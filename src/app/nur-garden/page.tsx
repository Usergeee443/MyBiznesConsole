"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/ui/BalanceCard";
import { formatMoney, formatDate, CUSTOMER_TYPES } from "@/lib/utils";
import { Plus, Package, Users, ShoppingCart, AlertCircle, Trash2, Edit, X, Calculator } from "lucide-react";
import { CostingTab } from "@/components/nur-garden/CostingTab";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type Tab = "products" | "costing" | "customers" | "sales" | "debts" | "analytics";

export default function NurGardenPage() {
  const [tab, setTab] = useState<Tab>("products");
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/nur-garden");
    setData(await res.json());
  }, []);

  async function apiSubmit(action: string, payload: Record<string, unknown>) {
    await fetch("/api/nur-garden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
  }

  useEffect(() => { load(); }, [load]);

  async function submit(action: string, payload: any) {
    await fetch("/api/nur-garden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    setModal(null);
    setForm({});
    load();
  }

  if (!data) return <LoadingSpinner />;

  const { products, customers, sales, debts, analytics, costing } = data;
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "products", label: "Mahsulotlar", icon: <Package size={16} /> },
    { id: "costing", label: "Tan narx & Xarajat", icon: <Calculator size={16} /> },
    { id: "customers", label: "Mijozlar", icon: <Users size={16} /> },
    { id: "sales", label: "Savdolar", icon: <ShoppingCart size={16} /> },
    { id: "debts", label: "Qarzlar", icon: <AlertCircle size={16} /> },
    { id: "analytics", label: "Analitika", icon: <BarChartIcon /> },
  ];

  return (
    <>
      <PageHeader
        title="Nur&Garden"
        description="Oziq-ovqat mahsulotlari savdosi"
        action={
          !["costing", "analytics", "debts"].includes(tab) ? (
            <button
              onClick={() => { setModal(tab === "products" ? "addProduct" : tab === "customers" ? "addCustomer" : tab === "sales" ? "addSale" : null); setForm({}); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              {tab === "products" ? "Mahsulot" : tab === "customers" ? "Mijoz" : tab === "sales" ? "Savdo" : "Qo'shish"}
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Jami daromad" value={formatMoney(analytics.totalRevenue)} color="#22c55e" />
        <StatCard label="Bu oy" value={formatMoney(analytics.monthRevenue)} sub={`${analytics.monthSalesCount} savdo`} color="#10b981" />
        <StatCard label="Qarz" value={formatMoney(analytics.totalDebt)} color="#ef4444" />
        <StatCard label="Kam qolgan" value={`${analytics.lowStock.length} ta`} sub="20 dan kam" color="#f59e0b" />
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              tab === t.id ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{p.unit}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setModal("editProduct"); setForm(p); }} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => submit("deleteProduct", { id: p.id })} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-end">
                <div>
                  <p className="text-lg font-bold text-emerald-400">{formatMoney(p.price)}</p>
                  <p className="text-xs text-zinc-600">Xarid: {formatMoney(p.costPrice)}</p>
                </div>
                <div className={`text-right ${p.stock < 20 ? "text-amber-400" : "text-zinc-400"}`}>
                  <p className="text-sm font-medium">{p.stock} {p.unit}</p>
                  <p className="text-xs">Qoldiq</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "costing" && (
        <CostingTab
          costing={costing}
          products={products}
          onRefresh={load}
          submit={apiSubmit}
        />
      )}

      {tab === "customers" && (
        <div className="space-y-2">
          {customers.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div>
                <p className="font-medium text-white">{c.name}</p>
                <p className="text-xs text-zinc-500">{CUSTOMER_TYPES[c.type as keyof typeof CUSTOMER_TYPES] ?? c.type} · {c.phone ?? "—"}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">{c.address ?? "—"}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "sales" && (
        <div className="space-y-2">
          {sales.map(({ sale, customer }: any) => (
            <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div>
                <p className="font-medium text-white">#{sale.id} · {customer?.name ?? "Noma'lum"}</p>
                <p className="text-xs text-zinc-500">{formatDate(sale.date)} · {sale.paymentType}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-semibold text-emerald-400">{formatMoney(sale.total)}</p>
                  {sale.paid < sale.total && (
                    <p className="text-xs text-red-400">Qarz: {formatMoney(sale.total - sale.paid)}</p>
                  )}
                </div>
                <button onClick={() => submit("deleteSale", { id: sale.id })} className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "debts" && (
        <div className="space-y-2">
          {debts.filter((d: any) => d.debt.status !== "paid").map(({ debt, customer }: any) => (
            <div key={debt.id} className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <div>
                <p className="font-medium text-white">{customer?.name ?? "Noma'lum"}</p>
                <p className="text-xs text-zinc-500">
                  Jami: {formatMoney(debt.amount)} · To'langan: {formatMoney(debt.paidAmount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-red-400">
                  {formatMoney(debt.amount - debt.paidAmount)}
                </span>
                <button
                  onClick={() => { setModal("payDebt"); setForm({ id: debt.id, amount: debt.amount - debt.paidAmount }); }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/30"
                >
                  To'lash
                </button>
              </div>
            </div>
          ))}
          {debts.filter((d: any) => d.debt.status !== "paid").length === 0 && (
            <p className="text-center text-zinc-600 py-8">Qarz yo&apos;q 🎉</p>
          )}
        </div>
      )}

      {tab === "analytics" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-3">Top mahsulotlar</h3>
            <div className="space-y-2">
              {analytics.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 text-xs text-zinc-600">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-300">{p.name}</span>
                      <span className="text-emerald-400">{formatMoney(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.min(100, (p.revenue / (analytics.topProducts[0]?.revenue || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analytics.salesByDay.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3">Kunlik savdo</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.salesByDay.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }}
                    formatter={(v) => formatMoney(Number(v))}
                  />
                  <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "addProduct" && (
            <ProductForm form={form} setForm={setForm} onSubmit={() => submit("addProduct", form)} title="Yangi mahsulot" />
          )}
          {modal === "editProduct" && (
            <ProductForm form={form} setForm={setForm} onSubmit={() => submit("updateProduct", form)} title="Mahsulotni tahrirlash" />
          )}
          {modal === "addCustomer" && (
            <CustomerForm form={form} setForm={setForm} onSubmit={() => submit("addCustomer", form)} />
          )}
          {modal === "addSale" && (
            <SaleForm form={form} setForm={setForm} products={products} customers={customers} onSubmit={(data: Record<string, unknown>) => submit("createSale", data)} />
          )}
          {modal === "payDebt" && (
            <PayDebtForm form={form} setForm={setForm} onSubmit={() => submit("payDebt", form)} />
          )}
        </Modal>
      )}
    </>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function BarChartIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="float-right p-1 rounded-lg hover:bg-zinc-800 text-zinc-500"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-3">
      <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
      <input {...props} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
    </div>
  );
}

function ProductForm({ form, setForm, onSubmit, title }: any) {
  return (
    <>
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <Input label="Nomi" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="O'lchov (kg, dona...)" value={form.unit ?? "kg"} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
      <Input label="Sotuv narxi" type="number" value={form.price ?? ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
      <Input label="Xarid narxi" type="number" value={form.costPrice ?? ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
      <Input label="Qoldiq" type="number" value={form.stock ?? ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
      <button onClick={onSubmit} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium mt-2">Saqlash</button>
    </>
  );
}

function CustomerForm({ form, setForm, onSubmit }: any) {
  return (
    <>
      <h3 className="text-lg font-bold text-white mb-4">Yangi mijoz</h3>
      <Input label="Ism" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Telefon" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <div className="mb-3">
        <label className="text-xs text-zinc-500 mb-1 block">Turi</label>
        <select value={form.type ?? "shop"} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
          <option value="wholesale">Optom</option>
          <option value="shop">Do&apos;kon</option>
          <option value="online">Online</option>
        </select>
      </div>
      <Input label="Manzil" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <button onClick={onSubmit} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium mt-2">Saqlash</button>
    </>
  );
}

function SaleForm({ form, setForm, products, customers, onSubmit }: any) {
  const [items, setItems] = useState([{ productId: products[0]?.id ?? 0, quantity: 1, price: products[0]?.price ?? 0 }]);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <>
      <h3 className="text-lg font-bold text-white mb-4">Yangi savdo</h3>
      <div className="mb-3">
        <label className="text-xs text-zinc-500 mb-1 block">Mijoz</label>
        <select value={form.customerId ?? ""} onChange={(e) => setForm({ ...form, customerId: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
          <option value="">Tanlang...</option>
          {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 mb-2">
          <select
            value={item.productId}
            onChange={(e) => {
              const p = products.find((pr: any) => pr.id === Number(e.target.value));
              const newItems = [...items];
              newItems[idx] = { ...item, productId: Number(e.target.value), price: p?.price ?? 0 };
              setItems(newItems);
            }}
            className="flex-1 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          >
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" value={item.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = Number(e.target.value); setItems(n); }} className="w-20 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" placeholder="Soni" />
          <input type="number" value={item.price} onChange={(e) => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} className="w-28 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" placeholder="Narx" />
        </div>
      ))}
      <button onClick={() => setItems([...items, { productId: products[0]?.id, quantity: 1, price: products[0]?.price ?? 0 }])} className="text-xs text-emerald-400 mb-3 hover:underline">+ Mahsulot qo'shish</button>

      <div className="mb-3">
        <label className="text-xs text-zinc-500 mb-1 block">To'lov turi</label>
        <select value={form.paymentType ?? "cash"} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
          <option value="cash">Naqd</option>
          <option value="credit">Nasiya (qarz)</option>
          <option value="partial">Qisman</option>
        </select>
      </div>
      <Input label="To'langan summa" type="number" value={form.paid ?? (form.paymentType === "credit" ? 0 : total)} onChange={(e) => setForm({ ...form, paid: Number(e.target.value) })} />
      <p className="text-sm text-zinc-400 mb-3">Jami: <span className="text-emerald-400 font-semibold">{formatMoney(total)}</span></p>
      <button onClick={() => onSubmit({ ...form, items, paid: form.paid ?? (form.paymentType === "credit" ? 0 : total) })} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium">Savdo yaratish</button>
    </>
  );
}

function PayDebtForm({ form, setForm, onSubmit }: any) {
  return (
    <>
      <h3 className="text-lg font-bold text-white mb-4">Qarz to&apos;lash</h3>
      <Input label="Summa" type="number" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
      <button onClick={onSubmit} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium mt-2">To&apos;lash</button>
    </>
  );
}
