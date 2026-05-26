import { sqlite } from "../db/index";

export type SessionData = Record<string, unknown>;

function ensureTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id INTEGER PRIMARY KEY,
      step TEXT,
      data TEXT,
      updated_at TEXT NOT NULL
    )
  `);
}

export function getSession(chatId: number): {
  step: string | null;
  data: SessionData;
} {
  ensureTable();
  const row = sqlite
    .prepare("SELECT step, data FROM telegram_sessions WHERE chat_id = ?")
    .get(chatId) as { step: string | null; data: string | null } | undefined;
  if (!row) return { step: null, data: {} };
  return {
    step: row.step,
    data: row.data ? (JSON.parse(row.data) as SessionData) : {},
  };
}

export function setSession(
  chatId: number,
  step: string | null,
  data: SessionData = {}
) {
  ensureTable();
  const now = new Date().toISOString();
  sqlite
    .prepare(
      `INSERT INTO telegram_sessions (chat_id, step, data, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET
         step = excluded.step,
         data = excluded.data,
         updated_at = excluded.updated_at`
    )
    .run(chatId, step, JSON.stringify(data), now);
}

export function clearSession(chatId: number) {
  ensureTable();
  sqlite.prepare("DELETE FROM telegram_sessions WHERE chat_id = ?").run(chatId);
}
