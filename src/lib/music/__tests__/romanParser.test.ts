import { parseRoman, looksLikeRoman } from "@/lib/music/romanParser";

describe("parseRoman", () => {
  test("basic numerals: I = F, V = C in F major (via degree)", () => {
    expect(parseRoman("I")).toMatchObject({ degree: 1, chromatic: 0, minorBase: false });
    expect(parseRoman("V")).toMatchObject({ degree: 5, chromatic: 0, minorBase: false });
    expect(parseRoman("i")).toMatchObject({ degree: 1, minorBase: true });
    expect(parseRoman("iv")).toMatchObject({ degree: 4, minorBase: true });
    expect(parseRoman("vii")).toMatchObject({ degree: 7, minorBase: true });
    expect(parseRoman("VII")).toMatchObject({ degree: 7, minorBase: false });
    expect(parseRoman("ii")).toMatchObject({ degree: 2, minorBase: true });
    expect(parseRoman("iii")).toMatchObject({ degree: 3, minorBase: true });
    expect(parseRoman("vi")).toMatchObject({ degree: 6, minorBase: true });
  });

  test("accidentals: bIII, #IV, bVII", () => {
    expect(parseRoman("bIII")).toMatchObject({ degree: 3, chromatic: -1 });
    expect(parseRoman("#IV")).toMatchObject({ degree: 4, chromatic: 1 });
    expect(parseRoman("bVII")).toMatchObject({ degree: 7, chromatic: -1 });
    expect(parseRoman("♭VI")).toMatchObject({ degree: 6, chromatic: -1 });
    expect(parseRoman("♯v")).toMatchObject({ degree: 5, chromatic: 1, minorBase: true });
  });

  test("qualities", () => {
    expect(parseRoman("IIdim")).toMatchObject({ degree: 2, quality: "dim", minorBase: false });
    expect(parseRoman("vii°")).toMatchObject({ degree: 7, quality: "°" });
    expect(parseRoman("viiø")).toMatchObject({ degree: 7, quality: "ø" });
    expect(parseRoman("III+")).toMatchObject({ degree: 3, quality: "+" });
    expect(parseRoman("IVsus2")).toMatchObject({ degree: 4, quality: "sus2" });
    expect(parseRoman("Isus4")).toMatchObject({ degree: 4 - 3, quality: "sus4" });
    // Uppercase numerals imply major, so "maj" here is a (no-op) extension.
    expect(parseRoman("Imaj")).toMatchObject({ degree: 1, quality: null, extension: "maj" });
    expect(parseRoman("Im")).toMatchObject({ degree: 1, quality: "m" });
    expect(parseRoman("IIaug")).toMatchObject({ degree: 2, quality: "aug" });
  });

  test("arbitrary extensions pass through verbatim", () => {
    expect(parseRoman("Imaj7b9")!.extension).toBe("maj7b9");
    expect(parseRoman("V7-5")!.extension).toBe("7-5");
    expect(parseRoman("iim7b5")!.extension).toBe("m7b5");
    expect(parseRoman("IV13#11")!.extension).toBe("13#11");
    expect(parseRoman("Iadd9")!.extension).toBe("add9");
    expect(parseRoman("V7alt")!.extension).toBe("7alt");
    expect(parseRoman("II9b5")!.extension).toBe("9b5");
  });

  test("slash chords: I/iii, V/vii, IV/v", () => {
    expect(parseRoman("I/iii")).toMatchObject({
      degree: 1,
      bass: { degree: 3, minorBase: true },
    });
    expect(parseRoman("V/vii")).toMatchObject({
      degree: 5,
      bass: { degree: 7 },
    });
    expect(parseRoman("IV/v")).toMatchObject({
      degree: 4,
      bass: { degree: 5, minorBase: true },
    });
  });

  test("slash chord with extensions on both parts", () => {
    const r = parseRoman("Imaj7b9/iii");
    expect(r).toMatchObject({ degree: 1, extension: "maj7b9", bass: { degree: 3 } });
    const r2 = parseRoman("V7alt/#iv");
    expect(r2).toMatchObject({ degree: 5, extension: "7alt", bass: { degree: 4, chromatic: 1 } });
  });

  test("returns null for non-numerals", () => {
    expect(parseRoman("Cmaj7")).toBeNull();
    expect(parseRoman("Bb")).toBeNull();
    expect(parseRoman("hello")).toBeNull();
    expect(parseRoman("")).toBeNull();
    expect(parseRoman("B/3")).toBeNull();
  });

  test("looksLikeRoman classification", () => {
    expect(looksLikeRoman("I")).toBe(true);
    expect(looksLikeRoman("bVII")).toBe(true);
    expect(looksLikeRoman("I/iii")).toBe(true);
    expect(looksLikeRoman("B")).toBe(false); // absolute chord letter
    expect(looksLikeRoman("Bb")).toBe(false);
    expect(looksLikeRoman("Cmaj7")).toBe(false);
  });

  test("edge: 'Isus4' degree is 1", () => {
    expect(parseRoman("Isus4")!.degree).toBe(1);
  });
});
