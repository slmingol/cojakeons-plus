#!/usr/bin/env node
/**
 * Retry specific puzzle IDs
 * Usage: node retry-puzzles.js 881 883 904 916
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';

const puzzleIds = process.argv.slice(2).map(Number);

if (puzzleIds.length === 0) {
    console.error('Usage: node retry-puzzles.js <puzzle-id> [puzzle-id...]');
    console.error('Example: node retry-puzzles.js 881 883 904');
    process.exit(1);
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
    console.log('Fetching current puzzle number...');
    const today = await getTodaysPuzzleNumber();
    
    if (!today) {
        console.error('Failed to detect current puzzle number');
        process.exit(1);
    }
    
    console.log(`Current puzzle: #${today}`);
    console.log(`Retrying ${puzzleIds.length} puzzle(s): ${puzzleIds.join(', ')}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const puzzleId of puzzleIds) {
        if (puzzleId > today) {
            console.log(`⚠ Skipping #${puzzleId} (future puzzle)`);
            continue;
        }
        
        const code = await retryPuzzle(puzzleId, today);
        
        if (code === 0) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Delay between retries
        if (puzzleId !== puzzleIds[puzzleIds.length - 1]) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`\nRetry complete: ${successCount} succeeded, ${failCount} failed`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
