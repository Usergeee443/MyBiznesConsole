import { db } from "./db/index";
import {
  accounts,
  transactions,
  products,
  productPrices,
  productCostConfig,
  customers,
  sales,
  saleItems,
  debts,
  arenaTopStats,
  funds,
  fundAllocations,
  fundDeposits,
} from "./db/schema";
import { eq, desc, sql, and, gte, lte, sum } from "drizzle-orm";
import {
  ARENATOP_COMMISSION,
  currentMonth,
  OPENING_BALANCE_CATEGORY,
  OPENING_FUND_SOURCE,
} from "./utils";

export function getAccountBalance(slug: string): number {
  const income = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountSlug, slug),
        eq(transactions.type, "income")
      )
    )
    .get();

  const expense = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountSlug, slug),
        eq(transactions.type, "expense")
      )
    )
    .get();

  const transferOut = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountSlug, slug),
        eq(transactions.type, "transfer")
      )
    )
    .get();

  const transferIn = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(eq(transactions.toAccountSlug, slug))
    .get();

  return (
    Number(income?.total ?? 0) -
    Number(expense?.total ?? 0) -
    Number(transferOut?.total ?? 0) +
    Number(transferIn?.total ?? 0)
  );
}

export function getFundBalance(slug: string): number {
  const deposits = db
    .select({ total: sum(fundDeposits.amount) })
    .from(fundDeposits)
    .where(eq(fundDeposits.fundSlug, slug))
    .get();

  const withdrawals = db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountSlug, slug),
        eq(transactions.type, "expense")
      )
    )
    .get();

  return Number(deposits?.total ?? 0) - Number(withdrawals?.total ?? 0);
}

export function getAllAccounts() {
  return db.select().from(accounts).all();
}

export function getBalanceOverview() {
  const allAccounts = getAllAccounts();
  const businessAccounts = allAccounts.filter((a) => a.type === "business");
  const personal = allAccounts.find((a) => a.slug === "personal");
  const nurGarden = allAccounts.find((a) => a.slug === "nur-garden");
  const oscoGroup = allAccounts.find((a) => a.slug === "osco");
  const wedy = allAccounts.find((a) => a.slug === "wedy");
  const arenatop = allAccounts.find((a) => a.slug === "arenatop");
  const otherIncome = allAccounts.find((a) => a.slug === "other-income");

  const nurGardenBalance = nurGarden ? getAccountBalance("nur-garden") : 0;
  const wedyBalance = wedy ? getAccountBalance("wedy") : 0;
  const arenatopBalance = arenatop ? getAccountBalance("arenatop") : 0;
  const personalBalance = personal ? getAccountBalance("personal") : 0;
  const otherBalance = otherIncome ? getAccountBalance("other-income") : 0;
  const oscoBalance = wedyBalance + arenatopBalance;

  const totalBalance =
    nurGardenBalance + oscoBalance + personalBalance + otherBalance;

  return {
    total: totalBalance,
    nurGarden: { ...nurGarden!, balance: nurGardenBalance },
    osco: { ...oscoGroup!, balance: oscoBalance, children: [
      { ...wedy!, balance: wedyBalance },
      { ...arenatop!, balance: arenatopBalance },
    ]},
    personal: { ...personal!, balance: personalBalance },
    otherIncome: { ...otherIncome!, balance: otherBalance },
  };
}

export function addTransaction(data: {
  accountSlug: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  category?: string;
  description?: string;
  date?: string;
  toAccountSlug?: string;
}) {
  const now = new Date().toISOString();
  return db
    .insert(transactions)
    .values({
      accountSlug: data.accountSlug,
      type: data.type,
      amount: data.amount,
      category: data.category ?? null,
      description: data.description ?? null,
      date: data.date ?? new Date().toISOString().split("T")[0],
      toAccountSlug: data.toAccountSlug ?? null,
      createdAt: now,
    })
    .returning()
    .get();
}

export function getRecentTransactions(limit = 20) {
  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .all();
}

export function getTransaction(id: number) {
  return db.select().from(transactions).where(eq(transactions.id, id)).get();
}

