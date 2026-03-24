import { useState, useEffect } from 'react';

/**
 * Find the daily puzzle index by matching today's date with puzzle dates
 * Returns the puzzle that matches today's date, or the most recent puzzle if none match
 */
export const getDailyPuzzleIndex = (puzzles) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Try to find exact date match
  const exactMatch = puzzles.findIndex(p => p.date === todayStr);
  if (exactMatch !== -1) {
    return exactMatch;
  }
  
  // If no exact match, find the most recent puzzle (latest date <= today)
  let latestIndex = 0;
  let latestDate = new Date(puzzles[0].date);
  
  for (let i = 1; i < puzzles.length; i++) {
    const puzzleDate = new Date(puzzles[i].date);
    if (puzzleDate <= today && puzzleDate > latestDate) {
      latestDate = puzzleDate;
      latestIndex = i;
    }
  }
  
  return latestIndex;
};

/**
 * Hook to manage daily puzzle state
 */
export const useDailyPuzzle = (puzzles) => {
  const [dailyPuzzleIndex, setDailyPuzzleIndex] = useState(() => 
    getDailyPuzzleIndex(puzzles)
  );
  const [isPlayingDaily, setIsPlayingDaily] = useState(true);

  // Update daily puzzle at midnight
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow - now;
    
    const timer = setTimeout(() => {
      setDailyPuzzleIndex(getDailyPuzzleIndex(puzzles));
      // Reload the page to reset the game at midnight
      window.location.reload();
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [puzzles]);

  const returnToDaily = () => {
    setDailyPuzzleIndex(getDailyPuzzleIndex(puzzles));
    setIsPlayingDaily(true);
    return dailyPuzzleIndex;
  };

  const setBrowseMode = () => {
    setIsPlayingDaily(false);
  };

  return {
    dailyPuzzleIndex,
    isPlayingDaily,
    returnToDaily,
    setBrowseMode,
  };
};
