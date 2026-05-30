import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { runMigrations } from "./migrate";
import path from "path";
import fs from "fs";

type Db = BetterSQLite3Database<typeof schema>;

let sqliteInstance: Database.Database | null = null;
let dbInstance: Db | null = null;
let initialized = false;

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function canUseDirectory(dir: string): boolean {
  if (fs.existsSync(dir)) return true;
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function resolveDbPath(): string {
  const buildPath = path.join(process.cwd(), ".next", "cache", "build.sqlite");
  const localPath = path.join(process.cwd(), "data", "biznes.db");

  if (isBuildTime()) {
    fs.mkdirSync(path.dirname(buildPath), { recursive: true });
    return buildPath;
  }

  const configured = process.env.DATABASE_PATH;
  if (configured) {
    const dir = path.dirname(configured);
    if (canUseDirectory(dir)) return configured;
  }

  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  return localPath;
}

function ensureConnection(): void {
  if (sqliteInstance && dbInstance) return;

  const dbPath = resolveDbPath();
  sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma("journal_mode = WAL");
  sqliteInstance.pragma("foreign_keys = ON");
  sqliteInstance.pragma("busy_timeout = 5000");
  dbInstance = drizzle(sqliteInstance, { schema });

  if (!initialized) {
    initDatabase();
  }
}

export function getSqlite(): Database.Database {
  ensureConnection();
  return sqliteInstance!;
}

export function getDb(): Db {
  ensureConnection();
  return dbInstance!;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getSqlite();
    const value = Reflect.get(instance as object, prop);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

export function initDatabase() {
  if (initialized) return;
  ensureConnection();

  sqliteInstance!.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      parent_slug TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_slug TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      date TEXT NOT NULL,
      to_account_slug TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'kg',
      price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      type TEXT NOT NULL DEFAULT 'shop',
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      date TEXT NOT NULL,
      total REAL NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      payment_type TEXT NOT NULL DEFAULT 'cash',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      sale_id INTEGER REFERENCES sales(id),
      amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS arenatop_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      stadiums_added INTEGER NOT NULL DEFAULT 0,
      total_stadiums INTEGER NOT NULL DEFAULT 0,
      users_added INTEGER NOT NULL DEFAULT 0,
      total_users INTEGER NOT NULL DEFAULT 0,
      bookings INTEGER NOT NULL DEFAULT 0,
      commission_per_booking REAL NOT NULL DEFAULT 2890,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS funds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT NOT NULL DEFAULT '#10b981',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fund_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_slug TEXT NOT NULL,
      business_slug TEXT NOT NULL,
      percentage REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fund_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_slug TEXT NOT NULL,
      amount REAL NOT NULL,
      business_slug TEXT NOT NULL,
      month TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  seedIfEmpty();
  runMigrations(sqliteInstance!);
  initialized = true;
}

function seedIfEmpty() {
  const sqlite = sqliteInstance!;
  try {
    sqlite.prepare("BEGIN IMMEDIATE").run();

    const exists = sqlite
      .prepare("SELECT 1 FROM accounts WHERE slug = ?")
      .get("nur-garden");
    if (exists) {
      sqlite.prepare("COMMIT").run();
      return;
    }

    const now = new Date().toISOString();

    const insertAccount = sqlite.prepare(
      "INSERT INTO accounts (name, slug, type, parent_slug, color, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    const defaultAccounts = [
      ["Nur&Garden", "nur-garden", "business", null, "#22c55e", "leaf", 1, now],
      ["Osco Holding", "osco", "group", null, "#6366f1", "building", 1, now],
      ["Wedy", "wedy", "business", "osco", "#a855f7", "heart", 0, now],
      ["ArenaTop", "arenatop", "business", "osco", "#3b82f6", "trophy", 1, now],
      ["Shaxsiy", "personal", "personal", null, "#f59e0b", "user", 1, now],
      ["Boshqa daromad", "other-income", "business", null, "#64748b", "plus", 1, now],
    ];

    for (const acc of defaultAccounts) {
      insertAccount.run(...acc);
    }

    const insertFund = sqlite.prepare(
      "INSERT INTO funds (name, slug, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );

    const defaultFunds = [
      [
        "Xavfsizlik jamg'armasi",
        "safety",
        "Favqulodda vaziyatlar uchun zaxira pul",
        "shield",
        "#ef4444",
        now,
      ],
      [
        "Katta xaridlar",
        "big-purchases",
        "Uy, mashina va katta xaridlar uchun",
        "home",
        "#8b5cf6",
        now,
      ],
      [
        "Ro'zg'or va shaxsiy xarajatlar",
        "rozgor",
        "Uy-ro'zg'or va shaxsiy ehtiyojlar uchun",
        "home",
        "#ec4899",
        now,
      ],
      [
        "Biznes rivojlantirish",
        "business-growth",
        "Yangi biznes yoki mavjud biznesni kuchaytirish",
        "rocket",
        "#10b981",
        now,
      ],
    ];

    for (const fund of defaultFunds) {
      insertFund.run(...fund);
    }

    const insertAllocation = sqlite.prepare(
      "INSERT INTO fund_allocations (fund_slug, business_slug, percentage) VALUES (?, ?, ?)"
    );

    const businesses = ["nur-garden", "arenatop", "other-income", "personal"];
    const allocations = [
      ["safety", 10],
      ["big-purchases", 10],
      ["rozgor", 20],
      ["business-growth", 10],
    ];

    for (const biz of businesses) {
      for (const [fund, pct] of allocations) {
        insertAllocation.run(fund, biz, pct);
      }
    }

    const insertProduct = sqlite.prepare(
      "INSERT INTO products (name, unit, price, cost_price, stock, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
    );

    const defaultProducts = [
      ["Lazer guruch 1kg", "kg", 25000, 18000, 500, now, now],
      ["Guruch 5kg", "dona", 110000, 85000, 100, now, now],
      ["Pista bodom", "kg", 180000, 140000, 50, now, now],
      ["Keshyu", "kg", 95000, 72000, 40, now, now],
    ];

    for (const p of defaultProducts) {
      insertProduct.run(...p);
    }

    sqlite.prepare("COMMIT").run();
  } catch {
    try {
      sqlite.prepare("ROLLBACK").run();
    } catch {
      /* ignore */
    }
  }
}
