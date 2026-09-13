import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listCharts } from "@/app/actions/charts";
import { SongList } from "@/components/song-list";
import { AppHeader } from "@/components/app-header";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const charts = await listCharts("updated", "all");

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold">Your charts</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          {charts.length} {charts.length === 1 ? "chart" : "charts"} in your library
        </p>
        <SongList charts={charts} />
      </main>
    </>
  );
}
