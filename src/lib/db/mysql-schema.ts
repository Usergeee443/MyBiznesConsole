import {
  mysqlTable,
  int,
  varchar,
  text,
  double,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const accounts = mysqlTable("accounts", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 32 }).notNull(),
  parentSlug: varchar("parent_slug", { length: 64 }),
  color: varchar("color", { length: 32 }).notNull().default("#6366f1"),
  icon: varchar("icon", { length: 64 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const transactions = mysqlTable("transactions", {
  id: int("id").primaryKey().autoincrement(),
  accountSlug: varchar("account_slug", { length: 64 }).notNull(),
  type: varchar("type", { length: 16 }).notNull(),
  amount: double("amount").notNull(),
  category: varchar("category", { length: 64 }),
  description: text("description"),
  date: varchar("date", { length: 16 }).notNull(),
  toAccountSlug: varchar("to_account_slug", { length: 64 }),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  unit: varchar("unit", { length: 32 }).notNull().default("kg"),
  price: double("price").notNull(),
  costPrice: double("cost_price").notNull().default(0),
  stock: double("stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
  updatedAt: varchar("updated_at", { length: 32 }).notNull(),
});

export const productPrices = mysqlTable(
  "product_prices",
  {
    id: int("id").primaryKey().autoincrement(),
    productId: int("product_id").notNull(),
    tier: varchar("tier", { length: 32 }).notNull(),
    price: double("price").notNull(),
  },
  (t) => [uniqueIndex("product_prices_product_tier").on(t.productId, t.tier)]
);

export const productCostConfig = mysqlTable("product_cost_config", {
  productId: int("product_id").primaryKey(),
  workerPay: double("worker_pay").notNull().default(300),
  itemsPerBox: int("items_per_box").notNull().default(16),
  boxType: varchar("box_type", { length: 16 }).notNull().default("normal"),
});

export const purchases = mysqlTable("purchases", {
  id: int("id").primaryKey().autoincrement(),
  productId: int("product_id"),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: double("quantity").notNull(),
  unitPrice: double("unit_price").notNull(),
  total: double("total").notNull(),
  paymentType: varchar("payment_type", { length: 16 }).notNull().default("cash"),
  paid: double("paid").notNull().default(0),
  notes: text("notes"),
  date: varchar("date", { length: 16 }).notNull(),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const supplierDebts = mysqlTable("supplier_debts", {
  id: int("id").primaryKey().autoincrement(),
  purchaseId: int("purchase_id").notNull(),
  amount: double("amount").notNull(),
  paidAmount: double("paid_amount").notNull().default(0),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const packagingSettings = mysqlTable("packaging_settings", {
  id: int("id").primaryKey().autoincrement(),
  stock: double("stock").notNull().default(20000),
  unitCost: double("unit_cost").notNull().default(700),
  updatedAt: varchar("updated_at", { length: 32 }).notNull(),
});

export const boxPurchases = mysqlTable("box_purchases", {
  id: int("id").primaryKey().autoincrement(),
  quantity: int("quantity").notNull(),
  unitCost: double("unit_cost").notNull(),
  boxType: varchar("box_type", { length: 16 }).notNull().default("normal"),
  date: varchar("date", { length: 16 }).notNull(),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const logisticsExpenses = mysqlTable("logistics_expenses", {
  id: int("id").primaryKey().autoincrement(),
  amount: double("amount").notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  type: varchar("type", { length: 32 }).notNull().default("shop"),
  address: text("address"),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const sales = mysqlTable("sales", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id"),
  date: varchar("date", { length: 16 }).notNull(),
  total: double("total").notNull(),
  paid: double("paid").notNull().default(0),
  paymentType: varchar("payment_type", { length: 16 }).notNull().default("cash"),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const saleItems = mysqlTable("sale_items", {
  id: int("id").primaryKey().autoincrement(),
  saleId: int("sale_id").notNull(),
  productId: int("product_id").notNull(),
  quantity: double("quantity").notNull(),
  price: double("price").notNull(),
  total: double("total").notNull(),
});

export const debts = mysqlTable("debts", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customer_id").notNull(),
  saleId: int("sale_id"),
  amount: double("amount").notNull(),
  paidAmount: double("paid_amount").notNull().default(0),
  dueDate: varchar("due_date", { length: 16 }),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const arenaTopStats = mysqlTable("arenatop_stats", {
  id: int("id").primaryKey().autoincrement(),
  date: varchar("date", { length: 16 }).notNull().unique(),
  stadiumsAdded: int("stadiums_added").notNull().default(0),
  totalStadiums: int("total_stadiums").notNull().default(0),
  usersAdded: int("users_added").notNull().default(0),
  totalUsers: int("total_users").notNull().default(0),
  bookings: int("bookings").notNull().default(0),
  commissionPerBooking: double("commission_per_booking").notNull().default(2890),
  notes: text("notes"),
  transactionId: int("transaction_id"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const funds = mysqlTable("funds", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }).notNull().default("#10b981"),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const fundAllocations = mysqlTable("fund_allocations", {
  id: int("id").primaryKey().autoincrement(),
  fundSlug: varchar("fund_slug", { length: 64 }).notNull(),
  businessSlug: varchar("business_slug", { length: 64 }).notNull(),
  percentage: double("percentage").notNull(),
});

export const fundDeposits = mysqlTable("fund_deposits", {
  id: int("id").primaryKey().autoincrement(),
  fundSlug: varchar("fund_slug", { length: 64 }).notNull(),
  amount: double("amount").notNull(),
  businessSlug: varchar("business_slug", { length: 64 }).notNull(),
  month: varchar("month", { length: 8 }).notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  createdAt: varchar("created_at", { length: 32 }).notNull(),
});

export const telegramSessions = mysqlTable("telegram_sessions", {
  chatId: int("chat_id").primaryKey(),
  step: varchar("step", { length: 64 }),
  data: text("data"),
  updatedAt: varchar("updated_at", { length: 32 }).notNull(),
});
