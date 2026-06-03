import { getMysqlDb, one } from "./db/mysql-db";
import {
  accounts, transactions, products, productPrices, productCostConfig,
  customers, sales, saleItems, debts, arenaTopStats, funds, fundAllocations, fundDeposits,
} from "./db/mysql-schema";
import { eq, desc, sql, and, gte, lte, sum } from "drizzle-orm";
import { ARENATOP_COMMISSION, currentMonth } from "./utils";

export async function getAccountBalance(slug: string) {
  const db = await getMysqlDb();
  const income = await one(
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountSlug, slug),
          eq(transactions.type, "income")
        )
      )
  );
  const expense = await one(
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountSlug, slug),
          eq(transactions.type, "expense")
        )
      )
  );
  const transferOut = await one(
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountSlug, slug),
          eq(transactions.type, "transfer")
        )
      )
  );
  const transferIn = await one(
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.toAccountSlug, slug))
  );

  return (
    Number(income?.total ?? 0) -
    Number(expense?.total ?? 0) -
    Number(transferOut?.total ?? 0) +
    Number(transferIn?.total ?? 0)
  );
}

export async function getFundBalance(slug: string) {
  const db = await getMysqlDb();
  const deposits = await one(
    db
      .select({ total: sum(fundDeposits.amount) })
      .from(fundDeposits)
      .where(eq(fundDeposits.fundSlug, slug))
  );
  const withdrawals = await one(
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountSlug, slug),
          eq(transactions.type, "expense")
        )
      )
  );

  return Number(deposits?.total ?? 0) - Number(withdrawals?.total ?? 0);
}

export async function getAllAccounts() {
  const db = await getMysqlDb();
  return await db.select().from(accounts);
}

