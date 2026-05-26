"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { BalanceCard, TotalBalanceCard } from "@/components/ui/BalanceCard";
import { QuickExpenseButton } from "@/components/finance/QuickExpense";
import { formatMoney, formatDate, BUSINESS_EXPENSE_CATEGORIES, PERSONAL_EXPENSE_CATEGORIES } from "@/lib/utils";
import { Plus, ArrowUpRight, ArrowDownRight, Leaf, Building2, User, X, Pencil, Trash2 } from "lucide-react";

export default function FinancePage() {
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState<"income" | "expense" | "edit" | null>(null);
  const [form, setForm] = useState<any>({ accountSlug: "personal", type: "expense" });

  const load = useCallback(async () => {
    const res = await fetch("/api/finance");
    setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (modal === "edit" && form.id) {
      await fetch("/api/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModal(null);
    setForm({ accountSlug: "personal", type: "expense" });
    load();
  }

  async function removeTx(id: number) {
    if (!confirm("O'chirishni xohlaysizmi?")) return;
    await fetch(`/api/finance?id=${id}`, { method: "DELETE" });
    load();
  }

  if (!data) return <Spinner />;

  const { balance, transactions, expenses } = data;
  const personalExpenses = expenses.filter((e: any) => e.accountSlug === "personal");
  const businessExpenses = expenses.filter((e: any) => e.accountSlug !== "personal");

  return (
    <>
      <PageHeader
        title="Moliya"
        description="Daromad, xarajat va balanslar"
        action={
          <div className="flex gap-2">
            <button onClick={() => { setModal("income"); setForm({ type: "income", accountSlug: "other-income" }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30">
              <Plus size={16} />Daromad
            </button>
            <button onClick={() => { setModal("expense"); setForm({ type: "expense", accountSlug: "personal" }); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30">
              <Plus size={16} />Xarajat
            </button>
          </div>
        }
      />

      <TotalBalanceCard total={balance.total} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <BalanceCard name="Nur&Garden" balance={balance.nurGarden.balance} color="#22c55e" icon={<Leaf size={20} />} />
        <BalanceCard name="Osco Holding" balance={balance.osco.balance} color="#6366f1" icon={<Building2 size={20} />} children={balance.osco.children} />
        <BalanceCard name="Shaxsiy" balance={balance.personal.balance} color="#f59e0b" icon={<User size={20} />} />
        <BalanceCard name="Boshqa daromad" balance={balance.otherIncome.balance} color="#64748b" icon={<Plus size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ExpenseSection title="Shaxsiy xarajatlar (bu oy)" expenses={personalExpenses} categories={PERSONAL_EXPENSE_CATEGORIES} />
        <ExpenseSection title="Biznes xarajatlari (bu oy)" expenses={businessExpenses} categories={BUSINESS_EXPENSE_CATEGORIES} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Barcha tranzaksiyalar</h2>
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                  {tx.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div>
                  <p className="text-sm text-zinc-300">{tx.description ?? tx.category ?? "—"}</p>
                  <p className="text-xs text-zinc-600">{formatDate(tx.date)} · {tx.accountSlug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount)}
                </span>
                <button
                  onClick={() => { setForm({ ...tx }); setModal("edit"); }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => removeTx(tx.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <QuickExpenseButton onSuccess={load} />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <button onClick={() => setModal(null)} className="float-right p-1 rounded-lg hover:bg-zinc-800 text-zinc-500"><X size={18} /></button>
            <h3 className="text-lg font-bold text-white mb-4">
              {modal === "edit" ? "Tahrirlash" : modal === "income" ? "Daromad qo'shish" : "Xarajat qo'shish"}
            </h3>

            {modal === "edit" && (
              <div className="mb-3">
                <label className="text-xs text-zinc-500 mb-1 block">Turi</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
                  <option value="income">Daromad</option>
                  <option value="expense">Xarajat</option>
                </select>
              </div>
            )}

            <div className="mb-3">
              <label className="text-xs text-zinc-500 mb-1 block">Hisob</label>
              <select value={form.accountSlug} onChange={(e) => setForm({ ...form, accountSlug: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
                <option value="personal">Shaxsiy</option>
                <option value="nur-garden">Nur&Garden</option>
                <option value="arenatop">ArenaTop</option>
                <option value="wedy">Wedy</option>
                <option value="other-income">Boshqa daromad</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="text-xs text-zinc-500 mb-1 block">Kategoriya</label>
              <select value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
                {((modal === "expense" || (modal === "edit" && form.type === "expense")) && form.accountSlug === "personal" ? PERSONAL_EXPENSE_CATEGORIES : BUSINESS_EXPENSE_CATEGORIES).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <input type="number" placeholder="Summa" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm mb-3" />
            <input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm mb-3" />
            <input type="text" placeholder="Izoh" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm mb-4" />

            <button onClick={submit} className={`w-full py-2.5 rounded-xl text-white font-medium ${modal === "income" ? "bg-emerald-500 hover:bg-emerald-400" : "bg-red-500 hover:bg-red-400"}`}>
              Saqlash
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ExpenseSection({ title, expenses, categories }: any) {
  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">{title}</h2>
        <span className="text-sm font-semibold text-red-400">{formatMoney(total)}</span>
      </div>
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-4">Xarajat yo&apos;q</p>
        ) : (
          expenses.map((e: any) => (
            <div key={e.id} className="flex justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div>
                <p className="text-sm text-zinc-300">{e.description ?? categories.find((c: any) => c.id === e.category)?.label ?? e.category}</p>
                <p className="text-xs text-zinc-600">{formatDate(e.date)}</p>
              </div>
              <span className="text-sm text-red-400 font-medium">-{formatMoney(e.amount)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
