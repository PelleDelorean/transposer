"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { transposeChart } from "@/lib/music/transpose";
import { KeySelector } from "@/components/key-selector";
import { ChartPreview } from "@/components/chart-preview";
import { saveChart } from "@/app/actions/charts";
import type { ChartRow } from "@/types/database";
import {
  Grid3x3,
  Music2,
  Save,
  Upload,
  FileDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type Mode = "grid" | "lyrics";

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
  const [mode, setMode] = useState<Mode>("grid");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        mode,
      });
    } catch {
      return null;
    }
  }, [debounced, targetKey, originalKey, mode]);

  // Draft autosave to localStorage.
  const draftKey = chart ? `draft:${chart.id}` : "draft:new";
  useEffect(() => {
    localStorage.setItem(
      draftKey,
      JSON.stringify({ title, originalKey, content, isPublic }),
    );
  }, [title, originalKey, content, isPublic, draftKey]);

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
        is_public: isPublic,
      });
      setSavedAt(new Date().toLocaleTimeString());
      if (!chart) router.replace(`/editor?id=${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    // h-dvh + overflow-hidden on md+ bounds the layout to the viewport so
    // the two panes scroll independently; on small screens the panes stack
    // and the page scrolls normally.
    <div className="flex min-h-screen flex-col md:h-dvh md:min-h-0 md:overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chart title"
          className="min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-semibold hover:border-zinc-300 focus:border-zinc-400 focus:outline-none dark:hover:border-zinc-700"
        />

        {/* Mode toggle */}
        <div className="flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setMode("grid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              mode === "grid"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Grid3x3 className="h-4 w-4" aria-hidden /> Grid
          </button>
          <button
            onClick={() => setMode("lyrics")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${
              mode === "lyrics"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Music2 className="h-4 w-4" aria-hidden /> Lyrics
          </button>
        </div>

        <KeySelector value={targetKey} onChange={setTargetKey} label="Transpose to" />
        <KeySelector value={originalKey} onChange={setOriginalKey} label="Original" />

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
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4" aria-hidden /> Upload .txt
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden /> {saving ? "Saving…" : "Save"}
        </button>

        {chart && (
          <a
            href={`/api/charts/${chart.id}/pdf?targetKey=${encodeURIComponent(targetKey)}&mode=${mode}`}
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <FileDown className="h-4 w-4" aria-hidden /> PDF
          </a>
        )}

        <span className="flex items-center gap-1 text-sm">
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
          />
        </div>
        <div className="md:min-h-0 md:overflow-y-auto p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Preview — {targetKey}
            {originalKey !== targetKey && originalKey ? ` (from ${originalKey})` : ""}
          </h2>
          {result ? (
            <ChartPreview lines={result.lines} mode={mode} />
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
