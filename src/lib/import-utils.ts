import * as XLSX from "xlsx";
import type { ImportType } from "./utils";

const KEY_ALIASES: Record<string, string> = {
  sana: "date",
  date: "date",
  hisob: "account_slug",
  account_slug: "account_slug",
  account: "account_slug",
  tur: "type",
  type: "type",
  summa: "amount",
  amount: "amount",
  kategoriya: "category",
  category: "category",
  izoh: "description",
  description: "description",
  notes: "notes",
  transfer_hisob: "to_account_slug",
  to_account_slug: "to_account_slug",
  savdo_id: "sale_ref",
  sale_ref: "sale_ref",
  mijoz: "customer_name",
  customer_name: "customer_name",
  customer: "customer_name",
  mahsulot: "product_name",
  product_name: "product_name",
  product: "product_name",
  miqdor: "quantity",
  quantity: "quantity",
  narx: "unit_price",
  unit_price: "unit_price",
  price: "unit_price",
  tolangan: "paid",
  paid: "paid",
  tolov_turi: "payment_type",
  payment_type: "payment_type",
  telefon: "phone",
  phone: "phone",
  manzil: "address",
  address: "address",
  stadiums_added: "stadiums_added",
  stadion_qoshildi: "stadiums_added",
  total_stadiums: "total_stadiums",
  jami_stadion: "total_stadiums",
  users_added: "users_added",
  foydalanuvchi_qoshildi: "users_added",
  total_users: "total_users",
  jami_foydalanuvchi: "total_users",
  bookings: "bookings",
  bronlar: "bookings",
  name: "name",
  nomi: "name",
  unit: "unit",
  birlik: "unit",
  stock: "stock",
  qoldiq: "stock",
  cost_price: "cost_price",
  tannarx: "cost_price",
};

export function normalizeRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const key = rawKey
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    const mapped = KEY_ALIASES[key] ?? key;
    out[mapped] = value;
  }
  return out;
}

export function parseExcelBuffer(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return rows.map(normalizeRow).filter((r) => Object.keys(r).length > 0);
}

export function parseDate(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) {
    return `${dot[3]}-${dot[2].padStart(2, "0")}-${dot[1].padStart(2, "0")}`;
  }
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
}

export function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const n = Number(
    String(val)
      .replace(/\s/g, "")
      .replace(/,/g, "")
      .replace(/so'm/gi, "")
  );
  return Number.isFinite(n) ? n : null;
}

export function parseString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export const IMPORT_TEMPLATES: Record<
  ImportType,
  { headers: string[]; example: (string | number)[] }
> = {
  transactions: {
    headers: [
      "sana",
      "hisob",
      "tur",
      "summa",
      "kategoriya",
      "izoh",
      "transfer_hisob",
    ],
    example: [
      "2024-01-01",
      "personal",
      "expense",
      50000,
      "food",
      "Ovqat",
      "",
    ],
  },
  sales: {
    headers: [
      "sana",
      "savdo_id",
      "mijoz",
      "mahsulot",
      "miqdor",
      "narx",
      "tolangan",
      "tolov_turi",
      "izoh",
    ],
    example: [
      "2024-06-01",
      "1",
      "Do'kon 1",
      "Pomidor",
      10,
      15000,
      150000,
      "cash",
      "",
    ],
  },
  customers: {
    headers: ["nomi", "telefon", "tur", "manzil", "izoh"],
    example: ["Do'kon 1", "+998901234567", "shop", "Toshkent", ""],
  },
  arenatop: {
    headers: [
      "sana",
      "stadion_qoshildi",
      "jami_stadion",
      "foydalanuvchi_qoshildi",
      "jami_foydalanuvchi",
      "bronlar",
      "izoh",
    ],
    example: ["2024-06-01", 2, 50, 10, 500, 25, ""],
  },
  products: {
    headers: ["nomi", "birlik", "narx", "tannarx", "qoldiq"],
    example: ["Pomidor", "kg", 18000, 12000, 100],
  },
};

export function buildTemplateWorkbook(type: ImportType): Buffer {
  const tpl = IMPORT_TEMPLATES[type];
  const ws = XLSX.utils.aoa_to_sheet([tpl.headers, tpl.example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "import");
  return Buffer.from(
    XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as ArrayBuffer
  );
}
