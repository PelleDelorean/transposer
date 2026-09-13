/**
 * Shared inline-emphasis and chord-placement logic, framework-agnostic:
 * consumed by both the DOM preview and the PDF renderer.
 */

export interface EmphasisSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

/**
 * Parse inline emphasis markup: ***bold italic***, **bold**, *italic*.
 * Longest-first, so *** resolves before **. Unpaired asterisks pass through
 * as literal text. Markers are stripped from output.
 */
export function parseEmphasis(text: string): EmphasisSegment[] {
  const segments: EmphasisSegment[] = [];
  const push = (t: string, bold: boolean, italic: boolean) => {
    if (t) segments.push({ text: t, bold, italic });
  };

  const re = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) push(text.slice(last, m.index), false, false);
    const marks = m[0];
    const inner = marks.replaceAll("*", "");
    if (marks.startsWith("***")) push(inner, true, true);
    else if (marks.startsWith("**")) push(inner, true, false);
    else push(inner, false, true);
    last = m.index + marks.length;
  }
  if (last < text.length) push(text.slice(last), false, false);
  return segments;
}

export interface ChordPiece {
  /** Lyric text with emphasis markers still inline. */
  text: string;
  /** Chord that renders above (the start of) this piece. */
  chord?: string;
}

/**
 * Build positioned chord/text pieces from parsed lyric segments.
 *
 * Convention: a chord in brackets applies to the word immediately BEFORE
 * the bracket (`the[I] song` -> "I" sits over "the"). A bracket with no
 * preceding word (line start, or back-to-back brackets) inserts a one-space
 * in-flow gap that the chord sits above, shifting the lyrics right.
 */
export function buildChordPieces(
  segments: { text: string; chord?: { token: string } }[],
): ChordPiece[] {
  const pieces: ChordPiece[] = [];

  for (const seg of segments) {
    const chord = seg.chord?.token;
    if (!chord) {
      if (seg.text) pieces.push({ text: seg.text });
      continue;
    }

    // Split "… trailingword" into prefix + word (+ whitespace tail) and
    // anchor the chord above the word.
    const m = /^([\s\S]*?)(\S+)(\s*)$/.exec(seg.text);
    if (m) {
      if (m[1]) pieces.push({ text: m[1] });
      pieces.push({ text: m[2], chord });
      if (m[3]) pieces.push({ text: m[3] });
    } else {
      // No preceding word: chord floats above a one-space gap; following
      // text starts after it. Wide chords extend over the first word.
      pieces.push({ text: " ", chord });
      if (seg.text) pieces.push({ text: seg.text });
    }
  }

  return pieces;
}
