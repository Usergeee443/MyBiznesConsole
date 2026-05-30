import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getDashboardStats } from "@/lib/services";

export async function GET() {
  const stats = getDashboardStats();
  return NextResponse.json(stats);
}
