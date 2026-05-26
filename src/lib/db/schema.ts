import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(), // business | personal | fund | group
  parentSlug: text("parent_slug"),
  color: text("color").notNull().default("#6366f1"),
  icon: text("icon"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountSlug: text("account_slug").notNull(),
  type: text("type").notNull(), // income | expense | transfer
  amount: real("amount").notNull(),
  category: text("category"),
  description: text("description"),
  date: text("date").notNull(),
  toAccountSlug: text("to_account_slug"),
  createdAt: text("created_at").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("kg"),
  price: real("price").notNull(),
  costPrice: real("cost_price").notNull().default(0),
  stock: real("stock").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productPrices = sqliteTable("product_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  tier: text("tier").notNull(), // shop | wholesale | online
  price: real("price").notNull(),
});

export const productCostConfig = sqliteTable("product_cost_config", {
  productId: integer("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),
  workerPay: real("worker_pay").notNull().default(300),
  itemsPerBox: integer("items_per_box").notNull().default(16),
  boxType: text("box_type").notNull().default("normal"), // normal | large
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id),
  name: text("name").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  paymentType: text("payment_type").notNull().default("cash"), // cash | credit
  paid: real("paid").notNull().default(0),
  notes: text("notes"),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const supplierDebts = sqliteTable("supplier_debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const packagingSettings = sqliteTable("packaging_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stock: real("stock").notNull().default(20000),
  unitCost: real("unit_cost").notNull().default(700),
  updatedAt: text("updated_at").notNull(),
});

export const boxPurchases = sqliteTable("box_purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quantity: integer("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  boxType: text("box_type").notNull().default("normal"),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const logisticsExpenses = sqliteTable("logistics_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  type: text("type").notNull().default("shop"), // wholesale | shop | online
  address: text("address"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").references(() => customers.id),
  date: text("date").notNull(),
  total: real("total").notNull(),
  paid: real("paid").notNull().default(0),
  paymentType: text("payment_type").notNull().default("cash"), // cash | credit | partial
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  total: real("total").notNull(),
});

export const debts = sqliteTable("debts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  saleId: integer("sale_id").references(() => sales.id),
  amount: real("amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"), // pending | partial | paid
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const arenaTopStats = sqliteTable("arenatop_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  stadiumsAdded: integer("stadiums_added").notNull().default(0),
  totalStadiums: integer("total_stadiums").notNull().default(0),
  usersAdded: integer("users_added").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  bookings: integer("bookings").notNull().default(0),
  commissionPerBooking: real("commission_per_booking").notNull().default(2890),
  notes: text("notes"),
  transactionId: integer("transaction_id"),
  createdAt: text("created_at").notNull(),
});

export const funds = sqliteTable("funds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  color: text("color").notNull().default("#10b981"),
  createdAt: text("created_at").notNull(),
});

export const fundAllocations = sqliteTable("fund_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fundSlug: text("fund_slug").notNull(),
  businessSlug: text("business_slug").notNull(),
  percentage: real("percentage").notNull(),
});

export const fundDeposits = sqliteTable("fund_deposits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fundSlug: text("fund_slug").notNull(),
  amount: real("amount").notNull(),
  businessSlug: text("business_slug").notNull(),
  month: text("month").notNull(), // YYYY-MM
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type ArenaTopStat = typeof arenaTopStats.$inferSelect;
export type Fund = typeof funds.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
