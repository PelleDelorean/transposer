import { redirect } from "next/navigation";
import {
  getSupabaseServerClient,
} from "@/lib/supabase/server";
import { Editor } from "@/components/editor";
import { getChart } from "@/app/actions/charts";
import { AppHeader } from "@/components/app-header";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let chart = null;
  if (id) {
    chart = await getChart(id);
    if (!chart) redirect("/editor");
  }

  return (
    <>
      <AppHeader user={user} />
      <Editor chart={chart} />
    </>
  );
}
