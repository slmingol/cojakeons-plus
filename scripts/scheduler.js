#!/usr/bin/env node
/**
 * Built-in scheduler for daily puzzle collection
 * Runs checks multiple times per day
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CHECK_TIMES = [2, 8, 14, 20]; // Check at 2am, 8am, 2pm, 8pm
const CHECK_INTERVAL = 15 * 60 * 1000; // Check every 15 minutes
const STATE_FILE = path.join(__dirname, '../data/scheduler-state.json');

// State tracking
let state = {
    lastRun: null,
    lastCheckDate: null,
    checksToday: 0,
    consecutiveErrors: 0,
    totalRuns: 0,
    totalErrors: 0
};

// Load state
function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const loaded = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
            state = { ...state, ...loaded };
            console.log(`[Scheduler] Loaded state: last run ${state.lastRun || 'never'}`);
        }
    } catch (err) {
        console.error('[Scheduler] Error loading state:', err.message);
    }
}

// Save state
function saveState() {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('[Scheduler] Error saving state:', err.message);
    }
}

// Should we run now?
function shouldRun() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDate = now.toISOString().split('T')[0];
    
    // Reset daily counter if it's a new day
    if (state.lastCheckDate !== currentDate) {
        state.checksToday = 0;
        state.lastCheckDate = currentDate;
    }
    
    // Check if we're in a check time window
    const isCheckTime = CHECK_TIMES.some(hour => 
        currentHour === hour && (!state.lastRun || 
        new Date(state.lastRun).getHours() !== hour)
    );
    
    return isCheckTime;
}

// Run the scraper
async function runScraper() {
    return new Promise((resolve) => {
        console.log(`[${new Date().toISOString()}] Running scheduled scrape...`);
        
        const scraperPath = path.join(__dirname, 'daily-scraper.js');
        const scraper = spawn('node', [scraperPath, '0'], {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        
        scraper.on('close', (code) => {
            if (code === 0) {
                state.consecutiveErrors = 0;
                console.log('[Scheduler] Scrape completed successfully');
            } else {
                console.error(`[Scheduler] Scrape failed with exit code ${code}`);
                state.consecutiveErrors++;
                state.totalErrors++;
            }
            
            state.lastRun = new Date().toISOString();
            state.checksToday++;
            state.totalRuns++;
            saveState();
            resolve();
        });
        
        scraper.on('error', (err) => {
            console.error('[Scheduler] Error spawning scraper:', err.message);
            state.consecutiveErrors++;
            state.totalErrors++;
            state.lastRun = new Date().toISOString();
            state.checksToday++;
            state.totalRuns++;
            saveState();
            resolve();
        });
    });
}

// Main scheduler loop
async function start() {
    console.log('[Scheduler] Starting...');
    console.log(`[Scheduler] Will check at hours: ${CHECK_TIMES.join(', ')}`);
    
    loadState();
    
    // Check immediately on startup
    if (shouldRun()) {
        await runScraper();
    }
    
    // Then check periodically
    setInterval(async () => {
        if (shouldRun()) {
            await runScraper();
        }
    }, CHECK_INTERVAL);
    
    console.log('[Scheduler] Running. Press Ctrl+C to stop.');
}

// Handle shutdown
process.on('SIGTERM', () => {
    console.log('[Scheduler] Shutting down...');
    saveState();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Scheduler] Shutting down...');
    saveState();
    process.exit(0);
});

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    start().catch(err => {
        console.error('[Scheduler] Fatal error:', err);
        process.exit(1);
    });
}

export { start, shouldRun, runScraper };
