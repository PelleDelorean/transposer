/**
 * Grid-line rendering shared by the DOM preview and the PDF document.
 *
 * Philosophy: the user authors the bar layout. Tabs and spaces typed
 * between a chord and the next `|` delimiter are mirrored verbatim
 * (tabs expanded to fixed stops), so what you see in the editor is what
 * prints. Keeping every delimiter aligned across rows is the user's
 * responsibility — the renderer never re-normalizes widths.
 */

/** Expand tabs to spaces at fixed `tabStop` column intervals. */
export function expandTabs(line: string, tabStop = 4): string {
  let out = "";
  let col = 0;
  for (const ch of line) {
    if (ch === "\t") {
      const spaces = tabStop - (col % tabStop);
      out += " ".repeat(spaces);
      col += spaces;
    } else {
      out += ch;
      col += 1;
    }
  }
  return out;
}

/**
 * Render a grid row by replacing each bar's chord token in place while
 * keeping the whitespace the user typed around it. Each segment keeps its
 * original width when the (possibly transposed) token fits — so delimiter
 * columns stay where the user put them — and grows only when a token is
 * longer than the space available.
 *
 * `raw` is the original (untransposed) line; `tokens` are the transposed
 * chord tokens in the same order.
 */
export function renderGridRow(
  raw: string,
  tokens: string[],
  tabStop = 4,
): string {
  const expanded = expandTabs(raw, tabStop);
  const parts = expanded.split("|");

  // Structural match: one segment per token between leading/trailing pipes.
  if (parts.length !== tokens.length + 2) {
    // Missing or extra delimiters — fall back to normalized single-space
    // bars rather than mangling the user's text.
    return "|" + tokens.map((t) => ` ${t} `).join("|") + "|";
  }

  let out = parts[0];
  for (let i = 0; i < tokens.length; i++) {
    const seg = parts[i + 1];
    const lead = seg.length - seg.trimStart().length;
    const replacement = (" ".repeat(lead) + tokens[i]).padEnd(seg.length);
    out += "|" + replacement;
  }
  out += "|" + parts[parts.length - 1];
  return out;
}
