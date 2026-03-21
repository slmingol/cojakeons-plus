#!/usr/bin/env node
/**
 * Auto-detect and retry missing puzzles
 * Usage: node retry-missing.js
 */

import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION_FILE = path.join(__dirname, '../data/collected-puzzles.json');

function getCollectedPuzzleIds() {
    try {
        const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf8'));
        return data.puzzles.map(p => p.id).sort((a, b) => a - b);
    } catch (err) {
        console.error('Error reading collection:', err.message);
        return [];
    }
}

function findMissingIds(collectedIds) {
    if (collectedIds.length === 0) return [];
    
    const min = collectedIds[0];
    const max = collectedIds[collectedIds.length - 1];
    const missing = [];
    
    for (let id = min; id <= max; id++) {
        if (!collectedIds.includes(id)) {
            missing.push(id);
        }
    }
    
    return missing;
}

async function getTodaysPuzzleNumber() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://connectionsplus.io/nyt-archive');
    const bodyText = await page.textContent('body');
    const match = bodyText.match(/Connections #(\d+)/);
    await browser.close();
    return match ? parseInt(match[1]) : null;
}

async function retryPuzzle(puzzleId, today) {
    const daysAgo = today - puzzleId;
    
    console.log(`\n[${new Date().toISOString()}] Retrying puzzle #${puzzleId} (${daysAgo} days ago)...`);
    
    return new Promise((resolve) => {
        const scraper = spawn('node', ['scripts/daily-scraper.js', daysAgo.toString()], {
            stdio: 'inherit'
        });
        
        scraper.on('close', (code) => {
            if (code === 0) {
                console.log(`✓ Puzzle #${puzzleId} completed`);
            } else {
                console.error(`✗ Puzzle #${puzzleId} failed with exit code ${code}`);
            }
            resolve(code);
        });
        
        scraper.on('error', (err) => {
            console.error(`✗ Puzzle #${puzzleId} error:`, err.message);
            resolve(1);
        });
    });
}

async function main() {
    console.log('Analyzing collection for missing puzzles...');
    
    const collectedIds = getCollectedPuzzleIds();
    
    if (collectedIds.length === 0) {
        console.error('No puzzles found in collection');
        process.exit(1);
    }
    
    console.log(`Collection: ${collectedIds.length} puzzles (${collectedIds[0]} - ${collectedIds[collectedIds.length - 1]})`);
    
    const missingIds = findMissingIds(collectedIds);
    
    if (missingIds.length === 0) {
        console.log('✓ No missing puzzles found! Collection is complete.');
        process.exit(0);
    }
    
    console.log(`Found ${missingIds.length} missing puzzle(s): ${missingIds.join(', ')}`);
    console.log('\nFetching current puzzle number...');
    
    const today = await getTodaysPuzzleNumber();
    
    if (!today) {
        console.error('Failed to detect current puzzle number');
        process.exit(1);
    }
    
    console.log(`Current puzzle: #${today}`);
    console.log(`\nRetrying ${missingIds.length} missing puzzle(s)...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const puzzleId of missingIds) {
        const code = await retryPuzzle(puzzleId, today);
        
        if (code === 0) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Delay between retries
        if (puzzleId !== missingIds[missingIds.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`\nRetry complete: ${successCount} succeeded, ${failCount} failed`);
    
    if (failCount > 0) {
        console.log('\nNote: Some puzzles may have failed due to malformed data (e.g., 15-tile puzzles).');
        console.log('These failures are expected and can be ignored.');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
