import { NextResponse } from "next/server";
import {
  getSettingsOverview,
  setAccountOpeningBalance,
  setFundOpeningBalance,
} from "@/lib/services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await getSettingsOverview();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, slug, amount, date } = body as {
    type: "account" | "fund";
    slug: string;
    amount: number;
    date?: string;
  };

  if (!type || !slug || amount === undefined) {
    return NextResponse.json(
      { error: "type, slug va amount kerak" },
      { status: 400 }
    );
  }

  const num = Number(amount);
  if (!Number.isFinite(num) || num < 0) {
    return NextResponse.json({ error: "Summa noto'g'ri" }, { status: 400 });
  }

  if (type === "account") {
    const result = await setAccountOpeningBalance(slug, num, date);
    return NextResponse.json({ ok: true, result });
  }

  if (type === "fund") {
    const result = await setFundOpeningBalance(slug, num, date);
    return NextResponse.json({ ok: true, result });
  }

  return NextResponse.json({ error: "type: account yoki fund" }, { status: 400 });
}
