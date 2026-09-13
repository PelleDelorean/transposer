"use client";

import React from "react";
import type { ChartLine } from "@/lib/music/chartParser";
import {
  buildChordPieces,
  parseEmphasis,
} from "@/lib/emphasis";

interface ChartPreviewProps {
  lines: ChartLine[];
  /**
   * Render mode:
   *  - "grid":   chords-only — every line is shown as its chord sequence,
   *              lyrics text is hidden.
   *  - "lyrics": chords positioned above the words they belong to.
   */
  mode: "grid" | "lyrics";
}

/** Monospace chart preview: chords-only grid or chords above lyric words. */
export function ChartPreview({ lines, mode }: ChartPreviewProps) {
  return (
    <div className="space-y-4 font-mono text-sm leading-6">
      {lines.map((line, i) => {
        if (line.type === "grid" && line.bars) {
          return (
            <div key={i} className="flex flex-wrap items-center gap-x-1 whitespace-pre text-emerald-700 dark:text-emerald-400">
              {line.bars.map((bar, j) => (
                <span key={j} className="rounded bg-zinc-100 px-2 py-0.5 font-semibold dark:bg-zinc-800">
                  {bar.token || "·"}
                </span>
              ))}
            </div>
          );
        }
        if (line.type === "lyric" && line.segments) {
          if (mode === "grid") {
            // Chords-only view: hide the lyric text, keep just the chord
            // sequence in flow order.
            const chords = line.segments
              .map((s) => s.chord?.token)
              .filter(Boolean) as string[];
            return chords.length ? (
              <div key={i} className="flex flex-wrap items-center gap-x-1 whitespace-pre text-emerald-700 dark:text-emerald-400">
                {chords.map((c, j) => (
                  <span key={j} className="rounded bg-zinc-100 px-2 py-0.5 font-semibold dark:bg-zinc-800">
                    {c}
                  </span>
                ))}
              </div>
            ) : null;
          }
          return <ChordOverLyric key={i} segments={line.segments} />;
        }
        // Section labels / blank lines: keep them in lyrics mode for
        // structure; in grid mode keep only non-empty labels.
        if (mode === "grid" && !line.raw.trim()) return null;
        return (
          <p key={i} className={mode === "grid" ? "text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}>
            {renderEmphasis(line.raw) || "\u00A0"}
          </p>
        );
      })}
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
}: {
  segments: { text: string; chord?: { token: string } }[];
}) {
  // Piece building is shared with the PDF renderer.
  const pieces = buildChordPieces(segments);

  return (
    // pt-6 reserves the chord row above the text.
    <div className="whitespace-pre-wrap pt-6">
      {pieces.map((p, j) =>
        p.chord ? (
          <span key={j} className="relative">
            <span className="absolute top-0 left-0 -translate-y-full font-semibold text-emerald-700 dark:text-emerald-400">
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
export function renderEmphasis(text: string): React.ReactNode[] {
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
