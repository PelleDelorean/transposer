import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { ChartLine } from "@/lib/music/chartParser";
import { renderGridRow } from "@/lib/grid";
import {
  buildChordPieces,
  parseEmphasis,
  type EmphasisSegment,
} from "@/lib/emphasis";

// IBM Plex Mono matches the on-screen chart font. Registered with
// @react-pdf/renderer from Google Fonts' static files; npm cache-friendly
// URLs keep the build deterministic.
let fontsRegistered = false;
function registerChartFonts() {
  if (fontsRegistered) return;
  const base =
    "https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono";
  Font.register({
    family: "ChartMono",
    fonts: [
      { src: `${base}/IBMPlexMono-Regular.ttf` },
      { src: `${base}/IBMPlexMono-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/IBMPlexMono-Italic.ttf`, fontStyle: "italic" },
      {
        src: `${base}/IBMPlexMono-BoldItalic.ttf`,
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
  fontsRegistered = true;
}

const MONO = "ChartMono";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 12,
    fontFamily: MONO,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
  },
  lyricBlock: {
    marginBottom: 8,
  },
  chordRow: {
    fontWeight: 700,
  },
  section: {
    fontFamily: "Helvetica",
    fontSize: 12,
    color: "#555",
    marginTop: 10,
    marginBottom: 6,
  },
});

interface ChartPdfDocumentProps {
  title: string;
  targetKey: string;
  lines: ChartLine[];
  /** Optional custom chord color as hex string. */
  chordColor?: string;
}

/** Render emphasis-parsed segments in the given base monospace font. */
function EmphasisRuns({
  segments,
}: {
  segments: EmphasisSegment[];
}) {
  return (
    <>
      {segments.map((seg, i) => {
        // One registered family; weight/fontStyle drive the variant.
        const style: { fontWeight?: number; fontStyle?: "normal" | "italic" } =
          {};
        if (seg.bold) style.fontWeight = 700;
        if (seg.italic) style.fontStyle = "italic";
        return (
          <Text key={i} style={style}>
            {seg.text}
          </Text>
        );
      })}
    </>
  );
}

/**
 * Grid line mirroring the user's authored layout: chord tokens replaced
 * in place, whitespace (tabs/spaces) between delimiters preserved, so
 * delimiter columns land where the user typed them.
 */
function GridLinePdf({ line, chordColor }: { line: ChartLine; chordColor?: string }) {
  if (!line.bars) return null;
  const tokens = line.bars.map((b) => b.token || "");
  const row = renderGridRow(line.raw, tokens);
  return (
    <Text
      style={{
        fontFamily: MONO,
        fontWeight: 700,
        color: chordColor ?? "#000000",
        marginBottom: 8,
      }}
    >
      {row}
    </Text>
  );
}

/**
 * One lyric line as two rows on a shared monospace character grid.
 * The chord row is space-padded so each chord begins exactly at the
 * character column where its piece of lyric text begins. Emphasis markers
 * are stripped before measuring so asterisks never skew the columns.
 */
function LyricLine({
  pieces,
  chordColor,
}: {
  pieces: { text: string; chord?: string }[];
  chordColor?: string;
}) {
  let offset = 0;
  const chordCells: Array<{ at: number; chord: string }> = [];
  const runs: EmphasisSegment[][] = [];

  for (const piece of pieces) {
    if (piece.chord) chordCells.push({ at: offset, chord: piece.chord });
    const stripped = piece.text.replaceAll("*", "");
    runs.push(parseEmphasis(piece.text));
    offset += stripped.length;
  }

  // Chord row: pad to each chord's column; a previous chord that overhangs
  // pushes the next chord to the next free column (standard behavior).
  let chordRow = "";
  for (const cell of chordCells) {
    const start = Math.max(cell.at, chordRow.length);
    chordRow += " ".repeat(start - chordRow.length) + cell.chord;
  }

  return (
    <View style={styles.lyricBlock}>
      <Text
        style={[
          styles.chordRow,
          { color: chordColor ?? "#000000" },
        ]}
      >
        {chordRow}
      </Text>
      <Text>
        {runs.map((segs, i) => (
          <EmphasisRuns key={i} segments={segs} />
        ))}
      </Text>
    </View>
  );
}

/** Section label: emphasis-aware, natural case. */
function SectionLine({ text }: { text: string }) {
  const segments = parseEmphasis(text);
  return (
    <View style={styles.section}>
      {segments.map((seg, i) => {
        if (!seg.bold && !seg.italic) return <Text key={i}>{seg.text}</Text>;
        let fontFamily = "Helvetica";
        if (seg.bold && seg.italic) fontFamily = "Helvetica-BoldOblique";
        else if (seg.bold) fontFamily = "Helvetica-Bold";
        else fontFamily = "Helvetica-Oblique";
        return (
          <Text key={i} style={{ fontFamily }}>
            {seg.text}
          </Text>
        );
      })}
    </View>
  );
}

/** Print-ready chart document rendered by @react-pdf/renderer. */
export function ChartPdfDocument({
  title,
  targetKey,
  lines,
  chordColor,
}: Omit<ChartPdfDocumentProps, "originalKey">) {
  registerChartFonts();
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            {title || "Untitled chart"}
          </Text>
          <Text style={{ fontFamily: "Helvetica" }}>{" "}({targetKey})</Text>
        </Text>

        {lines.map((line, i) => {
          if (line.type === "grid" && line.bars) {
            return <GridLinePdf key={i} line={line} chordColor={chordColor} />;
          }
          if (line.type === "lyric" && line.segments) {
            const pieces = buildChordPieces(line.segments);
            return <LyricLine key={i} pieces={pieces} chordColor={chordColor} />;
          }
          // Section labels render in natural case with emphasis support;
          // blank lines become spacers.
          return line.raw.trim() ? (
            <SectionLine key={i} text={line.raw} />
          ) : (
            <Text key={i}> </Text>
          );
        })}
      </Page>
    </Document>
  );
}