export async function getBalanceOverview() {
  const db = await getMysqlDb();
  const allAccounts = await getAllAccounts();
  const businessAccounts = allAccounts.filter((a) => a.type === "business");
  const personal = allAccounts.find((a) => a.slug === "personal");
  const nurGarden = allAccounts.find((a) => a.slug === "nur-garden");
  const oscoGroup = allAccounts.find((a) => a.slug === "osco");
  const wedy = allAccounts.find((a) => a.slug === "wedy");
  const arenatop = allAccounts.find((a) => a.slug === "arenatop");
  const otherIncome = allAccounts.find((a) => a.slug === "other-income");

  const nurGardenBalance = nurGarden ? await getAccountBalance("nur-garden") : 0;
  const wedyBalance = wedy ? await getAccountBalance("wedy") : 0;
  const arenatopBalance = arenatop ? await getAccountBalance("arenatop") : 0;
  const personalBalance = personal ? await getAccountBalance("personal") : 0;
  const otherBalance = otherIncome ? await getAccountBalance("other-income") : 0;
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

export async function addTransaction(data: {
  accountSlug: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  category?: string;
  description?: string;
  date?: string;
  toAccountSlug?: string;
}) {
  const db = await getMysqlDb();
  const now = new Date().toISOString();
  await db.insert(transactions).values({
    accountSlug: data.accountSlug,
    type: data.type,
    amount: data.amount,
    category: data.category ?? null,
    description: data.description ?? null,
    date: data.date ?? new Date().toISOString().split("T")[0],
    toAccountSlug: data.toAccountSlug ?? null,
    createdAt: now,
  });
  return await one(
    db.select().from(transactions).orderBy(desc(transactions.id)).limit(1)
  );
}

export async function getRecentTransactions(limit = 20) {
  const db = await getMysqlDb();
  return await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getTransaction(id: number) {
  const db = await getMysqlDb();
  return await one(
    db.select().from(transactions).where(eq(transactions.id, id))
  );
}

export async function updateTransaction(
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
  const db = await getMysqlDb();
  await db.update(transactions).set(data).where(eq(transactions.id, id));
  return await one(
    db.select().from(transactions).where(eq(transactions.id, id))
  );
}

export async function deleteTransaction(id: number) {
  const db = await getMysqlDb();
  const row = await one(
    db.select().from(transactions).where(eq(transactions.id, id))
  );
  await db.delete(transactions).where(eq(transactions.id, id));
  return row;
}

export async function getProducts() {
  const db = await getMysqlDb();
  return await db.select().from(products).where(eq(products.isActive, true));
}

export async function addProduct(data: {
  name: string;
  unit: string;
  price: number;
  costPrice?: number;
  stock?: number;
}) {
  const db = await getMysqlDb();
  const now = new Date().toISOString();
  await db.insert(products).values({
    name: data.name,
    unit: data.unit,
    price: data.price,
    costPrice: data.costPrice ?? 0,
    stock: data.stock ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  const product = await one(
    db.select().from(products).orderBy(desc(products.id)).limit(1)
  );
  if (!product) throw new Error("Product insert failed");

  await db.insert(productCostConfig)
    .values({ productId: product.id, workerPay: 300, itemsPerBox: 16, boxType: "normal" })
    ;

  const tiers: [string, number][] = [
    ["shop", data.price],
    ["wholesale", Math.round(data.price * 0.98)],
    ["online", Math.round(data.price * 1.067)],
  ];
  for (const [tier, price] of tiers) {
    await db.insert(productPrices).values({ productId: product.id, tier, price });
  }

  return product;
}

export async function updateProduct(
  id: number,
  data: Partial<{ name: string; unit: string; price: number; costPrice: number; stock: number }>
) {
  const db = await getMysqlDb();
  await db
    .update(products)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id));
  return await one(db.select().from(products).where(eq(products.id, id)));
}

export async function deleteProduct(id: number) {
  const db = await getMysqlDb();
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(products.id, id));
  return await one(db.select().from(products).where(eq(products.id, id)));
}

export async function getCustomers() {
  const db = await getMysqlDb();
  return await db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function addCustomer(data: {
  name: string;
  phone?: string;
  type: string;
  address?: string;
  notes?: string;
}) {
  const db = await getMysqlDb();
  await db
    .insert(customers)
    .values({ ...data, createdAt: new Date().toISOString() });
  return await one(
    db.select().from(customers).orderBy(desc(customers.id)).limit(1)
  );
}

export async function getSales(limit = 50) {
  const db = await getMysqlDb();
  return await db
    .select({
      sale: sales,
      customer: customers,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .orderBy(desc(sales.date))
    .limit(limit);
}

export async function createSale(data: {
  customerId?: number;
  items: { productId: number; quantity: number; price: number }[];
  paymentType: string;
  paid: number;
  notes?: string;
  date?: string;
}) {
  const db = await getMysqlDb();
  const date = data.date ?? new Date().toISOString().split("T")[0];
  const total = data.items.reduce((s, i) => s + i.quantity * i.price, 0);
  const now = new Date().toISOString();

  await db.insert(sales).values({
    customerId: data.customerId ?? null,
    date,
    total,
    paid: data.paid,
    paymentType: data.paymentType,
    notes: data.notes ?? null,
    createdAt: now,
  });
  const sale = await one(
    db.select().from(sales).orderBy(desc(sales.id)).limit(1)
  );
  if (!sale) throw new Error("Sale insert failed");

  for (const item of data.items) {
    await db.insert(saleItems)
      .values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      });

    const product = await one(
      db.select().from(products).where(eq(products.id, item.productId))
    );
    if (product) {
      await db.update(products)
        .set({ stock: product.stock - item.quantity, updatedAt: now })
        .where(eq(products.id, item.productId))
        ;
    }
  }

  if (data.paid > 0) {
    await addTransaction({
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
    await db.insert(debts)
      .values({
        customerId: data.customerId,
        saleId: sale.id,
        amount: debtAmount,
        paidAmount: 0,
        status: debtAmount === total ? "pending" : "partial",
        createdAt: now,
      })
      ;
  }

  return sale;
}

export async function deleteSale(id: number) {
  const db = await getMysqlDb();
  await db.delete(saleItems).where(eq(saleItems.saleId, id));
  await db.delete(debts).where(eq(debts.saleId, id));
  const row = await one(db.select().from(sales).where(eq(sales.id, id)));
  await db.delete(sales).where(eq(sales.id, id));
  return row;
}

export async function getDebts() {
  const db = await getMysqlDb();
  return await db
    .select({ debt: debts, customer: customers, sale: sales })
    .from(debts)
    .leftJoin(customers, eq(debts.customerId, customers.id))
    .leftJoin(sales, eq(debts.saleId, sales.id))
    .orderBy(desc(debts.createdAt));
}

export async function payDebt(id: number, amount: number) {
  const db = await getMysqlDb();
  const debt = await one(db.select().from(debts).where(eq(debts.id, id)));
  if (!debt) return null;

  const newPaid = debt.paidAmount + amount;
  const remaining = debt.amount - newPaid;
  const status = remaining <= 0 ? "paid" : newPaid > 0 ? "partial" : "pending";

  await db
    .update(debts)
    .set({ paidAmount: newPaid, status })
    .where(eq(debts.id, id));

  const updated = await one(db.select().from(debts).where(eq(debts.id, id)));

  await addTransaction({
    accountSlug: "nur-garden",
    type: "income",
    amount,
    category: "debt_payment",
    description: `Qarz to'lovi #${id}`,
  });

  return updated;
}

export async function getNurGardenAnalytics() {
  const db = await getMysqlDb();
  const allSales = await db.select().from(sales);
  const allProducts = await getProducts();
  const allDebts = await db.select().from(debts);

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

  const topProductsRows = await db
    .select({
      productId: saleItems.productId,
      totalQty: sql<number>`sum(${saleItems.quantity})`,
      totalAmount: sql<number>`sum(${saleItems.total})`,
    })
    .from(saleItems)
    .groupBy(saleItems.productId);
  const topProducts = topProductsRows.map((row) => {
      const product = allProducts.find((p) => p.id === row.productId);
      return {
        name: product?.name ?? "Noma'lum",
        quantity: row.totalQty ?? 0,
        revenue: row.totalAmount ?? 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const salesByDay = await db
    .select({
      date: sales.date,
      total: sql<number>`sum(${sales.total})`,
      count: sql<number>`count(*)`,
    })
    .from(sales)
    .groupBy(sales.date)
    .orderBy(desc(sales.date))
    .limit(30);

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

export async function getArenaTopStats(limit = 30) {
  const db = await getMysqlDb();
  return await db
    .select()
    .from(arenaTopStats)
    .orderBy(desc(arenaTopStats.date))
    .limit(limit);
}

export async function addArenaTopStat(data: {
  date: string;
  stadiumsAdded: number;
  totalStadiums: number;
  usersAdded: number;
  totalUsers: number;
  bookings: number;
  notes?: string;
}) {
  const db = await getMysqlDb();
  const now = new Date().toISOString();
  const commission = data.bookings * ARENATOP_COMMISSION;

  const existing = await one(
    db
      .select()
      .from(arenaTopStats)
      .where(eq(arenaTopStats.date, data.date))
  );

  let stat;
  if (existing) {
    await db
      .update(arenaTopStats)
      .set({
        stadiumsAdded: data.stadiumsAdded,
        totalStadiums: data.totalStadiums,
        usersAdded: data.usersAdded,
        totalUsers: data.totalUsers,
        bookings: data.bookings,
        notes: data.notes ?? null,
      })
      .where(eq(arenaTopStats.date, data.date));
    stat = await one(
      db.select().from(arenaTopStats).where(eq(arenaTopStats.date, data.date))
    );

    if (existing.transactionId) {
      if (commission > 0) {
        await updateTransaction(existing.transactionId, {
          amount: commission,
          description: `${data.bookings} ta bron (${data.date})`,
          date: data.date,
        });
      } else if (stat) {
        await deleteTransaction(existing.transactionId);
        await db
          .update(arenaTopStats)
          .set({ transactionId: null })
          .where(eq(arenaTopStats.id, stat.id));
      }
    } else if (commission > 0 && stat) {
      const tx = await addTransaction({
        accountSlug: "arenatop",
        type: "income",
        amount: commission,
        category: "commission",
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
      if (tx) {
        await db
          .update(arenaTopStats)
          .set({ transactionId: tx.id })
          .where(eq(arenaTopStats.id, stat.id));
        stat = await one(
          db.select().from(arenaTopStats).where(eq(arenaTopStats.id, stat.id))
        );
      }
    }
  } else {
    await db.insert(arenaTopStats).values({
      date: data.date,
      stadiumsAdded: data.stadiumsAdded,
      totalStadiums: data.totalStadiums,
      usersAdded: data.usersAdded,
      totalUsers: data.totalUsers,
      bookings: data.bookings,
      commissionPerBooking: ARENATOP_COMMISSION,
      notes: data.notes ?? null,
      createdAt: now,
    });
    stat = await one(
      db.select().from(arenaTopStats).where(eq(arenaTopStats.date, data.date))
    );

    if (commission > 0 && stat) {
      const tx = await addTransaction({
        accountSlug: "arenatop",
        type: "income",
        amount: commission,
        category: "commission",
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
      if (tx) {
        await db
          .update(arenaTopStats)
          .set({ transactionId: tx.id })
          .where(eq(arenaTopStats.id, stat.id));
        stat = await one(
          db.select().from(arenaTopStats).where(eq(arenaTopStats.id, stat.id))
        );
      }
    }
  }

  return stat;
}

export async function updateArenaTopStat(
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
  const db = await getMysqlDb();
  const existing = await one(
    db.select().from(arenaTopStats).where(eq(arenaTopStats.id, id))
  );
  if (!existing) return null;

  if (existing.date !== data.date) {
    const conflict = await one(
      db.select().from(arenaTopStats).where(eq(arenaTopStats.date, data.date))
    );
    if (conflict && conflict.id !== id) return null;
  }

  const commission = data.bookings * ARENATOP_COMMISSION;
  await db
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
    .where(eq(arenaTopStats.id, id));

  let stat = await one(
    db.select().from(arenaTopStats).where(eq(arenaTopStats.id, id))
  );

  if (existing.transactionId) {
    if (commission > 0) {
      await updateTransaction(existing.transactionId, {
        amount: commission,
        description: `${data.bookings} ta bron (${data.date})`,
        date: data.date,
      });
    } else {
      await deleteTransaction(existing.transactionId);
      await db.update(arenaTopStats)
        .set({ transactionId: null })
        .where(eq(arenaTopStats.id, id))
        ;
    }
  } else if (commission > 0) {
    const tx = await addTransaction({
      accountSlug: "arenatop",
      type: "income",
      amount: commission,
      category: "commission",
      description: `${data.bookings} ta bron (${data.date})`,
      date: data.date,
    });
    if (tx) {
      await db
        .update(arenaTopStats)
        .set({ transactionId: tx.id })
        .where(eq(arenaTopStats.id, id));
      stat = await one(
        db.select().from(arenaTopStats).where(eq(arenaTopStats.id, id))
      );
    }
  }

  return stat;
}

export async function deleteArenaTopStat(id: number) {
  const db = await getMysqlDb();
  const stat = await one(
    db.select().from(arenaTopStats).where(eq(arenaTopStats.id, id))
  );
  if (!stat) return null;

  if (stat.transactionId) {
    await deleteTransaction(stat.transactionId);
  }

  await db.delete(arenaTopStats).where(eq(arenaTopStats.id, id));
  return stat;
}

export async function getArenaTopAnalytics() {
  const db = await getMysqlDb();
  const stats = await getArenaTopStats(90);
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

export async function getFunds() {
  const db = await getMysqlDb();
  return await db.select().from(funds);
}

export async function getFundAllocations() {
  const db = await getMysqlDb();
  return await db.select().from(fundAllocations);
}

export async function getFundDeposits() {
  const db = await getMysqlDb();
  return await db
    .select()
    .from(fundDeposits)
    .orderBy(desc(fundDeposits.createdAt));
}

export async function deleteFundDeposit(id: number) {
  const db = await getMysqlDb();
  const row = await one(
    db.select().from(fundDeposits).where(eq(fundDeposits.id, id))
  );
  await db.delete(fundDeposits).where(eq(fundDeposits.id, id));
  return row;
}

export async function allocateFundsForMonth(month?: string) {
  const db = await getMysqlDb();
  const targetMonth = month ?? currentMonth();
  const businesses = ["nur-garden", "arenatop", "other-income", "personal"];
  const allocations = await getFundAllocations();
  const results = [];

  for (const biz of businesses) {
    const income = await one(
      db
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
    );

    const bizIncome = Number(income?.total ?? 0);
    if (bizIncome <= 0) continue;

    const bizAllocations = allocations.filter((a) => a.businessSlug === biz);

    for (const alloc of bizAllocations) {
      const amount = (bizIncome * alloc.percentage) / 100;
      if (amount <= 0) continue;

      const existing = await one(
        db
          .select()
          .from(fundDeposits)
          .where(
            and(
              eq(fundDeposits.fundSlug, alloc.fundSlug),
              eq(fundDeposits.businessSlug, biz),
              eq(fundDeposits.month, targetMonth)
            )
          )
      );

      if (existing) continue;

      await db.insert(fundDeposits).values({
        fundSlug: alloc.fundSlug,
        amount,
        businessSlug: biz,
        month: targetMonth,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      });
      const deposit = await one(
        db
          .select()
          .from(fundDeposits)
          .orderBy(desc(fundDeposits.id))
          .limit(1)
      );
      if (deposit) results.push(deposit);
    }
  }

  return results;
}

export async function getFundsOverview() {
  const allFunds = await getFunds();
  const allocations = await getFundAllocations();
  return Promise.all(
    allFunds.map(async (fund) => ({
      ...fund,
      balance: await getFundBalance(fund.slug),
      allocations: allocations.filter((a) => a.fundSlug === fund.slug),
    }))
  );
}

export async function getMonthlyExpenses(month?: string) {
  const db = await getMysqlDb();
  const targetMonth = month ?? currentMonth();
  return await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "expense"),
        gte(transactions.date, `${targetMonth}-01`),
        lte(transactions.date, `${targetMonth}-31`)
      )
    )
    .orderBy(desc(transactions.date));
}

export async function getDashboardStats() {
  const db = await getMysqlDb();
  const balance = await getBalanceOverview();
  const nurGarden = await getNurGardenAnalytics();
  const arenaTop = await getArenaTopAnalytics();
  const fundsOverview = await getFundsOverview();
  const recentTx = await getRecentTransactions(10);
  const monthExpenses = await getMonthlyExpenses();
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
