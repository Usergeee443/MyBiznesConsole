import { AlertTriangle } from "lucide-react";

export function TestDbBanner() {
  return (
    <div className="sticky top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
      <div className="flex items-start gap-3 px-4 py-3 lg:px-8">
        <AlertTriangle
          size={18}
          className="text-amber-400 shrink-0 mt-0.5"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-200">
            Test rejimi — ma&apos;lumotlar bazasi sinov bosqichida
          </p>
          <p className="text-xs text-amber-200/70 mt-0.5 leading-relaxed">
            Kiritilgan ma&apos;lumotlar vaqtincha saqlanadi. Redeploy yoki
            yangilashda yo&apos;qolishi mumkin. Muhim ma&apos;lumotlarni alohida
            nusxalab turing.
          </p>
        </div>
      </div>
    </div>
  );
}
