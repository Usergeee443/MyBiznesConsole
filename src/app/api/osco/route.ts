import { NextResponse } from "next/server";
export { dynamic, runtime } from "@/lib/api-config";
import {
  getArenaTopStats,
  addArenaTopStat,
  updateArenaTopStat,
  deleteArenaTopStat,
  getArenaTopAnalytics,
} from "@/lib/services";

export async function GET() {
  return NextResponse.json({
    stats: getArenaTopStats(),
    analytics: getArenaTopAnalytics(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const stat = addArenaTopStat(body);
  return NextResponse.json(stat);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "id kerak" }, { status: 400 });
  }
  const stat = updateArenaTopStat(id, data);
  if (!stat) {
    return NextResponse.json({ error: "Topilmadi yoki sana band" }, { status: 404 });
  }
  return NextResponse.json(stat);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id kerak" }, { status: 400 });
  }
  const stat = deleteArenaTopStat(id);
  if (!stat) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  return NextResponse.json(stat);
}
