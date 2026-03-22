#!/usr/bin/env node
/**
 * Manual puzzle entry for missing/gap puzzles
 * Interactive prompts for puzzle ID, date, categories, and words
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

const DIFFICULTY_COLORS = {
    1: '#F9DF6D',   // Yellow - Straightforward
    5: '#A0C35A',   // Green
    9: '#B0C4EF',   // Blue
    13: '#BA81C5'   // Purple - Tricky
};

async function manualEntry() {
    console.log('\n=== Manual Puzzle Entry ===\n');
    
    // Get puzzle ID
    const puzzleId = parseInt(await question('Puzzle ID: '));
    if (!puzzleId || isNaN(puzzleId)) {
        console.log('Invalid puzzle ID');
        rl.close();
        return;
    }
    
    // Get date
    const dateStr = await question('Date (e.g., "November 23, 2024"): ');
    
    console.log('\nEnter 4 categories. For each category:');
    console.log('  Difficulty: 1=Yellow (easy), 5=Green, 9=Blue, 13=Purple (hard)');
    
    const categories = [];
    
    for (let i = 1; i <= 4; i++) {
        console.log(`\n--- Category ${i} ---`);
        const name = await question('Category name: ');
        const difficultyInput = parseInt(await question('Difficulty (1/5/9/13): '));
        
        const difficulty = [1, 5, 9, 13].includes(difficultyInput) ? difficultyInput : 1;
        
        console.log('Enter 4 words:');
        const words = [];
        for (let w = 1; w <= 4; w++) {
            const word = await question(`  Word ${w}: `);
            words.push(word.toUpperCase());
        }
        
        categories.push({
            name: name,
            words: words,
            difficulty: difficulty,
            color: DIFFICULTY_COLORS[difficulty]
        });
    }
    
    const puzzle = {
        id: puzzleId,
        date: dateStr,
        categories: categories
    };
    
    // Show preview
    console.log('\n=== Preview ===');
    console.log(JSON.stringify(puzzle, null, 2));
    
    const confirm = await question('\nAdd this puzzle? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
        console.log('Cancelled');
        rl.close();
        return;
    }
    
    // Load collection
    const collectionPath = path.join(__dirname, '../data/collected-puzzles.json');
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    
    // Check for duplicate
    const existingIndex = collection.puzzles.findIndex(p => p.id === puzzleId);
    if (existingIndex !== -1) {
        console.log(`\n⚠ Puzzle #${puzzleId} already exists. Replacing...`);
        collection.puzzles[existingIndex] = puzzle;
    } else {
        collection.puzzles.push(puzzle);
    }
    
    // Sort by ID
    collection.puzzles.sort((a, b) => a.id - b.id);
    
    // Update metadata
    collection.count = collection.puzzles.length;
    collection.collected = new Date().toISOString();
    
    // Save
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
    
    console.log(`\n✓ Added puzzle #${puzzleId}`);
    console.log(`Total puzzles: ${collection.count}`);
    
    rl.close();
}

manualEntry().catch(err => {
    console.error('Error:', err);
    rl.close();
    process.exit(1);
});
