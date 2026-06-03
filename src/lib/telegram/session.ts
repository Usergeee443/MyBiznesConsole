import { sqlite } from "../db/index";
import { getMySqlPool, isMySqlConfigured } from "../mysql";

export type SessionData = Record<string, unknown>;

function ensureSqliteTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id INTEGER PRIMARY KEY,
      step TEXT,
      data TEXT,
      updated_at TEXT NOT NULL
    )
  `);
}

async function ensureMysqlTable() {
  const pool = getMySqlPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id BIGINT PRIMARY KEY,
      step VARCHAR(64),
      data TEXT,
      updated_at VARCHAR(32) NOT NULL
    )
  `);
}

export async function getSession(chatId: number): Promise<{
  step: string | null;
  data: SessionData;
}> {
  if (isMySqlConfigured()) {
    await ensureMysqlTable();
    const pool = getMySqlPool();
    const [rows] = await pool.query<
      { step: string | null; data: string | null }[]
    >("SELECT step, data FROM telegram_sessions WHERE chat_id = ?", [chatId]);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (!row) return { step: null, data: {} };
    return {
      step: row.step,
      data: row.data ? (JSON.parse(row.data) as SessionData) : {},
    };
  }

  ensureSqliteTable();
  const row = sqlite
    .prepare("SELECT step, data FROM telegram_sessions WHERE chat_id = ?")
    .get(chatId) as { step: string | null; data: string | null } | undefined;
  if (!row) return { step: null, data: {} };
  return {
    step: row.step,
    data: row.data ? (JSON.parse(row.data) as SessionData) : {},
  };
}

export async function setSession(
  chatId: number,
  step: string | null,
  data: SessionData = {}
) {
  const now = new Date().toISOString();
  const payload = JSON.stringify(data);

  if (isMySqlConfigured()) {
    await ensureMysqlTable();
    const pool = getMySqlPool();
    await pool.query(
      `INSERT INTO telegram_sessions (chat_id, step, data, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         step = VALUES(step),
         data = VALUES(data),
         updated_at = VALUES(updated_at)`,
      [chatId, step, payload, now]
    );
    return;
  }

  ensureSqliteTable();
  sqlite
    .prepare(
      `INSERT INTO telegram_sessions (chat_id, step, data, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET
         step = excluded.step,
         data = excluded.data,
         updated_at = excluded.updated_at`
    )
    .run(chatId, step, payload, now);
}

export async function clearSession(chatId: number) {
  if (isMySqlConfigured()) {
    await ensureMysqlTable();
    await getMySqlPool().query(
      "DELETE FROM telegram_sessions WHERE chat_id = ?",
      [chatId]
    );
    return;
  }

  ensureSqliteTable();
  sqlite.prepare("DELETE FROM telegram_sessions WHERE chat_id = ?").run(chatId);
}
