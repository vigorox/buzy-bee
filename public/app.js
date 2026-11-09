// State management
let vocabulary = [];
let currentWordIndex = 0;
let results = [];
let unmemorizedWords = []; // Store unmemorized words
let availableVoices = []; // Store available English voices
let selectedVoice = null; // Store selected voice
let gameSettings = {
  randomize: false,
  pronounceCount: 2,
};

const sampleVolabulary = [
  "apple",
  "banana",
  "cat"
];

// DOM elements
const mainPage = document.getElementById("mainPage");
const gamePage = document.getElementById("gamePage");
const resultPage = document.getElementById("resultPage");

const fileInput = document.getElementById("fileInput");
const manualTitle = document.getElementById("manualTitle");
const manualInput = document.getElementById("manualInput");
const addWordsBtn = document.getElementById("addWordsBtn");
const openImportBtn = document.getElementById("openImportBtn");
const closeImportBtn = document.getElementById("closeImportBtn");
const importModal = document.getElementById("importModal");
const deckSelect = document.getElementById("deckSelect");
const urlInput = document.getElementById("urlInput");
const importUrlBtn = document.getElementById("importUrlBtn");
const loadDeckBtn = document.getElementById("loadDeckBtn");
const wordListSection = document.getElementById("wordListSection");
const settingsSection = document.getElementById("settingsSection");
const wordList = document.getElementById("wordList");
const wordCount = document.getElementById("wordCount");
const currentDeckName = document.getElementById("currentDeckName");
const emptyState = document.getElementById("emptyState");
const unmemorizedSection = document.getElementById("unmemorizedSection");
const unmemorizedList = document.getElementById("unmemorizedList");
const unmemorizedCount = document.getElementById("unmemorizedCount");
const practiceUnmemorizedBtn = document.getElementById("practiceUnmemorizedBtn");
const clearUnmemorizedBtn = document.getElementById("clearUnmemorizedBtn");

const randomizeCheckbox = document.getElementById("randomizeCheckbox");
const pronounceCountSelect = document.getElementById("pronounceCount");
const pronounceIntervalSelect = document.getElementById("pronounceInterval");
const voiceSelect = document.getElementById("voiceSelect");
const startBtn = document.getElementById("startBtn");
const testVoiceBtn = document.getElementById("testVoiceBtn");

const currentWordSpan = document.getElementById("currentWord");
const totalWordsSpan = document.getElementById("totalWords");
const pronunciationPhase = document.getElementById("pronunciationPhase");
const answerPhase = document.getElementById("answerPhase");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackMessage = document.getElementById("feedbackMessage");
const feedbackOkBtn = document.getElementById("feedbackOkBtn");
const feedbackButtons = document.getElementById("feedbackButtons");
const feedbackButtonsWithWrong = document.getElementById("feedbackButtonsWithWrong");
const feedbackOkBtn2 = document.getElementById("feedbackOkBtn2");
const feedbackWrongBtn = document.getElementById("feedbackWrongBtn");
const spellingModal = document.getElementById("spellingModal");
const suspiciousWords = document.getElementById("suspiciousWords");
const spellingCancelBtn = document.getElementById("spellingCancelBtn");
const spellingProceedBtn = document.getElementById("spellingProceedBtn");
const currentRepeatSpan = document.getElementById("currentRepeat");
const totalRepeatsSpan = document.getElementById("totalRepeats");
const skipBtn = document.getElementById("skipBtn");
const repeatBtn = document.getElementById("repeatBtn");
const answerInput = document.getElementById("answerInput");
const okBtn = document.getElementById("okBtn");
const knowBtn = document.getElementById("knowBtn");
const dontKnowBtn = document.getElementById("dontKnowBtn");
const exitGameBtn = document.getElementById("exitGameBtn");

const correctCountSpan = document.getElementById("correctCount");
const totalCountSpan = document.getElementById("totalCount");
const resultMessage = document.getElementById("resultMessage");
const resultList = document.getElementById("resultList");
const backBtn = document.getElementById("backBtn");

// Speech synthesis
const synth = window.speechSynthesis;
let currentSpeech = null;
let pronunciationCount = 0;
let shouldSkip = false;
let pendingWords = []; // Store words pending spelling confirmation
let pendingTitle = ""; // Deck title for the pending words
let availableDecks = []; // Store available decks from server

// Initialize
loadFromLocalStorage();
loadAvailableDecks();
loadVoices();

