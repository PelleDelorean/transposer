import { transposeChart, renderRoman } from "@/lib/music/transpose";
import { getKey } from "@/lib/music/keys";

describe("renderRoman", () => {
  test("F major: I=F, i=Fm, V=C", () => {
    const F = getKey("F")!;
    expect(renderRoman("I", F)).toBe("F");
    expect(renderRoman("i", F)).toBe("Fm");
    expect(renderRoman("V", F)).toBe("C");
  });

  test("C major: IIdim=Ddim, V=G, vii°=Bdim", () => {
    const C = getKey("C")!;
    expect(renderRoman("IIdim", C)).toBe("Ddim");
    expect(renderRoman("vii°", C)).toBe("Bdim");
    expect(renderRoman("V", C)).toBe("G");
  });

  test("extensions pass through: Imaj7b9 in C = Cmaj7b9", () => {
    const C = getKey("C")!;
    expect(renderRoman("Imaj7b9", C)).toBe("Cmaj7b9");
    expect(renderRoman("V7alt", C)).toBe("G7alt");
    expect(renderRoman("IV13#11", C)).toBe("F13#11");
  });

  test("slash chords transpose both parts: V/vii in C = G/B", () => {
    const C = getKey("C")!;
    expect(renderRoman("V/vii", C)).toBe("G/B");
    expect(renderRoman("I/iii", C)).toBe("C/E");
    expect(renderRoman("IV/v", C)).toBe("F/G");
  });

  test("accidentals: bVII in C = Bb, #iv in G = C#", () => {
    const C = getKey("C")!;
    expect(renderRoman("bVII", C)).toBe("Bb");
    const G = getKey("G")!;
    expect(renderRoman("#iv", G)).toBe("C#m");
  });
});

describe("transposeChart", () => {
  const chart = "| I | vi | IIdim | IV |";

  test("all 12 keys with exact spellings from C major source", () => {
    const expected: Record<string, string> = {
      C: "| C | Am | Ddim | F |",
      F: "| F | Dm | Gdim | Bb |",
      Bb: "| Bb | Gm | Cdim | Eb |",
      Eb: "| Eb | Cm | Fdim | Ab |",
      Ab: "| Ab | Fm | Bbdim | Db |",
      Db: "| Db | Bbm | Ebdim | Gb |",
      G: "| G | Em | Adim | C |",
      D: "| D | Bm | Edim | G |",
      A: "| A | F#m | Bdim | D |",
      E: "| E | C#m | F#dim | A |",
      B: "| B | G#m | C#dim | E |",
      "F#": "| F# | D#m | G#dim | B |",
    };
    for (const [key, out] of Object.entries(expected)) {
      expect(transposeChart(chart, { targetKey: key }).text).toBe(out);
    }
  });

  test("flat keys use flat spellings, sharp keys use sharps", () => {
    // vi in E major = C#m (sharp)
    expect(transposeChart("| vi |", { targetKey: "E" }).text).toBe("| C#m |");
    // vi in Ab major = Fm (flat)
    expect(transposeChart("| vi |", { targetKey: "Ab" }).text).toBe("| Fm |");
    // bVII in Bb = Ab (flat key)
    expect(transposeChart("| bVII |", { targetKey: "Bb" }).text).toBe("| Ab |");
    // bVII in B = A (sharp key spelling of same pc stays natural here)
    expect(transposeChart("| bVII |", { targetKey: "B" }).text).toBe("| A |");
  });

  test("mixed roman + absolute chart transposes absolutes by interval", () => {
    const content = "| I | V/vii | IIdim | Cmaj7 |";
    const result = transposeChart(content, {
      targetKey: "F",
      originalKey: "C",
    });
    expect(result.text).toBe("| F | C/E | Gdim | Fmaj7 |");
  });

  test("absolute chord slash: Bb/D in C->F transposes to Eb/G", () => {
    const result = transposeChart("| Bb/D |", {
      targetKey: "F",
      originalKey: "C",
    });
    expect(result.text).toBe("| Eb/G |");
  });

  test("absolute chords without originalKey stay at same pitch", () => {
    expect(transposeChart("| Cmaj7 |", { targetKey: "G" }).text).toBe("| Cmaj7 |");
  });

  test("lyric mode round trip", () => {
    // iv is degree 4 minor of the target key: in F major, degree 4 = Bb → Bbm.
    const lyric = "My song[I] has not a lot of[iv] lines[VI]";
    const result = transposeChart(lyric, { targetKey: "F" });
    expect(result.text).toBe("My song[F] has not a lot of[Bbm] lines[D]");
  });

  test("lyric lines in a full chart preserve text", () => {
    const content = "Verse\n| I | V |\nHigh[I] above[V]";
    const result = transposeChart(content, { targetKey: "G" });
    expect(result.text).toBe("Verse\n| G | D |\nHigh[G] above[D]");
  });

  test("mode does not change realized chords", () => {
    const a = transposeChart("| I |", { targetKey: "F", mode: "grid" });
    const b = transposeChart("| I |", { targetKey: "F", mode: "lyrics" });
    expect(a.text).toBe(b.text);
  });

  test("structured lines returned for preview/PDF rendering", () => {
    const result = transposeChart("| I | vi |", { targetKey: "F" });
    expect(result.lines[0].type).toBe("grid");
    expect(result.lines[0].bars![0].token).toBe("F");
  });

  test("unknown target key throws", () => {
    expect(() => transposeChart("| I |", { targetKey: "Z" })).toThrow();
  });

  test("every extension example from the spec transposes", () => {
    const C = getKey("C")!;
    const specs: Array<[string, string]> = [
      ["Imaj7b9", "Cmaj7b9"],
      ["V7-5", "G7-5"],
      ["iim7b5", "Dm7b5"],
      ["IV13#11", "F13#11"],
      ["Iadd9", "Cadd9"],
      ["V7alt", "G7alt"],
      ["II9b5", "D9b5"],
    ];
    for (const [numeral, chord] of specs) {
      expect(renderRoman(numeral, C)).toBe(chord);
    }
  });
});
