import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { ScoredLead, SearchParams } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { searchId, query, params, leads } = body as {
      searchId: string;
      query: string;
      params: SearchParams;
      leads: ScoredLead[];
    };

    if (!searchId || !leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error: searchError } = await supabase.from("saved_searches").upsert(
      {
        search_id: searchId,
        user_id: userId,
        query: query || `${params.category} ${params.city}`,
        category: params.category,
        city: params.city,
        area: params.area || null,
        country: params.country || null,
        industry: params.industry || null,
        lead_count: leads.length,
      },
      { onConflict: "search_id", ignoreDuplicates: false }
    );

    if (searchError) {
      return NextResponse.json({ error: searchError.message }, { status: 500 });
    }

    // Delete old leads for this search, then insert fresh ones
    await supabase
      .from("saved_leads")
      .delete()
      .eq("search_id", searchId)
      .eq("user_id", userId);

    if (leads.length > 0) {
      const leadRows = leads.map((l) => ({
        user_id: userId,
        search_id: searchId,
        business_name: l.businessName,
        category: l.category,
        address: l.address,
        city: l.city,
        phone: l.phone || null,
        email: l.email || null,
        website: l.website || null,
        rating: l.rating ?? null,
        reviews: l.reviews ?? null,
        google_maps_link: l.googleMapsLink || null,
        business_status: l.businessStatus || null,
        lead_score: l.leadScore,
        priority: l.priority,
        website_status: l.websiteStatus,
        weak_digital_presence: l.weakDigitalPresence,
        search_params: params as unknown as Json,
      }));

      const { error: leadsError } = await supabase
        .from("saved_leads")
        .insert(leadRows);

      if (leadsError) {
        return NextResponse.json({ error: leadsError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: leads.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
