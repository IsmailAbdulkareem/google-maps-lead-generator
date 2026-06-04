import { NextResponse } from "next/server";
import { z } from "zod";
import { runLeadSearch } from "@/lib/run-search";

const searchSchema = z.object({
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await runLeadSearch(parsed.data);

    return NextResponse.json({
      query: result.query,
      leads: result.leads,
      meta: { total: result.leads.length },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
