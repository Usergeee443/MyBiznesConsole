/**
 * Lokal ishlab chiqish uchun Telegram bot (polling).
 * Ishga tushirish: npm run bot
 */
import "dotenv/config";
import { getBot } from "../src/lib/telegram/bot";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN .env faylida yo'q");
  process.exit(1);
}

const bot = getBot();

console.log("🤖 Telegram bot ishga tushdi (polling)...");
console.log("   /start — bosh menyu");

bot.start({
  onStart: (info) => {
    console.log(`✅ @${info.username} tayyor`);
  },
});
