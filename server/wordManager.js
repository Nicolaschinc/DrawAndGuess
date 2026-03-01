import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wordsPath = path.join(__dirname, 'words.json');
let wordsData = {};
let allWords = { zh: [], en: [] };

try {
  const data = fs.readFileSync(wordsPath, 'utf8');
  wordsData = JSON.parse(data);

  // Helper to flatten words for a specific language
  const flattenWords = (langData, lang) => {
    const list = [];
    Object.entries(langData).forEach(([category, categoryWords]) => {
      if (Array.isArray(categoryWords)) {
        categoryWords.forEach(word => {
          list.push({ word, category });
        });
      }
    });
    return list;
  };

  // Check if structure is multilingual (has 'zh' or 'en' keys) or legacy
  if (wordsData.zh || wordsData.en) {
    if (wordsData.zh) allWords.zh = flattenWords(wordsData.zh, 'zh');
    if (wordsData.en) allWords.en = flattenWords(wordsData.en, 'en');
  } else {
    // Legacy structure (assume 'zh')
    allWords.zh = flattenWords(wordsData, 'zh');
  }

  console.log(`Loaded words: zh=${allWords.zh.length}, en=${(allWords.en || []).length}`);
} catch (err) {
  console.error("Error loading words:", err);
  // Fallback words
  allWords.zh = [
    { word: "猫", category: "动物" },
    { word: "狗", category: "动物" },
    { word: "房子", category: "物体" }
  ];
  allWords.en = [
    { word: "Cat", category: "Animals" },
    { word: "Dog", category: "Animals" },
    { word: "House", category: "Objects" }
  ];
}

/**
 * Get a random word for a specific language, excluding used words if possible.
 * @param {string} lang - Language code ('zh' or 'en')
 * @param {Set<string>|Array<string>} usedWords - Set or Array of used words to avoid
 */
export function getRandomWord(lang = 'zh', usedWords = new Set()) {
  const wordList = allWords[lang] || allWords['zh']; // Fallback to zh
  if (!wordList || wordList.length === 0) return { word: "Error", category: "System" };

  // Convert usedWords to Set if it's an array
  const usedSet = Array.isArray(usedWords) ? new Set(usedWords) : usedWords;

  // Filter out used words
  const availableWords = wordList.filter(w => !usedSet.has(w.word));

  // If we have available words, pick from them
  if (availableWords.length > 0) {
    // Check if we have hot words in available list
    const hotWords = availableWords.filter(w => w.category === "热门" || w.category === "Hot");
    
    // 50% chance to pick a hot word if available
    if (hotWords.length > 0 && Math.random() < 0.5) {
      const randomIndex = Math.floor(Math.random() * hotWords.length);
      return hotWords[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    return availableWords[randomIndex];
  }

  // If all words used, fall back to picking from the full list (ignore usedWords)
  console.log(`[WordManager] All words used for ${lang}, recycling words.`);
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex];
}

export function addHotWords(words, lang = 'zh') {
  if (!Array.isArray(words) || words.length === 0) return;
  
  // Ensure the language array exists
  if (!allWords[lang]) allWords[lang] = [];
  
  // Update wordsData for "热门" category (in memory structure)
  if (!wordsData[lang]) wordsData[lang] = {};
  
  // This part is tricky because wordsData[lang]["热门"] is an array of strings, 
  // but we might want to preserve hints if we were saving back to file (which we aren't).
  wordsData[lang]["热门"] = words.map(w => typeof w === 'string' ? w : w.word);

  const targetList = allWords[lang];
  const existingWords = new Set(targetList.map(w => w.word));
  
  let addedCount = 0;
  words.forEach(item => {
    const word = typeof item === 'string' ? item : item.word;
    const hints = item.hints || [];
    
    if (!existingWords.has(word)) {
      targetList.push({ word, category: lang === 'zh' ? "热门" : "Hot", hints });
      existingWords.add(word);
      addedCount++;
    }
  });
  
  console.log(`Updated hot words for ${lang}: ${addedCount} added. Total: ${targetList.length}`);
}

/**
 * Gets a list of currently existing words in the pool to avoid AI generating duplicates.
 * @returns {string[]} Array of word strings
 */
export function getAllWordsList(lang = 'zh') {
  return (allWords[lang] || []).map(w => w.word);
}

export function getCategories(lang = 'zh') {
  return wordsData[lang] ? Object.keys(wordsData[lang]) : [];
}

export function getWordsByCategory(category, lang = 'zh') {
  return (wordsData[lang] && wordsData[lang][category]) || [];
}
