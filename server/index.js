import { server, PORT } from "./app.js";
import { getAllWordsList, addHotWords } from "./wordManager.js";
import { fetchTrendingWords } from "./aiService.js";

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  
  // Auto fetch hot words on startup
  try {
    console.log("Fetching trending words from AI...");
    
    // Fetch ZH
    const existingWordsZH = getAllWordsList('zh');
    fetchTrendingWords(10, existingWordsZH, 'zh').then(words => {
      if (words && words.length > 0) {
        addHotWords(words, 'zh');
        console.log(`Successfully added ${words.length} trending words (ZH) from AI.`);
      } else {
        console.log("No trending words (ZH) fetched from AI.");
      }
    }).catch(err => console.error("Failed to fetch ZH words:", err.message));

    // Fetch EN
    const existingWordsEN = getAllWordsList('en');
    fetchTrendingWords(10, existingWordsEN, 'en').then(words => {
      if (words && words.length > 0) {
        addHotWords(words, 'en');
        console.log(`Successfully added ${words.length} trending words (EN) from AI.`);
      } else {
        console.log("No trending words (EN) fetched from AI.");
      }
    }).catch(err => console.error("Failed to fetch EN words:", err.message));

  } catch (err) {
    console.error("Failed to initiate trending words fetch:", err.message);
  }
});
