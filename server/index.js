import { server, PORT } from "./app.js";
import { getAllWordsList, addHotWords } from "./wordManager.js";
import { fetchTrendingWords } from "./aiService.js";

server.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  
  // Auto fetch hot words on startup
  try {
    console.log("Fetching trending words from AI...");
    const existingWords = getAllWordsList();
    const words = await fetchTrendingWords(10, existingWords);
    if (words && words.length > 0) {
      addHotWords(words);
      console.log(`Successfully added ${words.length} trending words from AI.`);
    } else {
      console.log("No trending words fetched from AI.");
    }
  } catch (err) {
    console.error("Failed to fetch initial trending words:", err.message);
  }
});
