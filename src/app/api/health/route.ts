import { NextResponse } from "next/server";
export { dynamic, runtime } from "@/lib/api-config";

export async function GET() {
  return NextResponse.json({ ok: true, service: "mybiznes-console" });
}
