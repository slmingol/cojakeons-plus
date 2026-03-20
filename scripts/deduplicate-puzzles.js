#!/usr/bin/env node
/**
 * Remove duplicate puzzles from collection
 * Deduplicates by puzzle ID, keeping the first occurrence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isContainer = fs.existsSync('/usr/share/nginx/html/');
const dataDir = isContainer ? '/usr/share/nginx/html' : path.join(__dirname, '../data');

function deduplicateCollection() {
    const collectionPath = path.join(dataDir, 'collected-puzzles.json');
    
    if (!fs.existsSync(collectionPath)) {
        console.log('No collection file found');
        return;
    }
    
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
    const originalCount = collection.puzzles.length;
    
    // Deduplicate by ID
    const seen = new Set();
    const deduplicated = collection.puzzles.filter(puzzle => {
        if (seen.has(puzzle.id)) {
            console.log(`Removing duplicate: #${puzzle.id} - ${puzzle.date}`);
            return false;
        }
        seen.add(puzzle.id);
        return true;
    });
    
    if (deduplicated.length < originalCount) {
        collection.puzzles = deduplicated;
        collection.count = deduplicated.length;
        collection.collected = new Date().toISOString();
        
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
        console.log(`✓ Removed ${originalCount - deduplicated.length} duplicates`);
        console.log(`Remaining puzzles: ${deduplicated.length}`);
    } else {
        console.log('No duplicates found');
    }
}

function deduplicateStatic() {
    const srcPath = path.join(__dirname, '../src/puzzles.json');
    
    if (!fs.existsSync(srcPath)) {
        console.log('No static puzzles file found');
        return;
    }
    
    const puzzles = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    const originalCount = puzzles.length;
    
    // Deduplicate by ID
    const seen = new Set();
    const deduplicated = puzzles.filter(puzzle => {
        if (seen.has(puzzle.id)) {
            console.log(`Removing duplicate from static: #${puzzle.id}`);
            return false;
        }
        seen.add(puzzle.id);
        return true;
    });
    
    if (deduplicated.length < originalCount) {
        fs.writeFileSync(srcPath, JSON.stringify(deduplicated, null, 2));
        console.log(`✓ Removed ${originalCount - deduplicated.length} duplicates from static`);
        console.log(`Remaining puzzles: ${deduplicated.length}`);
        
        // Also update public
        const publicPath = path.join(__dirname, '../public/puzzles.json');
        if (fs.existsSync(publicPath)) {
            fs.writeFileSync(publicPath, JSON.stringify(deduplicated, null, 2));
        }
    } else {
        console.log('No duplicates found in static');
    }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    console.log('Deduplicating puzzles...');
    deduplicateCollection();
    deduplicateStatic();
    console.log('Done');
}

export { deduplicateCollection, deduplicateStatic };
