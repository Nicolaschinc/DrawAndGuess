
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// Mock fs module
vi.mock('fs');

describe('Word Manager', () => {
  let wordManager;

  beforeEach(async () => {
    vi.resetModules(); // Reset modules to re-import and re-run top-level code
    vi.clearAllMocks();
  });

  it('should load words from file successfully', async () => {
    // Setup mock file content
    const mockWords = {
      "TestCategory": ["word1", "word2"]
    };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockWords));

    // Import module after setting up mock
    wordManager = await import('../wordManager.js');

    const words = wordManager.getAllWordsList();
    expect(words).toContain('word1');
    expect(words).toContain('word2');
    expect(wordManager.getCategories()).toContain('TestCategory');
  });

  it('should fallback to default words if file read fails', async () => {
    // Setup mock to throw error
    fs.readFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    // Import module
    wordManager = await import('../wordManager.js');

    const words = wordManager.getAllWordsList();
    // Check for fallback words (e.g., "猫")
    expect(words).toContain('猫');
    expect(words.length).toBeGreaterThan(0);
  });

  it('getRandomWord should return a word', async () => {
    const mockWords = { "Test": ["singleWord"] };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockWords));
    wordManager = await import('../wordManager.js');

    const word = wordManager.getRandomWord();
    expect(word.word).toBe('singleWord');
    expect(word.category).toBe('Test');
  });

  it('addHotWords should add new words and avoid duplicates', async () => {
    const mockWords = { "Test": ["oldWord"] };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockWords));
    wordManager = await import('../wordManager.js');

    const initialCount = wordManager.getAllWordsList().length;
    
    // Add new words
    wordManager.addHotWords([
      { word: "newWord", hints: [] },
      { word: "oldWord", hints: [] } // Duplicate
    ]);

    const words = wordManager.getAllWordsList();
    expect(words).toContain('newWord');
    expect(words.filter(w => w === 'oldWord').length).toBe(1); // Should still be 1
    expect(words.length).toBe(initialCount + 1);
  });

  it('should handle hot words with 50% chance', async () => {
    const mockWords = { 
      "Normal": ["normal1"],
      "热门": ["hot1"]
    };
    fs.readFileSync.mockReturnValue(JSON.stringify(mockWords));
    
    // Mock Math.random to favor hot words
    // In wordManager: if (hotWords.length > 0 && Math.random() < 0.5)
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.1); // < 0.5

    wordManager = await import('../wordManager.js');
    const word = wordManager.getRandomWord();
    
    expect(word.category).toBe('热门');
    expect(word.word).toBe('hot1');
  });
});
