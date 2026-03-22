#!/usr/bin/env node
/**
 * Retry specific puzzle IDs
 * Usage: node retry-puzzles.js 881 883 904 916
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION_FILE = path.join(__dirname, '../data/collected-puzzles.json');

const puzzleIds = process.argv.slice(2).map(Number);

if (puzzleIds.length === 0) {
    console.error('Usage: node retry-puzzles.js <puzzle-id> [puzzle-id...]');
    console.error('Example: node retry-puzzles.js 881 883 904');
    process.exit(1);
}

function getReferenceId() {
    try {
        const data = JSON.parse(fs.readFileSync(COLLECTION_FILE, 'utf8'));
        const ids = data.puzzles.map(p => p.id).sort((a, b) => a - b);
        return ids[ids.length - 1] + 1; // max + 1
    } catch (err) {
        console.error('Error reading collection:', err.message);
        return null;
    }
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
    const referenceId = getReferenceId();
    
    if (!referenceId) {
        console.error('Failed to get reference puzzle number from collection');
        process.exit(1);
    }
    
    console.log(`Using puzzle #${referenceId} as reference (max collected + 1)`);
    console.log(`Retrying ${puzzleIds.length} puzzle(s): ${puzzleIds.join(', ')}`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const puzzleId of puzzleIds) {
        if (puzzleId >= referenceId) {
            console.log(`⚠ Skipping #${puzzleId} (not yet available or already collected)`);
            continue;
        }
        
        const code = await retryPuzzle(puzzleId, referenceId);
        
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
