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

  // Check if we have hot words
  const hotWords = allWords.filter(w => w.category === "热门");
  
  // 50% chance to pick a hot word if available
  if (hotWords.length > 0 && Math.random() < 0.5) {
    const randomIndex = Math.floor(Math.random() * hotWords.length);
    return hotWords[randomIndex];
  }

  // Fallback to random pick from all words
  const randomIndex = Math.floor(Math.random() * allWords.length);
  return allWords[randomIndex];
}

export function addHotWords(words) {
  if (!Array.isArray(words) || words.length === 0) return;
  
  // Update wordsData for "热门" category
  // words from AI are now objects: { word, hints }
  wordsData["热门"] = words.map(w => w.word); // Keep backward compatibility for wordsData if used elsewhere
  
  // 1. Keep track of existing words to avoid duplicates in the main pool
  const existingWords = new Set(allWords.map(w => w.word));

  // 2. Add ONLY new words that are not already in the pool
  let addedCount = 0;
  words.forEach(item => {
    // Check if item is an object with word property (new format) or just a string (old format fallback)
    const word = typeof item === 'string' ? item : item.word;
    const hints = item.hints || [];
    
    if (!existingWords.has(word)) {
      allWords.push({ word, category: "热门", hints });
      existingWords.add(word); // Update local set
      addedCount++;
    }
  });
  
  console.log(`Updated hot words: ${addedCount} new words added to pool (from ${words.length} fetched). Total words: ${allWords.length}`);
}

/**
 * Gets a list of currently existing words in the pool to avoid AI generating duplicates.
 * @returns {string[]} Array of word strings
 */
export function getAllWordsList() {
  return allWords.map(w => w.word);
}

export function getCategories() {
  return Object.keys(wordsData);
}

export function getWordsByCategory(category) {
  return wordsData[category] || [];
}
