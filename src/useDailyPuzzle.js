import { useState, useEffect } from 'react';

// Reference date: the date when puzzle index 0 was the daily puzzle
// You can adjust this to any date you want as the starting point
const REFERENCE_DATE = new Date('2024-01-01');
const REFERENCE_PUZZLE_INDEX = 0;

/**
 * Calculate the daily puzzle index based on the current date
 * Each day advances the puzzle by 1
 */
export const getDailyPuzzleIndex = (totalPuzzles) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const refDate = new Date(REFERENCE_DATE);
  refDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - refDate) / (1000 * 60 * 60 * 24));
  const puzzleIndex = (REFERENCE_PUZZLE_INDEX + daysDiff) % totalPuzzles;
  
  return puzzleIndex >= 0 ? puzzleIndex : totalPuzzles + puzzleIndex;
};

/**
 * Hook to manage daily puzzle state
 */
export const useDailyPuzzle = (totalPuzzles) => {
  const [dailyPuzzleIndex, setDailyPuzzleIndex] = useState(() => 
    getDailyPuzzleIndex(totalPuzzles)
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
      setDailyPuzzleIndex(getDailyPuzzleIndex(totalPuzzles));
      // Reload the page to reset the game at midnight
      window.location.reload();
    }, msUntilMidnight);
    
    return () => clearTimeout(timer);
  }, [totalPuzzles]);

  const returnToDaily = () => {
    setDailyPuzzleIndex(getDailyPuzzleIndex(totalPuzzles));
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
