import { createGameState, rankForScore, reduce, totalScore } from '../engine';
import type { GameAction, GameState, Puzzle } from '../engine';

export interface GameOptions {
  /** Previously found words (normalized) and reveal flag to restore. */
  saved?: { foundWords: readonly string[]; revealed: boolean };
  /** Called with the full progress after a new word, a reveal or a hide. */
  onchange?: (progress: { foundWords: readonly string[]; revealed: boolean }) => void;
}

export function createGame(puzzle: Puzzle, options: GameOptions = {}) {
  let state = $state.raw<GameState>(createGameState(puzzle, options.saved?.foundWords));
  let revealed = $state(options.saved?.revealed ?? false);
  let shakeId = $state(0);
  let feedbackId = $state(0);

  const score = $derived(totalScore(state.foundWords, state.index));
  const rank = $derived(rankForScore(score, state.index.maxScore));
  const sortedFound = $derived(
    state.foundWords
      .map((word) => state.index.displayForms.get(word) ?? word)
      .sort((a, b) => a.localeCompare(b, 'de')),
  );
  const missed = $derived(
    [...state.index.solutions]
      .filter((word) => !state.foundWords.includes(word))
      .map((word) => state.index.displayForms.get(word) ?? word)
      .sort((a, b) => a.localeCompare(b, 'de')),
  );
  const pangramForms = $derived(
    new Set([...state.index.pangrams].map((word) => state.index.displayForms.get(word) ?? word)),
  );

  return {
    get state() {
      return state;
    },
    get score() {
      return score;
    },
    get rank() {
      return rank;
    },
    get sortedFound() {
      return sortedFound;
    },
    get missed(): readonly string[] {
      return missed;
    },
    get revealed() {
      return revealed;
    },
    get pangramForms(): ReadonlySet<string> {
      return pangramForms;
    },
    get shakeId() {
      return shakeId;
    },
    get feedbackId() {
      return feedbackId;
    },
    dispatch(action: GameAction): void {
      const previousCount = state.foundWords.length;
      const next = reduce(state, action);
      if (action.type === 'TYPE' && next === state) {
        shakeId += 1;
      }
      if (action.type === 'SUBMIT' && next.lastResult !== null) {
        feedbackId += 1;
      }
      state = next;
      if (action.type === 'SUBMIT' && next.foundWords.length > previousCount) {
        options.onchange?.({ foundWords: next.foundWords, revealed });
      }
    },
    reveal(): void {
      revealed = true;
      options.onchange?.({ foundWords: state.foundWords, revealed });
    },
    hide(): void {
      revealed = false;
      options.onchange?.({ foundWords: state.foundWords, revealed });
    },
  };
}

export type Game = ReturnType<typeof createGame>;
