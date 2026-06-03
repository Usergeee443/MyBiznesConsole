import { getMySqlPool } from "../mysql";

let initialized = false;

const DDL = `
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) NOT NULL UNIQUE,
  type VARCHAR(32) NOT NULL,
  parent_slug VARCHAR(64),
  color VARCHAR(32) NOT NULL DEFAULT '#6366f1',
  icon VARCHAR(64),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_slug VARCHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL,
  amount DOUBLE NOT NULL,
  category VARCHAR(64),
  description TEXT,
  date VARCHAR(16) NOT NULL,
  to_account_slug VARCHAR(64),
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(32) NOT NULL DEFAULT 'kg',
  price DOUBLE NOT NULL,
  cost_price DOUBLE NOT NULL DEFAULT 0,
  stock DOUBLE NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_prices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  tier VARCHAR(32) NOT NULL,
  price DOUBLE NOT NULL,
  UNIQUE KEY product_prices_product_tier (product_id, tier)
);

CREATE TABLE IF NOT EXISTS product_cost_config (
  product_id INT PRIMARY KEY,
  worker_pay DOUBLE NOT NULL DEFAULT 300,
  items_per_box INT NOT NULL DEFAULT 16,
  box_type VARCHAR(16) NOT NULL DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  name VARCHAR(255) NOT NULL,
  quantity DOUBLE NOT NULL,
  unit_price DOUBLE NOT NULL,
  total DOUBLE NOT NULL,
  payment_type VARCHAR(16) NOT NULL DEFAULT 'cash',
  paid DOUBLE NOT NULL DEFAULT 0,
  notes TEXT,
  date VARCHAR(16) NOT NULL,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_debts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  amount DOUBLE NOT NULL,
  paid_amount DOUBLE NOT NULL DEFAULT 0,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS packaging_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stock DOUBLE NOT NULL DEFAULT 20000,
  unit_cost DOUBLE NOT NULL DEFAULT 700,
  updated_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS box_purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantity INT NOT NULL,
  unit_cost DOUBLE NOT NULL,
  box_type VARCHAR(16) NOT NULL DEFAULT 'normal',
  date VARCHAR(16) NOT NULL,
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS logistics_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DOUBLE NOT NULL,
  date VARCHAR(16) NOT NULL,
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  type VARCHAR(32) NOT NULL DEFAULT 'shop',
  address TEXT,
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  date VARCHAR(16) NOT NULL,
  total DOUBLE NOT NULL,
  paid DOUBLE NOT NULL DEFAULT 0,
  payment_type VARCHAR(16) NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DOUBLE NOT NULL,
  price DOUBLE NOT NULL,
  total DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS debts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  sale_id INT,
  amount DOUBLE NOT NULL,
  paid_amount DOUBLE NOT NULL DEFAULT 0,
  due_date VARCHAR(16),
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS arenatop_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date VARCHAR(16) NOT NULL UNIQUE,
  stadiums_added INT NOT NULL DEFAULT 0,
  total_stadiums INT NOT NULL DEFAULT 0,
  users_added INT NOT NULL DEFAULT 0,
  total_users INT NOT NULL DEFAULT 0,
  bookings INT NOT NULL DEFAULT 0,
  commission_per_booking DOUBLE NOT NULL DEFAULT 2890,
  notes TEXT,
  transaction_id INT,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS funds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(64),
  color VARCHAR(32) NOT NULL DEFAULT '#10b981',
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS fund_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fund_slug VARCHAR(64) NOT NULL,
  business_slug VARCHAR(64) NOT NULL,
  percentage DOUBLE NOT NULL
);

CREATE TABLE IF NOT EXISTS fund_deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fund_slug VARCHAR(64) NOT NULL,
  amount DOUBLE NOT NULL,
  business_slug VARCHAR(64) NOT NULL,
  month VARCHAR(8) NOT NULL,
  date VARCHAR(16) NOT NULL,
  created_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS telegram_sessions (
  chat_id BIGINT PRIMARY KEY,
  step VARCHAR(64),
  data TEXT,
  updated_at VARCHAR(32) NOT NULL
);
`;

export async function initMySqlDatabase(): Promise<void> {
  if (initialized) return;

  const pool = getMySqlPool();
  for (const stmt of DDL.split(";").map((s) => s.trim()).filter(Boolean)) {
    await pool.query(stmt);
  }

  await seedIfEmpty(pool);
  await migrateFunds(pool);
  await migrateProductDefaults(pool);

  initialized = true;
}

