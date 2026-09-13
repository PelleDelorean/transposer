"use client";

import React from "react";
import type { ChartLine } from "@/lib/music/chartParser";
import { buildChordPieces, parseEmphasis } from "@/lib/emphasis";
import { renderGridRow } from "@/lib/grid";

interface ChartPreviewProps {
  lines: ChartLine[];
  /** Chord color; defaults to black (same as PDF output). */
  chordColor?: string;
}

/**
 * Monospace chart preview. Lines render according to their type:
 *  - grid lines (`| I\t\t| IV |`) mirror the user's tab/space layout;
 *  - lyric lines render chords above the words they belong to;
 *  - other lines (section labels etc.) pass through with emphasis.
 * Both syntaxes coexist freely in one chart — no view toggle.
 */
export function ChartPreview({ lines, chordColor }: ChartPreviewProps) {
  return (
    <div className="space-y-4 font-mono text-sm leading-6">
      {lines.map((line, i) => {
        if (line.type === "grid" && line.bars) {
          return <GridLine key={i} line={line} chordColor={chordColor} />;
        }
        if (line.type === "lyric" && line.segments) {
          return (
            <ChordOverLyric key={i} segments={line.segments} chordColor={chordColor} />
          );
        }
        return (
          <p key={i} className="text-zinc-500 dark:text-zinc-400">
            {renderEmphasis(line.raw) || "\u00A0"}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Grid line: replace each bar's chord in place, preserving the exact
 * whitespace (tabs/spaces) the user typed between delimiters.
 */
function GridLine({ line, chordColor }: { line: ChartLine; chordColor?: string }) {
  if (!line.bars) return null;
  const tokens = line.bars.map((b) => b.token || "");
  const row = renderGridRow(line.raw, tokens);
  return (
    <div
      className="whitespace-pre font-semibold"
      style={{ color: chordColor || "#000000" }}
    >
      {row}
    </div>
  );
}

/**
 * Renders a lyric line with chords positioned absolutely above the word
 * each chord belongs to.
 *
 * Convention: a chord in brackets applies to the word immediately BEFORE
 * the bracket (`the[I] song` -> "I" sits over "the"). The trailing word of
 * the segment text is split off and wrapped in a relative span so the chord
 * can anchor above it. Text otherwise flows naturally (no grid columns).
 */
function ChordOverLyric({
  segments,
  chordColor,
}: {
  segments: { text: string; chord?: { token: string } }[];
  chordColor?: string;
}) {
  // Piece building is shared with the PDF renderer.
  const pieces = buildChordPieces(segments);

  return (
    // pt-6 reserves the chord row above the text.
    <div className="whitespace-pre-wrap pt-6">
      {pieces.map((p, j) =>
        p.chord ? (
          <span key={j} className="relative">
            <span
              className="absolute top-0 left-0 -translate-y-full font-semibold"
              style={{ color: chordColor || "#000000" }}
            >
              {p.chord}
            </span>
            {renderEmphasis(p.text)}
          </span>
        ) : (
          <span key={j}>{renderEmphasis(p.text)}</span>
        ),
      )}
    </div>
  );
}

/** Inline emphasis rendering for the DOM (shared parser in lib/emphasis). */
function renderEmphasis(text: string): React.ReactNode[] {
  return parseEmphasis(text).map((seg, i) => {
    if (!seg.bold && !seg.italic) return seg.text;
    if (seg.bold && seg.italic)
      return (
        <strong key={`e${i}`} className="font-bold italic">
          {seg.text}
        </strong>
      );
    if (seg.bold)
      return (
        <strong key={`e${i}`} className="font-bold">
          {seg.text}
        </strong>
      );
    return (
      <em key={`e${i}`} className="italic">
        {seg.text}
      </em>
    );
  });
}
