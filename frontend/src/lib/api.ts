import type {
  ApiError,
  ImageUploadResponse,
  Listing,
  ListingDetail,
  Order,
  PaymentSettings,
  PointPaymentMethod,
  PointPurchase,
  PointTransaction,
  PurchaseResponse,
  TransactionStatus,
  Textbook,
  User
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const TOKEN_KEY = "textbook_marketplace_token";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let payload: ApiError | null = null;

    try {
      payload = (await response.json()) as ApiError;
    } catch {
      payload = null;
    }

    throw new ApiClientError(
      payload?.error.code ?? "REQUEST_FAILED",
      payload?.error.message ?? "リクエストに失敗しました",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

export function toQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export const api = {
  register: (body: { email: string; name: string; password: string }) =>
    apiFetch<User>("/users", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    apiFetch<{ token: string; user: { uid: string; email: string; name: string } }>("/auth/login", {
      method: "POST",
      body
    }),
  me: () => apiFetch<User>("/users/me"),
  myPaymentSettings: () => apiFetch<PaymentSettings>("/users/me/payment-settings"),
  updatePaymentSettings: (body: Omit<PaymentSettings, "updatedAt">) =>
    apiFetch<{ paymentSettings: PaymentSettings; message: string }>("/users/me/payment-settings", {
      method: "PATCH",
      body
    }),
  purchasePoints: (body: {
    amount: number;
    paymentMethod: PointPaymentMethod;
    providerReference?: string;
  }) =>
    apiFetch<{ pointPurchase: PointPurchase; user: User; message: string }>("/users/me/points/purchase", {
      method: "POST",
      body
    }),
  myPointPurchases: () => apiFetch<PointPurchase[]>("/users/me/point-purchases"),
  myPointHistory: () => apiFetch<PointTransaction[]>("/users/me/point-history"),
  uploadImage: (body: { fileName: string; dataUrl: string }) =>
    apiFetch<ImageUploadResponse>("/uploads/images", { method: "POST", body }),
  textbooks: (params: Record<string, string | undefined> = {}) =>
    apiFetch<Textbook[]>(`/textbooks${toQuery(params)}`),
  createTextbook: (body: Omit<Textbook, "id" | "createdAt" | "updatedAt">) =>
    apiFetch<Textbook>("/textbooks", { method: "POST", body }),
  listings: (params: Record<string, string | undefined> = {}) =>
    apiFetch<Listing[]>(`/listings${toQuery(params)}`),
  listing: (id: string) => apiFetch<ListingDetail>(`/listings/${id}`),
  createListing: (body: {
    masterId: string;
    sellingPrice: number;
    condition: string;
    imageUrl: string;
    description?: string;
  }) => apiFetch<Listing>("/listings", { method: "POST", body }),
  cancelListing: (id: string) => apiFetch<Listing>(`/listings/${id}`, { method: "DELETE" }),
  myListings: () => apiFetch<Listing[]>("/listings/me"),
  purchase: (body: { listingId: string; shippingAddress: string; shippingFee: number }) =>
    apiFetch<PurchaseResponse>("/orders", { method: "POST", body }),
  myOrders: () => apiFetch<Order[]>("/orders/me"),
  mySalesOrders: () => apiFetch<Order[]>("/orders/sales/me"),
  updateTransactionStatus: (id: string, transactionStatus: TransactionStatus) =>
    apiFetch<Order>(`/orders/${id}/transaction-status`, {
      method: "PATCH",
      body: { transactionStatus }
    })
};
