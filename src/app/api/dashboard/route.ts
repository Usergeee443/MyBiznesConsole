import { NextResponse } from "next/server";
export { dynamic, runtime } from "@/lib/api-config";
import { getDashboardStats } from "@/lib/services";

export async function GET() {
  const stats = getDashboardStats();
  return NextResponse.json(stats);
}
