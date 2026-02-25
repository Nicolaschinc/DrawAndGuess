import OpenAI from 'openai';
import dotenv from 'dotenv';

// Ensure env vars are loaded if this file is imported directly or before index.js config
dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;
// Check if API key is present but don't crash, just warn
if (!apiKey) {
  console.warn('⚠️ Warning: DEEPSEEK_API_KEY is not set in .env file. AI features will not work.');
}

const openai = new OpenAI({
  apiKey: apiKey || 'dummy', // Prevent crash on init if key is missing
  baseURL: 'https://api.deepseek.com',
});

/**
 * Fetches trending words from DeepSeek AI.
 * @param {number} count Number of words to fetch
 * @param {string[]} excludeWords List of words to exclude from generation
 * @returns {Promise<Array<{word: string, hints: string[]}>>} Array of trending words with hints
 */
export async function fetchTrendingWords(count = 10, excludeWords = []) {
  if (!apiKey) {
    console.warn('⚠️  AI Service Warning: API Key missing or default. Skipping AI fetch.');
    return [];
  }

  // Sample only a subset of excluded words to keep prompt short (e.g. last 50 words)
  const excludeSample = excludeWords.slice(-50).join(", ");
  const excludePrompt = excludeSample ? `\n6. EXCLUDE these words (do NOT generate them): ${excludeSample}.` : "";

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a creative assistant for a "Draw and Guess" (Pictionary) game.
Your task is to generate a list of ${count} currently trending, popular, or culturally relevant words in China.

Requirements:
1. **Easy to Draw**: Words must be CONCRETE NOUNS or VISUALIZABLE PHRASES. Avoid abstract concepts, emotions, or complex actions that are hard to sketch.
2. **Three Hints**: For each word, provide exactly 3 hints that become progressively easier:
   - Hint 1 (Hard): A broad category or vague description (e.g., "Mythical Figure").
   - Hint 2 (Medium): A specific characteristic or context (e.g., "Strong fighter in Journey to the West").
   - Hint 3 (Easy): A very obvious clue like a nickname or famous catchphrase (e.g., "The Monkey King").
   - Hints must be short and concise (under 15 chars).
3. **Format**: Output MUST be a valid JSON array of objects.
   Example:
   [
     { "word": "孙悟空", "hints": ["神话人物", "西游记强者", "斗战胜佛"] },
     { "word": "奶茶", "hints": ["饮品", "年轻人喜欢喝", "有珍珠"] }
   ]
4. **Language**: Simplified Chinese.
5. Do NOT include any markdown formatting (like \`\`\`json), just the raw JSON string.${excludePrompt}
7. **Randomness**: Please try to be diverse and pick words from different domains (Food, Internet Memes, Daily Objects, Famous People).`
        },
        {
          role: 'user',
          content: `Generate ${count} unique, easy-to-draw trending words with 3 progressive hints.`
        }
      ],
      temperature: 1.3, // Increased temperature for more randomness
    });

    const content = response.choices[0].message.content.trim();
    console.log("----- AI Raw Response Start -----");
    console.log(content);
    console.log("----- AI Raw Response End -----");

    // Clean up potential markdown code blocks
    const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    const words = JSON.parse(cleanContent);
    console.log("Parsed words count:", words.length);
    console.log("First word sample:", words[0]);
    
    if (Array.isArray(words)) {
      // Validate structure
      return words.filter(w => w.word && Array.isArray(w.hints) && w.hints.length === 3);
    } else {
      console.error('AI response was not an array:', words);
      return [];
    }
  } catch (error) {
    console.error('Error fetching trending words from AI:', error);
    return [];
  }
}