export function updateTransaction(
  id: number,
  data: Partial<{
    accountSlug: string;
    type: string;
    amount: number;
    category: string;
    description: string;
    date: string;
  }>
) {
  return db
    .update(transactions)
    .set(data)
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

export function deleteTransaction(id: number) {
  return db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .returning()
    .get();
}

export function getProducts() {
  return db.select().from(products).where(eq(products.isActive, true)).all();
}

export function addProduct(data: {
  name: string;
  unit: string;
  price: number;
  costPrice?: number;
  stock?: number;
}) {
  const now = new Date().toISOString();
  const product = db
    .insert(products)
    .values({
      name: data.name,
      unit: data.unit,
      price: data.price,
      costPrice: data.costPrice ?? 0,
      stock: data.stock ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  db.insert(productCostConfig)
    .values({ productId: product.id, workerPay: 300, itemsPerBox: 16, boxType: "normal" })
    .run();

  const tiers: [string, number][] = [
    ["shop", data.price],
    ["wholesale", Math.round(data.price * 0.98)],
    ["online", Math.round(data.price * 1.067)],
  ];
  for (const [tier, price] of tiers) {
    db.insert(productPrices).values({ productId: product.id, tier, price }).run();
  }

  return product;
}

export function updateProduct(
  id: number,
  data: Partial<{ name: string; unit: string; price: number; costPrice: number; stock: number }>
) {
  return db
    .update(products)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id))
    .returning()
    .get();
}

export function deleteProduct(id: number) {
  return db
    .update(products)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id))
    .returning()
    .get();
}

export function getCustomers() {
  return db.select().from(customers).orderBy(desc(customers.createdAt)).all();
}

export function addCustomer(data: {
  name: string;
  phone?: string;
  type: string;
  address?: string;
  notes?: string;
}) {
  return db
    .insert(customers)
    .values({ ...data, createdAt: new Date().toISOString() })
    .returning()
    .get();
}

export function getSales(limit = 50) {
  return db
    .select({
      sale: sales,
      customer: customers,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .orderBy(desc(sales.date))
    .limit(limit)
    .all();
}

export function createSale(data: {
  customerId?: number;
  items: { productId: number; quantity: number; price: number }[];
  paymentType: string;
  paid: number;
  notes?: string;
  date?: string;
  skipStock?: boolean;
  skipIncome?: boolean;
}) {
  const date = data.date ?? new Date().toISOString().split("T")[0];
  const total = data.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const now = new Date().toISOString();

  const sale = db
    .insert(sales)
    .values({
      customerId: data.customerId ?? null,
      date,
      total,
      paid: data.paid,
      paymentType: data.paymentType,
      notes: data.notes ?? null,
      createdAt: now,
    })
    .returning()
    .get();

  for (const item of data.items) {
    db.insert(saleItems)
      .values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })
      .run();

    if (!data.skipStock) {
      const product = db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .get();
      if (product) {
        db.update(products)
          .set({ stock: product.stock - item.quantity, updatedAt: now })
          .where(eq(products.id, item.productId))
          .run();
      }
    }
  }

  if (data.paid > 0 && !data.skipIncome) {
    addTransaction({
      accountSlug: "nur-garden",
      type: "income",
      amount: data.paid,
      category: "sale",
      description: `Savdo #${sale.id}`,
      date,
    });
  }

  if (total > data.paid && data.customerId) {
    const debtAmount = total - data.paid;
    db.insert(debts)
      .values({
        customerId: data.customerId,
        saleId: sale.id,
        amount: debtAmount,
        paidAmount: 0,
        status: debtAmount === total ? "pending" : "partial",
        createdAt: now,
      })
      .run();
  }

  return sale;
}

export function deleteSale(id: number) {
  db.delete(saleItems).where(eq(saleItems.saleId, id)).run();
  db.delete(debts).where(eq(debts.saleId, id)).run();
  return db.delete(sales).where(eq(sales.id, id)).returning().get();
}

export function getDebts() {
  return db
    .select({ debt: debts, customer: customers, sale: sales })
    .from(debts)
    .leftJoin(customers, eq(debts.customerId, customers.id))
    .leftJoin(sales, eq(debts.saleId, sales.id))
    .orderBy(desc(debts.createdAt))
    .all();
}

export function payDebt(id: number, amount: number) {
  const debt = db.select().from(debts).where(eq(debts.id, id)).get();
  if (!debt) return null;

  const newPaid = debt.paidAmount + amount;
  const remaining = debt.amount - newPaid;
  const status = remaining <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";

  const updated = db
    .update(debts)
    .set({ paidAmount: newPaid, status })
    .where(eq(debts.id, id))
    .returning()
    .get();

  addTransaction({
    accountSlug: "nur-garden",
    type: "income",
    amount,
    category: "debt_payment",
    description: `Qarz to'lovi #${id}`,
  });

  return updated;
}

