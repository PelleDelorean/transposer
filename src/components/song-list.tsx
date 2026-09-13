"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteChart } from "@/app/actions/charts";
import type { ChartRow, SortOption, VisibilityFilter } from "@/types/database";
import { ArrowUpDown, Lock, Globe2, FileText, Trash2 } from "lucide-react";

const SORTS: Array<{ value: SortOption; label: string }> = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "alphabetical", label: "A–Z" },
];

const FILTERS: Array<{ value: VisibilityFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SongList({ charts }: { charts: ChartRow[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<SortOption>("updated");
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const visible = useMemo(() => {
    let list = charts;
    if (filter !== "all") {
      list = list.filter((c) => c.is_public === (filter === "public"));
    }
    return [...list].sort((a, b) => {
      if (sort === "alphabetical") return a.title.localeCompare(b.title);
      if (sort === "created") return b.created_at.localeCompare(a.created_at);
      return b.updated_at.localeCompare(a.updated_at);
    });
  }, [charts, sort, filter]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteChart(id);
      router.refresh();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          <ArrowUpDown className="h-4 w-4 text-zinc-500" aria-hidden />
          <span className="text-zinc-500 dark:text-zinc-400">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-zinc-300 bg-white py-1.5 pl-2 pr-8 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex overflow-hidden rounded-md border border-zinc-300 text-sm dark:border-zinc-700">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 ${
                filter === f.value
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <FileText className="mx-auto mb-2 h-8 w-8 text-zinc-400" aria-hidden />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No charts yet.{" "}
            <Link href="/editor" className="font-medium underline">
              Create your first chart
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {visible.map((chart) => (
            <li key={chart.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/editor?id=${chart.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {chart.title}
                </Link>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                    {chart.original_key}
                  </span>
                  <span className="flex items-center gap-1">
                    {chart.is_public ? (
                      <>
                        <Globe2 className="h-3 w-3" aria-hidden /> Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" aria-hidden /> Private
                      </>
                    )}
                  </span>
                  <span>Updated {formatDate(chart.updated_at)}</span>
                </p>
              </div>
              <button
                onClick={() => handleDelete(chart.id)}
                disabled={deleting === chart.id}
                aria-label={`Delete ${chart.title}`}
                className="rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
