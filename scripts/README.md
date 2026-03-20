# Puzzle Scraping Scripts

This directory contains scripts for collecting daily Connections puzzles from connectionsgame.org.

## Scripts

### `daily-scraper.js`
Fetches today's puzzle from connectionsgame.org.

**Note:** Because connectionsgame.org doesn't expose solutions without gameplay, this script currently only fetches metadata (puzzle ID and date). You'll need to either:
- Play through the puzzle and manually record the solution
- Use browser dev tools to extract the solution data
- Wait for puzzle solution APIs/endpoints

```bash
npm run scrape
```

### `scheduler.js`
Runs the daily scraper automatically at scheduled times (2am, 8am, 2pm, 8pm).

```bash
npm run scheduler
```

Keep this running as a service or background process:
```bash
nohup npm run scheduler > logs/scheduler.log 2>&1 &
```

### `merge-puzzles.js`
Merges newly collected puzzles with the static `src/puzzles.json` file. Use this after manually adding solutions to `data/collected-puzzles.json`.

```bash
npm run merge
```

### `deduplicate-puzzles.js`
Removes duplicate puzzles (by ID) from both collected and static puzzle files.

```bash
npm run dedupe
```

## Workflow

### Manual Solution Entry

Since auto-scraping solutions is difficult, here's the recommended workflow:

1. **Run the scraper** to get today's puzzle metadata:
   ```bash
   npm run scrape
   ```

2. **Play the puzzle** on connectionsgame.org (or extract via browser dev tools)

3. **Manually add the solution** to `data/collected-puzzles.json`:
   ```json
   {
     "id": 916,
     "date": "March 20, 2026",
     "categories": [
       {
         "name": "Things that are round",
         "words": ["BALL", "COIN", "GLOBE", "WHEEL"],
         "difficulty": 1,
         "color": "#F9DF6D"
       },
       {
         "name": "Types of cheese",
         "words": ["BRIE", "CHEDDAR", "GOUDA", "SWISS"],
         "difficulty": 2,
         "color": "#A0C35A"
       },
       {
         "name": "Words ending in -TION",
         "words": ["ACTION", "MOTION", "NATION", "POTION"],
         "difficulty": 3,
         "color": "#B0C4EF"
       },
       {
         "name": "___BOX",
         "words": ["CHAT", "LUNCH", "MAIL", "TOY"],
         "difficulty": 4,
         "color": "#BA81C5"
       }
     ]
   }
   ```

4. **Merge with main puzzle collection**:
   ```bash
   npm run merge
   ```

5. **Rebuild the app** to include new puzzles:
   ```bash
   npm run build
   ```

## Automation with GitHub Actions

You can set up GitHub Actions to:
1. Run the scraper daily
2. Create an issue with puzzle metadata
3. Manually fill in solutions via PR
4. Auto-merge and rebuild

See `.github/workflows/` for examples from cat-climber project.

## Data Files

- `data/collected-puzzles.json` - Scraped/collected puzzles (can include partial/incomplete)
- `data/scheduler-state.json` - Scheduler state tracking
- `src/puzzles.json` - Main static puzzle collection (915 puzzles)
- `public/puzzles.json` - Copy for static serving

## Copyright Notice

NYT Connections puzzles are copyrighted by The New York Times. This scraper is for personal/educational use only. Respect connectionsgame.org's terms of service and rate limits.
