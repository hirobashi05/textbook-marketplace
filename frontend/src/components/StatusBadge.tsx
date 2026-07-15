import type { ListingStatus } from "../types/api";
import { listingStatusLabels } from "../lib/format";

const styles: Record<ListingStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  sold: "bg-slate-100 text-slate-600 ring-slate-300",
  cancelled: "bg-amber-50 text-amber-700 ring-amber-200"
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      {listingStatusLabels[status]}
    </span>
  );
}

