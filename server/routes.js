import { getAllWordsList, addHotWords } from "./wordManager.js";
import { fetchTrendingWords, fetchReferenceImages, getBingImageUrl, getImageBuffer } from "./aiService.js";

export default function setupRoutes(app) {
  app.get("/health", (_, res) => res.json({ ok: true }));

  // AI Image Proxy to avoid CORS/Hotlinking issues
  app.get("/api/proxy-image", async (req, res) => {
    const { word, style } = req.query;
    if (!word) {
      return res.status(400).send("Word is required");
    }

    try {
      const aiUrl = getBingImageUrl(word, style || 'photo');
      const buffer = await getImageBuffer(aiUrl);
      
      res.set("Content-Type", "image/jpeg");
      res.set("Cache-Control", "public, max-age=3600"); 
      res.send(buffer);
    } catch (err) {
      console.error("AI Image proxy error:", err);
      res.status(500).send("Failed to fetch image");
    }
  });

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
