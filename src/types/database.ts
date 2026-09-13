export interface ChartRow {
  id: string;
  user_id: string;
  title: string;
  original_key: string;
  content: string;
  /** Chord color as #RRGGBB, or null for the default (black). */
  chord_color: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type ChartInsert = Omit<ChartRow, "id" | "created_at" | "updated_at">;
export type ChartUpdate = Partial<
  Pick<ChartRow, "title" | "original_key" | "content" | "chord_color" | "is_public">
>;

export type SortOption = "alphabetical" | "created" | "updated";
export type VisibilityFilter = "all" | "public" | "private";
