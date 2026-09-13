/**
 * Pitch-class math and note-name spelling primitives.
 * Pure functions, zero dependencies.
 */

/** A note name like "C", "Bb", "F#", "Gb". */
export type NoteName = string;

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const LETTERS: readonly string[] = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** Parse a note name into { letterIndex, accidentalSemitones } or null. */
export function parseNoteName(
  name: string,
): { letterIndex: number; accidental: number } | null {
  const m = /^([A-Ga-g])([#♯b♭xX]*)$/.exec(name.trim());
  if (!m) return null;
  const letterIndex = LETTERS.indexOf(m[1].toUpperCase());
  let accidental = 0;
  for (const ch of m[2]) {
    if (ch === "#" || ch === "♯") accidental += 1;
    else if (ch === "b" || ch === "♭") accidental -= 1;
    else if (ch === "x" || ch === "X") accidental += 2; // double sharp
  }
  return { letterIndex, accidental };
}

/** Pitch class (0-11) of a note name, or null if unparseable. */
export function noteToPitchClass(name: NoteName): number | null {
  const parsed = parseNoteName(name);
  if (!parsed) return null;
  const base = LETTER_SEMITONES[LETTERS[parsed.letterIndex]];
  return (((base + parsed.accidental) % 12) + 12) % 12;
}

/**
 * Spell a note on a given diatonic letter with a net alteration.
 * letterIndex 0=C..6=B. E.g. (6, -1) -> "Bb"; (3, +1) -> "F#".
 * Accidental is clamped to ±2 (single/double sharp or flat).
 */
export function spellNote(letterIndex: number, accidental: number): NoteName {
  const li = ((letterIndex % 7) + 7) % 7;
  const acc = Math.max(-2, Math.min(2, accidental));
  let suffix = "";
  for (let i = 0; i < Math.abs(acc); i++) suffix += acc < 0 ? "b" : "#";
  return LETTERS[li] + suffix;
}

/** Interval in semitones from pitch class a to pitch class b (0-11). */
export function intervalTo(a: number, b: number): number {
  return (((b - a) % 12) + 12) % 12;
}

/**
 * Spell a pitch class on a preferred diatonic letter (accidental within ±2).
 * E.g. pitch class 10 prefers letter B (6) -> "Bb"; prefers A (5) -> "A#".
 * The letter preference is adjusted by ±1 octave-equivalent steps when the
 * required accidental would exceed ±2, so the output is always spellable.
 */
export function spellPitchClassOnLetter(
  pitchClass: number,
  letterIndex: number,
  /** Preferred accidental sign of the source note: -1 flat, 0 any, +1 sharp. */
  preferSign: -1 | 0 | 1 = 0,
): NoteName {
  const pc = ((pitchClass % 12) + 12) % 12;
  // Collect all letters that can spell this pitch class within ±2 accidentals.
  const candidates: Array<{ li: number; acc: number; delta: number }> = [];
  for (let d = -3; d <= 3; d++) {
    const li = (((letterIndex + d) % 7) + 7) % 7;
    const base = LETTER_SEMITONES[LETTERS[li]];
    let acc = pc - base;
    if (acc > 6) acc -= 12;
    if (acc < -6) acc += 12;
    if (Math.abs(acc) <= 2) candidates.push({ li, acc, delta: Math.abs(d) });
  }
  if (candidates.length === 0) {
    return spellNote(((letterIndex % 7) + 7) % 7, 0);
  }
  // Prefer: natural spellings (smallest |accidental|), then matching the
  // source accidental sign, then smallest letter distance.
  candidates.sort((a, b) => {
    const absA = Math.abs(a.acc);
    const absB = Math.abs(b.acc);
    if (absA !== absB) return absA - absB;
    const signA = Math.sign(a.acc) as -1 | 0 | 1;
    const signB = Math.sign(b.acc) as -1 | 0 | 1;
    const prefA = preferSign !== 0 && signA === preferSign ? 0 : 1;
    const prefB = preferSign !== 0 && signB === preferSign ? 0 : 1;
    if (prefA !== prefB) return prefA - prefB;
    if (a.delta !== b.delta) return a.delta - b.delta;
    return 0;
  });
  return spellNote(candidates[0].li, candidates[0].acc);
}
