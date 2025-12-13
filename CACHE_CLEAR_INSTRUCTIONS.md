# How to Clear Cache and Force Update

## ⚠️ Safari Issue: Changing CACHE_NAME alone doesn't always work!

Safari caches very aggressively. You need to:

### Solution 1: Update Version in BOTH Files (RECOMMENDED)

**Every time you upload new files:**

1. **Update `public/sw.js`:**
```javascript
const CACHE_NAME = 'buzybee-v1.0.3-20251205'; // Change version
```

2. **Update `public/index.html`:**
```html
<link rel="stylesheet" href="style.css?v=1.0.3">
<script src="decks.js?v=1.0.3"></script>
<script src="app.js?v=1.0.3"></script>
```

The `?v=1.0.3` is a **cache buster** that forces Safari to reload the files.

### Solution 2: Clear Cache on iOS Safari (Users must do this)

**Method A - Clear specific website:**
1. **Settings → Safari → Advanced → Website Data**
2. **Find your website** in the list
3. **Swipe left and Delete**

**Method B - Clear all (faster):**
1. **Settings → Safari → Clear History and Website Data**
2. **Confirm**

Then reload the page.

### Solution 3: Unregister Service Worker (For Testing)
Open browser console and run:
```javascript
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
  location.reload();
});
```

## Why Safari is Different:

Safari caches more aggressively than Chrome:
- Service Worker updates are delayed
- Files are cached at multiple levels
- `sw.js` itself gets cached by the browser

## Best Practice for Updates:

**Before uploading to server, update version numbers in:**
1. ✅ `sw.js` - Change `CACHE_NAME` version
2. ✅ `index.html` - Add `?v=X.X.X` to all JS/CSS files

**Example workflow:**
```bash
# 1. Edit sw.js
const CACHE_NAME = 'buzybee-v1.0.3-20251205';

# 2. Edit index.html
<link rel="stylesheet" href="style.css?v=1.0.3">
<script src="decks.js?v=1.0.3"></script>
<script src="app.js?v=1.0.3"></script>

# 3. Upload all files to server

# 4. Clear Safari cache on your device (first time after each update)

# 5. Reload the page
```

## Current Cache Strategy:
- **Network First**: Always try to fetch fresh files from server
- **Cache Fallback**: Use cache only when offline
- **Auto-update Cache**: New files automatically update the cache
- **Version in URLs**: Cache busters force Safari to reload files

## Testing Updates:
1. Upload new files with updated version numbers
2. Open Safari Console (Settings → Safari → Advanced → Web Inspector)
3. Check console logs for "Service Worker installing..." with new version
4. If you don't see new version, clear cache and reload
