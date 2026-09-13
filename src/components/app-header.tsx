import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { signOut } from "@/app/actions/charts";

/** Shared top navigation. Sticks to the top of the viewport on every page. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-background px-4 dark:border-zinc-800">
      <Link
        href="/"
        className="flex items-center gap-2 font-(family-name:--font-bungee-shade) text-2xl"
      >
        {/* unoptimized: next/image refuses SVG unless globally allowed, and
            this 501px raster needs no optimization at 28px display size. */}
        <Image
          src="/favicon.svg"
          alt=""
          width={28}
          height={28}
          unoptimized
          className="rounded"
        />
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
