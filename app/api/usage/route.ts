import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkLimits } from "@/lib/usage-limits";

export async function GET() {
  try {
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await checkLimits(userId);

    return NextResponse.json(stats);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch usage stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}