# Safari Cache Fix - Summary

## Problem
iOS Safari ignores Service Worker cache updates because:
1. Safari caches aggressively at multiple levels
2. Service Worker updates are delayed
3. Even `sw.js` itself gets cached

## Solution Applied

### Changed Caching Strategy
- **Before**: Cache First (serve old cached files)
- **After**: Network First (always try to get fresh files from server)

### Added Cache Busters
Files now have version numbers in URLs:
```html
<link rel="stylesheet" href="style.css?v=1.0.2">
<script src="decks.js?v=1.0.2"></script>
<script src="app.js?v=1.0.2"></script>
```

## How to Deploy Updates

### Every time you make changes:

1. **Update version in `public/sw.js`:**
   ```javascript
   const CACHE_NAME = 'buzybee-v1.0.3-20251205'; // Increment version
   ```

2. **Update version in `public/index.html`:**
   ```html
   <link rel="stylesheet" href="style.css?v=1.0.3">
   <script src="decks.js?v=1.0.3"></script>
   <script src="app.js?v=1.0.3"></script>
   ```

3. **Upload all files** in `public/` folder to your server

4. **First time viewing the update:**
   - iOS: **Settings → Safari → Clear History and Website Data**
   - Desktop Safari: **Cmd + Option + R** (hard reload)
   - Reload the page

### Quick Update Script
Run `update-version.bat 1.0.3` to see instructions (Windows)

## Why Both Changes Are Needed

**Cache Buster (`?v=1.0.3`):**
- Forces Safari to reload JS/CSS files immediately
- Works even before Service Worker updates

**Service Worker Version:**
- Updates the offline cache
- Ensures app works properly when offline

## Testing
1. Upload new files with updated versions
2. Open Safari Developer Console
3. Look for: `Service Worker installing... buzybee-v1.0.3-20251205`
4. If you don't see it → clear cache and reload

## Current Settings (v1.0.2)
- ✅ Network-first caching strategy
- ✅ Cache busters on all JS/CSS files
- ✅ Auto-updates Service Worker
- ✅ Immediate skipWaiting on install
- ✅ Console logging for debugging

## For Users
After you deploy updates, tell users:
"Please clear Safari cache: Settings → Safari → Clear History and Website Data, then reload"

Only needed once per major update. After that, the network-first strategy will automatically fetch new files.
