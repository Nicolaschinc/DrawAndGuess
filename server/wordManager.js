import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordsPath = path.join(__dirname, 'words.json');
let wordsData = {};
let allWords = [];

try {
  const data = fs.readFileSync(wordsPath, 'utf8');
  wordsData = JSON.parse(data);
  // Flatten all words into a single array for random selection
  Object.values(wordsData).forEach(categoryWords => {
    if (Array.isArray(categoryWords)) {
      allWords = allWords.concat(categoryWords);
    }
  });
  console.log(`Loaded ${allWords.length} words from ${Object.keys(wordsData).length} categories.`);
} catch (err) {
  console.error("Error loading words:", err);
  // Fallback words if file read fails
  allWords = ["猫", "狗", "房子", "车", "树", "花"]; 
}

export function getRandomWord() {
  if (allWords.length === 0) return "错误";
  const randomIndex = Math.floor(Math.random() * allWords.length);
  return allWords[randomIndex];
}

export function getCategories() {
  return Object.keys(wordsData);
}

export function getWordsByCategory(category) {
  return wordsData[category] || [];
}
