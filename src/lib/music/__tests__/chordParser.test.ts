import { parseAbsoluteChord, formatAbsoluteChord } from "@/lib/music/chordParser";

describe("parseAbsoluteChord", () => {
  test("basic roots", () => {
    expect(parseAbsoluteChord("C")).toMatchObject({ rootPc: 0, suffix: "" });
    expect(parseAbsoluteChord("F")).toMatchObject({ rootPc: 5, suffix: "" });
    expect(parseAbsoluteChord("Bb")).toMatchObject({ rootPc: 10, rootLetter: 6 });
    expect(parseAbsoluteChord("F#")).toMatchObject({ rootPc: 6, rootLetter: 3 });
  });

  test("qualities and extensions in suffix", () => {
    expect(parseAbsoluteChord("Cmaj7")).toMatchObject({ rootPc: 0, suffix: "maj7" });
    expect(parseAbsoluteChord("Am7")).toMatchObject({ rootPc: 9, suffix: "m7" });
    expect(parseAbsoluteChord("G7alt")).toMatchObject({ rootPc: 7, suffix: "7alt" });
    expect(parseAbsoluteChord("D13#11")).toMatchObject({ rootPc: 2, suffix: "13#11" });
    expect(parseAbsoluteChord("Bbm7b5")).toMatchObject({ rootPc: 10, suffix: "m7b5" });
  });

  test("slash chords with absolute bass", () => {
    expect(parseAbsoluteChord("Bb/D")).toMatchObject({
      rootPc: 10,
      bass: { pc: 2, letter: 1 },
    });
    expect(parseAbsoluteChord("C/E")).toMatchObject({
      rootPc: 0,
      bass: { pc: 4, letter: 2 },
    });
    expect(parseAbsoluteChord("F#m7b5/A")).toMatchObject({
      rootPc: 6,
      suffix: "m7b5",
      bass: { pc: 9 },
    });
  });

  test("rejects non-chords", () => {
    expect(parseAbsoluteChord("I")).toBeNull();
    expect(parseAbsoluteChord("V/vii")).toBeNull();
    expect(parseAbsoluteChord("hello")).toBeNull();
    expect(parseAbsoluteChord("")).toBeNull();
    expect(parseAbsoluteChord("xx")).toBeNull();
  });

  test("rejects trailing junk that is not chord content", () => {
    expect(parseAbsoluteChord("Cwords")).toBeNull();
    expect(parseAbsoluteChord("Egg")).toBeNull(); // 'gg' not chord suffix
  });

  test("formatAbsoluteChord round trip", () => {
    expect(formatAbsoluteChord("Bb", "m7", "D")).toBe("Bbm7/D");
    expect(formatAbsoluteChord("C", "maj7", null)).toBe("Cmaj7");
  });
});
