"use client";

import { useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, Trash2, Package, Truck, Box } from "lucide-react";

export function CostingTab({
  costing,
  products,
  onRefresh,
  submit,
}: {
  costing: any;
  products: any[];
  onRefresh: () => void;
  submit: (action: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [purchaseForm, setPurchaseForm] = useState<any>({ paymentType: "cash" });
  const [boxForm, setBoxForm] = useState<any>({ boxType: "normal" });
  const [logisticsForm, setLogisticsForm] = useState<any>({});

  if (!costing) return null;

  const { packaging, purchases, supplierDebts, boxPurchases, logistics, products: costProducts } = costing;

  return (
    <div className="space-y-8">
      <section className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3">
          <Package size={16} /> Paketlar
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500">Qoldiq (dona)</label>
            <input
              type="number"
              defaultValue={packaging?.stock ?? 20000}
              onBlur={(e) =>
                submit("updatePackaging", { stock: Number(e.target.value) })
              }
              className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Paket narxi (avtomatik)</label>
            <input
              type="number"
              defaultValue={packaging?.unitCost ?? 700}
              onBlur={(e) =>
                submit("updatePackaging", { unitCost: Number(e.target.value) })
              }
              className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">Sotib olish (xom ashyo)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <select
            value={purchaseForm.productId ?? ""}
            onChange={(e) => {
              const p = products.find((x) => x.id === Number(e.target.value));
              setPurchaseForm({
                ...purchaseForm,
                productId: Number(e.target.value),
                name: p?.name ?? "",
              });
            }}
            className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          >
            <option value="">Mahsulot tanlang</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            placeholder="Nomi"
            value={purchaseForm.name ?? ""}
            onChange={(e) => setPurchaseForm({ ...purchaseForm, name: e.target.value })}
            className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          />
          <input
            type="number"
            placeholder="Miqdor (kg)"
            value={purchaseForm.quantity ?? ""}
            onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })}
            className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          />
          <input
            type="number"
            placeholder="Narx (masalan 12000)"
            value={purchaseForm.unitPrice ?? ""}
            onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: Number(e.target.value) })}
            className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          />
          <select
            value={purchaseForm.paymentType}
            onChange={(e) => setPurchaseForm({ ...purchaseForm, paymentType: e.target.value })}
            className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
          >
            <option value="cash">Naqd</option>
            <option value="credit">Qarzga</option>
          </select>
          {purchaseForm.paymentType === "credit" && (
            <input
              type="number"
              placeholder="To'langan qismi"
              value={purchaseForm.paid ?? 0}
              onChange={(e) => setPurchaseForm({ ...purchaseForm, paid: Number(e.target.value) })}
              className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm"
            />
          )}
        </div>
        <button
          onClick={async () => {
            await submit("addPurchase", purchaseForm);
            setPurchaseForm({ paymentType: "cash" });
            onRefresh();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm"
        >
          <Plus size={14} /> Sotib olish qo&apos;shish
        </button>

        <div className="mt-4 space-y-2">
          {purchases?.map(({ purchase, product }: any) => (
            <div key={purchase.id} className="flex justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/50">
              <div>
                <p className="text-sm text-white">{purchase.name}</p>
                <p className="text-xs text-zinc-500">
                  {purchase.quantity} {product?.unit ?? "kg"} × {formatMoney(purchase.unitPrice)} · {purchase.paymentType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-400">{formatMoney(purchase.total)}</span>
                <button
                  onClick={async () => {
                    if (confirm("O'chirish?")) {
                      await submit("deletePurchase", { id: purchase.id });
                      onRefresh();
                    }
                  }}
                  className="p-1 text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {supplierDebts?.filter((d: any) => d.debt.status !== "paid").length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-2">Yetkazib beruvchi qarzlari</p>
            {supplierDebts
              .filter((d: any) => d.debt.status !== "paid")
              .map(({ debt, purchase }: any) => (
                <div key={debt.id} className="flex justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-2">
                  <span className="text-sm text-zinc-300">{purchase?.name}</span>
                  <button
                    onClick={async () => {
                      const amount = debt.amount - debt.paidAmount;
                      await submit("paySupplierDebt", { id: debt.id, amount });
                      onRefresh();
                    }}
                    className="text-xs text-emerald-400"
                  >
                    To&apos;lash {formatMoney(debt.amount - debt.paidAmount)}
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 mb-3">
            <Box size={16} /> Karobka xaridi
          </h3>
          <div className="flex gap-2 mb-2 flex-wrap">
            <input type="number" placeholder="Soni" className="flex-1 min-w-[80px] px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" value={boxForm.quantity ?? ""} onChange={(e) => setBoxForm({ ...boxForm, quantity: Number(e.target.value) })} />
            <input type="number" placeholder="Narxi (5000-5500)" className="flex-1 min-w-[100px] px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" value={boxForm.unitCost ?? ""} onChange={(e) => setBoxForm({ ...boxForm, unitCost: Number(e.target.value) })} />
            <select value={boxForm.boxType} onChange={(e) => setBoxForm({ ...boxForm, boxType: e.target.value })} className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm">
              <option value="normal">Oddiy (16 ta)</option>
              <option value="large">Katta (24 ta)</option>
            </select>
            <button onClick={async () => { await submit("addBoxPurchase", boxForm); setBoxForm({ boxType: "normal" }); onRefresh(); }} className="px-3 py-2 rounded-xl bg-zinc-700 text-white text-sm">+</button>
          </div>
          {boxPurchases?.map((b: any) => (
            <div key={b.id} className="text-xs text-zinc-400 py-1 flex justify-between">
              <span>{b.quantity} ta × {formatMoney(b.unitCost)} ({b.boxType === "large" ? "24" : "16"}/quti)</span>
              <button onClick={async () => { await submit("deleteBoxPurchase", { id: b.id }); onRefresh(); }} className="text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2 mb-3">
            <Truck size={16} /> Logistika
          </h3>
          <div className="flex gap-2 mb-2">
            <input type="number" placeholder="Summa (1 000 000)" className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm" value={logisticsForm.amount ?? ""} onChange={(e) => setLogisticsForm({ ...logisticsForm, amount: Number(e.target.value) })} />
            <button onClick={async () => { await submit("addLogistics", logisticsForm); setLogisticsForm({}); onRefresh(); }} className="px-3 py-2 rounded-xl bg-zinc-700 text-white text-sm">+</button>
          </div>
          <p className="text-xs text-zinc-600 mb-2">Logistika barcha sotib olingan mahsulotlarga bo&apos;linadi</p>
          {logistics?.map((l: any) => (
            <div key={l.id} className="text-xs text-zinc-400 py-1 flex justify-between">
              <span>{formatDate(l.date)} — {formatMoney(l.amount)}</span>
              <button onClick={async () => { await submit("deleteLogistics", { id: l.id }); onRefresh(); }} className="text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">Tan narx va foyda (har mahsulot)</h3>
        <div className="space-y-4">
          {costProducts?.map((item: any) => (
            <ProductCostCard key={item.id} item={item} submit={submit} onRefresh={onRefresh} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductCostCard({
  item,
  submit,
  onRefresh,
}: {
  item: any;
  submit: (action: string, data: Record<string, unknown>) => Promise<void>;
  onRefresh: () => void;
}) {
  const b = item.cost?.breakdown;
  const margins = item.cost?.margins;
  const prices = item.prices ?? [];
  const shop = prices.find((p: any) => p.tier === "shop")?.price ?? 15000;
  const wholesale = prices.find((p: any) => p.tier === "wholesale")?.price ?? 14700;
  const online = prices.find((p: any) => p.tier === "online")?.price ?? 16000;

  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <h4 className="font-semibold text-white mb-3">{item.name}</h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <ConfigInput label="Ishchi haqi" defaultValue={item.cost?.config?.workerPay ?? 300} onSave={(v) => submit("updateProductCostConfig", { productId: item.id, workerPay: v })} />
        <ConfigInput label="Qutidagi dona" defaultValue={item.cost?.config?.itemsPerBox ?? 16} onSave={(v) => submit("updateProductCostConfig", { productId: item.id, itemsPerBox: v })} />
        <select
          defaultValue={item.cost?.config?.boxType ?? "normal"}
          onChange={(e) => submit("updateProductCostConfig", { productId: item.id, boxType: e.target.value })}
          className="px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs"
        >
          <option value="normal">Oddiy quti (16)</option>
          <option value="large">Katta quti (24)</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <PriceInput label="Do'kon" defaultValue={shop} onSave={(v) => submit("setProductPrices", { productId: item.id, prices: { shop: v, wholesale, online } })} />
        <PriceInput label="Optom" defaultValue={wholesale} onSave={(v) => submit("setProductPrices", { productId: item.id, prices: { shop, wholesale: v, online } })} />
        <PriceInput label="Online" defaultValue={online} onSave={(v) => submit("setProductPrices", { productId: item.id, prices: { shop, wholesale, online: v } })} />
      </div>

      {b && (
        <div className="text-xs space-y-1 border-t border-zinc-800 pt-3">
          <Row label="Xom ashyo" value={b.material} />
          <Row label="Paket (700)" value={b.packaging} />
          <Row label="Ishchi" value={b.labor} />
          <Row label="Karobka (bo'lingan)" value={b.box} />
          <Row label="Logistika" value={b.logistics} />
          <Row label="JAMI tannarx" value={b.total} bold />
          {margins && (
            <>
              <div className="pt-2 mt-2 border-t border-zinc-800">
                <Row label="Do'kon foydasi" value={margins.shop?.profit} color={margins.shop?.profit >= 0 ? "text-emerald-400" : "text-red-400"} />
                <Row label="Optom foydasi" value={margins.wholesale?.profit} color={margins.wholesale?.profit >= 0 ? "text-emerald-400" : "text-red-400"} />
                <Row label="Online foydasi" value={margins.online?.profit} color={margins.online?.profit >= 0 ? "text-emerald-400" : "text-red-400"} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-white" : ""}`}>
      <span className="text-zinc-500">{label}</span>
      <span className={color ?? "text-zinc-300"}>{formatMoney(value)}</span>
    </div>
  );
}

function ConfigInput({ label, defaultValue, onSave }: { label: string; defaultValue: number; onSave: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      <input type="number" defaultValue={defaultValue} onBlur={(e) => onSave(Number(e.target.value))} className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs" />
    </div>
  );
}

function PriceInput({ label, defaultValue, onSave }: { label: string; defaultValue: number; onSave: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-zinc-500">{label}</label>
      <input type="number" defaultValue={defaultValue} onBlur={(e) => onSave(Number(e.target.value))} className="w-full mt-0.5 px-2 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-400 text-xs font-medium" />
    </div>
  );
}
