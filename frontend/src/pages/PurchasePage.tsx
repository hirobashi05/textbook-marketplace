import { ArrowLeft, CheckCircle2, ShoppingCart, Wallet } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/Alert";
import { TextArea, TextInput } from "../components/FormField";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError, api } from "../lib/api";
import { conditionLabels, points, yen } from "../lib/format";
import type { ListingDetail } from "../types/api";

export function PurchasePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, refreshMe } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingFee, setShippingFee] = useState(300);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    api
      .listing(id)
      .then(setListing)
      .catch((caught) => {
        setError(caught instanceof ApiClientError ? caught.message : "出品詳細を取得できませんでした");
      });
  }, [id]);

  const totalAmount = useMemo(
    () => (listing ? listing.sellingPrice + shippingFee : shippingFee),
    [listing, shippingFee]
  );
  const hasEnoughPoints = (profile?.points ?? 0) >= totalAmount;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!listing) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.purchase({
        listingId: listing.id,
        shippingAddress,
        shippingFee
      });
      setSuccess(`${response.message}。残高: ${points(response.buyerPointsBalance)}`);
      await refreshMe();
      setTimeout(() => navigate("/mypage"), 900);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "購入に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!listing) {
    return (
      <div className="space-y-4">
        {error ? <Alert message={error} /> : <div className="py-12 text-center text-slate-500">読み込み中...</div>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-campus" to={`/listings/${listing.id}`}>
        <ArrowLeft size={17} aria-hidden />
        詳細へ戻る
      </Link>

      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} className="text-campus" aria-hidden />
          <h1 className="text-2xl font-bold">購入確認</h1>
        </div>

        <div className="mt-6 grid gap-4 rounded-lg border border-line bg-slate-50 p-4 sm:grid-cols-[160px_1fr]">
          <img
            src={listing.imageUrl || listing.textbook.imageUrl}
            alt={`${listing.textbook.title}の商品画像`}
            className="h-44 w-full rounded-lg object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-campus">{listing.textbook.courseName}</p>
            <h2 className="mt-1 text-xl font-bold">{listing.textbook.title}</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <SummaryItem label="出品価格" value={yen(listing.sellingPrice)} />
              <SummaryItem label="状態" value={conditionLabels[listing.condition]} />
              <SummaryItem label="出品者" value={listing.seller.name} />
            </dl>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && <Alert message={error} />}
          {success && <Alert tone="success" message={success} />}
          {!hasEnoughPoints && (
            <Alert
              tone="info"
              message="ポイント残高が不足しています。マイページでポイントを購入してから再度購入してください。"
            />
          )}
          <TextInput
            label="送料"
            htmlFor="shippingFee"
            type="number"
            min={0}
            value={shippingFee}
            onChange={(event) => setShippingFee(Number(event.target.value))}
            required
          />
          <TextArea
            label="配送先住所"
            htmlFor="shippingAddress"
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-paper p-4">
              <p className="text-sm text-slate-600">合計金額</p>
              <p className="text-3xl font-bold text-rose-700">{yen(totalAmount)}</p>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Wallet size={16} aria-hidden />
                保有ポイント
              </p>
              <p className="text-3xl font-bold text-campus">{points(profile?.points ?? 0)}</p>
            </div>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting || !listing.canPurchase || !hasEnoughPoints}
          >
            <CheckCircle2 size={18} aria-hidden />
            ポイントで購入確定
          </button>
        </form>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
