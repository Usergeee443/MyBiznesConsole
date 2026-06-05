import { getMysqlDb, one } from "./db/mysql-db";
import { products, customers } from "./db/mysql-schema";
import { eq } from "drizzle-orm";
import {
  addTransaction,
  addCustomer,
  addProduct,
  createSale,
  addArenaTopStat,
} from "./services-mysql";
import { parseDate, parseNumber, parseString } from "./import-utils";
import type { ImportResult, ImportType } from "./utils";

type ImportOptions = { historical?: boolean; dryRun?: boolean };

function err(
  errors: ImportResult["errors"],
  row: number,
  message: string
) {
  errors.push({ row, message });
}

export async function runBulkImport(
  type: ImportType,
  rows: Record<string, unknown>[],
  options: ImportOptions = {}
): Promise<ImportResult> {
  switch (type) {
    case "transactions":
      return importTransactions(rows, options);
    case "sales":
      return importSales(rows, options);
    case "customers":
      return importCustomers(rows, options);
    case "arenatop":
      return importArenatop(rows, options);
    case "products":
      return importProducts(rows, options);
    default:
      return { success: 0, errors: [{ row: 0, message: "Noma'lum tur" }] };
  }
}

async function resolveCustomer(name: string, type = "shop") {
  const db = await getMysqlDb();
  const existing = await one(
    db.select().from(customers).where(eq(customers.name, name))
  );
  if (existing) return existing;
  return await addCustomer({ name, type });
}

async function resolveProduct(name: string) {
  const db = await getMysqlDb();
  const existing = await one(
    db.select().from(products).where(eq(products.name, name))
  );
  if (existing) return existing;
  return await addProduct({ name, unit: "kg", price: 0, stock: 0 });
}

async function importTransactions(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let success = 0;
  const preview: Record<string, unknown>[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const date = parseDate(row.date);
    const accountSlug = parseString(row.account_slug);
    const type = parseString(row.type) as "income" | "expense" | "transfer";
    const amount = parseNumber(row.amount);
    const category = parseString(row.category) || undefined;
    const description = parseString(row.description) || undefined;
    const toAccountSlug = parseString(row.to_account_slug) || undefined;

    if (!date) {
      err(errors, line, "Sana noto'g'ri");
      continue;
    }
    if (!accountSlug) {
      err(errors, line, "Hisob kiritilmagan");
      continue;
    }
    if (!["income", "expense", "transfer"].includes(type)) {
      err(errors, line, "Tur: income, expense yoki transfer bo'lishi kerak");
      continue;
    }
    if (amount === null || amount <= 0) {
      err(errors, line, "Summa noto'g'ri");
      continue;
    }
    if (type === "transfer" && !toAccountSlug) {
      err(errors, line, "Transfer uchun transfer_hisob kerak");
      continue;
    }

    const payload = {
      accountSlug,
      type,
      amount,
      category,
      description,
      date,
      toAccountSlug: type === "transfer" ? toAccountSlug : undefined,
    };
    preview.push(payload);

    if (!options.dryRun) {
      await addTransaction(payload);
      success++;
    }
  }

  if (options.dryRun) success = preview.length;
  return { success, errors, preview: options.dryRun ? preview.slice(0, 20) : undefined };
}

async function importCustomers(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let success = 0;
  const db = await getMysqlDb();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const name = parseString(row.name);
    if (!name) {
      err(errors, line, "Nomi kiritilmagan");
      continue;
    }
    const type = parseString(row.type) || "shop";
    if (!options.dryRun) {
      const existing = await one(
        db.select().from(customers).where(eq(customers.name, name))
      );
      if (!existing) {
        await addCustomer({
          name,
          phone: parseString(row.phone) || undefined,
          type,
          address: parseString(row.address) || undefined,
          notes: parseString(row.notes) || undefined,
        });
      }
      success++;
    } else {
      success++;
    }
  }

  return { success, errors };
}

