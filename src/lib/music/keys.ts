/**
 * Target key definitions and accidental spelling per key.
 *
 * The 12 supported target keys. Each key carries:
 *  - tonic pitch class
 *  - the seven diatonic letters of its scale with their net accidentals
 *    (letter + key-signature accidental), used to spell scale degrees.
 *
 * Spelling rule: the letter of a degree comes from the key's scale; the
 * net accidental = chromatic alteration + key-signature accidental of that
 * letter. Flat keys emit only flats, sharp keys only sharps (per the spec:
 * e.g. #4 in F major is B natural because B is flatted in the signature).
 */

import { spellPitchClassOnLetter } from "./notes";

export type KeyName =
  | "C"
  | "F"
  | "Bb"
  | "Eb"
  | "Ab"
  | "Db"
  | "G"
  | "D"
  | "A"
  | "E"
  | "B"
  | "F#";

export interface KeyDef {
  /** Display name, e.g. "Bb". */
  name: KeyName;
  /** Tonic pitch class 0-11. */
  tonic: number;
  /** Scale letters (letter indexes 0=C..6=B) from tonic upward, 7 entries. */
  letters: number[];
  /** Net accidental for each scale letter (-1, 0, or +1), aligned to `letters`. */
  accidentals: number[];
}

/** Interval pattern of a major scale in semitones from the tonic. */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];

/** Letter indexes of a major scale starting on the given tonic letter. */
function scaleLetters(tonicLetter: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (tonicLetter + i) % 7);
}

interface KeySpec {
  name: KeyName;
  /** Tonic as (letterIndex, accidental). */
  tonicLetter: number;
  tonicAcc: number;
  /** Direction of the key signature: -1 flat, 0 neutral, +1 sharp. */
  color: -1 | 0 | 1;
}

const KEY_SPECS: KeySpec[] = [
  { name: "C", tonicLetter: 0, tonicAcc: 0, color: 0 },
  { name: "F", tonicLetter: 3, tonicAcc: 0, color: -1 },
  { name: "Bb", tonicLetter: 6, tonicAcc: -1, color: -1 },
  { name: "Eb", tonicLetter: 2, tonicAcc: -1, color: -1 },
  { name: "Ab", tonicLetter: 5, tonicAcc: -1, color: -1 },
  { name: "Db", tonicLetter: 1, tonicAcc: -1, color: -1 },
  { name: "G", tonicLetter: 4, tonicAcc: 0, color: 1 },
  { name: "D", tonicLetter: 1, tonicAcc: 0, color: 1 },
  { name: "A", tonicLetter: 5, tonicAcc: 0, color: 1 },
  { name: "E", tonicLetter: 2, tonicAcc: 0, color: 1 },
  { name: "B", tonicLetter: 6, tonicAcc: 0, color: 1 },
  { name: "F#", tonicLetter: 3, tonicAcc: 1, color: 1 },
];

/** Number of sharps/flats in each key's signature, indexed by KEY_ORDER. */
const SIGNATURE_ACCIDENTALS: Record<KeyName, number> = {
  C: 0,
  F: -1,
  Bb: -2,
  Eb: -3,
  Ab: -4,
  Db: -5,
  G: 1,
  D: 2,
  A: 3,
  E: 4,
  B: 5,
  "F#": 6,
};

/** Order of sharps F C G D A E B (letter indexes 3 0 4 1 5 2 6). */
const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];
/** Order of flats B E A D G C F (letter indexes 6 2 5 1 4 0 3). */
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];

function buildKey(spec: KeySpec): KeyDef {
  const tonic = ((([0, 2, 4, 5, 7, 9, 11][spec.tonicLetter] + spec.tonicAcc) % 12) + 12) % 12;
  const letters = scaleLetters(spec.tonicLetter);
  const sig = SIGNATURE_ACCIDENTALS[spec.name];

  const accidentals = letters.map((li, degree) => {
    if (sig === 0) return 0;
    const order = sig > 0 ? SHARP_ORDER : FLAT_ORDER;
    const count = Math.abs(sig);
    let acc = 0;
    // A letter affected by the key signature carries its accidental.
    if (order.slice(0, count).includes(li)) acc = sig > 0 ? 1 : -1;
    // The degree must still produce the correct major-scale pitch class.
    const basePitch = [0, 2, 4, 5, 7, 9, 11][li];
    const targetPitch = (tonic + MAJOR_SCALE[degree]) % 12;
    const natural = basePitch + acc;
    // normalize natural into 0..11 relative diff
    let diff = (((targetPitch - natural) % 12) + 12) % 12;
    if (diff > 6) diff -= 12;
    return acc + diff;
  });

  return { name: spec.name, tonic, letters, accidentals };
}

/** All 12 supported target keys. */
export const KEYS: KeyDef[] = KEY_SPECS.map(buildKey);

/** Display order for the UI dropdown: C, flats, sharps. */
export const KEY_ORDER: KeyName[] = [
  "C",
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
];

const KEY_BY_NAME = new Map(KEYS.map((k) => [k.name, k]));

/** Look up a key definition by name ("C", "Bb", "F#", ...). */
export function getKey(name: string): KeyDef | null {
  return KEY_BY_NAME.get(name as KeyName) ?? null;
}

/**
 * Spell a scale degree (1-7) of a key with an extra chromatic alteration.
 * E.g. degree 4 of F major with +1 alteration -> "B" (B natural: signature
 * flats the B, chromatic sharp cancels it). degree 7 with -1 -> "Eb".
 */
export function spellDegree(key: KeyDef, degree: number, chromatic = 0): string {
  const d = (((degree - 1) % 7) + 7) % 7;
  const letter = key.letters[d];
  return spellPitchClassOnLetter(
    (key.tonic + MAJOR_SCALE[d] + chromatic + 12) % 12,
    letter,
  );
}

/** Is this key a "flat" key (emits flats)? */
export function isFlatKey(key: KeyDef): boolean {
  return SIGNATURE_ACCIDENTALS[key.name] < 0;
}
