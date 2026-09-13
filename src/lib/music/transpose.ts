/**
 * Top-level transposition engine.
 *
 * transposeChart(content, opts) renders chart markup with all chord tokens
 * realized in the target key:
 *  - Roman numeral tokens resolve via the target key's scale spelling.
 *  - Absolute chord tokens transpose by the interval originalKey -> targetKey
 *    and respell on their original diatonic letters.
 *  - Extensions/alterations pass through verbatim.
 *  - Slash chords: both chord and bass transpose.
 */

import { parseChart, type ChartLine, type ChartToken } from "./chartParser";
import { parseRoman } from "./romanParser";
import { parseAbsoluteChord } from "./chordParser";
import { getKey, spellDegree, type KeyDef } from "./keys";
import { intervalTo, spellPitchClassOnLetter, parseNoteName } from "./notes";

export interface TransposeOptions {
  /** Target key name ("C", "Bb", "F#", ...). Required. */
  targetKey: string;
  /** Chart's original key, needed to transpose absolute chord tokens. */
  originalKey?: string;
}

export interface TransposeResult {
  /** Transposed chart text. */
  text: string;
  /** Lines for structured rendering (preview UI, PDF). */
  lines: ChartLine[];
  /** Key definition used. */
  key: KeyDef;
}

/** Resolve a Roman token to an absolute chord name in the target key. */
export function renderRoman(token: string, key: KeyDef): string {
  const roman = parseRoman(token);
  if (!roman) return token;

  // Normalize degree symbols: ° and ø both render as "dim".
  let quality = roman.quality;
  if (quality === "°" || quality === "ø") quality = "dim";

  // Lowercase numerals ALWAYS imply a minor base — the "m" comes from the
  // numeral itself, so the user never writes it: "iii7" -> Em7, "iiim7b5"
  // -> Em7b5, "ii" -> Dm. Only an explicit "maj" opts out ("imaj7" ->
  // Cmaj7). If the user did write an "m" ("iim7b5"), it is absorbed into
  // the minor base rather than duplicated.
  if (!quality && roman.minorBase) {
    if (roman.extension.startsWith("maj")) {
      quality = null; // explicit major opt-out
    } else {
      if (roman.extension.startsWith("m")) {
        roman.extension = roman.extension.slice(1);
      }
      quality = "m";
    }
  }
  const main =
    spellDegree(key, roman.degree, roman.chromatic) +
    (quality ?? "") +
    roman.extension;
  if (!roman.bass) return main;

  const bass = spellDegree(key, roman.bass.degree, roman.bass.chromatic);
  return `${main}/${bass}`;
}

/** Transpose an absolute chord token by `semitones`, respelling on original letters. */
function renderAbsolute(token: string, semitones: number): string {
  const chord = parseAbsoluteChord(token);
  if (!chord) return token;

  // Detect the source root's accidental sign to bias respelling (flat
  // sources prefer flat outputs, sharp sources prefer sharps).
  const rootMatch = token.trim().match(/^[A-Ga-g][#♯b♭]?/)!;
  const sourceAcc = parseNoteName(rootMatch[0])?.accidental ?? 0;
  const rootSign = Math.sign(sourceAcc) as -1 | 0 | 1;

  const rootPc = (chord.rootPc + semitones + 120) % 12;
  const root = spellPitchClassOnLetter(rootPc, chord.rootLetter, rootSign);
  if (!chord.bass) return root + chord.suffix;

  const bassPc = (chord.bass.pc + semitones + 120) % 12;
  const bass = spellPitchClassOnLetter(bassPc, chord.bass.letter, rootSign);
  return `${root}${chord.suffix}/${bass}`;
}

function transposeToken(token: ChartToken, key: KeyDef, semitones: number): ChartToken {
  switch (token.kind) {
    case "roman":
      return { kind: "absolute", token: renderRoman(token.token, key) };
    case "absolute":
      return { kind: "absolute", token: renderAbsolute(token.token, semitones) };
    default:
      return token;
  }
}

/** Transpose parsed lines into realized (absolute-chord) lines. */
function transposeLines(
  lines: ChartLine[],
  key: KeyDef,
  semitones: number,
): ChartLine[] {
  return lines.map((line) => {
    if (line.type === "grid" && line.bars) {
      return { ...line, bars: line.bars.map((b) => transposeToken(b, key, semitones)) };
    }
    if (line.type === "lyric" && line.segments) {
      return {
        ...line,
        segments: line.segments.map((s) =>
          s.chord ? { ...s, chord: transposeToken(s.chord, key, semitones) } : s,
        ),
      };
    }
    return line;
  });
}

/** Serialize transposed lines back to text. */
function serialize(lines: ChartLine[]): string {
  return lines
    .map((line) => {
      if (line.type === "grid" && line.bars) {
        const inner = line.bars
          .map((b) => ` ${b.kind === "unknown" && !b.token ? "" : b.token} `)
          .join("|");
        return `|${inner}|`;
      }
      if (line.type === "lyric" && line.segments) {
        return line.segments
          .map((s) => `${s.text}${s.chord && s.chord.token ? `[${s.chord.token}]` : ""}`)
          .join("");
      }
      return line.raw;
    })
    .join("\n");
}

/**
 * Transpose chart content to a target key and return both text and
 * structured lines for rich rendering.
 */
export function transposeChart(content: string, opts: TransposeOptions): TransposeResult {
  const key = getKey(opts.targetKey);
  if (!key) throw new Error(`Unknown target key: ${opts.targetKey}`);

  const original = opts.originalKey ? getKey(opts.originalKey) : null;
  const semitones = original ? intervalTo(original.tonic, key.tonic) : 0;

  const parsed = parseChart(content);
  const transposed = transposeLines(parsed, key, semitones);

  return {
    text: serialize(transposed),
    lines: transposed,
    key,
  };
}
