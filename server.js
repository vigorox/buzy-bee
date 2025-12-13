const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to list available decks
app.get('/api/decks', (req, res) => {
  const decksPath = path.join(__dirname, 'decks');
  
  fs.readdir(decksPath, (err, files) => {
    if (err) {
      return res.json([]);
    }
    
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    const decks = [];
    
    jsonFiles.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(decksPath, file), 'utf8');
        const deck = JSON.parse(content);
        decks.push({
          filename: file,
          title: deck.title || file.replace('.json', ''),
          words: deck.words
        });
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    });
    
    res.json(decks);
  });
});

app.listen(PORT, () => {
  console.log(`Vocabulary app running at http://localhost:${PORT}`);
});
