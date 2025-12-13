#!/bin/bash
# Quick version update script for deployment
# Usage: ./update-version.sh 1.0.3

if [ -z "$1" ]; then
    echo "Usage: ./update-version.sh <version>"
    echo "Example: ./update-version.sh 1.0.3"
    exit 1
fi

VERSION=$1
DATE=$(date +%Y%m%d)

echo "Updating to version $VERSION..."

# Update sw.js
sed -i "s/const CACHE_NAME = 'buzybee-v[0-9.]*-[0-9]*'/const CACHE_NAME = 'buzybee-v$VERSION-$DATE'/" public/sw.js

# Update index.html
sed -i "s/style.css?v=[0-9.]*/style.css?v=$VERSION/" public/index.html
sed -i "s/decks.js?v=[0-9.]*/decks.js?v=$VERSION/" public/index.html
sed -i "s/app.js?v=[0-9.]*/app.js?v=$VERSION/" public/index.html

echo "✅ Updated to version $VERSION"
echo "📋 Changes:"
echo "   - sw.js: buzybee-v$VERSION-$DATE"
echo "   - index.html: all files versioned to $VERSION"
echo ""
echo "Next steps:"
echo "1. Upload all files in 'public' folder to your server"
echo "2. Clear Safari cache on iOS: Settings → Safari → Clear History and Website Data"
echo "3. Reload the page"
