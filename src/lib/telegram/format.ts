import { formatMoney, formatDate } from "../utils";
import {
  getDashboardStats,
  getBalanceOverview,
  getNurGardenAnalytics,
  getArenaTopAnalytics,
  getFundsOverview,
  getRecentTransactions,
  getProducts,
  getSales,
  getDebts,
  getArenaTopStats,
} from "../services";
import { getNurGardenCostingOverview } from "../nur-garden-cost";

export async function formatDashboard(): Promise<string> {
  const s = await getDashboardStats();
  const b = s.balance;
  return (
    `📊 <b>MyBiznes — Bosh sahifa</b>\n\n` +
    `💎 Umumiy: <b>${formatMoney(b.total)}</b>\n\n` +
    `🌿 Nur&Garden: ${formatMoney(b.nurGarden.balance)}\n` +
    `🏢 Osco: ${formatMoney(b.osco.balance)}\n` +
    `👤 Shaxsiy: ${formatMoney(b.personal.balance)}\n` +
    `➕ Boshqa: ${formatMoney(b.otherIncome.balance)}\n\n` +
    `📈 Oy:\n` +
    `• Nur&Garden savdo: ${formatMoney(s.nurGarden.monthRevenue)}\n` +
    `• ArenaTop: ${formatMoney(s.arenaTop.monthCommission)} (${s.arenaTop.monthBookings} bron)\n` +
    `• Qarz: ${formatMoney(s.nurGarden.totalDebt)}\n` +
    `• Xarajat: ${formatMoney(s.monthExpenses)}`
  );
}

export async function formatBalance(): Promise<string> {
  const b = await getBalanceOverview();
  let text = `💰 <b>Balanslar</b>\n\n`;
  text += `💎 Umumiy: <b>${formatMoney(b.total)}</b>\n\n`;
  text += `🌿 Nur&Garden: ${formatMoney(b.nurGarden.balance)}\n`;
  text += `🏢 Osco: ${formatMoney(b.osco.balance)}\n`;
  for (const c of b.osco.children) {
    const status = c.isActive ? "" : " (pauza)";
    text += `   └ ${c.name}: ${formatMoney(c.balance)}${status}\n`;
  }
  text += `👤 Shaxsiy: ${formatMoney(b.personal.balance)}\n`;
  text += `➕ Boshqa daromad: ${formatMoney(b.otherIncome.balance)}`;
  return text;
}

export async function formatNurGardenAnalytics(): Promise<string> {
  const a = await getNurGardenAnalytics();
  return (
    `🌿 <b>Nur&Garden analitika</b>\n\n` +
    `💵 Jami daromad: ${formatMoney(a.totalRevenue)}\n` +
    `📅 Bu oy: ${formatMoney(a.monthRevenue)} (${a.monthSalesCount} savdo)\n` +
    `⚠️ Qarz: ${formatMoney(a.totalDebt)}\n` +
    `📦 Kam qolgan: ${a.lowStock.length} ta mahsulot`
  );
}

export async function formatProducts(): Promise<string> {
  const products = await getProducts();
  if (products.length === 0) return "Mahsulot yo'q";
  let text = `📦 <b>Mahsulotlar</b>\n\n`;
  for (const p of products.slice(0, 15)) {
    const stockWarn = p.stock < 20 ? " ⚠️" : "";
    text += `• ${p.name}\n  ${formatMoney(p.price)} | Qoldiq: ${p.stock} ${p.unit}${stockWarn}\n`;
  }
  if (products.length > 15) text += `\n... va yana ${products.length - 15} ta`;
  return text;
}

export async function formatSales(): Promise<string> {
  const sales = await getSales(10);
  if (sales.length === 0) return "Savdo yo'q";
  let text = `🛒 <b>So'nggi savdolar</b>\n\n`;
  for (const { sale, customer } of sales) {
    text += `#${sale.id} ${customer?.name ?? "—"} — ${formatMoney(sale.total)}\n`;
    text += `  ${formatDate(sale.date)}\n`;
  }
  return text;
}

export async function formatDebts(): Promise<string> {
  const debts = (await getDebts()).filter((d) => d.debt.status !== "paid");
  if (debts.length === 0) return "✅ Qarz yo'q!";
  let text = `⚠️ <b>Qarzlar</b>\n\n`;
  for (const { debt, customer } of debts.slice(0, 10)) {
    const left = debt.amount - debt.paidAmount;
    text += `• ${customer?.name ?? "—"}: <b>${formatMoney(left)}</b>\n`;
  }
  return text;
}

export async function formatCostingSummary(): Promise<string> {
  const c = await getNurGardenCostingOverview();
  const pkg = c.packaging;
  let text =
    `💵 <b>Tan narx</b>\n\n` +
    `📦 Paket: ${pkg?.stock ?? 0} ta × ${formatMoney(pkg?.unitCost ?? 700)}\n` +
    `🚚 Logistika yozuvlari: ${c.logistics?.length ?? 0}\n\n`;
  for (const p of c.products.slice(0, 5)) {
    const t = p.cost?.breakdown?.total ?? 0;
    text += `• ${p.name}: tannarx ${formatMoney(t)}\n`;
  }
  return text;
}

export async function formatOsco(): Promise<string> {
  const a = await getArenaTopAnalytics();
  let text = `🏢 <b>ArenaTop</b>\n\n`;
  text += `📊 Jami bron: ${a.totalBookings}\n`;
  text += `💵 Jami komissiya: ${formatMoney(a.totalCommission)}\n`;
  text += `📅 Bu oy: ${a.monthBookings} bron — ${formatMoney(a.monthCommission)}\n`;
  if (a.latest) {
    text += `\n<b>So'nggi kun</b> (${formatDate(a.latest.date)}):\n`;
    text += `• Stadion: ${a.latest.totalStadiums} (+${a.latest.stadiumsAdded})\n`;
    text += `• Odamlar: ${a.latest.totalUsers} (+${a.latest.usersAdded})\n`;
    text += `• Bron: ${a.latest.bookings}\n`;
  }
  return text;
}

export async function formatArenaHistory(): Promise<string> {
  const stats = await getArenaTopStats(10);
  if (stats.length === 0) return "Statistika yo'q";
  let text = `📋 <b>ArenaTop tarix</b>\n\n`;
  for (const s of stats) {
    text += `${formatDate(s.date)}: ${s.bookings} bron — ${formatMoney(s.bookings * s.commissionPerBooking)}\n`;
  }
  return text;
}

export async function formatFunds(): Promise<string> {
  const funds = await getFundsOverview();
  let text = `🐷 <b>Jamg'armalar</b>\n\n`;
  let total = 0;
  for (const f of funds) {
    total += f.balance;
    text += `• ${f.name}: <b>${formatMoney(f.balance)}</b>\n`;
  }
  text += `\n💎 Jami: ${formatMoney(total)}`;
  return text;
}

export async function formatTransactions(): Promise<string> {
  const txs = await getRecentTransactions(10);
  if (txs.length === 0) return "Tranzaksiya yo'q";
  let text = `📜 <b>So'nggi tranzaksiyalar</b>\n\n`;
  for (const tx of txs) {
    const sign = tx.type === "income" ? "➕" : "➖";
    text += `${sign} ${formatMoney(tx.amount)}\n`;
    text += `  ${tx.description ?? tx.category ?? "—"} · ${formatDate(tx.date)}\n`;
  }
  return text;
}
