"use client";

import { useState } from "react";
import { Minus, Car, UtensilsCrossed, Shirt, HeartPulse, Bus, MoreHorizontal } from "lucide-react";
import { cn, formatMoney, PERSONAL_EXPENSE_CATEGORIES } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  car: <Car size={18} />,
  utensils: <UtensilsCrossed size={18} />,
  shirt: <Shirt size={18} />,
  "heart-pulse": <HeartPulse size={18} />,
  bus: <Bus size={18} />,
  "more-horizontal": <MoreHorizontal size={18} />,
};

export function QuickExpenseButton({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSlug: "personal",
          type: "expense",
          amount: Number(amount),
          category,
          description: description || PERSONAL_EXPENSE_CATEGORIES.find(c => c.id === category)?.label,
        }),
      });
      setAmount("");
      setDescription("");
      setOpen(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Tez xarajat"
      >
        <Minus size={24} strokeWidth={3} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Tez xarajat</h3>
            <p className="text-sm text-zinc-500 mb-5">Shaxsiy xarajatingizni yozing</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {PERSONAL_EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all",
                    category === cat.id
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  {iconMap[cat.icon]}
                  {cat.label}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Summa (so'm)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-lg font-semibold mb-3 focus:outline-none focus:border-red-500/50"
              autoFocus
            />

            <input
              type="text"
              placeholder="Izoh (ixtiyoriy)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm mb-4 focus:outline-none focus:border-zinc-600"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                Bekor
              </button>
              <button
                onClick={submit}
                disabled={loading || !amount}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : amount ? `-${formatMoney(Number(amount))}` : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
