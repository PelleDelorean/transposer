import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getChart } from "@/app/actions/charts";
import { transposeChart } from "@/lib/music/transpose";
import { ChartPdfDocument } from "@/components/pdf/chart-pdf-document";
import { getKey } from "@/lib/music/keys";

export const runtime = "nodejs";

/**
 * GET /api/charts/[id]/pdf?targetKey=F&mode=grid
 * Returns the chart as a print-ready PDF (RLS-enforced via server client).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chart = await getChart(id);
  if (!chart) {
    return NextResponse.json({ error: "Chart not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const targetKeyParam = searchParams.get("targetKey");
  const modeParam = searchParams.get("mode");
  const targetKey =
    targetKeyParam && getKey(targetKeyParam) ? targetKeyParam : chart.original_key;
  const mode = modeParam === "lyrics" ? "lyrics" : "grid";

  const result = transposeChart(chart.content, {
    targetKey,
    mode,
  });

  const doc = (
    <ChartPdfDocument
      title={chart.title}
      targetKey={targetKey}
      mode={mode}
      lines={result.lines}
    />
  );

  const buffer = await renderToBuffer(doc);
  const filename = (chart.title || "chart")
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename || "chart"}-${targetKey}.pdf"`,
    },
  });
}