// Event listeners
fileInput.addEventListener("change", handleFileUpload);
addWordsBtn.addEventListener("click", addManualWords);
importUrlBtn.addEventListener("click", importFromUrl);
urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") importFromUrl();
});
openImportBtn.addEventListener("click", openImportModal);
closeImportBtn.addEventListener("click", closeImportModal);
loadDeckBtn.addEventListener("click", loadSelectedDeck);
startBtn.addEventListener("click", startGame);
skipBtn.addEventListener("click", skipPronunciation);
repeatBtn.addEventListener("click", repeatPronunciation);
exitGameBtn.addEventListener("click", exitGame);
okBtn.addEventListener("click", submitAnswer);
knowBtn.addEventListener("click", markAsKnown);
dontKnowBtn.addEventListener("click", markAsDontKnow);
feedbackOkBtn.addEventListener("click", closeFeedback);
feedbackOkBtn2.addEventListener("click", closeFeedback);
feedbackWrongBtn.addEventListener("click", markFeedbackAsWrong);
spellingCancelBtn.addEventListener("click", cancelSpelling);
spellingProceedBtn.addEventListener("click", proceedWithSpelling);
backBtn.addEventListener("click", backToMain);
practiceUnmemorizedBtn.addEventListener("click", practiceUnmemorized);
clearUnmemorizedBtn.addEventListener("click", clearUnmemorized);
voiceSelect.addEventListener("change", handleVoiceChange);
testVoiceBtn.addEventListener("click", testVoice);
answerInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") submitAnswer();
});

// File upload handler
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    importJsonContent(content, file.name);
    fileInput.value = ""; // allow re-selecting the same file
  };
  reader.readAsText(file);
}

// Returns an error message if a deck object is invalid, else null.
// A valid deck has a non-empty "title" string and a non-empty "words" (string or array).
function validateDeck(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return "not an object";
  if (typeof d.title !== "string" || !d.title.trim()) return 'missing "title"';
  if (typeof d.words !== "string" && !Array.isArray(d.words)) return 'missing "words"';
  if (parseDeckWords(d.words).length === 0) return '"words" is empty';
  return null;
}

// JSON file: a deck {title, words} or an array of such decks. Both fields are required.
async function importJsonContent(content, fileName) {
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    await Dialog.alert(`Invalid JSON file.\n\n${e.message}`);
    return;
  }

  const formatHint =
    'Expected:\n{ "title": "...", "words": "word1, word2, ..." }\nor an array of them.';

  if (Array.isArray(data)) {
    const errors = data
      .map((d, i) => [i + 1, validateDeck(d)])
      .filter(([, err]) => err)
      .map(([n, err]) => `• Item ${n}: ${err}`);
    if (data.length === 0 || errors.length > 0) {
      await Dialog.alert(
        `Invalid deck format.\n\n${data.length === 0 ? "The array is empty." : errors.slice(0, 5).join("\n")}\n\n${formatHint}`
      );
      return;
    }
    await importDeckList(data, `file:${fileName}`, fileName);
    return;
  }

  const error = validateDeck(data);
  if (error) {
    await Dialog.alert(`Invalid deck format: ${error}.\n\n${formatHint}`);
    return;
  }

  const words = parseDeckWords(data.words);
  const title = data.title.trim();
  vocabulary = words;
  saveToLocalStorage();
  setCurrentDeck(title);
  displayVocabulary();
  closeImportModal();
  await Dialog.alert(`Loaded "${title}" with ${words.length} word(s)!`);
}

// Display vocabulary list
function displayVocabulary() {
  wordCount.textContent = vocabulary.length;
  renderCurrentDeck();
  if (vocabulary.length === 0) {
    wordList.style.display = "none";
    emptyState.style.display = "block";
    settingsSection.style.display = "none";
    startBtn.style.display = "none";
    return;
  }

  wordList.style.display = "flex";
  emptyState.style.display = "none";
  settingsSection.style.display = "block";
  startBtn.style.display = "";

  wordList.innerHTML = vocabulary
    .map((word) => `<span class="word-tag">${word}</span>`)
    .join("");
  
  // Display unmemorized words
  displayUnmemorized();
}

// Last loaded deck name (null = custom / hand-edited list), persisted in localStorage
function getCurrentDeck() {
  return localStorage.getItem("currentDeck");
}

function setCurrentDeck(title) {
  if (title) localStorage.setItem("currentDeck", title);
  else localStorage.removeItem("currentDeck");
  renderCurrentDeck();
}

