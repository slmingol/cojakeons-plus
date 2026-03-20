#!/usr/bin/env node
/**
 * Daily Connections puzzle scraper for connectionsgame.org
 * Fetches today's puzzle with solution
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mapping for difficulty levels
const DIFFICULTY_COLORS = {
    1: '#F9DF6D', // Yellow
    2: '#A0C35A', // Green
    3: '#B0C4EF', // Blue
    4: '#BA81C5'  // Purple
};

/**
 * Get today's puzzle from connectionsgame.org
 */
async function getTodaysPuzzle() {
    let browser;
    try {
        console.log(`[${new Date().toISOString()}] Starting daily puzzle scrape...`);
        
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        const url = 'https://connectionsgame.org/';
        console.log(`Fetching ${url}...`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract puzzle data by looking for the archive or solution reveal
        const puzzleData = await page.evaluate(() => {
            const data = {
                id: null,
                date: null,
                categories: []
            };
            
            // Try to extract date
            const dateText = document.body.textContent;
            const dateMatch = dateText.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[^,]*,\s*\w+\s+\d+,\s*\d{4}/);
            if (dateMatch) {
                data.date = dateMatch[0];
            } else {
                // Fallback to current date
                data.date = new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
            
            // Try to extract puzzle number
            const puzzleNumMatch = dateText.match(/Puzzle\s+#?(\d+)/i);
            if (puzzleNumMatch) {
                data.id = parseInt(puzzleNumMatch[1]);
            }
            
            return data;
        });
        
        // If we couldn't get the data from the main page, try the archive
        if (!puzzleData.id || puzzleData.categories.length === 0) {
            console.log('Attempting to fetch from archive page...');
            
            await page.goto('https://connectionsgame.org/archive/', { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Extract from archive - look for today's puzzle
            const archiveData = await page.evaluate(() => {
                // Find the most recent puzzle in the archive
                const puzzleElements = document.querySelectorAll('[data-puzzle-id]');
                
                if (puzzleElements.length === 0) {
                    return null;
                }
                
                // Get the first (most recent) puzzle
                const firstPuzzle = puzzleElements[0];
                const puzzleId = firstPuzzle.getAttribute('data-puzzle-id');
                
                // Try to extract categories and words
                const categoryDivs = firstPuzzle.querySelectorAll('.category, .group-row, [class*="category"]');
                
                return {
                    id: puzzleId,
                    html: firstPuzzle.innerHTML,
                    categoryCount: categoryDivs.length
                };
            });
            
            if (archiveData) {
                Object.assign(puzzleData, archiveData);
            }
        }
        
        await browser.close();
        
        if (!puzzleData.id) {
            console.log('Could not extract puzzle data');
            return null;
        }
        
        console.log(`Found puzzle #${puzzleData.id} for ${puzzleData.date}`);
        
        // For now, return the metadata. In a real implementation, you'd need to
        // either scrape the revealed solution or have manual entry
        return puzzleData;
        
    } catch (error) {
        console.error('Error fetching daily puzzle:', error.message);
        if (browser) await browser.close();
        return null;
    }
}

/**
 * Manual puzzle entry helper
 * Since connectionsgame.org may not expose the solution without playing,
 * this helps format manually entered puzzles
 */
function createPuzzleEntry(puzzleId, date, categories) {
    return {
        id: puzzleId,
        date: date,
        categories: categories.map((cat, idx) => ({
            name: cat.name,
            words: cat.words,
            difficulty: cat.difficulty || (idx + 1),
            color: DIFFICULTY_COLORS[cat.difficulty || (idx + 1)]
        }))
    };
}

/**
 * Add puzzle to collection
 */
function addToCollection(puzzleData) {
    try {
        // Determine paths
        const isContainer = fs.existsSync('/usr/share/nginx/html/');
        const collectionPath = isContainer 
            ? '/usr/share/nginx/html/collected-puzzles.json'
            : path.join(__dirname, '../data/collected-puzzles.json');
        
        console.log(`Using collection path: ${collectionPath}`);
        
        let collection = { 
            collected: new Date().toISOString(), 
            count: 0, 
            puzzles: [] 
        };
        
        if (fs.existsSync(collectionPath)) {
            collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
        }
        
        // Check if puzzle already exists
        const exists = collection.puzzles.some(p => p.id === puzzleData.id);
        
        if (exists) {
            console.log(`Puzzle #${puzzleData.id} already exists in collection`);
            return false;
        }
        
        // Add to beginning (newest first)
        collection.puzzles.unshift(puzzleData);
        collection.count = collection.puzzles.length;
        collection.collected = new Date().toISOString();
        
        // Save
        const dir = path.dirname(collectionPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
        console.log(`✓ Added puzzle #${puzzleData.id} to collection`);
        console.log(`Total puzzles: ${collection.count}`);
        
        return true;
        
    } catch (error) {
        console.error('Error adding to collection:', error.message);
        return false;
    }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    getTodaysPuzzle().then((puzzleData) => {
        if (puzzleData) {
            console.log('Daily scrape complete');
            console.log('Note: connectionsgame.org requires manual solution entry or gameplay');
            console.log('Puzzle metadata retrieved:', JSON.stringify(puzzleData, null, 2));
        } else {
            console.log('No puzzle retrieved');
        }
        process.exit(0);
    }).catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}

export { 
    getTodaysPuzzle, 
    createPuzzleEntry, 
    addToCollection,
    DIFFICULTY_COLORS 
};
