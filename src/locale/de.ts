import type { RankId, RejectionReason } from '../engine';

const months = [
  'Jan.',
  'Feb.',
  'März',
  'Apr.',
  'Mai',
  'Juni',
  'Juli',
  'Aug.',
  'Sept.',
  'Okt.',
  'Nov.',
  'Dez.',
] as const;

/**
 * The single place German user-facing text is allowed to live.
 * See CLAUDE.md — no German string literals anywhere else in the codebase.
 */
export const de = {
  appName: 'Wortwabe',
  tagline: 'Das wöchentliche Wortspiel',

  ranks: {
    BEGINNER: 'Anfang',
    GOOD_START: 'Guter Start',
    MOVING_UP: 'Aufstieg',
    GOOD: 'Gut',
    SOLID: 'Solide',
    STRONG: 'Stark',
    GREAT: 'Großartig',
    AMAZING: 'Erstaunlich',
    GENIUS: 'Genie',
    QUEEN_BEE: 'Bienenkönigin',
  } satisfies Record<RankId, string>,

  rejections: {
    TOO_SHORT: 'Zu kurz',
    INVALID_LETTER: 'Buchstabe nicht im Spiel',
    MISSING_CENTER: 'Mittelbuchstabe fehlt',
    ALREADY_FOUND: 'Schon gefunden',
    NOT_A_WORD: 'Kein Wort in der Liste',
  } satisfies Record<RejectionReason, string>,

  accepted: {
    good: 'Gut!',
    strong: 'Stark!',
    excellent: 'Ausgezeichnet!',
    pangram: 'Pangramm!',
  },

  buttons: {
    delete: 'Löschen',
    shuffle: 'Mischen',
    submit: 'Eingabe',
  },

  aria: {
    rules: 'Regeln',
    pickPuzzle: 'Rätsel wählen',
    input: 'Eingabe',
    letters: 'Buchstaben',
  },

  inputPlaceholder: 'Wort eingeben',
  noPuzzle: 'Kein Rätsel verfügbar',
  newestAvailableNotice: 'Für diese Woche gibt es noch kein neues Rätsel.',

  foundCount: (n: number): string => (n === 1 ? '1 Wort' : `${String(n)} Wörter`),
  points: (n: number): string => `${String(n)} P.`,
  puzzleFrom: (date: string): string => {
    const [, month, day] = date.split('-');
    const name = months[Number(month) - 1] ?? '';
    return `Rätsel vom ${String(Number(day))}. ${name}`;
  },
} as const;
