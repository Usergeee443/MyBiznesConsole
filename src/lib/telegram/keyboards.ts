import { InlineKeyboard, Keyboard } from "grammy";
import { PERSONAL_EXPENSE_CATEGORIES } from "../utils";

/** Doimiy pastki tugmalar */
export function replyMainKeyboard() {
  return new Keyboard()
    .text("📋 Menyu")
    .text("💰 Balans")
    .row()
    .text("➖ Xarajat")
    .text("📊 Holat")
    .resized()
    .persistent();
}

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("📊 Bosh sahifa", "m:dashboard")
    .text("💰 Balanslar", "m:balance")
    .row()
    .text("🌿 Nur&Garden", "m:nurgarden")
    .text("🏢 Osco", "m:osco")
    .row()
    .text("💳 Moliya", "m:finance")
    .text("🐷 Jamg'arma", "m:funds")
    .row()
    .text("➖ Tez xarajat", "m:quickexpense");
}

export function backToMainKeyboard() {
  return new InlineKeyboard().text("◀️ Bosh menyu", "m:main");
}

export function nurGardenKeyboard() {
  return new InlineKeyboard()
    .text("📦 Mahsulotlar", "ng:products")
    .text("📈 Analitika", "ng:analytics")
    .row()
    .text("🛒 Savdolar", "ng:sales")
    .text("⚠️ Qarzlar", "ng:debts")
    .row()
    .text("💵 Tan narx", "ng:costing")
    .text("◀️ Orqaga", "m:main");
}

export function oscoKeyboard() {
  return new InlineKeyboard()
    .text("📅 Bugungi statistika", "os:addstat")
    .text("📋 Tarix", "os:history")
    .row()
    .text("◀️ Orqaga", "m:main");
}

export function financeKeyboard() {
  return new InlineKeyboard()
    .text("➖ Xarajat", "fin:expense")
    .text("➕ Daromad", "fin:income")
    .row()
    .text("📜 Tranzaksiyalar", "fin:txs")
    .row()
    .text("◀️ Orqaga", "m:main");
}

export function fundsKeyboard() {
  return new InlineKeyboard()
    .text("🔄 Oy ajratish", "fd:allocate")
    .text("📋 Ajratishlar", "fd:deposits")
    .row()
    .text("◀️ Orqaga", "m:main");
}

export function expenseCategoryKeyboard() {
  const kb = new InlineKeyboard();
  PERSONAL_EXPENSE_CATEGORIES.forEach((c, i) => {
    if (i % 2 === 0 && i > 0) kb.row();
    kb.text(c.label, `exp:${c.id}`);
  });
  kb.row().text("❌ Bekor", "cancel");
  return kb;
}

export function incomeAccountKeyboard() {
  return new InlineKeyboard()
    .text("Shaxsiy", "inc:personal")
    .text("Nur&Garden", "inc:nur-garden")
    .row()
    .text("ArenaTop", "inc:arenatop")
    .text("Boshqa", "inc:other-income")
    .row()
    .text("❌ Bekor", "cancel");
}

export function confirmCancelKeyboard(confirmData: string) {
  return new InlineKeyboard()
    .text("✅ Ha", confirmData)
    .text("❌ Yo'q", "cancel");
}

export function arenaStatSkipKeyboard() {
  return new InlineKeyboard().text("⏭ O'tkazib yuborish (0)", "arena:skip");
}
