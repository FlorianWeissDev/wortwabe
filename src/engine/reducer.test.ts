import { describe, expect, it } from 'vitest';

import { testPuzzle } from './__fixtures__/puzzle';
import { rankForScore } from './rank';
import { createGameState, reduce } from './reducer';
import { indexPuzzle, totalScore } from './score';
import type { GameState } from './types';

const index = indexPuzzle(testPuzzle);

function typeWord(state: GameState, word: string): GameState {
  return [...word].reduce((current, letter) => reduce(current, { type: 'TYPE', letter }), state);
}

function play(state: GameState, word: string): GameState {
  return reduce(typeWord(state, word), { type: 'SUBMIT' });
}

describe('createGameState', () => {
  it('starts empty with the puzzle letters in canonical order', () => {
    const state = createGameState(testPuzzle);
    expect(state.input).toBe('');
    expect(state.foundWords).toEqual([]);
    expect(state.outerOrder).toEqual(testPuzzle.outerLetters);
    expect(state.lastResult).toBeNull();
  });

  it('restores previously found words', () => {
    expect(createGameState(testPuzzle, ['kern', 'raten']).foundWords).toEqual(['kern', 'raten']);
  });

  it('discards saved words that are not solutions of this puzzle', () => {
    // Guards against a stale or hand-edited storage entry inflating the score.
    expect(createGameState(testPuzzle, ['kern', 'quatsch']).foundWords).toEqual(['kern']);
  });
});

describe('TYPE', () => {
  it('appends board letters', () => {
    expect(typeWord(createGameState(testPuzzle), 'kern').input).toBe('kern');
  });

  it('lowercases what is typed', () => {
    const state = reduce(createGameState(testPuzzle), { type: 'TYPE', letter: 'R' });
    expect(state.input).toBe('r');
  });

  it('returns the identical state for an off-board letter', () => {
    // Reference equality is how the UI knows to shake without a separate error channel.
    const state = createGameState(testPuzzle);
    expect(reduce(state, { type: 'TYPE', letter: 'b' })).toBe(state);
    expect(reduce(state, { type: 'TYPE', letter: 'ä' })).toBe(state);
    expect(reduce(state, { type: 'TYPE', letter: 'Enter' })).toBe(state);
  });
});

describe('DELETE and CLEAR', () => {
  it('removes the last letter', () => {
    const state = typeWord(createGameState(testPuzzle), 'kern');
    expect(reduce(state, { type: 'DELETE' }).input).toBe('ker');
  });

  it('empties the whole input', () => {
    const state = typeWord(createGameState(testPuzzle), 'kern');
    expect(reduce(state, { type: 'CLEAR' }).input).toBe('');
  });

  it('does nothing on an empty input', () => {
    const state = createGameState(testPuzzle);
    expect(reduce(state, { type: 'DELETE' })).toBe(state);
    expect(reduce(state, { type: 'CLEAR' })).toBe(state);
  });
});

describe('SHUFFLE', () => {
  it('keeps the same six outer letters', () => {
    const state = reduce(createGameState(testPuzzle), { type: 'SHUFFLE', random: () => 0.42 });
    expect([...state.outerOrder].sort()).toEqual([...testPuzzle.outerLetters].sort());
  });

  it('leaves the typed input and found words untouched', () => {
    const played = play(createGameState(testPuzzle), 'kern');
    const state = reduce(typeWord(played, 'rein'), { type: 'SHUFFLE', random: () => 0.42 });
    expect(state.input).toBe('rein');
    expect(state.foundWords).toEqual(['kern']);
  });
});

describe('SUBMIT', () => {
  it('records an accepted word and clears the input', () => {
    const state = play(createGameState(testPuzzle), 'raten');
    expect(state.foundWords).toEqual(['raten']);
    expect(state.input).toBe('');
    expect(state.lastResult).toEqual({
      status: 'ACCEPTED',
      word: 'raten',
      points: 5,
      isPangram: false,
    });
  });

  it('does not record a rejected word but still clears the input', () => {
    const state = play(createGameState(testPuzzle), 'renten');
    expect(state.foundWords).toEqual([]);
    expect(state.input).toBe('');
    expect(state.lastResult).toMatchObject({ status: 'REJECTED', reason: 'NOT_A_WORD' });
  });

  it('rejects a word that was already found', () => {
    const state = play(play(createGameState(testPuzzle), 'raten'), 'raten');
    expect(state.foundWords).toEqual(['raten']);
    expect(state.lastResult).toMatchObject({ reason: 'ALREADY_FOUND' });
  });

  it('does nothing on an empty input', () => {
    const state = createGameState(testPuzzle);
    expect(reduce(state, { type: 'SUBMIT' })).toBe(state);
  });

  it('keeps found words in the order they were found', () => {
    const state = play(play(play(createGameState(testPuzzle), 'raten'), 'kern'), 'irre');
    expect(state.foundWords).toEqual(['raten', 'kern', 'irre']);
  });
});

describe('playing a puzzle to the end', () => {
  it('reaches the top rank once every solution is found', () => {
    const state = [...index.solutions].reduce(play, createGameState(testPuzzle));

    expect(state.foundWords).toHaveLength(index.solutions.size);
    const score = totalScore(state.foundWords, state.index);
    expect(score).toBe(index.maxScore);
    expect(rankForScore(score, index.maxScore).id).toBe('QUEEN_BEE');
  });

  it('falls well short of the top when only the pangram is missing', () => {
    // The pangram is worth 17 of 43 points, so missing it costs two ranks —
    // which is the intended weight of finding one.
    const withoutPangram = [...index.solutions].filter((word) => word !== 'traktieren');
    const state = withoutPangram.reduce(play, createGameState(testPuzzle));
    const score = totalScore(state.foundWords, state.index);

    expect(score).toBe(26);
    const rank = rankForScore(score, index.maxScore);
    expect(rank.id).toBe('AMAZING');
    expect(rank.nextRank).toEqual({ id: 'GENIUS', pointsRequired: 30, pointsAway: 4 });
  });
});
