import type {
  CardBrand,
  ConvenienceStoreChain,
  ListingCondition,
  ListingStatus,
  OrderStatus,
  PointPaymentMethod,
  PointTransactionType,
  TransactionStatus
} from "../types/api";

export const conditionLabels: Record<ListingCondition, string> = {
  new: "新品同様",
  good: "良好",
  fair: "使用感あり",
  poor: "傷みあり",
  has_writing: "書き込みあり"
};

export const listingStatusLabels: Record<ListingStatus, string> = {
  available: "販売中",
  sold: "売約済み",
  cancelled: "取り下げ"
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  created: "注文作成済み",
  paid: "購入済み",
  cancelled: "キャンセル済み"
};

export const transactionStatusLabels: Record<TransactionStatus, string> = {
  purchased: "購入済み",
  awaiting_seller_confirmation: "出品者確認待ち",
  preparing_shipment: "発送準備中",
  shipped: "発送済み",
  completed: "受け取り完了",
  cancellation_requested: "キャンセル申請中"
};

export const pointTransactionTypeLabels: Record<PointTransactionType, string> = {
  point_purchase: "ポイント購入",
  textbook_purchase: "教科書購入",
  textbook_sale: "教科書販売による獲得",
  cancellation_refund: "キャンセル返金",
  admin_adjustment: "管理者調整"
};

export const paymentMethodLabels: Record<PointPaymentMethod, string> = {
  credit_card: "クレジットカード",
  convenience_store: "コンビニ払い",
  campus_coop: "生協カウンター"
};

export const cardBrandLabels: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  jcb: "JCB",
  amex: "American Express",
  diners: "Diners Club",
  discover: "Discover",
  other: "その他"
};

export const convenienceStoreLabels: Record<ConvenienceStoreChain, string> = {
  seven_eleven: "セブン-イレブン",
  familymart: "ファミリーマート",
  lawson: "ローソン",
  ministop: "ミニストップ",
  daily_yamazaki: "デイリーヤマザキ",
  seicomart: "セイコーマート",
  other: "その他"
};

export function yen(amount: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(amount);
}

export function points(amount: number) {
  return `${new Intl.NumberFormat("ja-JP").format(amount)} pt`;
}

export function signedPoints(amount: number) {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("ja-JP").format(amount)} pt`;
}

export function dateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
