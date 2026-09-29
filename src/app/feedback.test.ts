import { expect, it } from 'vitest';

import { de } from '../locale/de';
import { feedbackText } from './feedback';

const accepted = (word: string, isPangram = false) =>
  ({ status: 'ACCEPTED', word, points: 1, isPangram }) as const;

it('grades accepted words by length, with pangram taking precedence', () => {
  expect(feedbackText(accepted('geil'))).toBe(de.accepted.good);
  expect(feedbackText(accepted('geist'))).toBe(de.accepted.strong);
  expect(feedbackText(accepted('geiste'))).toBe(de.accepted.strong);
  expect(feedbackText(accepted('geistes'))).toBe(de.accepted.excellent);
  expect(feedbackText(accepted('lustige', true))).toBe(de.accepted.pangram);
  expect(feedbackText({ status: 'REJECTED', reason: 'ALREADY_FOUND', word: 'geil' })).toBe(
    de.rejections.ALREADY_FOUND,
  );
});
