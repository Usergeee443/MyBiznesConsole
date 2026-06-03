import type { Bot, Context } from "grammy";
import {
  mainMenuKeyboard,
  replyMainKeyboard,
  backToMainKeyboard,
  nurGardenKeyboard,
  oscoKeyboard,
  financeKeyboard,
  fundsKeyboard,
  expenseCategoryKeyboard,
  incomeAccountKeyboard,
  arenaStatSkipKeyboard,
} from "./keyboards";
import * as F from "./format";
import { getSession, setSession, clearSession } from "./session";
import {
  addTransaction,
  addArenaTopStat,
  allocateFundsForMonth,
  getFundDeposits,
  deleteFundDeposit,
  deleteArenaTopStat,
} from "../services";
import {
  PERSONAL_EXPENSE_CATEGORIES,
  todayISO,
  currentMonth,
  formatMoney,
  ARENATOP_COMMISSION,
} from "../utils";
import { initDatabase } from "../db/index";
import { isMySqlConfigured } from "../mysql";
import { initMySqlDatabase } from "../db/mysql-init";

function isOwner(ctx: Context): boolean {
  const ownerId = process.env.TELEGRAM_OWNER_ID;
  if (!ownerId) return true;
  return ctx.from?.id?.toString() === ownerId;
}

async function replyMain(ctx: Context, text: string) {
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: mainMenuKeyboard(),
  });
}

async function replyWithReplyKeyboard(ctx: Context, text: string) {
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: replyMainKeyboard(),
  });
}

