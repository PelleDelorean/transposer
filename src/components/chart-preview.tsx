"use client";

import type { ChartLine } from "@/lib/music/chartParser";

interface ChartPreviewProps {
  lines: ChartLine[];
}

/** Monospace chart preview: grid bars or chords above lyric words. */
export function ChartPreview({ lines }: ChartPreviewProps) {
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
          return (
            <div key={i} className="whitespace-pre-wrap">
              {/* Two-row grid: chord row above lyric row, column-aligned. */}
              <div className="grid" style={{ gridTemplateColumns: "repeat(" + Math.max(line.segments.length * 2 - 1, 1) + ", max-content)" }}>
                {line.segments.map((seg, j) => (
                  <FragmentRow key={j} text={seg.text} chord={seg.chord?.token ?? ""} />
                ))}
              </div>
            </div>
          );
        }
        return (
          <p key={i} className="text-zinc-500 dark:text-zinc-400">
            {line.raw || "\u00A0"}
          </p>
        );
      })}
    </div>
  );
}

function FragmentRow({ text, chord }: { text: string; chord: string }) {
  // Chord sits in its own column right before the text it belongs to.
  return (
    <>
      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{chord}</span>
      <span>{text}</span>
    </>
  );
}
