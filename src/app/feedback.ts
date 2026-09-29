import type { SubmitResult } from '../engine';
import { de } from '../locale/de';

/** Toast text for a submit result; accepted words are graded by length. */
export function feedbackText(result: SubmitResult): string {
  if (result.status === 'REJECTED') {
    return de.rejections[result.reason];
  }
  if (result.isPangram) {
    return de.accepted.pangram;
  }
  const length = result.word.length;
  if (length >= 7) {
    return de.accepted.excellent;
  }
  return length >= 5 ? de.accepted.strong : de.accepted.good;
}
