import { getAllWordsList, addHotWords } from "./wordManager.js";
import { fetchTrendingWords, fetchReferenceImages } from "./aiService.js";

export default function setupRoutes(app) {
  app.get("/health", (_, res) => res.json({ ok: true }));

  app.post("/api/refresh-hot-words", async (_, res) => {
    try {
      const existingWords = getAllWordsList();
      const words = await fetchTrendingWords(10, existingWords);
      if (words && words.length > 0) {
        addHotWords(words);
        res.json({ success: true, count: words.length, words });
      } else {
        res.status(500).json({ success: false, error: "Failed to fetch words from AI" });
      }
    } catch (err) {
      console.error("Error refreshing hot words:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/reference-images", async (req, res) => {
    const { word } = req.query;
    if (!word) {
      return res.status(400).json({ error: "Word is required" });
    }
    
    try {
      const images = await fetchReferenceImages(word);
      res.json({ images });
    } catch (err) {
      console.error("Error fetching reference images:", err);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });
}
