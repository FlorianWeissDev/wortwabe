import type { GameAction } from '../engine';

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/** Maps a keyboard event to a game action; modified keys are left to the browser. */
export function keyToAction(event: KeyLike): GameAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return null;
  }
  switch (event.key) {
    case 'Enter':
      return { type: 'SUBMIT' };
    case 'Backspace':
      return { type: 'DELETE' };
    case 'Escape':
      return { type: 'CLEAR' };
    case ' ':
      return { type: 'SHUFFLE' };
  }
  return /^\p{L}$/u.test(event.key) ? { type: 'TYPE', letter: event.key } : null;
}
