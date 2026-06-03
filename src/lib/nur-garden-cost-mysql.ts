import { getMysqlDb, one } from "./db/mysql-db";
import {
  products,
  productPrices,
  productCostConfig,
  purchases,
  supplierDebts,
  packagingSettings,
  boxPurchases,
  logisticsExpenses,
} from "./db/mysql-schema";
import { eq, desc, sum, sql } from "drizzle-orm";
import { addTransaction } from "./services-mysql";

export const PRICE_TIERS = {
  shop: { label: "Do'kon", key: "shop" },
  wholesale: { label: "Optom", key: "wholesale" },
  online: { label: "Online marketplace", key: "online" },
} as const;

export async function getPackaging() {
  const db = await getMysqlDb();
  return await one(db.select().from(packagingSettings).limit(1));
}

export async function updatePackaging(data: { stock?: number; unitCost?: number }) {
  const db = await getMysqlDb();
  const row = await getPackaging();
  if (!row) return null;
  const [updated] = await db
    .update(packagingSettings)
    .set({
      stock: data.stock ?? row.stock,
      unitCost: data.unitCost ?? row.unitCost,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(packagingSettings.id, row.id))
    .returning();
  return updated;
}

export async function getProductPrices(productId: number) {
  const db = await getMysqlDb();
  return await db
    .select()
    .from(productPrices)
    .where(eq(productPrices.productId, productId));
}

export async function setProductPrices(
  productId: number,
  prices: { shop: number; wholesale: number; online: number }
) {
  const db = await getMysqlDb();
  for (const [tier, price] of Object.entries(prices)) {
    const existing = db
      .select()
      .from(productPrices)
      .where(
        sql`${productPrices.productId} = ${productId} AND ${productPrices.tier} = ${tier}`
      )
      ;
    if (existing) {
      await db.update(productPrices)
        .set({ price })
        .where(eq(productPrices.id, existing.id))
        ;
    } else {
      await db.insert(productPrices)
        .values({ productId, tier, price })
        ;
    }
  }
  return await getProductPrices(productId);
}

export async function getProductCostConfig(productId: number) {
  const db = await getMysqlDb();
  return db
    .select()
    .from(productCostConfig)
    .where(eq(productCostConfig.productId, productId))
    ;
}

export async function updateProductCostConfig(
  productId: number,
  data: { workerPay?: number; itemsPerBox?: number; boxType?: string }
) {
  const db = await getMysqlDb();
  const existing = await getProductCostConfig(productId);
  if (existing) {
    return db
      .update(productCostConfig)
      .set({
        workerPay: data.workerPay ?? existing.workerPay,
        itemsPerBox: data.itemsPerBox ?? existing.itemsPerBox,
        boxType: data.boxType ?? existing.boxType,
      })
      .where(eq(productCostConfig.productId, productId))
      .returning();
  }
  return db
    .insert(productCostConfig)
    .values({
      productId,
      workerPay: data.workerPay ?? 300,
      itemsPerBox: data.itemsPerBox ?? 16,
      boxType: data.boxType ?? "normal",
    })
    .returning();
}

export async function getPurchases(limit = 50) {
  const db = await getMysqlDb();
  return db
    .select({ purchase: purchases, product: products })
    .from(purchases)
    .leftJoin(products, eq(purchases.productId, products.id))
    .orderBy(desc(purchases.date))
    .limit(limit)
    ;
}

export async function addPurchase(data: {
  productId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  paymentType: string;
  paid?: number;
  notes?: string;
  date?: string;
}) {
  const db = await getMysqlDb();
  const total = data.quantity * data.unitPrice;
  const paid =
    data.paid ?? (data.paymentType === "credit" ? 0 : total);
  const now = new Date().toISOString();
  const date = data.date ?? now.split("T")[0];

  const purchase = db
    .insert(purchases)
    .values({
      productId: data.productId ?? null,
      name: data.name,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      total,
      paymentType: data.paymentType,
      paid,
      notes: data.notes ?? null,
      date,
      createdAt: now,
    })
    .returning();

  if (paid > 0) {
    await addTransaction({
      accountSlug: "nur-garden",
      type: "expense",
      amount: paid,
      category: "purchase",
      description: `Sotib olish: ${data.name}`,
      date,
    });
  }

  if (total > paid) {
    await db.insert(supplierDebts)
      .values({
        purchaseId: purchase.id,
        amount: total - paid,
        paidAmount: 0,
        status: "pending",
        createdAt: now,
      })
      ;
  }

  return purchase;
}

export async function updatePurchase(
  id: number,
  data: Partial<{
    name: string;
    quantity: number;
    unitPrice: number;
    paymentType: string;
    paid: number;
    notes: string;
    date: string;
  }>
) {
  const db = await getMysqlDb();
  const existing = db.select().from(purchases).where(eq(purchases.id, id));
  if (!existing) return null;
  const quantity = data.quantity ?? existing.quantity;
  const unitPrice = data.unitPrice ?? existing.unitPrice;
  const total = quantity * unitPrice;
  return db
    .update(purchases)
    .set({ ...data, total })
    .where(eq(purchases.id, id))
    .returning();
}

export async function deletePurchase(id: number) {
  const db = await getMysqlDb();
  await db.delete(supplierDebts).where(eq(supplierDebts.purchaseId, id));
  return db.delete(purchases).where(eq(purchases.id, id)).returning();
}

export async function getSupplierDebts() {
  const db = await getMysqlDb();
  return db
    .select({ debt: supplierDebts, purchase: purchases })
    .from(supplierDebts)
    .leftJoin(purchases, eq(supplierDebts.purchaseId, purchases.id))
    .orderBy(desc(supplierDebts.createdAt))
    ;
}

export async function paySupplierDebt(id: number, amount: number) {
  const db = await getMysqlDb();
  const debt = db.select().from(supplierDebts).where(eq(supplierDebts.id, id));
  if (!debt) return null;
  const newPaid = debt.paidAmount + amount;
  const status = newPaid >= debt.amount ? "paid" : "partial";
  const updated = db
    .update(supplierDebts)
    .set({ paidAmount: newPaid, status })
    .where(eq(supplierDebts.id, id))
    .returning();
  await addTransaction({
    accountSlug: "nur-garden",
    type: "expense",
    amount,
    category: "supplier_debt",
    description: `Yetkazib beruvchi qarzi #${id}`,
  });
  return updated;
}

export async function getBoxPurchases(limit = 30) {
  const db = await getMysqlDb();
  return db
    .select()
    .from(boxPurchases)
    .orderBy(desc(boxPurchases.date))
    .limit(limit)
    ;
}

export async function addBoxPurchase(data: {
  quantity: number;
  unitCost: number;
  boxType: string;
  date?: string;
  notes?: string;
}) {
  const db = await getMysqlDb();
  const now = new Date().toISOString();
  const purchase = db
    .insert(boxPurchases)
    .values({
      quantity: data.quantity,
      unitCost: data.unitCost,
      boxType: data.boxType,
      date: data.date ?? now.split("T")[0],
      notes: data.notes ?? null,
      createdAt: now,
    })
    .returning();

  await addTransaction({
    accountSlug: "nur-garden",
    type: "expense",
    amount: data.quantity * data.unitCost,
    category: "box",
    description: `Karobka xaridi (${data.quantity} ta)`,
    date: data.date ?? now.split("T")[0],
  });

  return purchase;
}

export async function deleteBoxPurchase(id: number) {
  const db = await getMysqlDb();
  return db.delete(boxPurchases).where(eq(boxPurchases.id, id)).returning();
}

export async function getLogistics(limit = 30) {
  const db = await getMysqlDb();
  return db
    .select()
    .from(logisticsExpenses)
    .orderBy(desc(logisticsExpenses.date))
    .limit(limit)
    ;
}

export async function addLogistics(data: {
  amount: number;
  date?: string;
  notes?: string;
}) {
  const db = await getMysqlDb();
  const now = new Date().toISOString();
  const row = db
    .insert(logisticsExpenses)
    .values({
      amount: data.amount,
      date: data.date ?? now.split("T")[0],
      notes: data.notes ?? null,
      createdAt: now,
    })
    .returning();

  await addTransaction({
    accountSlug: "nur-garden",
    type: "expense",
    amount: data.amount,
    category: "logistics",
    description: data.notes ?? "Logistika xarajati",
    date: data.date ?? now.split("T")[0],
  });

  return row;
}

export async function deleteLogistics(id: number) {
  const db = await getMysqlDb();
  return db
    .delete(logisticsExpenses)
    .where(eq(logisticsExpenses.id, id))
    .returning();
}

function avgBoxCostPerUnit() {
  const rows = db.select().from(boxPurchases);
  if (rows.length === 0) return 5250 / 16;
  let totalCost = 0;
  let totalCapacity = 0;
  for (const b of rows) {
    totalCost += b.quantity * b.unitCost;
    const perBox = b.boxType === "large" ? 24 : 16;
    totalCapacity += b.quantity * perBox;
  }
  return totalCapacity > 0 ? totalCost / totalCapacity : 5250 / 16;
}

function logisticsPerUnit() {
  const totalLogistics = db
    .select({ t: sum(logisticsExpenses.amount) })
    .from(logisticsExpenses)
    ;
  const logTotal = Number(totalLogistics?.t ?? 0);
  if (logTotal <= 0) return 0;

  const allPurchases = db.select().from(purchases);
  const totalQty = allPurchases.reduce((s, p) => s + p.quantity, 0);
  if (totalQty <= 0) return 0;

  return logTotal / totalQty;
}

function avgMaterialCost(productId: number) {
  const rows = db
    .select()
    .from(purchases)
    .where(eq(purchases.productId, productId))
    ;
  if (rows.length === 0) {
    const p = db.select().from(products).where(eq(products.id, productId));
    return p?.costPrice ?? 0;
  }
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalCost = rows.reduce((s, r) => s + r.quantity * r.unitPrice, 0);
  return totalQty > 0 ? totalCost / totalQty : 0;
}

export async function calculateProductCost(productId: number) {
  const db = await getMysqlDb();
  const packaging = await getPackaging();
  const config = await getProductCostConfig(productId);
  const prices = await getProductPrices(productId);

  const material = avgMaterialCost(productId);
  const packagingCost = packaging?.unitCost ?? 700;
  const labor = config?.workerPay ?? 300;
  const itemsPerBox = config?.itemsPerBox ?? (config?.boxType === "large" ? 24 : 16);
  const boxPerUnit = avgBoxCostPerUnit();
  const logistics = logisticsPerUnit();

  const total = material + packagingCost + labor + boxPerUnit + logistics;

  const priceMap: Record<string, number> = {};
  for (const p of prices) priceMap[p.tier] = p.price;

  const margins: Record<string, { price: number; profit: number; marginPct: number }> = {};
  for (const tier of ["shop", "wholesale", "online"] as const) {
    const price = priceMap[tier] ?? 0;
    const profit = price - total;
    margins[tier] = {
      price,
      profit,
      marginPct: price > 0 ? (profit / price) * 100 : 0,
    };
  }

  return {
    breakdown: {
      material,
      packaging: packagingCost,
      labor,
      box: boxPerUnit,
      logistics,
      total,
    },
    margins,
    config,
    packaging,
  };
}

export async function getNurGardenCostingOverview() {
  const db = await getMysqlDb();
  const allProducts = db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    ;

  return {
    packaging: await getPackaging(),
    purchases: await getPurchases(20),
    supplierDebts: getSupplierDebts(),
    boxPurchases: getBoxPurchases(10),
    logistics: getLogistics(10),
    products: allProducts.map((p) => ({
      ...p,
      cost: await calculateProductCost(p.id),
      prices: await getProductPrices(p.id),
    })),
  };
}
