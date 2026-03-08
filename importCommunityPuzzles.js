/**
 * Import community-created puzzles from connections.swellgarfo.com
 * These are user-generated puzzles created with ChatGPT API and shared publicly
 * 
 * Source: https://www.reddit.com/r/NYTConnections/comments/185jok9/
 */

import https from 'https';
import fs from 'fs';

// Community puzzle IDs from the Reddit thread
const COMMUNITY_PUZZLES = [
  { id: '-NkIF0x3AxfILfXwHT52', description: 'Reddit-related words' },
  { id: '-NkIGdgBULxOdNZpI2OG', description: 'ChatGPT-related words' },
  { id: '-NkITR_Teq3_6B9uCgUO', description: 'Multiple meanings puzzle' },
  { id: '-NkIUT-5q5xc17XD_RBw', description: 'Science and nature' },
  { id: '-NkIUoZrvhj2Q91qG_P8', description: 'Versatile words' },
  { id: '-NkIJDCvpfvxfmzquQ0L', description: 'Fun puzzle #1' },
  { id: '-NkIJwQKPqB_mI736dwE', description: 'Fun puzzle #2' },
  { id: '-NkIKBdRbkJJ_u9Kg2gO', description: 'Red herrings #1' },
  { id: '-NkIKX33cMdBlNicdEIR', description: 'Red herrings #2' },
  { id: '-NkINs9DJ_HZxrqis06z', description: 'Science-related' },
  { id: '-NkIP4d7Vkqq6OIhWBfS', description: 'Puzzle about puzzles' },
  { id: '-NkIR5g79A6gCozP5Fdw', description: 'Emoji puzzle' },
  { id: '-NkIFKaW7vx-d3EO9U6E', description: 'Very difficult #1' },
  { id: '-NkIO6MimUErKzGAcn9o', description: 'Very difficult #2' },
];

/**
 * Fetch a puzzle from swellgarfo.com
 */
function fetchPuzzle(puzzleId) {
  return new Promise((resolve, reject) => {
    const url = `https://connections.swellgarfo.com/game/${puzzleId}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse puzzle HTML to extract categories and words
 */
function parsePuzzleHTML(html) {
  try {
    // Try to extract words from the HTML
    // The words appear as consecutive uppercase text
    const allCapsPattern = /\b[A-Z]{2,}\b/g;
    const matches = html.match(allCapsPattern);
    
    if (!matches) {
      throw new Error('Could not find any words in puzzle HTML');
    }
    
    // Filter out common HTML/technical words and take unique values
    const technicalWords = new Set([
      'HTML', 'HTTP', 'HTTPS', 'DOCTYPE', 'META', 'UTF', 'IONICONS', 
      'NEW', 'PLAY', 'ONLINE', 'WEBSITE', 'MADE', 'BY', 'COPYRIGHT',
      'SCATTERGORIES', 'PICTIONARY', 'REALLY', 'BORING', 'SWELLGARFO',
      'PUZZLES', 'CREATE', 'SHUFFLE', 'CLEAR', 'SUBMIT', 'INCORRECT'
    ]);
    const uniqueWords = [];
    const seen = new Set();
    
    for (const word of matches) {
      if (!technicalWords.has(word) && !seen.has(word) && word.length >= 3) {
        uniqueWords.push(word);
        seen.add(word);
      }
    }
    
    if (uniqueWords.length < 16) {
      console.log('  Found words:', uniqueWords.slice(0, 20));
      throw new Error(`Found only ${uniqueWords.length} words, need 16`);
    }
    
    // Take the first 16 unique words
    const words = uniqueWords.slice(0, 16);
    
    console.log('  Extracted words:', words);
    
    return {
      words,
      needsManualCategorization: true
    };
  } catch (error) {
    throw new Error(`Failed to parse puzzle: ${error.message}`);
  }
}

/**
 * Convert to your puzzle format
 * Note: Categories need to be filled in manually by playing the puzzle
 */
function convertToPuzzleFormat(puzzleData, description) {
  return {
    categories: [
      {
        category: "CATEGORY 1 - Play puzzle to discover",
        words: puzzleData.words.slice(0, 4),
        difficulty: 1
      },
      {
        category: "CATEGORY 2 - Play puzzle to discover",
        words: puzzleData.words.slice(4, 8),
        difficulty: 2
      },
      {
        category: "CATEGORY 3 - Play puzzle to discover",
        words: puzzleData.words.slice(8, 12),
        difficulty: 3
      },
      {
        category: "CATEGORY 4 - Play puzzle to discover",
        words: puzzleData.words.slice(12, 16),
        difficulty: 4
      }
    ],
    source: `Community puzzle: ${description}`,
    date: new Date().toISOString().split('T')[0]
  };
}

/**
 * Main function to import puzzles
 */
async function importPuzzles() {
  console.log('Fetching community puzzles from connections.swellgarfo.com...\n');
  
  const importedPuzzles = [];
  
  for (const puzzle of COMMUNITY_PUZZLES) {  // Import all puzzles
    try {
      console.log(`Fetching ${puzzle.description}...`);
      const html = await fetchPuzzle(puzzle.id);
      const parsedData = parsePuzzleHTML(html);
      const converted = convertToPuzzleFormat(parsedData, puzzle.description);
      
      importedPuzzles.push(converted);
      console.log(`✓ Successfully fetched: ${puzzle.description}\n`);
      
      // Be polite - wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Failed to fetch ${puzzle.description}:`, error.message);
    }
  }
  
  // Load existing puzzles
  const puzzlesPath = './src/puzzles.json';
  const existingPuzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf8'));
  
  // Add new puzzles to the end
  const updatedPuzzles = [...existingPuzzles, ...importedPuzzles];
  
  console.log(`\nImported ${importedPuzzles.length} new community puzzles`);
  console.log(`Total puzzles: ${updatedPuzzles.length}`);
  console.log('\nNOTE: Category names are placeholders. Play each puzzle on');
  console.log('connections.swellgarfo.com to discover the actual categories,');
  console.log('then update puzzles.json with the correct category names.\n');
  
  // Write to a new file so you can review before merging
  fs.writeFileSync('./src/puzzles-with-community.json', JSON.stringify(updatedPuzzles, null, 2));
  
  console.log('✓ Saved to: src/puzzles-with-community.json');
  console.log('  Review the file, then rename it to puzzles.json to use it.\n');
}

// Run the import
importPuzzles().catch(console.error);

export { fetchPuzzle, parsePuzzleHTML, convertToPuzzleFormat };
