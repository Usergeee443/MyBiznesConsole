"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/ui/BalanceCard";
import { formatMoney, formatDate, todayISO, ARENATOP_COMMISSION } from "@/lib/utils";
import { Plus, Trophy, Pause, Calendar, Pencil, Trash2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";

export default function OscoPage() {
  const [data, setData] = useState<any>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<any>({ date: todayISO() });

  const load = useCallback(async () => {
    const res = await fetch("/api/osco");
    setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (form.id) {
      await fetch("/api/osco", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/osco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModal(false);
    setForm({ date: todayISO() });
    load();
  }

  async function removeStat(id: number) {
    if (!confirm("Bu statistikani o'chirishni xohlaysizmi?")) return;
    await fetch(`/api/osco?id=${id}`, { method: "DELETE" });
    load();
  }

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { stats, analytics } = data;

  return (
    <>
      <PageHeader
        title="Osco Holding"
        description="IT kompaniya — Wedy va ArenaTop"
        action={
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium"
          >
            <Plus size={16} />
            Bugungi statistika
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 opacity-60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Pause size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Wedy</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">Pauzada</span>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Loyiha vaqtincha to&apos;xtatilgan</p>
        </div>

        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Trophy size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">ArenaTop</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Faol</span>
            </div>
          </div>
          <p className="text-sm text-zinc-400">Bron komissiyasi: {formatMoney(ARENATOP_COMMISSION)} / bron</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Jami bronlar" value={String(analytics.totalBookings)} color="#3b82f6" />
        <StatCard label="Jami komissiya" value={formatMoney(analytics.totalCommission)} color="#10b981" />
        <StatCard label="Bu oy bronlar" value={String(analytics.monthBookings)} color="#6366f1" />
        <StatCard label="Bu oy daromad" value={formatMoney(analytics.monthCommission)} color="#22c55e" />
      </div>

      {analytics.latest && (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">So&apos;nggi kun ({formatDate(analytics.latest.date)})</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <MiniStat label="Stadion qo'shildi" value={analytics.latest.stadiumsAdded} />
            <MiniStat label="Jami stadion" value={analytics.latest.totalStadiums} />
            <MiniStat label="Odamlar qo'shildi" value={analytics.latest.usersAdded} />
            <MiniStat label="Jami odamlar" value={analytics.latest.totalUsers} />
            <MiniStat label="Bronlar" value={analytics.latest.bookings} highlight />
          </div>
        </div>
      )}

      {analytics.chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">Kunlik bronlar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">Komissiya daromadi</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} formatter={(v) => formatMoney(Number(v))} />
                <Line type="monotone" dataKey="commission" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Kunlik statistika tarixi</h3>
      <div className="space-y-2">
        {stats.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-zinc-600" />
              <div>
                <p className="text-sm font-medium text-white">{formatDate(s.date)}</p>
                <p className="text-xs text-zinc-500">
                  +{s.stadiumsAdded} stadion · +{s.usersAdded} odam · {s.bookings} bron
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-400">
                {formatMoney(s.bookings * s.commissionPerBooking)}
              </span>
              <button
                onClick={() => { setForm(s); setModal(true); }}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => removeStat(s.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <p className="text-center text-zinc-600 py-8">Hali statistika kiritilmagan. &quot;Bugungi statistika&quot; tugmasini bosing.</p>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              {form.id ? "Statistikani tahrirlash" : "ArenaTop kunlik statistika"}
            </h3>
            <FormInput label="Sana" type="date" value={form.date} onChange={(e: any) => setForm({ ...form, date: e.target.value })} />
            <FormInput label="Qo'shilgan stadionlar" type="number" value={form.stadiumsAdded ?? ""} onChange={(e: any) => setForm({ ...form, stadiumsAdded: Number(e.target.value) })} />
            <FormInput label="Jami stadionlar" type="number" value={form.totalStadiums ?? ""} onChange={(e: any) => setForm({ ...form, totalStadiums: Number(e.target.value) })} />
            <FormInput label="Qo'shilgan odamlar" type="number" value={form.usersAdded ?? ""} onChange={(e: any) => setForm({ ...form, usersAdded: Number(e.target.value) })} />
            <FormInput label="Jami odamlar" type="number" value={form.totalUsers ?? ""} onChange={(e: any) => setForm({ ...form, totalUsers: Number(e.target.value) })} />
            <FormInput label="Bronlar soni" type="number" value={form.bookings ?? ""} onChange={(e: any) => setForm({ ...form, bookings: Number(e.target.value) })} />
            {form.bookings > 0 && (
              <p className="text-sm text-emerald-400 mb-3">
                Komissiya: {formatMoney(form.bookings * ARENATOP_COMMISSION)}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400">Bekor</button>
              <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${highlight ? "text-blue-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function FormInput({ label, ...props }: any) {
  return (
    <div className="mb-3">
      <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
      <input {...props} className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-blue-500/50" />
    </div>
  );
}
