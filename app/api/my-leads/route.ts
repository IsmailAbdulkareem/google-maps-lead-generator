import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: searches, error: searchError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (searchError) {
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    return NextResponse.json({ searches: searches ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchId } = await request.json();

    if (!searchId) {
      return NextResponse.json({ error: "searchId required" }, { status: 400 });
    }

    const supabase = await createClient();

    await supabase.from("saved_leads").delete().eq("search_id", searchId).eq("user_id", userId);

    await supabase.from("saved_searches").delete().eq("search_id", searchId).eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
