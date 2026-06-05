import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const PERSONAL_EXPENSE_CATEGORIES = [
  { id: "taxi", label: "Taksi", icon: "car" },
  { id: "food", label: "Ovqat", icon: "utensils" },
  { id: "clothes", label: "Kiyim", icon: "shirt" },
  { id: "health", label: "Salomatlik", icon: "heart-pulse" },
  { id: "transport", label: "Transport", icon: "bus" },
  { id: "other", label: "Boshqa", icon: "more-horizontal" },
] as const;

export const BUSINESS_EXPENSE_CATEGORIES = [
  { id: "salary", label: "Ish haqi", icon: "users" },
  { id: "nurse", label: "Hamshira", icon: "stethoscope" },
  { id: "supplies", label: "Materiallar", icon: "package" },
  { id: "delivery", label: "Yetkazib berish", icon: "truck" },
  { id: "rent", label: "Ijara", icon: "building" },
  { id: "other", label: "Boshqa", icon: "more-horizontal" },
] as const;

export const CUSTOMER_TYPES = {
  wholesale: "Optom",
  shop: "Do'kon",
  online: "Online",
} as const;

export const ARENATOP_COMMISSION = 2890;

export const OPENING_BALANCE_CATEGORY = "opening_balance";
export const OPENING_FUND_SOURCE = "opening";

export type ImportType =
  | "transactions"
  | "sales"
  | "customers"
  | "arenatop"
  | "products";

export type ImportResult = {
  success: number;
  errors: { row: number; message: string }[];
  preview?: Record<string, unknown>[];
};
