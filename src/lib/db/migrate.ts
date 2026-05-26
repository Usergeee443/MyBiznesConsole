import type Database from "better-sqlite3";

export function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      tier TEXT NOT NULL,
      price REAL NOT NULL,
      UNIQUE(product_id, tier)
    );

    CREATE TABLE IF NOT EXISTS product_cost_config (
      product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
      worker_pay REAL NOT NULL DEFAULT 300,
      items_per_box INTEGER NOT NULL DEFAULT 16,
      box_type TEXT NOT NULL DEFAULT 'normal'
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'cash',
      paid REAL NOT NULL DEFAULT 0,
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplier_debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS packaging_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock REAL NOT NULL DEFAULT 20000,
      unit_cost REAL NOT NULL DEFAULT 700,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS box_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quantity INTEGER NOT NULL,
      unit_cost REAL NOT NULL,
      box_type TEXT NOT NULL DEFAULT 'normal',
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logistics_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id INTEGER PRIMARY KEY,
      step TEXT,
      data TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  const cols = sqlite
    .prepare("PRAGMA table_info(arenatop_stats)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "transaction_id")) {
    sqlite.exec(
      `ALTER TABLE arenatop_stats ADD COLUMN transaction_id INTEGER`
    );
  }

  const packaging = sqlite
    .prepare("SELECT COUNT(*) as c FROM packaging_settings")
    .get() as { c: number };
  if (packaging.c === 0) {
    sqlite
      .prepare(
        "INSERT INTO packaging_settings (stock, unit_cost, updated_at) VALUES (20000, 700, ?)"
      )
      .run(new Date().toISOString());
  }

  migrateFunds(sqlite);
  migrateProductDefaults(sqlite);
}

function migrateFunds(sqlite: Database.Database) {
  sqlite
    .prepare(
      `UPDATE funds SET name = ?, description = ?, icon = ?, color = ? WHERE slug = 'entertainment' OR slug = 'rozgor'`
    )
    .run(
      "Ro'zg'or va shaxsiy xarajatlar",
      "Uy-ro'zg'or va shaxsiy ehtiyojlar uchun",
      "home",
      "#ec4899"
    );

  sqlite
    .prepare(`UPDATE funds SET slug = 'rozgor' WHERE slug = 'entertainment'`)
    .run();

  sqlite
    .prepare(
      `UPDATE fund_deposits SET fund_slug = 'rozgor' WHERE fund_slug = 'entertainment'`
    )
    .run();

  sqlite
    .prepare(
      `UPDATE fund_allocations SET fund_slug = 'rozgor' WHERE fund_slug = 'entertainment'`
    )
    .run();

  sqlite
    .prepare(
      `UPDATE funds SET description = ? WHERE slug = 'big-purchases'`
    )
    .run("Uy, mashina va katta xaridlar uchun (10%)");

  const sources = ["nur-garden", "arenatop", "other-income", "personal"];
  const fundPercents: [string, number][] = [
    ["safety", 10],
    ["big-purchases", 10],
    ["rozgor", 20],
    ["business-growth", 10],
  ];

  const migrated = sqlite
    .prepare(
      `SELECT 1 FROM fund_allocations WHERE fund_slug = 'rozgor' AND business_slug = 'personal' AND percentage = 20 LIMIT 1`
    )
    .get();
  if (migrated) return;

  sqlite.prepare("DELETE FROM fund_allocations").run();

  const insert = sqlite.prepare(
    "INSERT OR IGNORE INTO fund_allocations (fund_slug, business_slug, percentage) VALUES (?, ?, ?)"
  );
  for (const src of sources) {
    for (const [fund, pct] of fundPercents) {
      insert.run(fund, src, pct);
    }
  }
}

function migrateProductDefaults(sqlite: Database.Database) {
  const products = sqlite
    .prepare("SELECT id, price FROM products WHERE is_active = 1")
    .all() as { id: number; price: number }[];

  const insertPrice = sqlite.prepare(
    "INSERT OR IGNORE INTO product_prices (product_id, tier, price) VALUES (?, ?, ?)"
  );
  const insertConfig = sqlite.prepare(
    "INSERT OR IGNORE INTO product_cost_config (product_id, worker_pay, items_per_box, box_type) VALUES (?, 300, 16, 'normal')"
  );

  for (const p of products) {
    insertConfig.run(p.id);
    const base = p.price;
    insertPrice.run(p.id, "shop", base);
    insertPrice.run(p.id, "wholesale", Math.round(base * 0.98));
    insertPrice.run(p.id, "online", Math.round(base * 1.067));
  }
}
