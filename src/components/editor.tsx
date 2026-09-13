"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transposeChart } from "@/lib/music/transpose";
import { KeySelector } from "@/components/key-selector";
import { ChartPreview } from "@/components/chart-preview";
import { saveChart } from "@/app/actions/charts";
import type { ChartRow } from "@/types/database";
import {
  Save,
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface EditorProps {
  /** Existing chart when editing (from ?id=), null for new. */
  chart: ChartRow | null;
}

const SAMPLE = `Verse
| I | vi | IV | V |
Lines of the[I] song go here[IV] and carry on[V]

Chorus
| I | V/vii | IIdim | Cmaj7 |`;

export function Editor({ chart }: EditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(chart?.title ?? "");
  const [originalKey, setOriginalKey] = useState(chart?.original_key ?? "C");
  const [content, setContent] = useState(chart?.content ?? SAMPLE);
  const [isPublic, setIsPublic] = useState(chart?.is_public ?? false);
  const [targetKey, setTargetKey] = useState(chart?.original_key ?? "C");
  // Persisted per chart; empty string = default (black).
  const [chordColor, setChordColor] = useState(chart?.chord_color ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Snapshot of the values as of the last save (or initial load).
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      title: chart?.title ?? "",
      originalKey: chart?.original_key ?? "C",
      content: chart?.content ?? SAMPLE,
      chordColor: chart?.chord_color ?? "",
      isPublic: chart?.is_public ?? false,
    }),
  );
  const [pdfConfirm, setPdfConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges =
    JSON.stringify({ title, originalKey, content, chordColor, isPublic }) !==
    savedSnapshot;

  // Debounced live preview (~200ms).
  const [debounced, setDebounced] = useState(content);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(content), 200);
    return () => clearTimeout(t);
  }, [content]);

  const result = useMemo(() => {
    try {
      return transposeChart(debounced, {
        targetKey,
        originalKey,
      });
    } catch {
      return null;
    }
  }, [debounced, targetKey, originalKey]);

  /**
   * Tab inserts spaces instead of moving focus. If the selection spans
   * multiple lines, each line is indented by two spaces (and Shift+Tab
   * removes up to two leading spaces per line) — handy for laying out
   * grid sections.
   */
  function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Only intercept Tab (with or without Shift); every other key — delete,
    // arrows, typing — must behave natively.
    if (e.key !== "Tab") return;

    const ta = e.currentTarget;
    const { selectionStart: s, selectionEnd: en, value } = ta;
    e.preventDefault();

    const isShift = e.shiftKey;
    const multiline = value.slice(s, en).includes("\n");

    if (!isShift && !multiline) {
      // Simple case: insert two spaces at the cursor.
      const next = value.slice(0, s) + "  " + value.slice(en);
      setContent(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
      return;
    }

    // Multi-line indent/dedent.
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    const segment = value.slice(lineStart, en);
    const lines = segment.split("\n");
    const adjusted = lines
      .map((l) =>
        isShift ? l.replace(/^ {1,2}/, "") : "  " + l,
      )
      .join("\n");
    const next = value.slice(0, lineStart) + adjusted + value.slice(en);
    setContent(next);
    requestAnimationFrame(() => {
      ta.selectionStart = lineStart;
      ta.selectionEnd = lineStart + adjusted.length;
    });
  }

  // Draft autosave to localStorage.
  const draftKey = chart ? `draft:${chart.id}` : "draft:new";
  useEffect(() => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({ title, originalKey, content, chordColor, isPublic }),
    );
  }, [title, originalKey, content, chordColor, isPublic, draftKey]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setContent(String(reader.result ?? ""));
      const name = file.name.replace(/\.(txt|text)$/i, "");
      if (!title) setTitle(name);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { id } = await saveChart({
        id: chart?.id,
        title,
        original_key: originalKey,
        content,
        chord_color: chordColor || null,
        is_public: isPublic,
      });
      setSavedAt(new Date().toLocaleTimeString());
      setSavedSnapshot(
        JSON.stringify({ title, originalKey, content, chordColor, isPublic }),
      );
      if (!chart) router.replace(`/editor?id=${id}`);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Cmd/Ctrl+S saves from anywhere on the page (also blocks the browser's
  // "save page" dialog mid-edit). Re-attached each render so the handler
  // always sees current form values.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) void handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  /**
   * PDF export: if there are unsaved changes, ask whether to save first
   * (and then export) or export the last saved state.
   */
  async function handlePdfClick() {
    if (hasUnsavedChanges) {
      setPdfConfirm(true);
      return;
    }
    window.location.href = pdfUrl();
  }

  function pdfUrl(): string {
    const params = new URLSearchParams({ targetKey });
    if (chordColor) params.set("chordColor", chordColor);
    return `/api/charts/${chart?.id}/pdf?${params.toString()}`;
  }

  async function handlePdfSaveAndExport() {
    setPdfConfirm(false);
    const ok = await handleSave();
    if (ok) window.location.href = pdfUrl();
  }

  return (
    // h-dvh + overflow-hidden on md+ bounds the layout to the viewport so
    // the two panes scroll independently; on small screens the panes stack
    // and the page scrolls normally. The sticky AppHeader above this div
    // is h-14, so the editor column fills exactly the remaining viewport.
    <div className="flex min-h-screen flex-col md:h-[calc(100dvh-3.5rem)] md:min-h-0 md:overflow-hidden">
      {/* Sticky toolbar (lighter gray, above pane scrollbars). top-14 keeps
          it clear of the sticky app header on small screens. */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chart title"
          className="min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-400 focus:border-zinc-500 focus:outline-none dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-400"
        />

        <KeySelector value={targetKey} onChange={setTargetKey} label="Transpose to" />
        <KeySelector value={originalKey} onChange={setOriginalKey} label="Original" />

        {/* Chord color picker */}
        <label className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          Chords
          <input
            type="color"
            value={chordColor || "#000000"}
            onChange={(e) => setChordColor(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-zinc-400 bg-transparent dark:border-zinc-600"
            title="Chord color (default black)"
          />
          {chordColor && (
            <button
              type="button"
              onClick={() => setChordColor("")}
              className="text-xs underline text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              title="Reset to default (black)"
            >
              reset
            </button>
          )}
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4"
          />
          Public
        </label>

        <input
          ref={fileRef}
          type="file"
          accept=".txt,.text"
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700"
        >
          <Upload className="h-4 w-4" aria-hidden /> Upload .txt
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex w-28 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            hasUnsavedChanges
              ? "border-emerald-600 bg-emerald-600 text-white shadow hover:bg-emerald-500"
              : "border-zinc-400 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          <Save className="h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save"}
        </button>

        {chart && (
          <button
            onClick={handlePdfClick}
            className="flex items-center gap-1.5 rounded-md border border-zinc-400 px-3 py-1.5 text-sm hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-700"
          >
            <FileDown className="h-4 w-4" aria-hidden /> PDF
          </button>
        )}

        {/* Reserve space so the status appearing/disappearing doesn't shift
            the buttons. Invisible dot keeps the line height stable. */}
        <span className="flex min-w-32 items-center gap-1 text-sm">
          {!saveError && !savedAt && (
            <CheckCircle2 className="h-4 w-4 invisible" aria-hidden />
          )}
          {saveError ? (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden />
              <span className="text-red-600 dark:text-red-400">{saveError}</span>
            </>
          ) : savedAt ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              <span className="text-zinc-500 dark:text-zinc-400">Saved {savedAt}</span>
            </>
          ) : null}
        </span>
      </div>

      {/* Unsaved-changes dialog for PDF export */}
      {pdfConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-5 text-zinc-100 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold">Unsaved changes</h3>
            <p className="mb-5 text-sm text-zinc-300">
              You have unsaved changes. Save them and export the PDF, or export
              the last saved state?
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setPdfConfirm(false)}
                className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPdfConfirm(false);
                  window.location.href = pdfUrl();
                }}
                className="rounded-md border border-zinc-600 px-3 py-1.5 text-sm hover:bg-zinc-800"
              >
                Export saved
              </button>
              <button
                onClick={handlePdfSaveAndExport}
                disabled={saving}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save & export"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Split view */}
      <div className="grid flex-1 grid-cols-1 divide-y divide-zinc-200 md:min-h-0 md:grid-cols-2 md:divide-x md:divide-y-0 dark:divide-zinc-800">
        <div className="flex min-h-0 flex-col p-4">
          <h2 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Chart markup
          </h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 resize-none rounded-md border border-zinc-300 bg-transparent p-3 font-mono text-sm leading-6 focus:outline-none md:min-h-0 dark:border-zinc-700"
            ref={textareaRef}
            onKeyDown={handleTab}
          />
        </div>
        <div className="md:min-h-0 md:overflow-y-auto p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Preview — {targetKey}
            {originalKey !== targetKey && originalKey ? ` (from ${originalKey})` : ""}
          </h2>
          {result ? (
            <ChartPreview lines={result.lines} chordColor={chordColor || undefined} />
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400">
              Could not render preview.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
