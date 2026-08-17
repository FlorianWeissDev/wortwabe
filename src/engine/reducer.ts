import { normalizeKey } from './normalize';
import { indexPuzzle } from './score';
import { shuffled } from './shuffle';
import type { GameState, Letter, Puzzle } from './types';
import { validateWord } from './validate';

export type GameAction =
  | { type: 'TYPE'; letter: string }
  | { type: 'DELETE' }
  | { type: 'CLEAR' }
  | { type: 'SHUFFLE'; random?: () => number }
  | { type: 'SUBMIT' };

export function createGameState(puzzle: Puzzle, foundWords: readonly string[] = []): GameState {
  const index = indexPuzzle(puzzle);
  return {
    index,
    input: '',
    outerOrder: [...puzzle.outerLetters],
    // Saved progress is filtered against the puzzle so a stale or tampered entry
    // cannot inflate the score.
    foundWords: foundWords.filter((word) => index.solutions.has(word)),
    lastResult: null,
  };
}

/**
 * Returns the *same* state object when an action changes nothing — notably when
 * an off-board letter is typed. The UI uses that identity check to trigger the
 * rejection shake without a separate error channel.
 */
export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TYPE': {
      const letter = normalizeKey(action.letter);
      if (letter === null || !state.index.letters.has(letter)) {
        return state;
      }
      return { ...state, input: state.input + letter, lastResult: null };
    }

    case 'DELETE': {
      if (state.input.length === 0) {
        return state;
      }
      return { ...state, input: state.input.slice(0, -1), lastResult: null };
    }

    case 'CLEAR': {
      if (state.input.length === 0) {
        return state;
      }
      return { ...state, input: '', lastResult: null };
    }

    case 'SHUFFLE': {
      const outerOrder: readonly Letter[] = shuffled(state.outerOrder, action.random);
      return { ...state, outerOrder };
    }

    case 'SUBMIT': {
      if (state.input.length === 0) {
        return state;
      }
      const result = validateWord(state.input, state.index, state.foundWords);
      return {
        ...state,
        input: '',
        lastResult: result,
        foundWords:
          result.status === 'ACCEPTED' ? [...state.foundWords, result.word] : state.foundWords,
      };
    }
  }
}
