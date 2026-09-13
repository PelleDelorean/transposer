/**
 * Absolute chord parser (e.g. "Cmaj7", "Bb/D", "F#m7b5").
 * Shares the quality/extension suffix grammar with the Roman parser.
 */

import { noteToPitchClass, parseNoteName, spellPitchClassOnLetter } from "./notes";

export interface AbsoluteChord {
  /** Root pitch class 0-11. */
  rootPc: number;
  /** Preferred diatonic letter of the root (0=C..6=B) for respelling. */
  rootLetter: number;
  /** Suffix after the root: quality + extensions, verbatim. */
  suffix: string;
  /** Bass note, if a "/X" part exists. */
  bass: { pc: number; letter: number } | null;
}

/**
 * Parse an absolute chord token. Returns null if the token is not an
 * absolute chord (e.g. it's a Roman numeral or arbitrary word).
 */
export function parseAbsoluteChord(token: string): AbsoluteChord | null {
  const t = token.trim();
  if (!t) return null;

  const slashAt = t.lastIndexOf("/");
  const mainPart = slashAt >= 0 ? t.slice(0, slashAt) : t;
  const bassPart = slashAt >= 0 ? t.slice(slashAt + 1) : null;

  const rootMatch = mainPart.match(/^[A-Ga-g][#♯b♭]?/);
  if (!rootMatch) return null;
  const rootFull = rootMatch[0];
  const suffix = mainPart.slice(rootFull.length);

  // Reject tokens whose suffix clearly isn't chord content: suffix must be
  // empty or start with a chord-ish character (quality, digit, alteration).
  if (
    suffix &&
    !/^(?:(?:maj|min|dim|aug|sus|add|m|M|\+|-|°|ø|∆)|[#♯b♭]|[0-9])/.test(suffix)
  ) {
    return null;
  }

  const rootPc = noteToPitchClass(rootFull);
  const rootParsed = parseNoteName(rootFull);
  if (rootPc === null || !rootParsed) return null;

  let bass: AbsoluteChord["bass"] = null;
  if (bassPart !== null) {
    const bm = bassPart.match(/^[A-Ga-g][#♯b♭]?/);
    if (!bm || bm[0].length !== bassPart.length) return null;
    const pc = noteToPitchClass(bassPart);
    const parsed = parseNoteName(bassPart);
    if (pc === null || !parsed) return null;
    bass = { pc, letter: parsed.letterIndex };
  }

  return { rootPc, rootLetter: rootParsed.letterIndex, suffix, bass };
}

/**
 * Format an absolute chord back to a string given root/bass spellings.
 */
export function formatAbsoluteChord(
  root: string,
  suffix: string,
  bass: string | null,
): string {
  return bass ? `${root}${suffix}/${bass}` : `${root}${suffix}`;
}

/** Re-export for convenience in transpose logic. */
export { spellPitchClassOnLetter };
