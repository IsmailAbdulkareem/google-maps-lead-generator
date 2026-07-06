import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchId } = await params;
    const supabase = await createClient();

    const { data: leads, error } = await supabase
      .from("saved_leads")
      .select("*")
      .eq("search_id", searchId)
      .eq("user_id", userId)
      .order("lead_score", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: search } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("search_id", searchId)
      .eq("user_id", userId)
      .single();

    return NextResponse.json({ leads: leads ?? [], search: search ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
