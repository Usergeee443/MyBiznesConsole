import { NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/import-utils";
import { runBulkImport } from "@/lib/bulk-import";
import type { ImportType } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES: ImportType[] = [
  "transactions",
  "sales",
  "customers",
  "arenatop",
  "products",
];

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const type = form.get("type") as ImportType;
  const historical = form.get("historical") !== "false";
  const dryRun = form.get("dryRun") === "true";

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Excel fayl kerak" }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Import turi noto'g'ri" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseExcelBuffer(buffer);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Fayl bo'sh yoki o'qib bo'lmadi" },
      { status: 400 }
    );
  }

  const result = await runBulkImport(type, rows, { historical, dryRun });
  return NextResponse.json({
    ...result,
    totalRows: rows.length,
    dryRun,
  });
}
