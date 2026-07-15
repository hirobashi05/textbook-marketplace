import { ArrowLeft, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/Alert";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError, api } from "../lib/api";
import { conditionLabels, yen } from "../lib/format";
import type { ListingDetail } from "../types/api";

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError("");
    api
      .listing(id)
      .then(setListing)
      .catch((caught) => {
        setError(caught instanceof ApiClientError ? caught.message : "出品詳細を取得できませんでした");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!listing) {
      return;
    }

    setIsCancelling(true);
    setError("");
    setNotice("");

    try {
      await api.cancelListing(listing.id);
      const refreshed = await api.listing(listing.id);
      setListing(refreshed);
      setNotice("出品を取り下げました");
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "取り下げに失敗しました");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500">読み込み中...</div>;
  }

  if (error && !listing) {
    return <Alert message={error} />;
  }

  if (!listing) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-campus" to="/">
        <ArrowLeft size={17} aria-hidden />
        一覧へ戻る
      </Link>

      {error && <Alert message={error} />}
      {notice && <Alert tone="success" message={notice} />}

      <section className="panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-slate-100">
            <img
              src={listing.imageUrl || listing.textbook.imageUrl}
              alt={`${listing.textbook.title}の商品画像`}
              className="h-full min-h-[320px] w-full object-cover"
            />
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-campus">{listing.textbook.courseName}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-normal">{listing.textbook.title}</h1>
              </div>
              <StatusBadge status={listing.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="ISBN" value={listing.textbook.isbn} />
              <DetailItem label="出版社" value={listing.textbook.publisher} />
              <DetailItem label="定価" value={yen(listing.textbook.listPrice)} />
              <DetailItem label="対象学年" value={`${listing.textbook.academicYear}年`} />
              <DetailItem label="学部" value={listing.textbook.faculty} />
              <DetailItem label="学科" value={listing.textbook.department} />
              <DetailItem label="状態" value={conditionLabels[listing.condition]} />
              <DetailItem label="出品者" value={listing.seller.name} />
            </dl>

            <div className="rounded-lg border border-line bg-slate-50 p-4">
              <h2 className="text-sm font-bold text-slate-700">説明</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {listing.description || "説明はありません"}
              </p>
            </div>

            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-slate-600">出品価格</p>
              <p className="text-3xl font-bold text-rose-700">{yen(listing.sellingPrice)}</p>
            </div>

            {listing.isOwnListing ? (
              listing.status === "available" && (
                <button
                  type="button"
                  className="btn-danger w-full"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  <Trash2 size={17} aria-hidden />
                  取り下げ
                </button>
              )
            ) : listing.canPurchase ? (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate("/login", { state: { from: `/purchase/${listing.id}` } });
                    return;
                  }
                  navigate(`/purchase/${listing.id}`);
                }}
              >
                <ShoppingCart size={18} aria-hidden />
                ポイントで購入
              </button>
            ) : (
              <div className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-600">
                購入できません
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