export function getNurGardenAnalytics() {
  const allSales = db.select().from(sales).all();
  const allProducts = getProducts();
  const allDebts = db.select().from(debts).all();

  const totalRevenue = allSales.reduce((s, sale) => s + sale.total, 0);
  const totalPaid = allSales.reduce((s, sale) => s + sale.paid, 0);
  const totalDebt = allDebts.reduce(
    (s, d) => s + (d.amount - d.paidAmount),
    0
  );
  const totalSales = allSales.length;

  const monthStart = currentMonth() + "-01";
  const monthSales = allSales.filter((s) => s.date >= monthStart);
  const monthRevenue = monthSales.reduce((s, sale) => s + sale.total, 0);

  const topProducts = db
    .select({
      productId: saleItems.productId,
      totalQty: sql<number>`sum(${saleItems.quantity})`,
      totalAmount: sql<number>`sum(${saleItems.total})`,
    })
    .from(saleItems)
    .groupBy(saleItems.productId)
    .all()
    .map((row) => {
      const product = allProducts.find((p) => p.id === row.productId);
      return {
        name: product?.name ?? "Noma'lum",
        quantity: row.totalQty ?? 0,
        revenue: row.totalAmount ?? 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const salesByDay = db
    .select({
      date: sales.date,
      total: sql<number>`sum(${sales.total})`,
      count: sql<number>`count(*)`,
    })
    .from(sales)
    .groupBy(sales.date)
    .orderBy(desc(sales.date))
    .limit(30)
    .all();

  return {
    totalRevenue,
    totalPaid,
    totalDebt,
    totalSales,
    monthRevenue,
    monthSalesCount: monthSales.length,
    topProducts,
    salesByDay,
    lowStock: allProducts.filter((p) => p.stock < 20),
  };
}

export function getArenaTopStats(limit = 30) {
  return db
    .select()
    .from(arenaTopStats)
    .orderBy(desc(arenaTopStats.date))
    .limit(limit)
    .all();
}

export function addArenaTopStat(data: {
  date: string;
  stadiumsAdded: number;
  totalStadiums: number;
  usersAdded: number;
  totalUsers: number;
  bookings: number;
  notes?: string;
  skipIncome?: boolean;
}) {
  const now = new Date().toISOString();
  const commission = data.skipIncome ? 0 : data.bookings * ARENATOP_COMMISSION;

  const existing = db
    .select()
    .from(arenaTopStats)
    .where(eq(arenaTopStats.date, data.date))
    .get();

  let stat;
  if (existing) {
    stat = db
      .update(arenaTopStats)
      .set({
        stadiumsAdded: data.stadiumsAdded,
        totalStadiums: data.totalStadiums,
        usersAdded: data.usersAdded,
        totalUsers: data.totalUsers,
        bookings: data.bookings,
        notes: data.notes ?? null,
      })
      .where(eq(arenaTopStats.date, data.date))
      .returning()
      .get();

    if (existing.transactionId) {
      if (commission > 0) {
        updateTransaction(existing.transactionId, {
          amount: commission,
          description: `${data.bookings} ta bron (${data.date})`,
          date: data.date,
        });
      } else {
        deleteTransaction(existing.transactionId);
        db.update(arenaTopStats)
          .set({ transactionId: null })
          .where(eq(arenaTopStats.id, stat.id))
          .run();
      }
    } else if (commission > 0) {
      const tx = addTransaction({
        accountSlug: "arenatop",
        type: "income",
        amount: commission,
        category: "commission",
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
      db.update(arenaTopStats)
        .set({ transactionId: tx.id })
        .where(eq(arenaTopStats.id, stat.id))
        .run();
    }
  } else {
    stat = db
      .insert(arenaTopStats)
      .values({
        date: data.date,
        stadiumsAdded: data.stadiumsAdded,
        totalStadiums: data.totalStadiums,
        usersAdded: data.usersAdded,
        totalUsers: data.totalUsers,
        bookings: data.bookings,
        commissionPerBooking: ARENATOP_COMMISSION,
        notes: data.notes ?? null,
        createdAt: now,
      })
      .returning()
      .get();

    if (commission > 0) {
      const tx = addTransaction({
        accountSlug: "arenatop",
        type: "income",
        amount: commission,
        category: "commission",
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
      stat = db
        .update(arenaTopStats)
        .set({ transactionId: tx.id })
        .where(eq(arenaTopStats.id, stat.id))
        .returning()
        .get();
    }
  }

  return stat;
}

export function updateArenaTopStat(
  id: number,
  data: {
    date: string;
    stadiumsAdded: number;
    totalStadiums: number;
    usersAdded: number;
    totalUsers: number;
    bookings: number;
    notes?: string;
  }
) {
  const existing = db
    .select()
    .from(arenaTopStats)
    .where(eq(arenaTopStats.id, id))
    .get();
  if (!existing) return null;

  if (existing.date !== data.date) {
    const conflict = db
      .select()
      .from(arenaTopStats)
      .where(eq(arenaTopStats.date, data.date))
      .get();
    if (conflict && conflict.id !== id) return null;
  }

  const commission = data.bookings * ARENATOP_COMMISSION;
  const stat = db
    .update(arenaTopStats)
    .set({
      date: data.date,
      stadiumsAdded: data.stadiumsAdded,
      totalStadiums: data.totalStadiums,
      usersAdded: data.usersAdded,
      totalUsers: data.totalUsers,
      bookings: data.bookings,
      notes: data.notes ?? null,
    })
    .where(eq(arenaTopStats.id, id))
    .returning()
    .get();

  if (existing.transactionId) {
    if (commission > 0) {
      updateTransaction(existing.transactionId, {
        amount: commission,
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
    } else {
      deleteTransaction(existing.transactionId);
      db.update(arenaTopStats)
        .set({ transactionId: null })
        .where(eq(arenaTopStats.id, id))
        .run();
    }
  } else if (commission > 0) {
    const tx = addTransaction({
      accountSlug: "arenatop",
      type: "income",
      amount: commission,
      category: "commission",
      description: `${data.bookings} ta bron (${data.date})`,
      date: data.date,
    });
    db.update(arenaTopStats)
      .set({ transactionId: tx.id })
      .where(eq(arenaTopStats.id, id))
      .run();
  }

  return stat;
}

export function deleteArenaTopStat(id: number) {
  const stat = db
    .select()
    .from(arenaTopStats)
    .where(eq(arenaTopStats.id, id))
    .get();
  if (!stat) return null;

  if (stat.transactionId) {
    deleteTransaction(stat.transactionId);
  }

  return db
    .delete(arenaTopStats)
    .where(eq(arenaTopStats.id, id))
    .returning()
    .get();
}

export function getArenaTopAnalytics() {
  const stats = getArenaTopStats(90);
  const totalBookings = stats.reduce((s, st) => s + st.bookings, 0);
  const totalCommission = stats.reduce(
    (s, st) => s + st.bookings * st.commissionPerBooking,
    0
  );
  const latest = stats[0];
  const monthStart = currentMonth() + "-01";
  const monthStats = stats.filter((s) => s.date >= monthStart);
  const monthBookings = monthStats.reduce((s, st) => s + st.bookings, 0);
  const monthCommission = monthStats.reduce(
    (s, st) => s + st.bookings * st.commissionPerBooking,
    0
  );

  return {
    totalBookings,
    totalCommission,
    latest,
    monthBookings,
    monthCommission,
    chartData: stats
      .slice()
      .reverse()
      .map((s) => ({
        date: s.date.slice(5),
        bookings: s.bookings,
        commission: s.bookings * s.commissionPerBooking,
        stadiums: s.totalStadiums,
        users: s.totalUsers,
      })),
  };
}

export function getFunds() {
  return db.select().from(funds).all();
}

export function getFundAllocations() {
  return db.select().from(fundAllocations).all();
}

export function getFundDeposits() {
  return db
    .select()
    .from(fundDeposits)
    .orderBy(desc(fundDeposits.createdAt))
    .all();
}

export function deleteFundDeposit(id: number) {
  return db
    .delete(fundDeposits)
    .where(eq(fundDeposits.id, id))
    .returning()
    .get();
}

export function allocateFundsForMonth(month?: string) {
  const targetMonth = month ?? currentMonth();
  const businesses = ["nur-garden", "arenatop", "other-income", "personal"];
  const allocations = getFundAllocations();
  const results = [];

  for (const biz of businesses) {
    const income = db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountSlug, biz),
          eq(transactions.type, "income"),
          gte(transactions.date, `${targetMonth}-01`),
          lte(transactions.date, `${targetMonth}-31`)
        )
      )
      .get();

    const bizIncome = Number(income?.total ?? 0);
    if (bizIncome <= 0) continue;

    const bizAllocations = allocations.filter((a) => a.businessSlug === biz);

    for (const alloc of bizAllocations) {
      const amount = (bizIncome * alloc.percentage) / 100;
      if (amount <= 0) continue;

      const existing = db
        .select()
        .from(fundDeposits)
        .where(
          and(
            eq(fundDeposits.fundSlug, alloc.fundSlug),
            eq(fundDeposits.businessSlug, biz),
            eq(fundDeposits.month, targetMonth)
          )
        )
        .get();

      if (existing) continue;

      const deposit = db
        .insert(fundDeposits)
        .values({
          fundSlug: alloc.fundSlug,
          amount,
          businessSlug: biz,
          month: targetMonth,
          date: new Date().toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
        })
        .returning()
        .get();

      results.push(deposit);
    }
  }

  return results;
}

export function getFundsOverview() {
  const allFunds = getFunds();
  return allFunds.map((fund) => ({
    ...fund,
    balance: getFundBalance(fund.slug),
    allocations: getFundAllocations().filter((a) => a.fundSlug === fund.slug),
  }));
}

export function getMonthlyExpenses(month?: string) {
  const targetMonth = month ?? currentMonth();
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(transactions.date, `${targetMonth}-01`),
        lte(transactions.date, `${targetMonth}-31`)
      )
    )
    .orderBy(desc(transactions.date))
    .all();
}

export function getDashboardStats() {
  const balance = getBalanceOverview();
  const nurGarden = getNurGardenAnalytics();
  const arenaTop = getArenaTopAnalytics();
  const fundsOverview = getFundsOverview();
  const recentTx = getRecentTransactions(10);
  const monthExpenses = getMonthlyExpenses();
  const totalExpenses = monthExpenses.reduce((s, t) => s + t.amount, 0);

  return {
    balance,
    nurGarden,
    arenaTop,
    funds: fundsOverview,
    recentTransactions: recentTx,
    monthExpenses: totalExpenses,
  };
}

function getOpeningBalanceTx(slug: string) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountSlug, slug),
        eq(transactions.category, OPENING_BALANCE_CATEGORY)
      )
    )
    .get();
}

