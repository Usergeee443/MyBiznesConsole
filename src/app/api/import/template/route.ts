import { NextResponse } from "next/server";
import { buildTemplateWorkbook } from "@/lib/import-utils";
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

const NAMES: Record<ImportType, string> = {
  transactions: "tranzaksiyalar",
  sales: "savdolar",
  customers: "mijozlar",
  arenatop: "arenatop",
  products: "mahsulotlar",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as ImportType;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "type kerak" }, { status: 400 });
  }

  const buffer = buildTemplateWorkbook(type);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="shablon-${NAMES[type]}.xlsx"`,
    },
  });
}
