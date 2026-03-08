import { useState, useEffect } from 'react';

const GAME_STATE_KEY = 'conjakeions-plus-game-state';

const getDefaultGameState = () => ({
  currentPuzzleIndex: 0,
  solved: [],
  mistakes: 0,
  revealed: false,
});

const loadGameState = () => {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading game state:', error);
  }
  return getDefaultGameState();
};

const saveGameState = (state) => {
  try {
    const stateToSave = {
      ...state,
      savedAt: Date.now(),
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

const clearGameState = () => {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
};

export const hasSavedGame = () => {
  try {
    const stored = localStorage.getItem(GAME_STATE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      // Check if it has meaningful progress
      return (state.solved && state.solved.length > 0) || state.mistakes > 0;
    }
  } catch (error) {
    console.error('Error checking saved game:', error);
  }
  return false;
};

export const useGameState = () => {
  const [savedState, setSavedState] = useState(loadGameState);

  const saveState = (currentPuzzleIndex, solved, mistakes, revealed, gameOver) => {
    // Only save if game is in progress (not won/lost/revealed)
    if (!gameOver && !revealed) {
      const state = {
        currentPuzzleIndex,
        solved,
        mistakes,
        revealed,
      };
      setSavedState(state);
      saveGameState(state);
    } else {
      // Clear saved state when game is complete
      clearGameState();
    }
  };

  const clearState = () => {
    setSavedState(getDefaultGameState());
    clearGameState();
  };

  return {
    savedState,
    saveState,
    clearState,
  };
};