function getOpeningFundDeposit(slug: string) {
  return db
    .select()
    .from(fundDeposits)
    .where(
      and(
        eq(fundDeposits.fundSlug, slug),
        eq(fundDeposits.businessSlug, OPENING_FUND_SOURCE)
      )
    )
    .get();
}

export function getSettingsOverview() {
  const accs = getAllAccounts().filter(
    (a) => a.type !== "group" && a.isActive
  );
  const fundsList = getFunds();

  return {
    accounts: accs.map((a) => {
      const opening = getOpeningBalanceTx(a.slug);
      return {
        slug: a.slug,
        name: a.name,
        type: a.type,
        color: a.color,
        balance: getAccountBalance(a.slug),
        openingAmount: opening?.amount ?? 0,
        openingDate: opening?.date ?? null,
      };
    }),
    funds: fundsList.map((f) => {
      const opening = getOpeningFundDeposit(f.slug);
      return {
        slug: f.slug,
        name: f.name,
        color: f.color,
        balance: getFundBalance(f.slug),
        openingAmount: opening?.amount ?? 0,
        openingDate: opening?.date ?? null,
      };
    }),
  };
}

export function setAccountOpeningBalance(
  slug: string,
  amount: number,
  date?: string
) {
  const d = date ?? new Date().toISOString().split("T")[0];
  const existing = getOpeningBalanceTx(slug);

  if (amount <= 0) {
    if (existing) deleteTransaction(existing.id);
    return null;
  }

  if (existing) {
    return updateTransaction(existing.id, {
      amount,
      date: d,
      type: "income",
      category: OPENING_BALANCE_CATEGORY,
      description: "Saytdan oldingi balans",
    });
  }

  return addTransaction({
    accountSlug: slug,
    type: "income",
    amount,
    category: OPENING_BALANCE_CATEGORY,
    description: "Saytdan oldingi balans",
    date: d,
  });
}

export function setFundOpeningBalance(
  slug: string,
  amount: number,
  date?: string
) {
  const d = date ?? new Date().toISOString().split("T")[0];
  const month = d.slice(0, 7);
  const existing = getOpeningFundDeposit(slug);
  const now = new Date().toISOString();

  if (amount <= 0) {
    if (existing) {
      db.delete(fundDeposits).where(eq(fundDeposits.id, existing.id)).run();
    }
    return null;
  }

  if (existing) {
    db.update(fundDeposits)
      .set({ amount, date: d, month })
      .where(eq(fundDeposits.id, existing.id))
      .run();
    return db
      .select()
      .from(fundDeposits)
      .where(eq(fundDeposits.id, existing.id))
      .get();
  }

  return db
    .insert(fundDeposits)
    .values({
      fundSlug: slug,
      amount,
      businessSlug: OPENING_FUND_SOURCE,
      month,
      date: d,
      createdAt: now,
    })
    .returning()
    .get();
}
