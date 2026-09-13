import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ChartLine } from "@/lib/music/chartParser";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 12,
    fontFamily: "Courier",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#555",
    marginBottom: 20,
  },
  barRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  bar: {
    marginRight: 8,
    marginBottom: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: "#f2f2f2",
    fontFamily: "Courier-Bold",
  },
  lyricBlock: {
    marginBottom: 8,
  },
  chordRow: {
    fontFamily: "Courier-Bold",
    color: "#0a7d4f",
  },
  lyricRow: {
    fontFamily: "Courier",
  },
  section: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: "#555",
    marginTop: 10,
    marginBottom: 6,
    textTransform: "uppercase",
  },
});

interface ChartPdfDocumentProps {
  title: string;
  originalKey: string;
  targetKey: string;
  mode: "grid" | "lyrics";
  lines: ChartLine[];
}

/** Print-ready chart document rendered by @react-pdf/renderer. */
export function ChartPdfDocument({
  title,
  originalKey,
  targetKey,
  mode,
  lines,
}: ChartPdfDocumentProps) {
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title || "Untitled chart"}</Text>
        <Text style={styles.meta}>
          Key: {targetKey}
          {originalKey !== targetKey ? ` (transposed from ${originalKey})` : ""} ·{" "}
          {mode === "grid" ? "Chords grid" : "Lyrics + chords"}
        </Text>

        {lines.map((line, i) => {
          if (line.type === "grid" && line.bars) {
            return (
              <View key={i} style={styles.barRow}>
                {line.bars.map((bar, j) => (
                  <Text key={j} style={styles.bar}>
                    {bar.token || "·"}
                  </Text>
                ))}
              </View>
            );
          }
          if (line.type === "lyric" && line.segments) {
            // Build a chord line above the lyric line with fixed 2-col chunks.
            const pairs = line.segments.map((s) => ({
              chord: s.chord?.token ?? "",
              text: s.text,
            }));
            return (
              <View key={i} style={styles.lyricBlock}>
                <Text style={styles.chordRow}>
                  {pairs.map((p) => p.chord).join("")}
                </Text>
                <Text style={styles.lyricRow}>
                  {pairs.map((p) => p.text).join("")}
                </Text>
              </View>
            );
          }
          // Section labels and blank/unknown lines.
          return line.raw.trim() ? (
            <Text key={i} style={styles.section}>
              {line.raw}
            </Text>
          ) : (
            <Text key={i}> </Text>
          );
        })}
      </Page>
    </Document>
  );
}
