import { expect, it } from 'vitest';

import { keyToAction } from './keys';

const press = (key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey', true>> = {}) =>
  keyToAction({ key, ctrlKey: false, metaKey: false, altKey: false, ...mods });

it('maps keys to actions', () => {
  expect(press('g')).toEqual({ type: 'TYPE', letter: 'g' });
  expect(press('G')).toEqual({ type: 'TYPE', letter: 'G' });
  expect(press('Enter')).toEqual({ type: 'SUBMIT' });
  expect(press('Backspace')).toEqual({ type: 'DELETE' });
  expect(press('Escape')).toEqual({ type: 'CLEAR' });
  expect(press(' ')).toEqual({ type: 'SHUFFLE' });
});

it('ignores modified keys and non-letters', () => {
  expect(press('r', { metaKey: true })).toBeNull();
  expect(press('a', { ctrlKey: true })).toBeNull();
  expect(press('Enter', { altKey: true })).toBeNull();
  expect(press('Shift')).toBeNull();
  expect(press('ArrowLeft')).toBeNull();
  expect(press('1')).toBeNull();
  expect(press('-')).toBeNull();
});
