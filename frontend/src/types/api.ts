export type UserStatus = "active" | "suspended" | "deleted";
export type ListingStatus = "available" | "sold" | "cancelled";
export type ListingCondition = "new" | "good" | "fair" | "poor" | "has_writing";
export type OrderStatus = "created" | "paid" | "cancelled";
export type TransactionStatus =
  | "purchased"
  | "awaiting_seller_confirmation"
  | "preparing_shipment"
  | "shipped"
  | "completed"
  | "cancellation_requested";
export type PointPurchaseStatus = "created" | "paid" | "cancelled";
export type PointTransactionType =
  | "point_purchase"
  | "textbook_purchase"
  | "textbook_sale"
  | "cancellation_refund"
  | "admin_adjustment";
export type PointPaymentMethod = "credit_card" | "convenience_store" | "campus_coop";
export type StoredPaymentMethod = "credit_card" | "convenience_store";
export type CardBrand = "visa" | "mastercard" | "jcb" | "amex" | "diners" | "discover" | "other";
export type ConvenienceStoreChain =
  | "seven_eleven"
  | "familymart"
  | "lawson"
  | "ministop"
  | "daily_yamazaki"
  | "seicomart"
  | "other";

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type ImageUploadResponse = {
  imageUrl: string;
};

export type User = {
  uid: string;
  email: string;
  name: string;
  paymentMethod: PointPaymentMethod | null;
  points: number;
  userStatus: UserStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthUser = Pick<User, "uid" | "email" | "name">;

export type Textbook = {
  id: string;
  isbn: string | null;
  title: string;
  publisher: string;
  listPrice: number;
  courseName: string;
  faculty: string;
  department: string;
  academicYear: number;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Listing = {
  id: string;
  sellingPrice: number;
  condition: ListingCondition;
  description: string | null;
  imageUrl: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  textbook: Textbook;
  seller: {
    uid: string;
    name: string;
  };
};

export type ListingDetail = Listing & {
  canPurchase: boolean;
  isOwnListing: boolean;
};

export type Order = {
  id: string;
  listingId: string;
  buyerId: string;
  shippingAddress: string;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  transactionStatus: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  listing: Listing;
};

export type PointPurchase = {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PointPaymentMethod;
  providerReference: string | null;
  status: PointPurchaseStatus;
  createdAt: string;
  updatedAt: string;
};

export type PointTransaction = {
  id: string;
  userId: string;
  type: PointTransactionType;
  amount: number;
  balanceAfter: number;
  orderId: string | null;
  pointPurchaseId: string | null;
  description: string | null;
  createdAt: string;
};

export type PaymentSettings = {
  preferredMethod: StoredPaymentMethod;
  creditCard: {
    holderName: string;
    brand: CardBrand;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
  convenienceStore: {
    chain: ConvenienceStoreChain;
    payerName: string;
    payerPhone: string;
  } | null;
  updatedAt: string | null;
};

export type PurchaseResponse = {
  orderId: string;
  listingId: string;
  buyerId: string;
  status: OrderStatus;
  orderStatus: OrderStatus;
  transactionStatus: TransactionStatus;
  listingStatus: ListingStatus;
  totalAmount: number;
  paymentMethod: string;
  buyerPointsBalance: number;
  sellerPointsBalance: number;
  message: string;
};
