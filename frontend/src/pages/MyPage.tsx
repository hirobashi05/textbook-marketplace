import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  History,
  PackageCheck,
  ReceiptText,
  Truck,
  UserRound,
  Wallet,
  XCircle
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../components/Alert";
import { SelectField, TextInput } from "../components/FormField";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { ApiClientError, api } from "../lib/api";
import {
  conditionLabels,
  dateTime,
  listingStatusLabels,
  orderStatusLabels,
  paymentMethodLabels,
  pointTransactionTypeLabels,
  points,
  signedPoints,
  transactionStatusLabels,
  yen
} from "../lib/format";
import type {
  Listing,
  Order,
  PointPaymentMethod,
  PointTransaction,
  TransactionStatus
} from "../types/api";

const cancellableStatuses = new Set<TransactionStatus>([
  "purchased",
  "awaiting_seller_confirmation",
  "preparing_shipment"
]);

const sellerNextAction: Partial<Record<TransactionStatus, { status: TransactionStatus; label: string }>> = {
  purchased: { status: "awaiting_seller_confirmation", label: "出品者確認待ちへ" },
  awaiting_seller_confirmation: { status: "preparing_shipment", label: "注文を確認" },
  preparing_shipment: { status: "shipped", label: "発送済みにする" }
};

export function MyPage() {
  const { profile, refreshMe } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salesOrders, setSalesOrders] = useState<Order[]>([]);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [pointAmount, setPointAmount] = useState(5000);
  const [paymentMethod, setPaymentMethod] = useState<PointPaymentMethod>("credit_card");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isBuyingPoints, setIsBuyingPoints] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadMyPage = async () => {
    const [, myListings, myOrders, mySalesOrders, history] = await Promise.all([
      refreshMe(),
      api.myListings(),
      api.myOrders(),
      api.mySalesOrders(),
      api.myPointHistory()
    ]);
    setListings(myListings);
    setOrders(myOrders);
    setSalesOrders(mySalesOrders);
    setPointHistory(history);
  };

  useEffect(() => {
    loadMyPage().catch((caught) => {
      setError(caught instanceof ApiClientError ? caught.message : "マイページを取得できませんでした");
    });
    // refreshMe is stable from AuthProvider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      profile?.paymentMethod === "credit_card" ||
      profile?.paymentMethod === "convenience_store" ||
      profile?.paymentMethod === "campus_coop"
    ) {
      setPaymentMethod(profile.paymentMethod);
    }
  }, [profile?.paymentMethod]);

  const handlePurchasePoints = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsBuyingPoints(true);
    try {
      const response = await api.purchasePoints({ amount: pointAmount, paymentMethod });
      setNotice(`${response.message}: ${points(response.pointPurchase.amount)}`);
      await loadMyPage();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "ポイント購入に失敗しました");
    } finally {
      setIsBuyingPoints(false);
    }
  };

  const handleUpdateTransaction = async (orderId: string, transactionStatus: TransactionStatus) => {
    setError("");
    setNotice("");
    setUpdatingOrderId(orderId);
    try {
      await api.updateTransactionStatus(orderId, transactionStatus);
      setNotice(`取引ステータスを「${transactionStatusLabels[transactionStatus]}」に更新しました`);
      await loadMyPage();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "取引ステータスの更新に失敗しました");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <UserRound size={22} className="text-campus" aria-hidden />
          <h1 className="text-2xl font-bold">マイページ</h1>
        </div>
        {error && <Alert message={error} />}
        {notice && <Alert tone="success" message={notice} />}
        {profile && (
          <dl className="mt-5 grid gap-4 sm:grid-cols-4">
            <ProfileItem label="名前" value={profile.name} />
            <ProfileItem label="メールアドレス" value={profile.email} />
            <ProfileItem label="保有ポイント" value={points(profile.points)} />
            <ProfileItem label="ステータス" value={profile.userStatus} />
          </dl>
        )}
      </section>

      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wallet size={22} className="text-campus" aria-hidden />
            <h2 className="text-xl font-bold">ポイント購入</h2>
          </div>
          <Link to="/mypage/payments" className="btn-secondary">
            <CreditCard size={17} aria-hidden />
            支払い設定
          </Link>
        </div>
        <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handlePurchasePoints}>
          <TextInput
            label="購入ポイント"
            htmlFor="pointAmount"
            type="number"
            min={100}
            max={100000}
            step={100}
            value={pointAmount}
            onChange={(event) => setPointAmount(Number(event.target.value))}
            required
          />
          <SelectField
            label="決済手段"
            htmlFor="paymentMethod"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PointPaymentMethod)}
          >
            {Object.entries(paymentMethodLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </SelectField>
          <button type="submit" className="btn-primary self-end" disabled={isBuyingPoints}>
            <CreditCard size={17} aria-hidden />
            購入
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <History size={21} className="text-campus" aria-hidden />
          <h2 className="text-xl font-bold">売上・ポイント履歴</h2>
        </div>
        <div className="panel overflow-hidden">
          {pointHistory.length === 0 ? (
            <p className="p-5 text-center text-slate-500">ポイント履歴はありません</p>
          ) : (
            <div className="divide-y divide-line">
              {pointHistory.map((item) => (
                <div key={item.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div>
                    <p className="font-semibold">{pointTransactionTypeLabels[item.type]}</p>
                    <p className="mt-1 text-xs text-slate-500">{dateTime(item.createdAt)}</p>
                  </div>
                  <p className={`font-bold ${item.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {signedPoints(item.amount)}
                  </p>
                  <p className="text-sm text-slate-600">残高 {points(item.balanceAfter)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen size={21} className="text-campus" aria-hidden />
          <h2 className="text-xl font-bold">自分の出品</h2>
        </div>
        <div className="grid gap-3">
          {listings.length === 0 ? (
            <div className="panel p-5 text-center text-slate-500">出品はありません</div>
          ) : listings.map((listing) => (
            <Link key={listing.id} to={`/listings/${listing.id}`} className="panel block p-4 transition hover:border-campus">
              <div className="grid gap-4 sm:grid-cols-[96px_1fr_auto] sm:items-start">
                <ProductImage listing={listing} />
                <div>
                  <p className="text-sm font-semibold text-campus">{listing.textbook.courseName}</p>
                  <h3 className="mt-1 text-lg font-bold">{listing.textbook.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {conditionLabels[listing.condition]} / {yen(listing.sellingPrice)} / {dateTime(listing.createdAt)}
                  </p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck size={21} className="text-campus" aria-hidden />
          <h2 className="text-xl font-bold">販売した取引</h2>
        </div>
        <div className="grid gap-3">
          {salesOrders.length === 0 ? (
            <div className="panel p-5 text-center text-slate-500">販売済みの取引はありません</div>
          ) : salesOrders.map((order) => (
            <TransactionCard
              key={order.id}
              order={order}
              role="seller"
              updating={updatingOrderId === order.id}
              onUpdate={handleUpdateTransaction}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ReceiptText size={21} className="text-campus" aria-hidden />
          <h2 className="text-xl font-bold">購入した取引</h2>
        </div>
        <div className="grid gap-3">
          {orders.length === 0 ? (
            <div className="panel p-5 text-center text-slate-500">購入履歴はありません</div>
          ) : orders.map((order) => (
            <TransactionCard
              key={order.id}
              order={order}
              role="buyer"
              updating={updatingOrderId === order.id}
              onUpdate={handleUpdateTransaction}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TransactionCard({
  order,
  role,
  updating,
  onUpdate
}: {
  order: Order;
  role: "buyer" | "seller";
  updating: boolean;
  onUpdate: (orderId: string, status: TransactionStatus) => Promise<void>;
}) {
  const sellerAction = role === "seller" ? sellerNextAction[order.transactionStatus] : undefined;
  const canComplete = role === "buyer" && order.transactionStatus === "shipped";
  const canCancel = cancellableStatuses.has(order.transactionStatus);

  return (
    <div className="panel p-4">
      <div className="grid gap-4 lg:grid-cols-[96px_1fr_auto] lg:items-start">
        <ProductImage listing={order.listing} />
        <div>
          <p className="text-sm font-semibold text-campus">{order.listing.textbook.courseName}</p>
          <Link to={`/listings/${order.listingId}`} className="mt-1 block text-lg font-bold hover:text-campus">
            {order.listing.textbook.title}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{yen(order.totalAmount)}</span>
            <span>{dateTime(order.createdAt)}</span>
            <span>{orderStatusLabels[order.status]}</span>
          </div>
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            配送先: {order.shippingAddress}
          </p>
        </div>
        <div className="min-w-48 space-y-3">
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-700">
            {transactionStatusLabels[order.transactionStatus]}
          </div>
          {sellerAction && (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={updating}
              onClick={() => onUpdate(order.id, sellerAction.status)}
            >
              <PackageCheck size={17} aria-hidden />
              {sellerAction.label}
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={updating}
              onClick={() => onUpdate(order.id, "completed")}
            >
              <CheckCircle2 size={17} aria-hidden />
              受け取り完了
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={updating}
              onClick={() => onUpdate(order.id, "cancellation_requested")}
            >
              <XCircle size={17} aria-hidden />
              キャンセル申請
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductImage({ listing }: { listing: Listing }) {
  return (
    <img
      src={listing.imageUrl || listing.textbook.imageUrl || undefined}
      alt={`${listing.textbook.title}の商品画像`}
      className="h-28 w-full rounded-lg object-cover sm:w-24"
    />
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold">{value}</dd>
    </div>
  );
}
