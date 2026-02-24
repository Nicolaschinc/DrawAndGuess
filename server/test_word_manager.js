
import { getRandomWord } from './wordManager.js';
import fs from 'fs';
import path from 'path';

const wordsPath = path.join(process.cwd(), 'words.json');
const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
const allWords = Object.values(wordsData).flat();

console.log("Total words loaded from JSON:", allWords.length);

const word = getRandomWord();
console.log("Random word picked:", word);

if (typeof word === 'string' && word.length > 0) {
  console.log("Test Passed: getRandomWord returned a valid string.");
} else {
  console.error("Test Failed: getRandomWord returned invalid result.");
  process.exit(1);
}

if (allWords.includes(word)) {
    console.log("Test Passed: Picked word exists in the database.");
} else {
    console.error("Test Failed: Picked word NOT found in the database.");
    process.exit(1);
}
