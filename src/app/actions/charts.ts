"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ChartInsert, ChartRow, SortOption, VisibilityFilter } from "@/types/database";

const SORT_FIELDS: Record<SortOption, string> = {
  alphabetical: "title",
  created: "created_at",
  updated: "updated_at",
};

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function listCharts(
  sort: SortOption = "updated",
  visibility: VisibilityFilter = "all",
): Promise<ChartRow[]> {
  const { supabase } = await requireUser();
  const column = SORT_FIELDS[sort] ?? "updated_at";
  let query = supabase
    .from("charts")
    .select("*")
    .order(column, { ascending: sort === "alphabetical" });

  if (visibility !== "all") {
    query = query.eq("is_public", visibility === "public");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getChart(id: string): Promise<ChartRow | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("charts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveChart(
  input: Omit<ChartInsert, "user_id"> & { id?: string },
): Promise<{ id: string }> {
  const { supabase, user } = await requireUser();

  const row = {
    title: input.title.trim() || "Untitled chart",
    original_key: input.original_key,
    content: input.content,
    is_public: input.is_public,
    user_id: user.id,
  };

  if (input.id) {
    const { error } = await supabase
      .from("charts")
      .update(row)
      .eq("id", input.id);
    if (error) throw new Error(error.message);
    revalidatePath("/");
    return { id: input.id };
  }

  const { data, error } = await supabase
    .from("charts")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return { id: data.id };
}

export async function deleteChart(id: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("charts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
