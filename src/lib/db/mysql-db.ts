import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { getMySqlPool, isMySqlConfigured } from "../mysql";
import * as schema from "./mysql-schema";
import { initMySqlDatabase } from "./mysql-init";

export type MysqlDb = MySql2Database<typeof schema>;

let dbInstance: MysqlDb | null = null;
let initPromise: Promise<void> | null = null;

export async function getMysqlDb(): Promise<MysqlDb> {
  if (!isMySqlConfigured()) {
    throw new Error("MySQL sozlanmagan");
  }
  if (!initPromise) {
    initPromise = initMySqlDatabase();
  }
  await initPromise;
  if (!dbInstance) {
    dbInstance = drizzle(getMySqlPool(), { schema, mode: "default" });
  }
  return dbInstance;
}

export async function one<T>(rows: Promise<T[]>): Promise<T | undefined> {
  const r = await rows;
  return r[0];
}
