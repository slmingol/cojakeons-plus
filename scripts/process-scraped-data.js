#!/usr/bin/env node
/**
 * Process scraped puzzle data for use in the app
 * - Sort puzzles by ID
 * - Clean date strings (remove ID prefix)
 * - Normalize date formats
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../data/collected-puzzles.json');
const outputSrcPath = path.join(__dirname, '../src/puzzles.json');
const outputPublicPath = path.join(__dirname, '../public/puzzles.json');

console.log('Processing scraped puzzle data...\n');

// Read scraped data
const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
console.log(`Loaded ${rawData.puzzles.length} puzzles from scraped data`);

// Sort by ID
const sorted = rawData.puzzles.sort((a, b) => a.id - b.id);
console.log(`Sorted puzzles by ID (${sorted[0].id} to ${sorted[sorted.length-1].id})`);

// Clean and normalize dates
const processed = sorted.map(puzzle => {
  // Remove ID prefix from date string
  let dateStr = puzzle.date.replace(/^\d+/, '').trim();
  
  // Try to parse and normalize to ISO date (YYYY-MM-DD)
  let normalizedDate = dateStr;
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      normalizedDate = parsed.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn(`  Warning: Could not parse date for puzzle ${puzzle.id}: "${dateStr}"`);
  }
  
  return {
    ...puzzle,
    date: normalizedDate
  };
});

console.log('\nDate format samples (before → after):');
[0, 100, 500, processed.length-1].forEach(idx => {
  const orig = sorted[idx];
  const proc = processed[idx];
  console.log(`  ID ${proc.id}: "${orig.date}" → "${proc.date}"`);
});

// Write to src/puzzles.json
fs.writeFileSync(outputSrcPath, JSON.stringify(processed, null, 2));
console.log(`\n✓ Wrote ${processed.length} puzzles to ${outputSrcPath}`);

// Write to public/puzzles.json
fs.writeFileSync(outputPublicPath, JSON.stringify(processed, null, 2));
console.log(`✓ Wrote ${processed.length} puzzles to ${outputPublicPath}`);

console.log('\nDone! Puzzle data is ready for the app.');
