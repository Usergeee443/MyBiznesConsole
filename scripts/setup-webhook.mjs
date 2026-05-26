/**
 * Render post-deploy — Telegram webhook (tsx kerak emas).
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl =
  process.env.RENDER_EXTERNAL_URL ??
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_APP_URL;

if (!token) {
  console.log("[webhook] TELEGRAM_BOT_TOKEN yo'q — o'tkazib yuborildi");
  process.exit(0);
}

if (!baseUrl) {
  console.log("[webhook] URL yo'q — /api/telegram/setup ni qo'lda chaqiring");
  process.exit(0);
}

const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

const body = { url: webhookUrl };
if (secret) body.secret_token = secret;

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const data = await res.json();

if (data.ok) {
  console.log(`[webhook] O'rnatildi: ${webhookUrl}`);
  process.exit(0);
}

console.error("[webhook] Xato:", data);
process.exit(1);
