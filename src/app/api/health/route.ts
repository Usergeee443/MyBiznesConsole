import { NextResponse } from "next/server";
import { isMySqlConfigured, testMySqlConnection } from "@/lib/mysql";
import { initMySqlDatabase } from "@/lib/db/mysql-init";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let mysql: "not_configured" | "ok" | "error" = "not_configured";

  if (isMySqlConfigured()) {
    try {
      await initMySqlDatabase();
      const ok = await testMySqlConnection();
      mysql = ok ? "ok" : "error";
    } catch {
      mysql = "error";
    }
  }

  return NextResponse.json({
    ok: true,
    service: "mybiznes-console",
    mysql,
    database: mysql === "ok" ? "mysql" : "sqlite",
  });
}
