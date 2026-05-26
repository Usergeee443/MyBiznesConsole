"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { BalanceCard, TotalBalanceCard, StatCard } from "@/components/ui/BalanceCard";
import { QuickExpenseButton } from "@/components/finance/QuickExpense";
import { formatMoney, formatDate } from "@/lib/utils";
import { Leaf, Building2, User, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardData {
  balance: {
    total: number;
    nurGarden: { name: string; balance: number; color: string; isActive: boolean };
    osco: {
      name: string;
      balance: number;
      color: string;
      children: { name: string; balance: number; color: string; isActive: boolean }[];
    };
    personal: { name: string; balance: number; color: string };
    otherIncome: { name: string; balance: number; color: string };
  };
  nurGarden: { monthRevenue: number; totalDebt: number; totalSales: number };
  arenaTop: { monthBookings: number; monthCommission: number; latest?: { totalStadiums: number; totalUsers: number } };
  funds: { name: string; balance: number; color: string }[];
  recentTransactions: { id: number; type: string; amount: number; category: string | null; description: string | null; date: string; accountSlug: string }[];
  monthExpenses: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { balance, nurGarden, arenaTop, funds, recentTransactions, monthExpenses } = data;

  return (
    <>
      <PageHeader
        title="Salom, Nurmuxammad!"
        description="Bugungi biznes va moliya holati"
      />

      <TotalBalanceCard total={balance.total} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        <BalanceCard
          name={balance.nurGarden.name}
          balance={balance.nurGarden.balance}
          color={balance.nurGarden.color}
          icon={<Leaf size={20} />}
          isActive={balance.nurGarden.isActive}
        />
        <BalanceCard
          name={balance.osco.name}
          balance={balance.osco.balance}
          color={balance.osco.color}
          icon={<Building2 size={20} />}
          children={balance.osco.children}
        />
        <BalanceCard
          name={balance.personal.name}
          balance={balance.personal.balance}
          color={balance.personal.color}
          icon={<User size={20} />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
        <StatCard
          label="Nur&Garden (oy)"
          value={formatMoney(nurGarden.monthRevenue)}
          sub={`${nurGarden.totalSales} ta savdo`}
          color="#22c55e"
        />
        <StatCard
          label="Qarzdorlik"
          value={formatMoney(nurGarden.totalDebt)}
          sub="Nasiyada"
          color="#ef4444"
        />
        <StatCard
          label="ArenaTop (oy)"
          value={formatMoney(arenaTop.monthCommission)}
          sub={`${arenaTop.monthBookings} ta bron`}
          color="#3b82f6"
        />
        <StatCard
          label="Xarajat (oy)"
          value={formatMoney(monthExpenses)}
          sub="Shaxsiy + biznes"
          color="#f59e0b"
        />
      </div>

      {arenaTop.latest && (
        <div className="mt-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <p className="text-sm text-blue-400 font-medium">ArenaTop bugungi holat</p>
          <div className="flex gap-6 mt-2 text-sm text-zinc-300">
            <span>{arenaTop.latest.totalStadiums} stadion</span>
            <span>{arenaTop.latest.totalUsers} foydalanuvchi</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Jamg&apos;armalar
          </h2>
          <div className="space-y-2">
            {funds.map((fund) => (
              <div
                key={fund.name}
                className="flex justify-between items-center p-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
              >
                <span className="text-sm text-zinc-300">{fund.name}</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatMoney(fund.balance)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            So&apos;nggi tranzaksiyalar
          </h2>
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-zinc-600 p-4 text-center">Hali tranzaksiya yo&apos;q</p>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === "income" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {tx.type === "income" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-300">{tx.description ?? tx.category ?? tx.type}</p>
                      <p className="text-xs text-zinc-600">{formatDate(tx.date)} · {tx.accountSlug}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === "income" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <QuickExpenseButton onSuccess={load} />
    </>
  );
}
