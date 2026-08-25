import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="glass-card-static flex flex-col items-center justify-center min-h-[60vh] py-24 rounded-3xl gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-[#C9A05C]" />
      <span className="text-xs text-slate-500 dark:text-[#ebd09e] font-medium">
        Memuat data akademik...
      </span>
    </div>
  );
}
