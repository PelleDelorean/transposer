/**
 * Roman numeral chord parser.
 *
 * Grammar (per token):
 *   [accidental] numeral [quality] [extension/alteration string] [/ bass numeral]
 *
 * - accidental: b, #, ♭, ♯ (applies to the degree)
 * - numeral: I..VII; UPPERCASE = major-quality base, lowercase = minor base
 * - quality: dim, °, ø, aug, +, sus2, sus4, maj, m (optional, after numeral)
 * - extension: arbitrary pass-through string (maj7b9, 7-5, 13#11, add9, 7alt, 9b5, …)
 * - bass: optional "/iii" — a full sub-numeral, transposed dynamically
 */

export interface RomanChord {
  /** 1-7 scale degree of the main chord. */
  degree: number;
  /** Chromatic alteration of the degree: -1 (b), 0, +1 (#). */
  chromatic: number;
  /** True if the numeral was lowercase (minor base). */
  minorBase: boolean;
  /** Explicit quality detected after the numeral (dim, aug, sus2, …) or null. */
  quality: string | null;
  /** Raw extension/alteration string appended after the quality, verbatim. */
  extension: string;
  /** Bass note as a Roman numeral, or null. */
  bass: RomanBass | null;
}

export interface RomanBass {
  degree: number;
  chromatic: number;
  minorBase: boolean;
}

const NUMERAL_VALUES: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
};

/** Qualities recognized right after the numeral. Longest first. */
const QUALITIES = [
  "dim",
  "°",
  "ø",
  "aug",
  "sus2",
  "sus4",
  "sus",
  "maj",
  "m",
  "+",
];

interface NumeralPart {
  degree: number;
  chromatic: number;
  minorBase: boolean;
}

/** Parse "[b|#]I..VII" prefix; returns chars consumed. */
function parseNumeral(
  s: string,
): (NumeralPart & { length: number }) | null {
  let i = 0;
  let chromatic = 0;
  while (i < s.length && (s[i] === "b" || s[i] === "♭")) {
    chromatic -= 1;
    i++;
  }
  while (i < s.length && (s[i] === "#" || s[i] === "♯")) {
    chromatic += 1;
    i++;
  }
  // Match the longest valid numeral (vii before v, etc.).
  for (const raw of ["vii", "vi", "iv", "iii", "ii", "i", "v"]) {
    const slice = s.slice(i, i + raw.length).toLowerCase();
    if (slice === raw) {
      const original = s.slice(i, i + raw.length);
      const minorBase = original === original.toLowerCase();
      return { degree: NUMERAL_VALUES[raw], chromatic, minorBase, length: i + raw.length };
    }
  }
  return null;
}

/** Try to match one of the known qualities at position i. */
function parseQualityAt(
  s: string,
  i: number,
  minorBase: boolean,
): { quality: string; length: number } | null {
  if (i >= s.length) return null;
  for (const q of QUALITIES) {
    if (s.startsWith(q, i)) {
      if (!minorBase && (q === "maj" || q === "M")) {
        // "maj"/"M" after an uppercase numeral is an extension, not a
        // quality ("Imaj7" = major-7th extension; uppercase already implies
        // major). Skip it AND any shorter prefix like "m" at this position,
        // so the extension keeps the full "maj…" string.
        return null;
      }
      if (minorBase && q === "m") {
        // Symmetrically, bare "m" after a lowercase numeral is redundant
        // ("iim7b5" keeps "m7b5" as the verbatim extension).
        return null;
      }
      return { quality: q, length: q.length };
    }
  }
  return null;
}

/** Parse a full Roman numeral token (no surrounding whitespace). */
export function parseRoman(token: string): RomanChord | null {
  const t = token.trim();
  if (!t) return null;

  const head = parseNumeral(t);
  if (!head) return null;

  let i = head.length;
  let quality: string | null = null;

  const q = parseQualityAt(t, i, head.minorBase);
  if (q) {
    quality = q.quality;
    i += q.length;
  }

  // Everything after the quality is the verbatim extension/alteration string.
  // Stop at a slash that begins the bass numeral.
  let extension = "";
  const slashAt = t.indexOf("/", i);
  if (slashAt >= 0) {
    extension = t.slice(i, slashAt);
    i = slashAt;
  } else {
    extension = t.slice(i);
  }

  // Parse bass numeral after "/" (recursively simple: degree part only).
  let bass: RomanBass | null = null;
  if (i < t.length && t[i] === "/") {
    const bassPart = parseNumeral(t.slice(i + 1));
    if (bassPart) {
      // Bass may itself carry a small quality tail; we keep only the numeral
      // per the spec (I/iii, V/vii, IV/v).
      bass = {
        degree: bassPart.degree,
        chromatic: bassPart.chromatic,
        minorBase: bassPart.minorBase,
      };
    } else {
      return null; // "/" present but no valid bass numeral
    }
  } else if (slashAt >= 0) {
    return null; // unreachable safeguard
  }

  return {
    degree: head.degree,
    chromatic: head.chromatic,
    minorBase: head.minorBase,
    quality,
    extension,
    bass,
  };
}

/**
 * Does this string look like a Roman numeral token (as opposed to an
 * absolute chord like "B" or "Bb7")? Used by the chart segmenter.
 * A numeral must contain i/I or v/V in numeral position (after optional b/#).
 */
export function looksLikeRoman(token: string): boolean {
  const t = token.trim();
  if (!t) return false;
  const part = parseNumeral(t);
  if (!part) return false;
  // Reject absolute chords: a bare "B" or "Bb" with no numeral letters.
  // parseNumeral only matches i/v-based numerals, so "B" (letter B) fails
  // already; "bII" passes (correct), "Bb" fails (correct).
  const rest = t.slice(part.length);
  // Disallow letter-only tails that would make this an absolute chord, e.g. "Bdim7" is fine
  // (letters d,i,m contain i) — acceptable ambiguity resolved in favor of numeral.
  return true;
}
