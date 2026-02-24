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
  Object.entries(wordsData).forEach(([category, categoryWords]) => {
    if (Array.isArray(categoryWords)) {
      categoryWords.forEach(word => {
        allWords.push({ word, category });
      });
    }
  });
  console.log(`Loaded ${allWords.length} words from ${Object.keys(wordsData).length} categories.`);
} catch (err) {
  console.error("Error loading words:", err);
  // Fallback words if file read fails
  allWords = [
    { word: "猫", category: "动物" },
    { word: "狗", category: "动物" },
    { word: "房子", category: "物体" },
    { word: "车", category: "交通工具" },
    { word: "树", category: "植物" },
    { word: "花", category: "植物" }
  ]; 
}

export function getRandomWord() {
  if (allWords.length === 0) return { word: "错误", category: "系统" };
  const randomIndex = Math.floor(Math.random() * allWords.length);
  return allWords[randomIndex];
}

export function getCategories() {
  return Object.keys(wordsData);
}

export function getWordsByCategory(category) {
  return wordsData[category] || [];
}
