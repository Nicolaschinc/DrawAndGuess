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
  timeout: 15000, // 15s timeout
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Logs message with sensitive data handling.
 * In production, raw data is redacted.
 */
function safeLog(message, data = null) {
  if (IS_PROD) {
    if (data) {
      console.log(`[AI-Service] ${message} [Data Redacted]`);
    } else {
      console.log(`[AI-Service] ${message}`);
    }
  } else {
    console.log(`[AI-Service] ${message}`, data !== null ? data : '');
  }
}

/**
 * Validates the AI response schema.
 * Expected: Array<{word: string, hints: string[]}>
 */
function validateSchema(data) {
  if (!Array.isArray(data)) return false;
  return data.every(item => 
    item &&
    typeof item.word === 'string' && 
    item.word.length > 0 &&
    Array.isArray(item.hints) && 
    item.hints.length === 3 &&
    item.hints.every(h => typeof h === 'string' && h.length > 0)
  );
}

/**
 * Delays execution for a specified time.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches trending words from DeepSeek AI with retry, timeout, and schema validation.
 * @param {number} count Number of words to fetch
 * @param {string[]} excludeWords List of words to exclude from generation
 * @returns {Promise<Array<{word: string, hints: string[]}>>} Array of trending words with hints
 */
export async function fetchTrendingWords(count = 10, excludeWords = []) {
  if (!apiKey || apiKey === 'dummy' || apiKey.includes('NEW-ROTATED-KEY')) {
    safeLog('⚠️ API Key is missing or invalid. Skipping AI fetch.');
    return [];
  }

  // Sample only a subset of excluded words to keep prompt short (e.g. last 50 words)
  const excludeSample = excludeWords.slice(-50).join(", ");
  const excludePrompt = excludeSample ? `\n6. EXCLUDE these words (do NOT generate them): ${excludeSample}.` : "";

  const messages = [
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
  ];

  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      safeLog(`Attempt ${attempts}/${MAX_RETRIES}: Fetching trending words...`);
      
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 1.3,
      });

      const content = response.choices[0].message.content.trim();
      
      // In non-prod, log raw response for debugging
      if (!IS_PROD) {
        console.log("----- AI Raw Response Start -----");
        console.log(content);
        console.log("----- AI Raw Response End -----");
      }

      // Clean up potential markdown code blocks
      const cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      
      let words;
      try {
        words = JSON.parse(cleanContent);
      } catch (e) {
        throw new Error('AI_JSON_PARSE_ERROR');
      }

      if (validateSchema(words)) {
        safeLog(`Successfully parsed ${words.length} words.`);
        return words;
      } else {
        throw new Error('AI_SCHEMA_INVALID');
      }
      
    } catch (error) {
      const isLastAttempt = attempts === MAX_RETRIES;
      const errorCode = error.code || error.message || 'AI_UNKNOWN_ERROR';
      
      safeLog(`Error in attempt ${attempts}: ${errorCode}`);
      
      if (isLastAttempt) {
        console.error(`[AI-Service] Final failure after ${MAX_RETRIES} attempts. Code: ${errorCode}`, error);
        return []; // Fail gracefully
      }
      
      await delay(RETRY_DELAY_MS * attempts); // Exponential backoff
    }
  }
  
  return [];
}

/**
 * Searches for reference images for a given word using an external search API (mocked for now).
 * In a real scenario, you would use Bing Image Search API or Google Custom Search JSON API.
 * @param {string} word The word to search for
 * @returns {Promise<string[]>} Array of image URLs
 */
export async function fetchReferenceImages(word) {
  if (!word) return [];

  // Since we don't have a real Image Search API key (like Bing/Google), 
  // we will use Unsplash Source or similar placeholder services that support keywords.
  // Note: Unsplash Source is deprecated/unreliable, so we'll use a combination of 
  // reliable placeholder services and maybe a direct scrape if needed (but scraping is risky).
  // For this demo, we will use `pollinations.ai` which is a free generative AI 
  // but it's very fast and works like a search engine for "concepts". 
  // It's technically AI generation but it's instant and free, perfect for "reference".
  
  try {
    // Strategy: Use Pollinations.ai for instant generated reference
    // It's much faster than DALL-E and free.
    // We add some seed to get different variations if needed.
    // Use Bing Image Search thumbnail API as a stable alternative since pollinations.ai is experiencing downtime (Error 1033)
    const imageUrl1 = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(word + ' photo')}&w=512&h=512&c=7&rs=1&p=0`;
    const imageUrl2 = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(word + ' cartoon')}&w=512&h=512&c=7&rs=1&p=0`;
    const imageUrl3 = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(word + ' sketch')}&w=512&h=512&c=7&rs=1&p=0`;
    
    return [imageUrl1, imageUrl2, imageUrl3];
  } catch (error) {
    console.error("Error fetching reference images:", error);
    return [];
  }
}
