#!/usr/bin/env python3
"""Generate one MP3 per word of the built-in decks (public/decks.js) with Microsoft's
Natural voices (edge-tts), so every device pronounces them the same way.

Why files instead of the system voice: TTS engines clip the first moment of audio, and
a spoken filler ("uh, ") only hides that on some browsers/devices. In an audio file the
fix is trivial and universal: a short stretch of real silence at the start.

Each word is cleaned up after synthesis: the voice's own leading/trailing silence
(edge-tts adds over a second of trailing silence) is trimmed, an exact lead-in of
silence is added, and the volume is normalised so every word is equally loud.

NOTE: the app does not use these files at the moment. Playback support (a "Recorded voice"
option, manifest loading and service-worker precaching) was built and then removed because
the decks change often. This script is kept so the files can be generated again if needed.

Setup:  pip install edge-tts miniaudio lameenc
Usage:
    python tools/gen-audio.py                       # generate what is missing
    python tools/gen-audio.py --voice en-US-JennyNeural --force
    python tools/gen-audio.py --list-voices

Output: public/assets/audio/<slug>.mp3 and public/assets/audio/manifest.js
Re-run after adding words to decks.js, then bump public/version.js and push.
"""
import argparse
import array
import asyncio
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DECKS_JS = ROOT / "public" / "decks.js"
OUT_DIR = ROOT / "public" / "assets" / "audio"

# Same pace as the app's system voice (speakSystem() in app.js uses rate 0.7)
DEFAULT_RATE = "-30%"
DEFAULT_VOICE = "en-US-AriaNeural"
LEAD_SILENCE_MS = 350  # absorbs the device/engine start-up clipping
TAIL_SILENCE_MS = 120  # keeps the last sound from being cut off
SAMPLE_RATE = 24000
SILENCE_THRESHOLD = 0.02  # fraction of full scale that counts as "speech"
PEAK_TARGET = 0.89  # about -1 dBFS
PIPELINE = "1"  # bump when process_audio() changes in a way that alters every file


