import { NextResponse } from "next/server";
export { dynamic, runtime } from "@/lib/api-config";
import { getBotOrNull } from "@/lib/telegram/bot";

/** Webhook o'rnatish: GET /api/telegram/setup?url=https://your-domain.com/api/telegram/webhook */
export async function GET(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN .env da yo'q" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  let webhookUrl = searchParams.get("url");

  if (!webhookUrl) {
    const host = request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host) {
      webhookUrl = `${proto}://${host}/api/telegram/webhook`;
    }
  }

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "url parametri kerak yoki host aniqlanmadi" },
      { status: 400 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const body: Record<string, unknown> = { url: webhookUrl };
  if (secret) body.secret_token = secret;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();

  const bot = getBotOrNull();
  if (bot) {
    const me = await bot.api.getMe();
    return NextResponse.json({
      ok: data.ok,
      webhook: webhookUrl,
      bot: me.username,
      telegram: data,
    });
  }

  return NextResponse.json({ ok: data.ok, webhook: webhookUrl, telegram: data });
}
