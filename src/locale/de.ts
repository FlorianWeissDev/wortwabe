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

/** `2026-09-23` -> `23. Sept.` */
function formatPuzzleDate(date: string): string {
  const [, month, day] = date.split('-');
  return `${String(Number(day))}. ${months[Number(month) - 1] ?? ''}`;
}

const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;

/** `2026-09-23` -> `Mi, 23. Sept.` */
function formatRowDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const weekday = weekdays[new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)).getUTCDay()];
  return `${weekday ?? ''}, ${formatPuzzleDate(date)}`;
}

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
    closeDialog: 'Dialog schließen',
    puzzleList: 'Rätselliste',
    backToCurrent: 'Zurück zur aktuellen Woche',
    openPuzzle: (date: string): string => `${formatPuzzleDate(date)} öffnen`,
  },

  a11y: {
    wordAccepted: (word: string, points: number): string =>
      `Wort gefunden: ${word}, ${String(points)} ${points === 1 ? 'Punkt' : 'Punkte'}`,
    pangramAccepted: (word: string, points: number): string =>
      `Pangramm gefunden: ${word}, ${String(points)} Punkte`,
    rankUp: (rank: string): string => `Neuer Rang: ${rank}`,
  },

  picker: {
    title: 'Rätsel wählen',
    currentBadge: 'Diese Woche',
    revealedTag: 'aufgelöst',
    close: 'Schließen',
    rowDate: formatRowDate,
    foundOfTotal: (n: number, total: number): string => `${String(n)} von ${String(total)} Wörtern`,
    points: (score: number, max: number): string => `${String(score)} von ${String(max)} Punkten`,
  },

  rules: {
    title: 'So wird gespielt',
    close: 'Schließen',
    paragraphs: [
      'Bilde Wörter aus den sieben Buchstaben der Wabe.',
      'Jedes Wort hat mindestens 4 Buchstaben.',
      'Der Buchstabe in der Mitte muss in jedem Wort vorkommen.',
      'Buchstaben dürfen mehrfach verwendet werden.',
      'Wörter mit Umlauten (ä, ö, ü) oder ß gibt es in diesem Spiel nicht.',
      'Punkte: Ein Wort mit 4 Buchstaben zählt 1 Punkt, längere Wörter zählen 1 Punkt pro Buchstabe.',
      'Ein Pangramm nutzt alle sieben Buchstaben und bringt 7 Bonuspunkte.',
      'Mit deinen Punkten steigst du im Rang auf, bis zur Bienenkönigin.',
      'Jeden Mittwoch erscheint ein neues Rätsel. Ältere Rätsel kannst du über das Menü (☰) weiterspielen.',
      'Tastatur: Enter schickt das Wort ab, Rücktaste löscht einen Buchstaben, Esc leert die Eingabe, die Leertaste mischt die Buchstaben.',
    ],
  },

  olderPuzzleNotice: (date: string): string => `Rätsel vom ${formatPuzzleDate(date)}`,
  backToCurrent: 'zurück zur aktuellen Woche',

  inputPlaceholder: 'Wort eingeben',
  noPuzzle: 'Kein Rätsel verfügbar',
  newestAvailableNotice: 'Für diese Woche gibt es noch kein neues Rätsel.',

  foundCount: (n: number): string => (n === 1 ? '1 Wort' : `${String(n)} Wörter`),
  yourScore: (score: number, max: number): string =>
    `Dein Stand: ${String(score)} von ${String(max)} Punkten`,
  pointsToRank: (n: number, rank: string): string =>
    `Noch ${String(n)} ${n === 1 ? 'Punkt' : 'Punkte'} bis ${rank}`,
  foundOfTotal: (n: number, total: number): string => `${String(n)} von ${String(total)} Wörtern`,
  pangramLegend: 'Fett = Pangramm',
  missedLegend: 'Grau = nicht gefunden',
  reveal: {
    action: 'Lösung anzeigen',
    confirm: 'Lösung wirklich anzeigen?',
    cancel: 'Abbrechen',
    show: 'Anzeigen',
    keepGuessing: 'Weiterraten',
    stripSuffix: 'aufgelöst',
  },
  points: (n: number): string => `${String(n)} P.`,
  puzzleFrom: (date: string): string => `Rätsel vom ${formatPuzzleDate(date)}`,
} as const;
