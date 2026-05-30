import { NextResponse } from "next/server";
export { dynamic, runtime } from "@/lib/api-config";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getRecentTransactions,
  getMonthlyExpenses,
  getBalanceOverview,
} from "@/lib/services";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? undefined;

  return NextResponse.json({
    balance: getBalanceOverview(),
    transactions: getRecentTransactions(100),
    expenses: getMonthlyExpenses(month),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const tx = addTransaction(body);
  return NextResponse.json(tx);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  if (!id) {
    return NextResponse.json({ error: "id kerak" }, { status: 400 });
  }
  const tx = updateTransaction(id, data);
  if (!tx) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  return NextResponse.json(tx);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ error: "id kerak" }, { status: 400 });
  }
  const tx = deleteTransaction(id);
  if (!tx) {
    return NextResponse.json({ error: "Topilmadi" }, { status: 404 });
  }
  return NextResponse.json(tx);
}
