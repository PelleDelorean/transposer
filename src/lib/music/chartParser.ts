/**
 * Chart content segmenter.
 *
 * A chart is plain text where each line is either:
 *  - a grid line:    | I | vi | IIdim | IV |
 *  - a lyric line:   My song[I] has not a lot of[iv] lines[VI]
 *  - anything else (section labels, blank lines) passed through verbatim.
 *
 * Token disambiguation: within bars/brackets, a token is a Roman numeral if
 * the numeral grammar matches ("bVII", "I/iii"); otherwise it is tried as an
 * absolute chord ("Cmaj7", "Bb/D"). Unparseable tokens pass through verbatim.
 */

import { looksLikeRoman, parseRoman } from "./romanParser";
import { parseAbsoluteChord } from "./chordParser";

export type ChartToken =
  | { kind: "roman"; token: string }
  | { kind: "absolute"; token: string }
  | { kind: "unknown"; token: string };

export interface ChartLine {
  type: "grid" | "lyric" | "plain";
  /** For grid lines: the tokens between bars. */
  bars?: ChartToken[];
  /** For lyric lines: alternating text and bracketed chord tokens. */
  segments?: { text: string; chord?: ChartToken }[];
  /** Original line text. */
  raw: string;
}

/** Strip one leading/trailing bar pipe and split into tokens. */
function splitBars(line: string): string[] {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner.split("|").map((s) => s.trim());
}

/** Classify a single chord token. */
function classifyToken(token: string): ChartToken {
  const t = token.trim();
  if (!t) return { kind: "unknown", token: t };
  if (looksLikeRoman(t)) return { kind: "roman", token: t };
  if (parseAbsoluteChord(t)) return { kind: "absolute", token: t };
  return { kind: "unknown", token: t };
}

function parseGridLine(raw: string): ChartLine {
  return { type: "grid", bars: splitBars(raw).map(classifyToken), raw };
}

function parseLyricLine(raw: string): ChartLine {
  const segments: ChartLine["segments"] = [];
  const re = /\[([^\]]*)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    segments.push({ text: raw.slice(last, m.index), chord: classifyToken(m[1]) });
    last = m.index + m[0].length;
  }
  segments.push({ text: raw.slice(last) });
  return { type: "lyric", segments, raw };
}

function looksLikeGrid(line: string): boolean {
  return line.trim().startsWith("|");
}

function hasBrackets(line: string): boolean {
  return /\[[^\]]*\]/.test(line);
}

/** Parse chart content into structured lines. */
export function parseChart(content: string): ChartLine[] {
  return content.split(/\r?\n/).map((line) => {
    if (looksLikeGrid(line)) return parseGridLine(line);
    if (hasBrackets(line)) return parseLyricLine(line);
    return { type: "plain", raw: line };
  });
}
