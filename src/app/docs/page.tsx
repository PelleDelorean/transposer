import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Syntax guide — CHARTMAKER",
};

const sections = [
  {
    id: "numerals",
    heading: "Roman numeral basics",
    body: (
      <>
        <p>
          Chords are written as scale degrees relative to the key.{" "}
          <strong>Uppercase = major base, lowercase = minor base.</strong> When
          you pick a target key, every numeral resolves to an absolute chord in
          that key.
        </p>
        <Code>In C major: I = C · ii = Dm · V = G · vii° = Bdim</Code>
        <Code>In F major: I = F · i = Fm · V = C</Code>
      </>
    ),
  },
  {
    id: "accidentals",
    heading: "Accidentals",
    body: (
      <>
        <p>
          Prefix a numeral with <Code>b</Code> or <Code>#</Code> (or ♭/♯) to
          alter the degree.
        </p>
        <Code>♭III or bIII · #IV · bVII</Code>
      </>
    ),
  },
  {
    id: "qualities",
    heading: "Qualities",
    body: (
      <>
        <p>
          Append a quality right after the numeral:{" "}
          <Code>dim</Code>, <Code>°</Code>, <Code>ø</Code>, <Code>aug</Code>,{" "}
          <Code>+</Code>, <Code>sus2</Code>, <Code>sus4</Code>, <Code>maj</Code>,{" "}
          <Code>m</Code>.
        </p>
        <Code>IIdim · vii° · III+ · IVsus2</Code>
      </>
    ),
  },
  {
    id: "extensions",
    heading: "Arbitrary extensions & alterations",
    body: (
      <>
        <p>
          Any numeric extension or alteration string after the root is
          transposed with the chord and passes through verbatim — the parser is
          grammar-based, not a hardcoded list.
        </p>
        <Code>Imaj7b9 · V7-5 · iim7b5 · IV13#11 · Iadd9 · V7alt · II9b5</Code>
      </>
    ),
  },
  {
    id: "slash",
    heading: "Slash chords",
    body: (
      <>
        <p>
          Write the bass note as a second Roman numeral after{" "}
          <Code>/</Code>. Both the chord and the bass transpose dynamically.
        </p>
        <Code>I/iii → C/E (in C) · V/vii → G/B · IV/v → F/G</Code>
      </>
    ),
  },
  {
    id: "absolute",
    heading: "Absolute chords",
    body: (
      <>
        <p>
          Charts may mix numerals with absolute chord names, e.g.{" "}
          <Code>Cmaj7</Code>, <Code>Bb/D</Code>Absolute chords transpose by
          the interval between the chart&rsquo;s <em>original key</em> and the
          target key, and are respelled to match the target key&rsquo;s
          accidental convention.
        </p>
        <Code>| I | V/vii | IIdim | Cmaj7 |</Code>
      </>
    ),
  },
  {
    id: "keys",
    heading: "Key signatures & accidental spelling",
    body: (
      <>
        <p>
          There are exactly 12 target keys. Output spelling strictly follows
          the target key&rsquo;s convention:
        </p>
        <ul className="list-disc pl-5 text-sm">
          <li>
            <strong>Neutral:</strong> C
          </li>
          <li>
            <strong>Flats:</strong> F, Bb, Eb, Ab, Db — outputs flats (Bb, Eb,
            Ab…)
          </li>
          <li>
            <strong>Sharps:</strong> G, D, A, E, B, F# — outputs sharps (F#,
            C#, G#…)
          </li>
        </ul>
        <p>
          The degree letter comes from the target key&rsquo;s scale; the
          accidental combines the key signature with your chromatic alteration.
          Example: <Code>#IV</Code> in F major is <strong>B natural</strong>{" "}
          (the signature flats B; your sharp cancels it).
        </p>
      </>
    ),
  },
  {
    id: "lyrics",
    heading: "Inline lyrics format",
    body: (
      <>
        <p>
          Put chords in square brackets directly after the syllable or word
          they belong to — the chord is rendered above that word. Switch the
          editor to <strong>Lyrics mode</strong> to see the chord-over-lyric
          layout.
        </p>
        <Code>My song[I] has not a lot of[iv] lines[VI]</Code>
        <p>
          Here <code>I</code> sits above &ldquo;song&rdquo;, <code>iv</code>{" "}
          above &ldquo;of&rdquo;, and <code>VI</code> above
          &ldquo;lines&rdquo;. A bracket at the very start of a line anchors
          above the position where the following text begins.
        </p>
      </>
    ),
  },
  {
    id: "grid",
    heading: "Grid format",
    body: (
      <>
        <p>
          Start a line with <Code>|</Code> and separate bars with pipes. Any
          other line is treated as a section label or free text and passes
          through untouched.
        </p>
        <Code>| I | vi | IIdim | IV |</Code>
        <p>
          The <strong>Grid / Lyrics</strong> toggle in the editor only changes
          how the same markup is <em>displayed</em> — your chart text is never
          modified. <strong>Grid</strong> shows a chords-only view (every line
          reduced to its chord sequence, with section labels kept for
          structure). <strong>Lyrics</strong> shows chords positioned above
          the words they belong to. The chosen mode is also used when
          exporting the chart as a PDF.
        </p>
      </>
    ),
  },
];

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="my-2 block rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-sm dark:bg-zinc-800">
      {children}
    </code>
  );
}

export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Syntax guide</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        How CHARTMAKER parses and transposes your charts.
      </p>

      <div className="space-y-10">
        {sections.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="mb-3 text-xl font-semibold">{s.heading}</h2>
            <div className="space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
