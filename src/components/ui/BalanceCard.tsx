import { cn, formatMoney } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BalanceCardProps {
  name: string;
  balance: number;
  color: string;
  icon?: React.ReactNode;
  subtitle?: string;
  isActive?: boolean;
  children?: { name: string; balance: number; color: string; isActive?: boolean }[];
  onClick?: () => void;
  expanded?: boolean;
}

export function BalanceCard({
  name,
  balance,
  color,
  icon,
  subtitle,
  isActive = true,
  children,
  onClick,
  expanded: controlledExpanded,
}: BalanceCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;
  const hasChildren = children && children.length > 0;

  return (
    <div className="space-y-2">
      <button
        onClick={() => {
          if (hasChildren) setInternalExpanded(!expanded);
          onClick?.();
        }}
        className={cn(
          "w-full text-left p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98]",
          !isActive && "opacity-60"
        )}
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
          borderColor: `${color}30`,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: `${color}40` }}
              >
                {icon}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-zinc-300">{name}</p>
              {subtitle && (
                <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {hasChildren &&
            (expanded ? (
              <ChevronUp size={16} className="text-zinc-500" />
            ) : (
              <ChevronDown size={16} className="text-zinc-500" />
            ))}
        </div>
        <p className="text-2xl font-bold text-white mt-4">{formatMoney(balance)}</p>
        {!isActive && (
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            Pauzada
          </span>
        )}
      </button>

      {hasChildren && expanded && (
        <div className="pl-4 space-y-2">
          {children.map((child) => (
            <div
              key={child.name}
              className={cn(
                "p-4 rounded-xl border",
                !child.isActive && "opacity-60"
              )}
              style={{
                background: `linear-gradient(135deg, ${child.color}10 0%, transparent 100%)`,
                borderColor: `${child.color}25`,
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-zinc-400">{child.name}</p>
                  {!child.isActive && (
                    <span className="text-xs text-zinc-600">Pauzada</span>
                  )}
                </div>
                <p className="text-lg font-semibold text-white">
                  {formatMoney(child.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TotalBalanceCard({ total }: { total: number }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-purple-500/20 border border-emerald-500/20">
      <p className="text-sm text-zinc-400">Umumiy balans</p>
      <p className="text-4xl font-bold text-white mt-2">{formatMoney(total)}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  color = "#6366f1",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