def slugify(word: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", word.lower()).strip("-")


def read_words() -> list[str]:
    """All words from every deck in decks.js, de-duplicated case-insensitively."""
    text = DECKS_JS.read_text(encoding="utf-8")
    seen, words = set(), []
    for block in re.findall(r'words:\s*"([^"]*)"', text):
        for w in re.split(r"[\n,]+", block):
            w = w.strip()
            if w and w.lower() not in seen:
                seen.add(w.lower())
                words.append(w)
    return words


def process_audio(mp3: bytes, lead_ms: int, tail_ms: int) -> bytes:
    """Decode, trim the voice's own silence, add exact lead/tail silence, normalise, re-encode."""
    import lameenc
    import miniaudio

    decoded = miniaudio.decode(
        mp3, output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=SAMPLE_RATE
    )
    pcm = decoded.samples  # array('h')
    limit = int(SILENCE_THRESHOLD * 32767)
    first = next((i for i, s in enumerate(pcm) if abs(s) > limit), None)
    if first is None:
        raise RuntimeError("decoded audio is silent")
    last = len(pcm) - 1
    while abs(pcm[last]) <= limit:
        last -= 1
    margin = int(0.03 * SAMPLE_RATE)  # keep a touch of the natural attack/decay
    speech = pcm[max(0, first - margin) : min(len(pcm), last + 1 + margin)]

    peak = max(abs(s) for s in speech) or 1
    gain = PEAK_TARGET * 32767 / peak
    out = array.array("h", [0]) * int(lead_ms / 1000 * SAMPLE_RATE)
    out.extend(int(max(-32768, min(32767, s * gain))) for s in speech)
    out.extend(array.array("h", [0]) * int(tail_ms / 1000 * SAMPLE_RATE))

    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(SAMPLE_RATE)
    enc.set_channels(1)
    enc.set_quality(2)
    return bytes(enc.encode(out.tobytes()) + enc.flush())


async def synth_one(edge_tts, word, voice, rate, retries=4) -> bytes:
    for attempt in range(1, retries + 1):
        try:
            audio = bytearray()
            async for chunk in edge_tts.Communicate(word, voice, rate=rate).stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
            if audio:
                return bytes(audio)
            raise RuntimeError("no audio returned")
        except Exception:  # network hiccups happen
            if attempt == retries:
                raise
            await asyncio.sleep(1.5 * attempt)
    raise RuntimeError("unreachable")


async def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    ap.add_argument("--rate", default=DEFAULT_RATE, help='speed, e.g. "-20%%" (default) or "+0%%"')
    ap.add_argument("--silence-ms", type=int, default=LEAD_SILENCE_MS, help="silence before the word")
    ap.add_argument("--force", action="store_true", help="regenerate even if the file exists")
    ap.add_argument("--out", type=Path, default=OUT_DIR)
    ap.add_argument("--words", nargs="*", help="only these words (for samples/tests)")
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    try:
        import edge_tts
        import lameenc  # noqa: F401
        import miniaudio  # noqa: F401
    except ImportError as e:
        print(f"Missing package ({e.name}). Run:  pip install edge-tts miniaudio lameenc", file=sys.stderr)
        return 1

    if args.list_voices:
        for v in await edge_tts.list_voices():
            if v["Locale"] in ("en-US", "en-GB"):
                print(f'{v["ShortName"]:34} {v["Gender"]}')
        return 0

    words = args.words or read_words()
    args.out.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out / "manifest.js"
    old = {}
    if manifest_path.exists():
        text = manifest_path.read_text("utf-8")
        old = json.loads(text[text.index("{") : text.rindex("}") + 1])
    # A different voice/rate/silence invalidates every existing file
    same_settings = (old.get("voice"), old.get("rate"), old.get("silenceMs")) == (args.voice, args.rate, args.silence_ms)
    known = old.get("words", {}) if same_settings and not args.words else {}

    slugs = {}
    for w in words:
        s = slugify(w)
        if not s:
            print(f"skip (no usable characters): {w!r}")
            continue
        if s in slugs and slugs[s].lower() != w.lower():
            print(f"slug clash: {w!r} vs {slugs[s]!r}", file=sys.stderr)
            return 1
        slugs[s] = w

    sem = asyncio.Semaphore(4)
    done = failed = 0

    async def work(slug, word):
        nonlocal done, failed
        path = args.out / f"{slug}.mp3"
        if path.exists() and not args.force and same_settings:
            known[word.lower()] = f"{slug}.mp3"
            return
        async with sem:
            try:
                raw = await synth_one(edge_tts, word, args.voice, args.rate)
                data = await asyncio.to_thread(process_audio, raw, args.silence_ms, TAIL_SILENCE_MS)
            except Exception as e:
                failed += 1
                print(f"FAILED {word!r}: {e}", file=sys.stderr)
                return
        path.write_bytes(data)
        known[word.lower()] = f"{slug}.mp3"
        done += 1
        print(f"  {word}  ({max(1, len(data) // 1024)} KB)")

    await asyncio.gather(*(work(s, w) for s, w in slugs.items()))

    if not args.words:
        # "id" changes whenever the settings change, so the app/service worker know when
        # every cached file is outdated (file names alone don't tell them)
        settings = f"{PIPELINE}|{args.voice}|{args.rate}|{args.silence_ms}|{TAIL_SILENCE_MS}|{PEAK_TARGET}|{SILENCE_THRESHOLD}"
        manifest = {
            "id": hashlib.sha1(settings.encode()).hexdigest()[:8],
            "voice": args.voice,
            "rate": args.rate,
            "silenceMs": args.silence_ms,
            "words": dict(sorted(known.items())),
        }
        # A .js file (not .json) so it also loads from file:// and straight into the service worker
        manifest_path.write_text(
            "// Generated by tools/gen-audio.py - do not edit\n"
            f"const AUDIO_MANIFEST = {json.dumps(manifest, ensure_ascii=False, indent=1)};\n",
            "utf-8",
        )
        # Remove files that no longer belong to any word
        keep = set(known.values())
        for f in args.out.glob("*.mp3"):
            if f.name not in keep:
                f.unlink()
                print(f"removed stale {f.name}")
    total = sum(f.stat().st_size for f in args.out.glob("*.mp3"))
    print(f"generated {done}, failed {failed}, words in manifest {len(known)}, total {total / 1024:.0f} KB")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
