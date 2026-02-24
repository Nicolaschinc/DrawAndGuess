
import { getRandomWord } from './wordManager.js';
import fs from 'fs';
import path from 'path';

const wordsPath = path.join(process.cwd(), 'words.json');
const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
const allWords = Object.values(wordsData).flat();

console.log("Total words loaded from JSON:", allWords.length);

const picked = getRandomWord();
console.log("Random word picked:", picked);

if (typeof picked === 'object' && picked.word && picked.category) {
  console.log("Test Passed: getRandomWord returned a valid object.");
} else {
  console.error("Test Failed: getRandomWord returned invalid result.");
  process.exit(1);
}

if (allWords.includes(picked.word)) {
    console.log("Test Passed: Picked word exists in the database.");
} else {
    console.error("Test Failed: Picked word NOT found in the database.");
    process.exit(1);
}
