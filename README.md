# Buzy Bee

<p align="center"><img src="public/assets/icon/buzy-bee-icon-256.png" width="120" alt="Buzy Bee"></p>

A simple vocabulary practice web application that can run directly from your file system - no server needed!

## Features

- Interactive interface
- Web-based vocabulary practice
- Speech synthesis for pronunciation
- Import words manually or from pre-made decks
- Spelling check integration
- Works offline as a PWA (Progressive Web App)

## Quick Start (No Server Required)

Simply open `public/index.html` in your web browser:

1. Navigate to the `public` folder
2. Double-click `index.html` to open it in your browser
3. Start practicing vocabulary!

## Adding Custom Decks

To add your own vocabulary decks:

1. Open `public/decks.js`
2. Add a new deck to the `AVAILABLE_DECKS` array:
```javascript
{
  "title": "My Custom Deck",
  "words": "word1, word2, word3, word4"
}
```

Example:
```javascript
const AVAILABLE_DECKS = [
  {
    "title": "Sample Animals",
    "words": "cat, dog, elephant, giraffe, lion"
  },
  {
    "title": "My Custom Deck",
    "words": "apple, orange, banana, grape"
  }
];
```

## Using with a Server (Optional)

If you prefer to run it with a local server:

### Prerequisites
- Node.js (v12 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd buzy-bee
```

2. Install dependencies:
```bash
npm install
```

### Usage

Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
buzy-bee/
├── public/                    # All app files (can run standalone)
│   ├── index.html            # Main HTML file
│   ├── app.js                # Application logic
│   ├── style.css             # Styles
│   ├── sw.js                 # Service worker for PWA
│   ├── sample-animals.json   # Sample deck
│   ├── spelling-bee-1.json   # Spelling bee deck
│   └── assets/               # Icons and images
├── decks/                    # Original deck files (optional)
├── server.js                 # Express server (optional)
├── package.json              # Project dependencies
└── README.md                 # Project documentation
```

## Available Decks

- **Sample Animals**: Basic animal vocabulary
- **Spelling Bee 1st**: First grade spelling bee words

## Technologies

- Pure JavaScript (Vanilla JS)
- Web Speech API for pronunciation
- LocalStorage for data persistence
- Service Worker for offline support
- Optional: Node.js + Express.js 5.2.1

## License

ISC