function renderCurrentDeck() {
  const title = getCurrentDeck();
  currentDeckName.textContent = title || "Custom list";
  currentDeckName.title = title || "";
  currentDeckName.classList.toggle("custom", !title);
  const index = title ? availableDecks.findIndex((d) => d.title === title) : -1;
  if (index !== -1) deckSelect.value = String(index);
}

// Display unmemorized words
function displayUnmemorized() {
  if (unmemorizedWords.length === 0) {
    unmemorizedSection.style.display = "none";
    return;
  }

  unmemorizedSection.style.display = "block";
  unmemorizedCount.textContent = unmemorizedWords.length;
  unmemorizedList.innerHTML = unmemorizedWords
    .map((word) => `<span class="word-tag miss">${word}</span>`)
    .join("");
}

// Open import modal
function openImportModal() {
  importModal.classList.add("show");
}

// Close import modal
function closeImportModal() {
  importModal.classList.remove("show");
  manualTitle.value = "";
  manualInput.value = "";
  fileInput.value = "";
  urlInput.value = "";
}

// Parse a deck's words (string "a, b" / newline-separated, or array)
function parseDeckWords(words) {
  const list = Array.isArray(words) ? words : String(words || "").split(/[\n,]+/);
  return list.map((w) => String(w).trim()).filter((w) => w.length > 0);
}

// Custom (URL-imported) decks stored in localStorage
function getCustomDecks() {
  try {
    return JSON.parse(localStorage.getItem("customDecks")) || [];
  } catch (e) {
    return [];
  }
}

function saveCustomDecks(decks) {
  localStorage.setItem("customDecks", JSON.stringify(decks));
}

// Import an array of {title, words} decks into the deck list.
// `source` is the URL (or "file:name") — importing the same source again replaces its decks.
async function importDeckList(data, source, fallbackTitle) {
  const imported = data
    .map((d, i) => ({
      title: (d && d.title && String(d.title).trim()) || `${fallbackTitle} #${i + 1}`,
      words: parseDeckWords(d && d.words),
    }))
    .filter((d) => d.words.length > 0);

  if (imported.length === 0) {
    await Dialog.alert('No valid decks found. Each item must contain a "words" field.');
    return;
  }

  if (!(await Dialog.confirm(
    `Import ${imported.length} deck(s)?\n\n` +
    imported.map((d) => `• ${d.title} (${d.words.length} words)`).join("\n") +
    `\n\nThey will be added to the deck list.`
  ))) {
    return;
  }

  const decks = getCustomDecks().filter((d) => d.url !== source);
  imported.forEach((d) => decks.push({ title: d.title, words: d.words.join(", "), url: source }));
  saveCustomDecks(decks);
  loadAvailableDecks();
  deckSelect.value = String(availableDecks.findIndex((d) => d.url === source));
  closeImportModal();
  await Dialog.alert(
    `Imported ${imported.length} deck(s)!\n\nPick one in the deck list and click "Load".`
  );
}

// Import a deck JSON from URL, save to localStorage and load it
async function importFromUrl() {
  const url = urlInput.value.trim();
  if (!/^https?:\/\//i.test(url)) {
    await Dialog.alert("Please enter a valid URL (http:// or https://)");
    return;
  }

  importUrlBtn.disabled = true;
  const originalText = importUrlBtn.textContent;
  importUrlBtn.textContent = "Importing...";

  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = JSON.parse(await res.text());
  } catch (e) {
    console.error("Import from URL failed", e);
    await Dialog.alert(
      `Failed to import from URL.\n\n${e.message}\n\n(The server must allow CORS and return valid JSON.)`
    );
    return;
  } finally {
    importUrlBtn.disabled = false;
    importUrlBtn.textContent = originalText;
  }

  const fallbackTitle = url.split("/").pop();

  // Array format: import multiple decks into the deck list
  if (Array.isArray(data)) {
    await importDeckList(data, url, fallbackTitle);
    return;
  }

  const words = parseDeckWords(data && data.words);
  if (words.length === 0) {
    await Dialog.alert('No words found. JSON must contain a "words" field.');
    return;
  }
  const title = (data.title && String(data.title).trim()) || fallbackTitle;

  if (!(await Dialog.confirm(
    `Import "${title}" (${words.length} words)?\n\nThis will replace your current vocabulary list.`
  ))) {
    return;
  }

  // Save deck (same URL overwrites the previous import)
  const decks = getCustomDecks().filter((d) => d.url !== url);
  decks.push({ title, words: words.join(", "), url });
  saveCustomDecks(decks);
  loadAvailableDecks();
  deckSelect.value = String(availableDecks.findIndex((d) => d.url === url));

  vocabulary = words;
  saveToLocalStorage();
  setCurrentDeck(title);
  displayVocabulary();
  closeImportModal();
  await Dialog.alert(`Successfully imported "${title}" with ${words.length} word(s)!`);
}