export function setupBotHandlers(bot: Bot) {
  if (isMySqlConfigured()) {
    void initMySqlDatabase();
  } else {
    initDatabase();
  }

  bot.use(async (ctx, next) => {
    if (!isOwner(ctx)) {
      await ctx.reply("⛔ Ruxsat yo'q. Bu bot faqat egasi uchun.");
      return;
    }
    await next();
  });

  bot.command("start", async (ctx) => {
    await clearSession(ctx.chat!.id);
    await replyWithReplyKeyboard(
      ctx,
      `Salom, <b>Nurmuxammad</b>! 👋\n\nMyBiznes Console botiga xush kelibsiz.`
    );
    await replyMain(ctx, "Quyidagi tugmalardan tanlang:");
  });

  bot.hears("📋 Menyu", async (ctx) => {
    await clearSession(ctx.chat!.id);
    await replyMain(ctx, "📋 Bosh menyu:");
  });

  bot.hears("💰 Balans", async (ctx) => {
    await replyMain(ctx, await F.formatBalance());
  });

  bot.hears("📊 Holat", async (ctx) => {
    await replyMain(ctx, await F.formatDashboard());
  });

  bot.hears("➖ Xarajat", async (ctx) => {
    await setSession(ctx.chat!.id, "expense_category", {});
    await ctx.reply("➖ Kategoriya tanlang:", {
      reply_markup: expenseCategoryKeyboard(),
    });
  });

  bot.command("menu", async (ctx) => {
    await clearSession(ctx.chat!.id);
    await replyMain(ctx, "📋 Bosh menyu:");
  });

  bot.callbackQuery("cancel", async (ctx) => {
    await clearSession(ctx.chat!.id);
    await ctx.answerCallbackQuery();
    await replyMain(ctx, "❌ Bekor qilindi.");
  });

  bot.callbackQuery("m:main", async (ctx) => {
    await clearSession(ctx.chat!.id);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("📋 Bosh menyu:", {
      reply_markup: mainMenuKeyboard(),
    }).catch(() =>
      replyMain(ctx, "📋 Bosh menyu:")
    );
  });

  bot.callbackQuery("m:dashboard", async (ctx) => {
    await ctx.answerCallbackQuery();
    const text = await F.formatDashboard();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: backToMainKeyboard(),
    }).catch(() => replyMain(ctx, text));
  });

  bot.callbackQuery("m:balance", async (ctx) => {
    await ctx.answerCallbackQuery();
    const text = await F.formatBalance();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: backToMainKeyboard(),
    }).catch(() => replyMain(ctx, text));
  });

  bot.callbackQuery("m:nurgarden", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🌿 <b>Nur&Garden</b>\nBo'limni tanlang:", {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() =>
      ctx.reply("🌿 Nur&Garden", { reply_markup: nurGardenKeyboard() })
    );
  });

  bot.callbackQuery("m:osco", async (ctx) => {
    await ctx.answerCallbackQuery();
    const text = await F.formatOsco();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: oscoKeyboard(),
    }).catch(() => ctx.reply(text, { parse_mode: "HTML", reply_markup: oscoKeyboard() }));
  });

  bot.callbackQuery("m:finance", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("💳 <b>Moliya</b>", {
      parse_mode: "HTML",
      reply_markup: financeKeyboard(),
    }).catch(() =>
      ctx.reply("💳 Moliya", { reply_markup: financeKeyboard() })
    );
  });

  bot.callbackQuery("m:funds", async (ctx) => {
    await ctx.answerCallbackQuery();
    const text = await F.formatFunds();
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: fundsKeyboard(),
    }).catch(() => replyMain(ctx, text));
  });

  bot.callbackQuery("m:quickexpense", async (ctx) => {
    await ctx.answerCallbackQuery();
    await setSession(ctx.chat!.id, "expense_category", {});
    await ctx.editMessageText("➖ Xarajat kategoriyasini tanlang:", {
      reply_markup: expenseCategoryKeyboard(),
    }).catch(() =>
      ctx.reply("➖ Kategoriya tanlang:", { reply_markup: expenseCategoryKeyboard() })
    );
  });

  // Nur&Garden
  bot.callbackQuery("ng:products", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatProducts(), {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("ng:analytics", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatNurGardenAnalytics(), {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("ng:sales", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatSales(), {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("ng:debts", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatDebts(), {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("ng:costing", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatCostingSummary(), {
      parse_mode: "HTML",
      reply_markup: nurGardenKeyboard(),
    }).catch(() => {});
  });

  // Osco
  bot.callbackQuery("os:history", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatArenaHistory(), {
      parse_mode: "HTML",
      reply_markup: oscoKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("os:addstat", async (ctx) => {
    await ctx.answerCallbackQuery();
    await setSession(ctx.chat!.id, "arena_stadiums_added", { date: todayISO() });
    await ctx.editMessageText(
      `📅 ArenaTop statistika (${todayISO()})\n\n1/5 — Bugun qo'shilgan stadionlar soni:`,
      { reply_markup: arenaStatSkipKeyboard() }
    ).catch(() =>
      ctx.reply(`1/5 — Qo'shilgan stadionlar:`)
    );
  });

  bot.callbackQuery("arena:skip", async (ctx) => {
    await ctx.answerCallbackQuery();
    const chatId = ctx.chat!.id;
    const { step, data } = await getSession(chatId);
    if (!step?.startsWith("arena_")) return;

    const field = step.replace("arena_", "");
    const defaults: Record<string, number> = {
      stadiums_added: 0,
      total_stadiums: 0,
      users_added: 0,
      total_users: 0,
      bookings: 0,
    };
    data[field] = 0;
    await advanceArenaStep(ctx, chatId, field, data);
  });

  // Finance
  bot.callbackQuery("fin:expense", async (ctx) => {
    await ctx.answerCallbackQuery();
    await setSession(ctx.chat!.id, "expense_category", {});
    await ctx.editMessageText("➖ Kategoriya tanlang:", {
      reply_markup: expenseCategoryKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("fin:income", async (ctx) => {
    await ctx.answerCallbackQuery();
    await setSession(ctx.chat!.id, "income_account", {});
    await ctx.editMessageText("➕ Daromad qaysi hisobga?", {
      reply_markup: incomeAccountKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery("fin:txs", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(await F.formatTransactions(), {
      parse_mode: "HTML",
      reply_markup: financeKeyboard(),
    }).catch(() => {});
  });

  bot.callbackQuery(/^exp:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const category = ctx.match![1];
    const label =
      PERSONAL_EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ??
      category;
    await setSession(ctx.chat!.id, "expense_amount", { category, label });
    await ctx.editMessageText(
      `➖ <b>${label}</b>\n\nSummani yozing (faqat raqam):\nMasalan: 25000`,
      { parse_mode: "HTML" }
    ).catch(() => {});
  });

  bot.callbackQuery(/^inc:(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const accountSlug = ctx.match![1];
    await setSession(ctx.chat!.id, "income_amount", { accountSlug });
    await ctx.editMessageText(
      `➕ Daromad summasini yozing (faqat raqam):`
    ).catch(() => {});
  });

  // Funds
  bot.callbackQuery("fd:allocate", async (ctx) => {
    await ctx.answerCallbackQuery();
    const results = await allocateFundsForMonth(currentMonth());
    await ctx.editMessageText(
      `✅ ${currentMonth()} uchun ${results.length} ta ajratish yaratildi.`,
      { reply_markup: fundsKeyboard() }
    ).catch(() => {});
  });

  bot.callbackQuery("fd:deposits", async (ctx) => {
    await ctx.answerCallbackQuery();
    const deposits = (await getFundDeposits()).slice(0, 10);
    if (deposits.length === 0) {
      await ctx.editMessageText("Ajratishlar yo'q.", {
        reply_markup: fundsKeyboard(),
      }).catch(() => {});
      return;
    }
    let text = "📋 <b>So'nggi ajratishlar</b>\n\n";
    for (const d of deposits) {
      text += `• ${d.fundSlug}: +${formatMoney(d.amount)} (${d.businessSlug}, ${d.month})\n`;
      text += `  /del_fund_${d.id}\n`;
    }
    text += "\nO'chirish uchun yuqoridagi buyruqni yuboring.";
    await ctx.editMessageText(text, {
      parse_mode: "HTML",
      reply_markup: fundsKeyboard(),
    }).catch(() => {});
  });

  bot.hears(/^\/del_fund_(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const deleted = await deleteFundDeposit(id);
    if (deleted) {
      await ctx.reply(`✅ Ajratish #${id} o'chirildi.`, {
        reply_markup: fundsKeyboard(),
      });
    } else {
      await ctx.reply("❌ Topilmadi.");
    }
  });

  bot.hears(/^\/del_arena_(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const deleted = await deleteArenaTopStat(id);
    if (deleted) {
      await ctx.reply(`✅ Statistika #${id} o'chirildi.`);
    } else {
      await ctx.reply("❌ Topilmadi.");
    }
  });

  // Text messages for multi-step flows
  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return;

    const chatId = ctx.chat.id;
    const { step, data } = await getSession(chatId);
    const text = ctx.message.text.trim().replace(/\s/g, "");
    const amount = Number(text.replace(/[^\d.]/g, ""));

    if (!step) {
      await ctx.reply("Menyudan tugma tanlang:", { reply_markup: mainMenuKeyboard() });
      return;
    }

    if (step === "expense_amount") {
      if (!amount || amount <= 0) {
        await ctx.reply("❌ To'g'ri summa kiriting. Masalan: 15000");
        return;
      }
      await addTransaction({
        accountSlug: "personal",
        type: "expense",
        amount,
        category: data.category as string,
        description: data.label as string,
      });
      await clearSession(chatId);
      await replyMain(
        ctx,
        `✅ Xarajat saqlandi!\n➖ ${data.label}: <b>${formatMoney(amount)}</b>`
      );
      return;
    }

    if (step === "income_amount") {
      if (!amount || amount <= 0) {
        await ctx.reply("❌ To'g'ri summa kiriting.");
        return;
      }
      await addTransaction({
        accountSlug: data.accountSlug as string,
        type: "income",
        amount,
        category: "other",
        description: "Telegram orqali",
      });
      await clearSession(chatId);
      await replyMain(ctx, `✅ Daromad saqlandi: <b>${formatMoney(amount)}</b>`);
      return;
    }

    if (step.startsWith("arena_")) {
      const num = Number(ctx.message.text.trim());
      if (isNaN(num) || num < 0) {
        await ctx.reply("❌ 0 yoki musbat raqam kiriting.");
        return;
      }
      const field = step.replace("arena_", "");
      data[field] = num;
      await advanceArenaStep(ctx, chatId, field, data);
      return;
    }
  });
}

async function advanceArenaStep(
  ctx: Context,
  chatId: number,
  completedField: string,
  data: Record<string, unknown>
) {
  const steps: { field: string; question: string; next: string }[] = [
    {
      field: "stadiums_added",
      question: "2/5 — Jami stadionlar soni:",
      next: "arena_total_stadiums",
    },
    {
      field: "total_stadiums",
      question: "3/5 — Bugun qo'shilgan odamlar:",
      next: "arena_users_added",
    },
    {
      field: "users_added",
      question: "4/5 — Jami foydalanuvchilar:",
      next: "arena_total_users",
    },
    {
      field: "total_users",
      question: "5/5 — Bugungi bronlar soni:",
      next: "arena_bookings",
    },
  ];

  const current = steps.find((s) => s.field === completedField);
  if (current) {
    await setSession(chatId, current.next, data);
    await ctx.reply(current.question, { reply_markup: arenaStatSkipKeyboard() });
    return;
  }

  if (completedField === "bookings") {
    const stat = await addArenaTopStat({
      date: (data.date as string) ?? todayISO(),
      stadiumsAdded: Number(data.stadiums_added ?? 0),
      totalStadiums: Number(data.total_stadiums ?? 0),
      usersAdded: Number(data.users_added ?? 0),
      totalUsers: Number(data.total_users ?? 0),
      bookings: Number(data.bookings ?? 0),
    });
    await clearSession(chatId);
    const commission = Number(data.bookings ?? 0) * ARENATOP_COMMISSION;
    await replyMain(
      ctx,
      `✅ ArenaTop statistika saqlandi!\n\n` +
        `📅 ${stat.date}\n` +
        `🏟 Stadion: ${stat.totalStadiums} (+${stat.stadiumsAdded})\n` +
        `👥 Odamlar: ${stat.totalUsers} (+${stat.usersAdded})\n` +
        `🎫 Bron: ${stat.bookings}\n` +
        `💵 Komissiya: ${formatMoney(commission)}\n\n` +
        `O'chirish: /del_arena_${stat.id}`
    );
  }
}
