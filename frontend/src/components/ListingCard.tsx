import { ArrowRight, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { conditionLabels, yen } from "../lib/format";
import type { Listing } from "../types/api";
import { StatusBadge } from "./StatusBadge";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="panel flex h-full flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-slate-100">
        <img
          src={listing.imageUrl || listing.textbook.imageUrl}
          alt={`${listing.textbook.title}の商品画像`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-campus">
                {listing.textbook.courseName}
              </p>
              <h2 className="mt-1 text-lg font-bold leading-snug text-ink">{listing.textbook.title}</h2>
            </div>
            <StatusBadge status={listing.status} />
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">学部</dt>
              <dd className="font-medium">{listing.textbook.faculty}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">学科</dt>
              <dd className="font-medium">{listing.textbook.department}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">価格</dt>
              <dd className="text-base font-bold text-rose-700">{yen(listing.sellingPrice)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">状態</dt>
              <dd className="font-medium">{conditionLabels[listing.condition]}</dd>
            </div>
          </dl>

          <p className="flex items-center gap-2 text-sm text-slate-600">
            <UserRound size={16} aria-hidden />
            {listing.seller.name}
          </p>
        </div>

        <Link className="btn-secondary mt-5 w-full" to={`/listings/${listing.id}`}>
          詳細
          <ArrowRight size={17} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
