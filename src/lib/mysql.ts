import mysql, { type Pool, type RowDataPacket } from "mysql2/promise";

let pool: Pool | null = null;

export function isMySqlConfigured(): boolean {
  return Boolean(
    process.env.MYSQL_HOST &&
      process.env.MYSQL_USER &&
      process.env.MYSQL_PASSWORD &&
      process.env.MYSQL_DATABASE
  );
}

export function getMySqlPool(): Pool {
  if (pool) return pool;

  if (!isMySqlConfigured()) {
    throw new Error("MySQL sozlamalari to'liq emas");
  }

  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl:
      process.env.MYSQL_SSL === "true"
        ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" }
        : undefined,
  });

  return pool;
}

export async function testMySqlConnection() {
  const db = getMySqlPool();
  const [rows] = await db.query<RowDataPacket[]>("SELECT 1 as ok");
  return rows?.[0]?.ok === 1;
}