async function seedIfEmpty(pool: ReturnType<typeof getMySqlPool>) {
  const [rows] = await pool.query<{ c: number }[]>(
    "SELECT COUNT(*) as c FROM accounts WHERE slug = ?",
    ["nur-garden"]
  );
  const count = Array.isArray(rows) ? (rows[0] as { c: number })?.c : 0;
  if (count > 0) return;

  const now = new Date().toISOString();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const accounts = [
      ["Nur&Garden", "nur-garden", "business", null, "#22c55e", "leaf"],
      ["Osco Holding", "osco", "group", null, "#6366f1", "building"],
      ["Wedy", "wedy", "business", "osco", "#a855f7", "heart"],
      ["ArenaTop", "arenatop", "business", "osco", "#3b82f6", "trophy"],
      ["Shaxsiy", "personal", "personal", null, "#f59e0b", "user"],
      ["Boshqa daromad", "other-income", "business", null, "#64748b", "plus"],
    ];
    for (const [name, slug, type, parent, color, icon] of accounts) {
      await conn.query(
        `INSERT INTO accounts (name, slug, type, parent_slug, color, icon, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [name, slug, type, parent, color, icon, now]
      );
    }

    const fundRows = [
      [
        "Xavfsizlik jamg'armasi",
        "safety",
        "Favqulodda vaziyatlar uchun zaxira pul",
        "shield",
        "#ef4444",
      ],
      [
        "Katta xaridlar",
        "big-purchases",
        "Uy, mashina va katta xaridlar uchun",
        "home",
        "#8b5cf6",
      ],
      [
        "Ro'zg'or va shaxsiy xarajatlar",
        "rozgor",
        "Uy-ro'zg'or va shaxsiy ehtiyojlar uchun",
        "home",
        "#ec4899",
      ],
      [
        "Biznes rivojlantirish",
        "business-growth",
        "Yangi biznes yoki mavjud biznesni kuchaytirish",
        "rocket",
        "#10b981",
      ],
    ];
    for (const [name, slug, desc, icon, color] of fundRows) {
      await conn.query(
        `INSERT INTO funds (name, slug, description, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, slug, desc, icon, color, now]
      );
    }

    const businesses = ["nur-garden", "arenatop", "other-income", "personal"];
    const allocations: [string, number][] = [
      ["safety", 10],
      ["big-purchases", 10],
      ["rozgor", 20],
      ["business-growth", 10],
    ];
    for (const biz of businesses) {
      for (const [fund, pct] of allocations) {
        await conn.query(
          `INSERT IGNORE INTO fund_allocations (fund_slug, business_slug, percentage) VALUES (?, ?, ?)`,
          [fund, biz, pct]
        );
      }
    }

    const products = [
      ["Lazer guruch 1kg", "kg", 25000, 18000, 500],
      ["Guruch 5kg", "dona", 110000, 85000, 100],
      ["Pista bodom", "kg", 180000, 140000, 50],
      ["Keshyu", "kg", 95000, 72000, 40],
    ];
    for (const [name, unit, price, cost, stock] of products) {
      const [res] = await conn.query(
        `INSERT INTO products (name, unit, price, cost_price, stock, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [name, unit, price, cost, stock, now, now]
      );
      const productId = (res as { insertId: number }).insertId;
      await conn.query(
        `INSERT IGNORE INTO product_cost_config (product_id, worker_pay, items_per_box, box_type) VALUES (?, 300, 16, 'normal')`,
        [productId]
      );
      const tiers: [string, number][] = [
        ["shop", price as number],
        ["wholesale", Math.round((price as number) * 0.98)],
        ["online", Math.round((price as number) * 1.067)],
      ];
      for (const [tier, p] of tiers) {
        await conn.query(
          `INSERT IGNORE INTO product_prices (product_id, tier, price) VALUES (?, ?, ?)`,
          [productId, tier, p]
        );
      }
    }

    const [packRows] = await conn.query<{ c: number }[]>(
      "SELECT COUNT(*) as c FROM packaging_settings"
    );
    const packCount = (packRows as { c: number }[])[0]?.c ?? 0;
    if (packCount === 0) {
      await conn.query(
        `INSERT INTO packaging_settings (stock, unit_cost, updated_at) VALUES (20000, 700, ?)`,
        [now]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function migrateFunds(pool: ReturnType<typeof getMySqlPool>) {
  await pool.query(
    `UPDATE funds SET name = ?, description = ?, icon = ?, color = ? WHERE slug IN ('entertainment', 'rozgor')`,
    [
      "Ro'zg'or va shaxsiy xarajatlar",
      "Uy-ro'zg'or va shaxsiy ehtiyojlar uchun",
      "home",
      "#ec4899",
    ]
  );
  await pool.query(`UPDATE funds SET slug = 'rozgor' WHERE slug = 'entertainment'`);
  await pool.query(
    `UPDATE fund_deposits SET fund_slug = 'rozgor' WHERE fund_slug = 'entertainment'`
  );
  await pool.query(
    `UPDATE fund_allocations SET fund_slug = 'rozgor' WHERE fund_slug = 'entertainment'`
  );
  await pool.query(
    `UPDATE funds SET description = ? WHERE slug = 'big-purchases'`,
    ["Uy, mashina va katta xaridlar uchun (10%)"]
  );

  const [rows] = await pool.query<{ c: number }[]>(
    `SELECT COUNT(*) as c FROM fund_allocations WHERE fund_slug = 'rozgor' AND business_slug = 'personal' AND percentage = 20`
  );
  if ((rows as { c: number }[])[0]?.c > 0) return;

  await pool.query("DELETE FROM fund_allocations");
  const sources = ["nur-garden", "arenatop", "other-income", "personal"];
  const fundPercents: [string, number][] = [
    ["safety", 10],
    ["big-purchases", 10],
    ["rozgor", 20],
    ["business-growth", 10],
  ];
  for (const src of sources) {
    for (const [fund, pct] of fundPercents) {
      await pool.query(
        `INSERT IGNORE INTO fund_allocations (fund_slug, business_slug, percentage) VALUES (?, ?, ?)`,
        [fund, src, pct]
      );
    }
  }
}

async function migrateProductDefaults(pool: ReturnType<typeof getMySqlPool>) {
  const [products] = await pool.query<{ id: number; price: number }[]>(
    "SELECT id, price FROM products WHERE is_active = 1"
  );
  for (const p of products as { id: number; price: number }[]) {
    await pool.query(
      `INSERT IGNORE INTO product_cost_config (product_id, worker_pay, items_per_box, box_type) VALUES (?, 300, 16, 'normal')`,
      [p.id]
    );
    const base = p.price;
    for (const [tier, price] of [
      ["shop", base],
      ["wholesale", Math.round(base * 0.98)],
      ["online", Math.round(base * 1.067)],
    ] as const) {
      await pool.query(
        `INSERT IGNORE INTO product_prices (product_id, tier, price) VALUES (?, ?, ?)`,
        [p.id, tier, price]
      );
    }
  }
}