// Add a deck from manually entered words (title required)
async function addManualWords() {
  const title = manualTitle.value.trim();
  const input = manualInput.value.trim();

  if (!title) {
    await Dialog.alert("Please enter a title for this word list!");
    manualTitle.focus();
    return;
  }

  if (!input) {
    await Dialog.alert("Please enter some words!");
    return;
  }

  // Parse words
  const newWords = input
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  if (newWords.length === 0) {
    await Dialog.alert("No valid words found!");
    return;
  }

  // Validate words (only letters, spaces, hyphens, apostrophes)
  const invalidWords = newWords.filter((word) => !/^[a-zA-Z\s'-]+$/.test(word));

  if (invalidWords.length > 0) {
    await Dialog.alert(
      `Invalid words detected: ${invalidWords.join(
        ", "
      )}\n\nWords should only contain letters, spaces, hyphens, or apostrophes.`
    );
    return;
  }

  // Drop duplicates within the entered list
  const seen = new Set();
  const words = newWords.filter((word) => {
    const key = word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Check spelling before saving
  checkSpellingAndSaveManual(title, words);
}

// Save manually entered words as a deck (same title replaces the previous one) and load it
async function saveManualDeck(title, words) {
  const source = `manual:${title}`;
  const decks = getCustomDecks().filter((d) => d.url !== source);
  decks.push({ title, words: words.join(", "), url: source });
  saveCustomDecks(decks);
  loadAvailableDecks();

  vocabulary = words;
  saveToLocalStorage();
  setCurrentDeck(title);
  displayVocabulary();
  manualTitle.value = "";
  manualInput.value = "";
  closeImportModal();
  await Dialog.alert(`Saved "${title}" with ${words.length} word(s)!`);
}

// Spelling check using LanguageTool API
async function checkSpelling(words) {
  const suspicious = [];

  try {
    // Check words in batches to respect rate limits
    const batchSize = 10;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const text = batch.join(" ");

      // Call LanguageTool API
      const params = new URLSearchParams({
        text: text,
        language: "en-US",
        enabledOnly: "false",
      });

      const response = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429) {
          console.warn(
            "LanguageTool rate limit reached, using fallback spell check"
          );
          return fallbackSpellCheck(words);
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Process matches for spelling errors
      if (data.matches && data.matches.length > 0) {
        for (const match of data.matches) {
          // Focus on spelling errors (TYPOS category)
          if (
            match.rule.issueType === "misspelling" ||
            match.rule.category.id === "TYPOS" ||
            match.message.toLowerCase().includes("spelling")
          ) {
            const errorText = text.substring(
              match.offset,
              match.offset + match.length
            );
            const word = batch.find(
              (w) => w.toLowerCase() === errorText.toLowerCase()
            );

            if (word && !suspicious.find((s) => s.word === word)) {
              suspicious.push({
                word: word,
                issues: [match.message],
                suggestions: match.replacements.slice(0, 3).map((r) => r.value),
              });
            }
          }
        }
      }

      // Add small delay between batches to respect rate limits
      if (i + batchSize < words.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } catch (error) {
    console.error("LanguageTool API error:", error);
    // Fall back to pattern-based check if API fails
    return fallbackSpellCheck(words);
  }

  return suspicious;
}

// Fallback pattern-based spell check (in case API fails)
function fallbackSpellCheck(words) {
  const suspicious = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    const issues = [];

    // Multiple consecutive same letters (more than 2)
    if (/(.)\1{2,}/.test(lower)) {
      issues.push("repeated letters");
    }

    // Uncommon letter combinations
    if (/[qx][^uiaeo]|[aeiouy]{5,}|[bcdfghjklmnpqrstvwxyz]{6,}/i.test(lower)) {
      issues.push("unusual pattern");
    }

    // Too short or too long
    if (lower.length === 1 || lower.length > 25) {
      issues.push("unusual length");
    }

    // Contains numbers
    if (/[0-9]/.test(word)) {
      issues.push("contains numbers");
    }

    // Suspicious consonant clusters at the start
    if (/^[bcdfghjklmnpqrstvwxyz]{4,}/i.test(lower)) {
      issues.push("unusual consonant start");
    }

    if (issues.length > 0) {
      suspicious.push({ word, issues, suggestions: [] });
    }
  }

  return suspicious;
}

// Check spelling, then save the words as a deck (for manual input)
async function checkSpellingAndSaveManual(title, words) {
  const suspicious = await checkSpelling(words);

  if (suspicious.length > 0) {
    pendingTitle = title;
    pendingWords = words;
    showSpellingWarning(suspicious);
  } else {
    await saveManualDeck(title, words);
  }
}

// Show spelling warning modal
function showSpellingWarning(suspicious) {
  suspiciousWords.innerHTML = suspicious
    .map((item) => {
      const suggestionText =
        item.suggestions && item.suggestions.length > 0
          ? `<div style="color: #10b981; font-size: 0.9em; margin-top: 4px;">Suggestions: ${item.suggestions.join(
              ", "
            )}</div>`
          : "";
      return `<div style="margin-bottom: 12px;">
                <strong style="color: #dc2626;">${
                  item.word
                }</strong> - ${item.issues.join(", ")}
                ${suggestionText}
            </div>`;
    })
    .join("");
  spellingModal.classList.add("show");
}

// Cancel spelling - clear pending words
function cancelSpelling() {
  spellingModal.classList.remove("show");
//   pendingWords = [];
//   manualInput.value = "";
}

// Proceed with spelling - accept the words
async function proceedWithSpelling() {
  spellingModal.classList.remove("show");

  const title = pendingTitle;
  const words = pendingWords;
  pendingTitle = "";
  pendingWords = [];

  if (title && words.length > 0) {
    await saveManualDeck(title, words);
  }
}

// Start game
async function startGame() {
  if (vocabulary.length === 0) {
    await Dialog.alert("Please upload vocabulary first!");
    return;
  }

  // Get settings
  gameSettings.randomize = randomizeCheckbox.checked;
  gameSettings.pronounceCount = parseInt(pronounceCountSelect.value);
  gameSettings.pronounceInterval = parseInt(pronounceIntervalSelect.value);
  
  // Save settings to localStorage
  saveSettingsToLocalStorage();

  // Prepare word list
  let gameWords = [...vocabulary];
  if (gameSettings.randomize) {
    gameWords = shuffle(gameWords);
  }

  // Initialize game state
  vocabulary = gameWords;
  currentWordIndex = 0;
  results = [];

  // Switch to game page
  showPage("game");
  playCurrentWord();
}

// Play current word
function playCurrentWord() {
  const word = vocabulary[currentWordIndex];

  // Update UI
  currentWordSpan.textContent = currentWordIndex + 1;
  totalWordsSpan.textContent = vocabulary.length;
  totalRepeatsSpan.textContent = gameSettings.pronounceCount;

  // Show pronunciation phase
  pronunciationPhase.style.display = "block";
  answerPhase.style.display = "none";
  answerInput.value = "";

  // Start pronunciation
  pronunciationCount = 0;
  shouldSkip = false;
  pronounceWord(word);
}

// Pronounce word multiple times
function pronounceWord(word) {
  if (shouldSkip || pronunciationCount >= gameSettings.pronounceCount) {
    showAnswerPhase();
    return;
  }

  pronunciationCount++;
  currentRepeatSpan.textContent = pronunciationCount;

  // Cancel any ongoing speech
  synth.cancel();

  // Create speech utterance
  currentSpeech = new SpeechSynthesisUtterance(word);
  currentSpeech.lang = "en-US";
  currentSpeech.rate = 0.8;
  
  // Use selected voice if available
  if (selectedVoice) {
    currentSpeech.voice = selectedVoice;
  }

  currentSpeech.onend = () => {
    // Wait a bit before next pronunciation
    setTimeout(() => {
      pronounceWord(word);
    }, gameSettings.pronounceInterval);
  };

  synth.speak(currentSpeech);
}

// Skip pronunciation
function skipPronunciation() {
  shouldSkip = true;
  synth.cancel();
  showAnswerPhase();
}

// Repeat pronunciation (from answer phase)
function repeatPronunciation() {
  const word = vocabulary[currentWordIndex];
  
  // Cancel any ongoing speech
  synth.cancel();
  
  // Create speech utterance
  const speech = new SpeechSynthesisUtterance(word);
  speech.lang = "en-US";
  speech.rate = 0.8;
  
  // Use selected voice if available
  if (selectedVoice) {
    speech.voice = selectedVoice;
  }
  
  synth.speak(speech);
}

// Show answer phase
function showAnswerPhase() {
  pronunciationPhase.style.display = "none";
  answerPhase.style.display = "block";
  // answerInput.focus();
}

// Submit answer
function submitAnswer() {
  const word = vocabulary[currentWordIndex];
  const answer = answerInput.value.trim().toLowerCase();
  const isCorrect = answer === word.toLowerCase();

  results.push({
    word: word,
    answer: answer,
    correct: isCorrect,
    known: false,
  });

  // Add to unmemorized if incorrect
  if (!isCorrect) {
    addToUnmemorized(word);
  } else {
    // Remove from unmemorized if correct
    removeFromUnmemorized(word);
  }

  // Show feedback
  if (isCorrect) {
    showFeedback("Correct!", true, false);
  } else {
    showFeedback(`${word}\n\nYou entered: ${answer}`, false, false);
  }
}

// Mark as known
function markAsKnown() {
  const word = vocabulary[currentWordIndex];

  results.push({
    word: word,
    answer: "",
    correct: true,
    known: true,
  });

  // Remove from unmemorized if known (will be re-added if user clicks "I Got It Wrong")
  removeFromUnmemorized(word);

  // Show the correct answer, pronounce, and show "I Got It Wrong" button
  showFeedback(word, true, true, true);
}

// Mark as don't know
function markAsDontKnow() {
  const word = vocabulary[currentWordIndex];

  results.push({
    word: word,
    answer: "",
    correct: false,
    known: false,
  });

  // Add to unmemorized if don't know
  addToUnmemorized(word);

  // Show the correct answer in red and pronounce
  showFeedback(word, false, true);
}

// Game header bee: "normal" | "happy" | "sad"
const BEE_IMAGES = {
  normal: "assets/icon/buzy-bee.svg",
  happy: "assets/icon/buzy-bee-happy.svg",
  sad: "assets/icon/buzy-bee-sad.svg",
};
// Preload so the swap is instant
Object.values(BEE_IMAGES).forEach((src) => (new Image().src = src));

function setBeeMood(mood) {
  const bee = document.getElementById("gameBee");
  if (!bee) return;
  bee.src = BEE_IMAGES[mood] || BEE_IMAGES.normal;
  bee.classList.remove("bee-happy", "bee-sad");
  if (mood === "happy" || mood === "sad") {
    void bee.offsetWidth; // restart animation
    bee.classList.add(`bee-${mood}`);
  }
}

// Show feedback and optionally pronounce
function showFeedback(message, isCorrect, pronounce, showWrongButton = false) {
  setBeeMood(isCorrect ? "happy" : "sad");

  // Set message and style
  feedbackMessage.textContent = message;
  feedbackMessage.className =
    "feedback-message " + (isCorrect ? "correct" : "incorrect");

  // Show modal
  feedbackModal.classList.add("show");
  
  // Show appropriate button layout
  if (showWrongButton) {
    feedbackButtons.style.display = "none";
    feedbackButtonsWithWrong.style.display = "flex";
  } else {
    feedbackButtons.style.display = "flex";
    feedbackButtonsWithWrong.style.display = "none";
  }

  // Pronounce if needed
  if (pronounce) {
    const word = vocabulary[currentWordIndex];
    synth.cancel();
    const speech = new SpeechSynthesisUtterance(word);
    speech.lang = "en-US";
    speech.rate = 0.8;
    
    // Use selected voice if available
    if (selectedVoice) {
      speech.voice = selectedVoice;
    }
    
    synth.speak(speech);
  }
}

// Close feedback modal and move to next word
function closeFeedback() {
  feedbackModal.classList.remove("show");
  synth.cancel();
  nextWord();
}

// Mark as wrong from feedback (user clicked "I Got It Wrong" after "I Know It")
function markFeedbackAsWrong() {
  const word = vocabulary[currentWordIndex];
  
  // Find the last result for this word and update it
  const lastResult = results[results.length - 1];
  if (lastResult && lastResult.word === word) {
    lastResult.correct = false;
  }
  
  // Add to unmemorized words
  addToUnmemorized(word);
  
  // Close feedback and move to next word
  feedbackModal.classList.remove("show");
  synth.cancel();
  nextWord();
}

// Move to next word
function nextWord() {
  setBeeMood("normal");
  currentWordIndex++;

  if (currentWordIndex >= vocabulary.length) {
    showResults();
  } else {
    playCurrentWord();
  }
}

// Show results
function showResults() {
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;

  correctCountSpan.textContent = correctCount;
  totalCountSpan.textContent = totalCount;

  // Generate message
  const percentage = (correctCount / totalCount) * 100;
  if (percentage === 100) {
    resultMessage.textContent = "🎉 Perfect! You know all the words!";
  } else if (percentage >= 80) {
    resultMessage.textContent = "👏 Great job! Keep it up!";
  } else if (percentage >= 60) {
    resultMessage.textContent = "👍 Good effort! Practice makes perfect!";
  } else {
    resultMessage.textContent = "💪 Keep practicing! You can do it!";
  }

  // Display detailed results
  resultList.innerHTML = results
    .map((r) => {
      const statusClass = r.known
        ? "known"
        : r.correct
        ? "correct"
        : "incorrect";
      const statusText = r.known
        ? "Known"
        : r.correct
        ? `✓ ${r.answer}`
        : `✗ ${r.answer || "(no answer)"}`;

      return `
            <div class="result-item ${statusClass}">
                <span class="result-word">${r.word}</span>
                <span class="result-status">${statusText}</span>
            </div>
        `;
    })
    .join("");

  showPage("result");
}

// Back to main page
function backToMain() {
  synth.cancel();
  showPage("main");
}

// Exit game during practice
async function exitGame() {
  if (await Dialog.confirm("Exit game? Your progress will not be saved.")) {
    synth.cancel();
    showPage("main");
  }
}

// Show page
function showPage(page) {
  mainPage.classList.remove("active");
  gamePage.classList.remove("active");
  resultPage.classList.remove("active");

  if (page === "main") {
    mainPage.classList.add("active");
  } else if (page === "game") {
    gamePage.classList.add("active");
  } else if (page === "result") {
    resultPage.classList.add("active");
  }
}

// Utility: Shuffle array
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Unmemorized words management
function addToUnmemorized(word) {
  const lowerWord = word.toLowerCase();
  if (!unmemorizedWords.find(w => w.toLowerCase() === lowerWord)) {
    unmemorizedWords.push(word);
    saveUnmemorizedToLocalStorage();
    displayUnmemorized();
  }
}

function removeFromUnmemorized(word) {
  const lowerWord = word.toLowerCase();
  const index = unmemorizedWords.findIndex(w => w.toLowerCase() === lowerWord);
  if (index !== -1) {
    unmemorizedWords.splice(index, 1);
    saveUnmemorizedToLocalStorage();
    displayUnmemorized();
  }
}

async function practiceUnmemorized() {
  if (unmemorizedWords.length === 0) {
    await Dialog.alert("No unmemorized words to practice!");
    return;
  }

  // Use unmemorized words as vocabulary
  vocabulary = [...unmemorizedWords];
  
  // Get settings
  gameSettings.randomize = randomizeCheckbox.checked;
  gameSettings.pronounceCount = parseInt(pronounceCountSelect.value);
  gameSettings.pronounceInterval = parseInt(pronounceIntervalSelect.value);
  
  // Save settings to localStorage
  saveSettingsToLocalStorage();

  // Prepare word list
  let gameWords = [...vocabulary];
  if (gameSettings.randomize) {
    gameWords = shuffle(gameWords);
  }

  // Initialize game state
  vocabulary = gameWords;
  currentWordIndex = 0;
  results = [];

  // Switch to game page
  showPage("game");
  playCurrentWord();
}

async function clearUnmemorized() {
  if (unmemorizedWords.length === 0) {
    await Dialog.alert("No unmemorized words to clear!");
    return;
  }

  if (await Dialog.confirm(`Clear all ${unmemorizedWords.length} unmemorized words?`)) {
    unmemorizedWords = [];
    saveUnmemorizedToLocalStorage();
    displayUnmemorized();
    await Dialog.alert("Unmemorized words cleared!");
  }
}

// LocalStorage functions
function saveToLocalStorage() {
  localStorage.setItem("vocabulary", JSON.stringify(vocabulary));
}

function saveSettingsToLocalStorage() {
  localStorage.setItem("gameSettings", JSON.stringify(gameSettings));
}

function saveUnmemorizedToLocalStorage() {
  localStorage.setItem("unmemorizedWords", JSON.stringify(unmemorizedWords));
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem("vocabulary");
  if (stored) {
    try {
      vocabulary = JSON.parse(stored);
      displayVocabulary();
    } catch (e) {
      console.error("Failed to load vocabulary from localStorage", e);
      // If failed to load, load sample data
      loadSampleDataAuto();
    }
  } else {
    // No vocabulary in localStorage, load sample data automatically
    loadSampleDataAuto();
  }
  
  // Load unmemorized words
  const storedUnmemorized = localStorage.getItem("unmemorizedWords");
  if (storedUnmemorized) {
    try {
      unmemorizedWords = JSON.parse(storedUnmemorized);
      displayUnmemorized();
    } catch (e) {
      console.error("Failed to load unmemorized words from localStorage", e);
    }
  }
  
  // Load game settings
  const storedSettings = localStorage.getItem("gameSettings");
  if (storedSettings) {
    try {
      const loaded = JSON.parse(storedSettings);
      gameSettings.randomize = loaded.randomize || false;
      gameSettings.pronounceCount = loaded.pronounceCount || 2;
      gameSettings.pronounceInterval = loaded.pronounceInterval || 1000;
      
      // Update UI
      randomizeCheckbox.checked = gameSettings.randomize;
      pronounceCountSelect.value = gameSettings.pronounceCount;
      pronounceIntervalSelect.value = gameSettings.pronounceInterval;
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
  }
}

// Load sample data automatically (without confirmation)
function loadSampleDataAuto() {
  vocabulary = sampleVolabulary;
  saveToLocalStorage();
  localStorage.removeItem("currentDeck");
  displayVocabulary();
}

// Load available decks from decks.js
function loadAvailableDecks() {
  // Load decks from global AVAILABLE_DECKS variable defined in decks.js
  // plus decks imported from URL (stored in localStorage)
  availableDecks = [...(AVAILABLE_DECKS || []), ...getCustomDecks()];

  if (availableDecks.length === 0) {
    deckSelect.innerHTML = '<option value="">No decks available</option>';
    loadDeckBtn.disabled = true;
  } else {
    deckSelect.innerHTML = '<option value="">-- Select a deck --</option>' +
      availableDecks.map((deck, index) => 
        `<option value="${index}">${deck.url ? (deck.url.startsWith("file:") ? "📄 " : deck.url.startsWith("manual:") ? "✏️ " : "🌐 ") : ""}${deck.title}</option>`
      ).join('');
    loadDeckBtn.disabled = false;
  }
  renderCurrentDeck();
}

// Load available voices
function loadVoices() {
  // Get all voices
  const voices = synth.getVoices();
  
  // Filter English voices
  availableVoices = voices.filter(voice => 
    voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
  );
  
  if (availableVoices.length === 0) {
    voiceSelect.innerHTML = '<option value="">No English voices available</option>';
    return;
  }
  
  // Populate voice selector
  voiceSelect.innerHTML = '<option value="">Default voice</option>' +
    availableVoices.map((voice, index) => {
      const lang = voice.lang.replace('_', '-');
      const label = `${voice.name} (${lang})`;
      return `<option value="${index}">${label}</option>`;
    }).join('');
  
  // Load saved voice preference
  const savedVoiceIndex = localStorage.getItem('selectedVoiceIndex');
  if (savedVoiceIndex && availableVoices[savedVoiceIndex]) {
    voiceSelect.value = savedVoiceIndex;
    selectedVoice = availableVoices[savedVoiceIndex];
  }
}

// Voices might load asynchronously on some browsers
if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = loadVoices;
}

// Handle voice change
function handleVoiceChange() {
  const index = voiceSelect.value;
  if (index === '') {
    selectedVoice = null;
    localStorage.removeItem('selectedVoiceIndex');
  } else {
    selectedVoice = availableVoices[index];
    localStorage.setItem('selectedVoiceIndex', index);
  }
}

// Speak a random word from the list with the selected voice
function testVoice() {
  if (vocabulary.length === 0) return;
  const word = vocabulary[Math.floor(Math.random() * vocabulary.length)];
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  if (selectedVoice) utterance.voice = selectedVoice;
  synth.speak(utterance);
}

// Load selected deck
async function loadSelectedDeck() {
  const selectedIndex = deckSelect.value;
  
  if (!selectedIndex) {
    await Dialog.alert('Please select a deck!');
    return;
  }
  
  const deck = availableDecks[selectedIndex];
  
  if (!deck) {
    await Dialog.alert('Invalid deck selected!');
    return;
  }
  
  // Show confirmation dialog
  if (!(await Dialog.confirm(`Load "${deck.title}"?\n\nThis will replace your current vocabulary list.`))) {
    return;
  }
  
  // Parse words from the deck
  const words = parseDeckWords(deck.words);
  
  if (words.length === 0) {
    await Dialog.alert('No words found in the deck!');
    return;
  }
  
  vocabulary = words;
  saveToLocalStorage();
  setCurrentDeck(deck.title);
  displayVocabulary();
  await Dialog.alert(`Successfully loaded "${deck.title}" with ${words.length} word(s)!`);
}
