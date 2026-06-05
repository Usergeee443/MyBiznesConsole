"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { formatMoney, type ImportType } from "@/lib/utils";
import {
  Upload,
  Download,
  Save,
  Wallet,
  PiggyBank,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type AccountRow = {
  slug: string;
  name: string;
  type: string;
  color: string;
  balance: number;
  openingAmount: number;
  openingDate: string | null;
};

type FundRow = {
  slug: string;
  name: string;
  color: string;
  balance: number;
  openingAmount: number;
  openingDate: string | null;
};

const IMPORT_TYPES: { id: ImportType; label: string; hint: string }[] = [
  {
    id: "transactions",
    label: "Tranzaksiyalar",
    hint: "Daromad, xarajat, transferlar (sana, hisob, tur, summa)",
  },
  {
    id: "sales",
    label: "Savdolar",
    hint: "Bir xil savdo_id = bitta savdo, bir nechta mahsulot qatorlari",
  },
  { id: "customers", label: "Mijozlar", hint: "Nomi, telefon, tur (shop/wholesale/online)" },
  { id: "arenatop", label: "ArenaTop statistikasi", hint: "Kunlik bronlar va stadionlar" },
  { id: "products", label: "Mahsulotlar", hint: "Nomi, narx, qoldiq" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<"balance" | "import">("balance");
  const [data, setData] = useState<{
    accounts: AccountRow[];
    funds: FundRow[];
  } | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { amount: string; date: string }>
  >({});
  const [saving, setSaving] = useState<string | null>(null);
  const [importType, setImportType] = useState<ImportType>("transactions");
  const [file, setFile] = useState<File | null>(null);
  const [historical, setHistorical] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: { row: number; message: string }[];
    totalRows?: number;
    dryRun?: boolean;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const json = await res.json();
    setData(json);
    const d: Record<string, { amount: string; date: string }> = {};
    for (const a of json.accounts) {
      d[`acc:${a.slug}`] = {
        amount: String(a.openingAmount || ""),
        date: a.openingDate || new Date().toISOString().split("T")[0],
      };
    }
    for (const f of json.funds) {
      d[`fund:${f.slug}`] = {
        amount: String(f.openingAmount || ""),
        date: f.openingDate || new Date().toISOString().split("T")[0],
      };
    }
    setDrafts(d);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveOpening(
    kind: "account" | "fund",
    slug: string
  ) {
    const key = `${kind === "account" ? "acc" : "fund"}:${slug}`;
    const draft = drafts[key];
    if (!draft) return;

    setSaving(key);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: kind,
        slug,
        amount: Number(draft.amount) || 0,
        date: draft.date,
      }),
    });
    setSaving(null);
    load();
  }

  async function runImport(dryRun: boolean) {
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("type", importType);
    form.append("historical", String(historical));
    form.append("dryRun", String(dryRun));

    const res = await fetch("/api/import", { method: "POST", body: form });
    const json = await res.json();
    setImportResult(json);
    setImporting(false);
    if (!dryRun && res.ok) load();
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Sozlamalar"
        description="Boshlang'ich balanslar va Excel orqali ma'lumot importi"
      />

      <div className="flex gap-2 mb-6">
        <TabBtn
          active={tab === "balance"}
          onClick={() => setTab("balance")}
          icon={<Wallet size={16} />}
          label="Boshlang'ich balanslar"
        />
        <TabBtn
          active={tab === "import"}
          onClick={() => setTab("import")}
          icon={<FileSpreadsheet size={16} />}
          label="Excel import"
        />
      </div>

      {tab === "balance" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <Wallet size={18} className="text-emerald-400" />
              Hisoblar
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              Sayt ishga tushishidan oldingi mavjud balansni kiriting. Bu alohida
              &quot;boshlang&apos;ich balans&quot; sifatida saqlanadi.
            </p>
            <div className="space-y-3">
              {data.accounts.map((a) => (
                <BalanceRow
                  key={a.slug}
                  name={a.name}
                  slug={a.slug}
                  color={a.color}
                  balance={a.balance}
                  draftKey={`acc:${a.slug}`}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  saving={saving === `acc:${a.slug}`}
                  onSave={() => saveOpening("account", a.slug)}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              <PiggyBank size={18} className="text-emerald-400" />
              Jamg&apos;armalar
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              Jamg&apos;armalardagi mavjud mablag&apos;ni ham shu yerda
              belgilashingiz mumkin.
            </p>
            <div className="space-y-3">
              {data.funds.map((f) => (
                <BalanceRow
                  key={f.slug}
                  name={f.name}
                  slug={f.slug}
                  color={f.color}
                  balance={f.balance}
                  draftKey={`fund:${f.slug}`}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  saving={saving === `fund:${f.slug}`}
                  onSave={() => saveOpening("fund", f.slug)}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "import" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">
                Import turi
              </label>
              <select
                value={importType}
                onChange={(e) => {
                  setImportType(e.target.value as ImportType);
                  setImportResult(null);
                }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm"
              >
                {IMPORT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 mt-2">
                {IMPORT_TYPES.find((t) => t.id === importType)?.hint}
              </p>
            </div>

            <a
              href={`/api/import/template?type=${importType}`}
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
            >
              <Download size={16} />
              Shablon yuklab olish (.xlsx)
            </a>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={historical}
                onChange={(e) => setHistorical(e.target.checked)}
                className="rounded border-zinc-600"
              />
              <span className="text-sm text-zinc-300">
                Tarixiy ma&apos;lumot (balans va omborga ta&apos;sir qilmasin)
              </span>
            </label>

            <div>
              <label className="text-sm text-zinc-400 block mb-2">
                Excel fayl
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setImportResult(null);
                }}
                className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-zinc-800 file:text-zinc-200"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={!file || importing}
                onClick={() => runImport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50"
              >
                <Upload size={16} />
                Tekshirish (preview)
              </button>
              <button
                disabled={!file || importing}
                onClick={() => runImport(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Upload size={16} />
                {importing ? "Import..." : "Import qilish"}
              </button>
            </div>
          </div>

          {importResult && (
            <div
              className={`rounded-2xl border p-5 ${
                importResult.errors?.length
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-emerald-500/30 bg-emerald-500/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {importResult.errors?.length ? (
                  <AlertCircle size={18} className="text-amber-400" />
                ) : (
                  <CheckCircle size={18} className="text-emerald-400" />
                )}
                <span className="text-white font-medium">
                  {importResult.dryRun ? "Tekshirish natijasi" : "Import natijasi"}
                </span>
              </div>
              <p className="text-sm text-zinc-300">
                Muvaffaqiyatli: <strong>{importResult.success}</strong>
                {importResult.totalRows !== undefined && (
                  <> / {importResult.totalRows} qator</>
                )}
              </p>
              {importResult.errors?.length > 0 && (
                <ul className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                  {importResult.errors.map((e, i) => (
                    <li key={i} className="text-xs text-amber-300/90">
                      Qator {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 text-sm text-zinc-500 space-y-2">
            <p className="font-medium text-zinc-400">Maslahatlar</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Avval shablonni yuklab oling va to&apos;ldiring</li>
              <li>Savdolarda bir nechta mahsulot uchun bir xil savdo_id ishlating</li>
              <li>Mijoz va mahsulot nomlari avtomatik yaratiladi (bo&apos;lmasa)</li>
              <li>Tarixiy import balansga qo&apos;shilmaydi — avval boshlang&apos;ich balansni kiriting</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BalanceRow({
  name,
  slug,
  color,
  balance,
  draftKey,
  drafts,
  setDrafts,
  saving,
  onSave,
}: {
  name: string;
  slug: string;
  color: string;
  balance: number;
  draftKey: string;
  drafts: Record<string, { amount: string; date: string }>;
  setDrafts: React.Dispatch<
    React.SetStateAction<Record<string, { amount: string; date: string }>>
  >;
  saving: boolean;
  onSave: () => void;
}) {
  const draft = drafts[draftKey] ?? { amount: "", date: "" };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-white">{name}</span>
          <span className="text-xs text-zinc-600">{slug}</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Joriy balans: {formatMoney(balance)}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-zinc-500 block mb-1">
            Boshlang&apos;ich summa
          </label>
          <input
            type="number"
            min={0}
            value={draft.amount}
            onChange={(e) =>
              setDrafts((d) => ({
                ...d,
                [draftKey]: { ...draft, amount: e.target.value },
              }))
            }
            placeholder="0"
            className="w-36 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Sana</label>
          <input
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDrafts((d) => ({
                ...d,
                [draftKey]: { ...draft, date: e.target.value },
              }))
            }
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
          />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
        >
          <Save size={14} />
          {saving ? "..." : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
