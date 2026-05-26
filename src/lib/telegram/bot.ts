import { Bot } from "grammy";
import { setupBotHandlers } from "./handlers";

let bot: Bot | null = null;

export function getBot(): Bot {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN o'rnatilmagan");
  }

  if (!bot) {
    bot = new Bot(token);
    setupBotHandlers(bot);
  }

  return bot;
}

export function getBotOrNull(): Bot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    return getBot();
  } catch {
    return null;
  }
}
