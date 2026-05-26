import { NextResponse } from "next/server";
import { getBotOrNull } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const bot = getBotOrNull();
  if (!bot) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN o'rnatilmagan" },
      { status: 503 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const update = await request.json();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({
    status: process.env.TELEGRAM_BOT_TOKEN ? "configured" : "missing_token",
    webhook: "/api/telegram/webhook",
  });
}
