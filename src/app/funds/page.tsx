"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { formatMoney, currentMonth } from "@/lib/utils";
import { PiggyBank, Shield, Home, Rocket, RefreshCw, Trash2 } from "lucide-react";

const fundIcons: Record<string, React.ReactNode> = {
  safety: <Shield size={20} />,
  "big-purchases": <Home size={20} />,
  rozgor: <Home size={20} />,
  entertainment: <Home size={20} />,
  "business-growth": <Rocket size={20} />,
};

const businessNames: Record<string, string> = {
  "nur-garden": "Nur&Garden",
  arenatop: "ArenaTop",
  "other-income": "Boshqa daromad",
  personal: "Shaxsiy",
};

export default function FundsPage() {
  const [data, setData] = useState<any>(null);
  const [allocating, setAllocating] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/funds");
    setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function allocate() {
    setAllocating(true);
    try {
      await fetch("/api/funds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocate", month: currentMonth() }),
      });
      load();
    } finally {
      setAllocating(false);
    }
  }

  async function removeDeposit(id: number) {
    if (!confirm("Bu ajratishni o'chirishni xohlaysizmi? Jamg'arma balansi kamayadi.")) return;
    await fetch(`/api/funds?id=${id}`, { method: "DELETE" });
    load();
  }

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { funds, deposits } = data;
  const totalFunds = funds.reduce((s: number, f: any) => s + f.balance, 0);

  return (
    <>
      <PageHeader
        title="Jamg'armalar"
        description="Har oy bizneslardan avtomatik ajratish"
        action={
          <button
            onClick={allocate}
            disabled={allocating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={allocating ? "animate-spin" : ""} />
            {currentMonth()} ajratish
          </button>
        }
      />

      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 mb-8">
        <p className="text-sm text-zinc-400">Jami jamg&apos;arma</p>
        <p className="text-4xl font-bold text-white mt-1">{formatMoney(totalFunds)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {funds.map((fund: any) => (
          <div
            key={fund.slug}
            className="p-5 rounded-2xl border bg-zinc-900/50"
            style={{ borderColor: `${fund.color}30` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${fund.color}30` }}
              >
                {fundIcons[fund.slug] ?? <PiggyBank size={20} />}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">{fund.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{fund.description}</p>
                <p className="text-2xl font-bold mt-3" style={{ color: fund.color }}>
                  {formatMoney(fund.balance)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Oylik ajratish foizi:</p>
              <div className="space-y-1">
                {fund.allocations.map((a: any) => (
                  <div key={`${a.businessSlug}-${a.fundSlug}`} className="flex justify-between text-xs">
                    <span className="text-zinc-400">{businessNames[a.businessSlug] ?? a.businessSlug}</span>
                    <span className="text-zinc-300">{a.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
        So&apos;nggi ajratishlar
      </h3>
      <div className="space-y-2">
        {deposits.length === 0 ? (
          <p className="text-center text-zinc-600 py-8">
            Hali ajratish yo&apos;q. &quot;{currentMonth()} ajratish&quot; tugmasini bosing.
          </p>
        ) : (
          deposits.slice(0, 20).map((d: any) => (
            <div key={d.id} className="flex justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div>
                <p className="text-sm text-zinc-300">
                  {funds.find((f: any) => f.slug === d.fundSlug)?.name ?? d.fundSlug}
                </p>
                <p className="text-xs text-zinc-600">
                  {businessNames[d.businessSlug] ?? d.businessSlug} · {d.month}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-400">+{formatMoney(d.amount)}</span>
                <button
                  onClick={() => removeDeposit(d.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                  title="O'chirish"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-300">Qanday ishlaydi:</strong> Nur&Garden, Osco (ArenaTop), boshqa daromad va
          shaxsiy daromaddan har oy ajratiladi: Xavfsizlik 10%, Katta xaridlar 10%, Ro&apos;zg&apos;or 20%,
          Biznes rivojlantirish 10%. Qolgan 50% biznes hisoblarida qoladi (reinvestitsiya).
        </p>
      </div>
    </>
  );
}