async function importProducts(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let success = 0;
  const db = await getMysqlDb();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const name = parseString(row.name);
    if (!name) {
      err(errors, line, "Nomi kiritilmagan");
      continue;
    }
    const price = parseNumber(row.unit_price ?? row.price) ?? 0;
    const costPrice = parseNumber(row.cost_price) ?? 0;
    const stock = parseNumber(row.stock) ?? 0;
    const unit = parseString(row.unit) || "kg";

    if (!options.dryRun) {
      const existing = await one(
        db.select().from(products).where(eq(products.name, name))
      );
      if (!existing) {
        await addProduct({ name, unit, price, costPrice, stock });
      }
      success++;
    } else {
      success++;
    }
  }

  return { success, errors };
}

async function importSales(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let success = 0;
  const historical = options.historical ?? true;

  const groups = new Map<
    string,
    { meta: Record<string, unknown>; items: Record<string, unknown>[] }
  >();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const date = parseDate(row.date);
    const productName = parseString(row.product_name);
    const quantity = parseNumber(row.quantity);
    const unitPrice = parseNumber(row.unit_price);

    if (!date) {
      err(errors, line, "Sana noto'g'ri");
      continue;
    }
    if (!productName) {
      err(errors, line, "Mahsulot kiritilmagan");
      continue;
    }
    if (quantity === null || quantity <= 0) {
      err(errors, line, "Miqdor noto'g'ri");
      continue;
    }
    if (unitPrice === null || unitPrice < 0) {
      err(errors, line, "Narx noto'g'ri");
      continue;
    }

    const saleRef =
      parseString(row.sale_ref) ||
      `${date}|${parseString(row.customer_name) || "anon"}`;
    if (!groups.has(saleRef)) {
      groups.set(saleRef, { meta: row, items: [] });
    }
    groups.get(saleRef)!.items.push(row);
  }

  for (const [, group] of groups) {
    const meta = group.meta;
    const date = parseDate(meta.date)!;
    const customerName = parseString(meta.customer_name);
    const paid = parseNumber(meta.paid) ?? 0;
    const paymentType = parseString(meta.payment_type) || "cash";
    const notes = parseString(meta.notes) || undefined;

    let customerId: number | undefined;
    if (customerName && !options.dryRun) {
      customerId = (await resolveCustomer(customerName)).id;
    }

    const items: { productId: number; quantity: number; price: number }[] = [];
    if (!options.dryRun) {
      for (const item of group.items) {
        const productName = parseString(item.product_name);
        const product = await resolveProduct(productName);
        const qty = parseNumber(item.quantity)!;
        const price = parseNumber(item.unit_price)!;
        items.push({ productId: product.id, quantity: qty, price });
      }
    }

    if (!options.dryRun && items.length > 0) {
      await createSale({
        customerId,
        items,
        paymentType,
        paid,
        notes,
        date,
        skipStock: historical,
        skipIncome: historical,
      });
      success++;
    } else if (options.dryRun) {
      success++;
    }
  }

  return { success, errors };
}

async function importArenatop(
  rows: Record<string, unknown>[],
  options: ImportOptions
): Promise<ImportResult> {
  const errors: ImportResult["errors"] = [];
  let success = 0;
  const historical = options.historical ?? true;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const date = parseDate(row.date);
    if (!date) {
      err(errors, line, "Sana noto'g'ri");
      continue;
    }

    if (!options.dryRun) {
      await addArenaTopStat({
        date,
        stadiumsAdded: parseNumber(row.stadiums_added) ?? 0,
        totalStadiums: parseNumber(row.total_stadiums) ?? 0,
        usersAdded: parseNumber(row.users_added) ?? 0,
        totalUsers: parseNumber(row.total_users) ?? 0,
        bookings: parseNumber(row.bookings) ?? 0,
        notes: parseString(row.notes) || undefined,
        skipIncome: historical,
      });
      success++;
    } else {
      success++;
    }
  }

  return { success, errors };
}
