import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  getFundsOverview,
  getFundAllocations,
  allocateFundsForMonth,
  getFundDeposits,
  deleteFundDeposit,
} from "@/lib/services";

export async function GET() {
  return NextResponse.json({
    funds: getFundsOverview(),
    allocations: getFundAllocations(),
    deposits: getFundDeposits(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "allocate") {
    const results = allocateFundsForMonth(body.month);
    return NextResponse.json(results);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id kerak" }, { status: 400 });
  }
  const deposit = deleteFundDeposit(id);
  if (!deposit) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  return NextResponse.json(deposit);
}
