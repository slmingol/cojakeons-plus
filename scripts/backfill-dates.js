#!/usr/bin/env node
/**
 * Backfill correct publication dates from CSV to collected-puzzles.json
 * CSV has dates in YYYY-MM-DD format, we need "Month Day, Year" format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCsvDate(csvDate) {
    // Convert "2023-06-12" to "June 12, 2023"
    const date = new Date(csvDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function loadCsvDates() {
    const csvPath = path.join(__dirname, '../Connections_Data.csv');
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.trim().split('\n');
    
    // Build a map of puzzle ID -> date
    const dateMap = new Map();
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\d+),(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const puzzleId = parseInt(match[1]);
            const csvDate = match[2];
            
            if (!dateMap.has(puzzleId)) {
                dateMap.set(puzzleId, parseCsvDate(csvDate));
            }
        }
    }
    
    return dateMap;
}

function backfillDates() {
    console.log('Loading CSV dates...');
    const dateMap = loadCsvDates();
    console.log(`Found ${dateMap.size} unique puzzle dates in CSV`);
    
    const collectionPath = path.join(__dirname, '../data/collected-puzzles.json');
    console.log('Loading collected puzzles...');
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    
    let updated = 0;
    let notFound = 0;
    
    for (const puzzle of collection.puzzles) {
        if (dateMap.has(puzzle.id)) {
            const correctDate = dateMap.get(puzzle.id);
            if (puzzle.date !== correctDate) {
                console.log(`Updating #${puzzle.id}: "${puzzle.date}" -> "${correctDate}"`);
                puzzle.date = correctDate;
                updated++;
            }
        } else {
            console.log(`Warning: No CSV date found for puzzle #${puzzle.id}`);
            notFound++;
        }
    }
    
    if (updated > 0) {
        collection.collected = new Date().toISOString();
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
        console.log(`\n✓ Updated ${updated} puzzle dates`);
    } else {
        console.log('\nNo updates needed');
    }
    
    if (notFound > 0) {
        console.log(`⚠ ${notFound} puzzles not found in CSV (likely beyond CSV range)`);
    }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    backfillDates();
}

export { backfillDates };
