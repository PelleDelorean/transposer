import { KEYS, getKey, spellDegree, isFlatKey } from "@/lib/music/keys";

describe("keys", () => {
  test("12 keys are defined with unique names", () => {
    expect(KEYS).toHaveLength(12);
    expect(new Set(KEYS.map((k) => k.name)).size).toBe(12);
  });

  test("tonic pitch classes", () => {
    const expected: Record<string, number> = {
      C: 0, F: 5, Bb: 10, Eb: 3, Ab: 8, Db: 1,
      G: 7, D: 2, A: 9, E: 4, B: 11, "F#": 6,
    };
    for (const k of KEYS) {
      expect(k.tonic).toBe(expected[k.name]);
    }
  });

  test("every key's scale letters ascend diatonically", () => {
    for (const k of KEYS) {
      for (let d = 0; d < 6; d++) {
        expect((k.letters[d] + 1) % 7).toBe(k.letters[d + 1]);
      }
    }
  });

  test("key spellings: degree 1 equals tonic", () => {
    const expected: Record<string, string> = {
      C: "C", F: "F", Bb: "Bb", Eb: "Eb", Ab: "Ab", Db: "Db",
      G: "G", D: "D", A: "A", E: "E", B: "B", "F#": "F#",
    };
    for (const k of KEYS) {
      expect(spellDegree(k, 1)).toBe(expected[k.name]);
    }
  });

  test("flat keys emit flats, sharp keys emit sharps on altered degrees", () => {
    // F major: degree 4 is Bb (flat key)
    const F = getKey("F")!;
    expect(spellDegree(F, 4)).toBe("Bb");
    // G major: degree 7 is F# (sharp key)
    const G = getKey("G")!;
    expect(spellDegree(G, 7)).toBe("F#");
    // Bb major: degree 7 is A (natural)
    const Bb = getKey("Bb")!;
    expect(spellDegree(Bb, 7)).toBe("A");
    // Eb major: degrees 2, 6, 7 are F, C, D — degree 4 Ab
    const Eb = getKey("Eb")!;
    expect(spellDegree(Eb, 4)).toBe("Ab");
    expect(spellDegree(Eb, 3)).toBe("G");
  });

  test("chromatic alteration cancels key signature: #4 in F is B natural", () => {
    const F = getKey("F")!;
    expect(spellDegree(F, 4, 1)).toBe("B");
    // b7 in F major -> Eb
    expect(spellDegree(F, 7, -1)).toBe("Eb");
  });

  test("isFlatKey classification", () => {
    expect(isFlatKey(getKey("F")!)).toBe(true);
    expect(isFlatKey(getKey("Db")!)).toBe(true);
    expect(isFlatKey(getKey("C")!)).toBe(false);
    expect(isFlatKey(getKey("G")!)).toBe(false);
    expect(isFlatKey(getKey("F#")!)).toBe(false);
  });

  test("getKey returns null for unknown", () => {
    expect(getKey("H")).toBeNull();
    expect(getKey("")).toBeNull();
  });
});
