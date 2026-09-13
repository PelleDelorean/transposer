import Link from "next/link";
import { BookOpen, Music2 } from "lucide-react";
import { signOut } from "@/app/actions/charts";

/** Shared top navigation. */
export function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Music2 className="h-5 w-5" aria-hidden />
        CHARTMAKER
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/docs"
          className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <BookOpen className="h-4 w-4" aria-hidden /> Docs
        </Link>
        <Link
          href="/editor"
          className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New chart
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
