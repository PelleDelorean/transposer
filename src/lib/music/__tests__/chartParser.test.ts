import { parseChart } from "@/lib/music/chartParser";

describe("parseChart", () => {
  test("grid lines split into bars", () => {
    const lines = parseChart("| I | vi | IIdim | IV |");
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe("grid");
    expect(lines[0].bars).toHaveLength(4);
    expect(lines[0].bars![0]).toEqual({ kind: "roman", token: "I" });
    expect(lines[0].bars![2]).toEqual({ kind: "roman", token: "IIdim" });
  });

  test("lyric lines capture bracketed chords", () => {
    const lines = parseChart("My song[I] has not a lot of[iv] lines[VI]");
    expect(lines[0].type).toBe("lyric");
    expect(lines[0].segments).toEqual([
      { text: "My song", chord: { kind: "roman", token: "I" } },
      { text: " has not a lot of", chord: { kind: "roman", token: "iv" } },
      { text: " lines", chord: { kind: "roman", token: "VI" } },
      { text: "" },
    ]);
  });

  test("disambiguation: B is absolute, bVII is roman", () => {
    const lines = parseChart("| B | bVII | Cmaj7 | Bb/D |");
    expect(lines[0].bars![0]).toEqual({ kind: "absolute", token: "B" });
    expect(lines[0].bars![1]).toEqual({ kind: "roman", token: "bVII" });
    expect(lines[0].bars![2]).toEqual({ kind: "absolute", token: "Cmaj7" });
    expect(lines[0].bars![3]).toEqual({ kind: "absolute", token: "Bb/D" });
  });

  test("plain lines pass through", () => {
    const lines = parseChart("Verse 1\n\nChorus");
    expect(lines[0]).toMatchObject({ type: "plain", raw: "Verse 1" });
    expect(lines[1]).toMatchObject({ type: "plain", raw: "" });
    expect(lines[2]).toMatchObject({ type: "plain", raw: "Chorus" });
  });

  test("mixed chart structure", () => {
    const content = [
      "Verse",
      "| I | V/vii | IIdim | Cmaj7 |",
      "Sing a[I] song[iv]",
    ].join("\n");
    const lines = parseChart(content);
    expect(lines.map((l) => l.type)).toEqual(["plain", "grid", "lyric"]);
  });

  test("unknown tokens classify as unknown", () => {
    const lines = parseChart("| N.C. |");
    expect(lines[0].bars![0]).toEqual({ kind: "unknown", token: "N.C." });
  });

  test("handles CRLF line endings", () => {
    const lines = parseChart("| I |\r\n| V |");
    expect(lines).toHaveLength(2);
  });
});
