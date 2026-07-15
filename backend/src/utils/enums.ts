import {
  ListingCondition,
  ListingStatus,
  OrderStatus,
  PointTransactionType,
  PointPurchaseStatus,
  TransactionStatus,
  UserStatus
} from "@prisma/client";

export const listingStatuses = ["available", "sold", "cancelled"] as const;
export const listingConditions = ["new", "good", "fair", "poor", "has_writing"] as const;
export const orderStatuses = ["created", "paid", "cancelled"] as const;
export const userStatuses = ["active", "suspended", "deleted"] as const;
export const transactionStatuses = [
  "purchased",
  "awaiting_seller_confirmation",
  "preparing_shipment",
  "shipped",
  "completed",
  "cancellation_requested"
] as const;
export const pointPurchaseStatuses = ["created", "paid", "cancelled"] as const;
export const pointTransactionTypes = [
  "point_purchase",
  "textbook_purchase",
  "textbook_sale",
  "cancellation_refund",
  "admin_adjustment"
] as const;

export type ApiListingStatus = (typeof listingStatuses)[number];
export type ApiListingCondition = (typeof listingConditions)[number];

export function toApiUserStatus(status: UserStatus) {
  return status.toLowerCase() as (typeof userStatuses)[number];
}

export function toApiListingStatus(status: ListingStatus) {
  return status.toLowerCase() as ApiListingStatus;
}

export function toApiListingCondition(condition: ListingCondition) {
  return condition.toLowerCase() as ApiListingCondition;
}

export function toApiOrderStatus(status: OrderStatus) {
  return status.toLowerCase() as (typeof orderStatuses)[number];
}

export function toApiTransactionStatus(status: TransactionStatus) {
  return status.toLowerCase() as (typeof transactionStatuses)[number];
}

export function toApiPointPurchaseStatus(status: PointPurchaseStatus) {
  return status.toLowerCase() as (typeof pointPurchaseStatuses)[number];
}

export function toApiPointTransactionType(type: PointTransactionType) {
  return type.toLowerCase() as (typeof pointTransactionTypes)[number];
}

export function toPrismaTransactionStatus(status: (typeof transactionStatuses)[number]) {
  const map = {
    purchased: TransactionStatus.PURCHASED,
    awaiting_seller_confirmation: TransactionStatus.AWAITING_SELLER_CONFIRMATION,
    preparing_shipment: TransactionStatus.PREPARING_SHIPMENT,
    shipped: TransactionStatus.SHIPPED,
    completed: TransactionStatus.COMPLETED,
    cancellation_requested: TransactionStatus.CANCELLATION_REQUESTED
  } satisfies Record<(typeof transactionStatuses)[number], TransactionStatus>;

  return map[status];
}

export function toPrismaListingStatus(status: ApiListingStatus) {
  const map = {
    available: ListingStatus.AVAILABLE,
    sold: ListingStatus.SOLD,
    cancelled: ListingStatus.CANCELLED
  } satisfies Record<ApiListingStatus, ListingStatus>;

  return map[status];
}

export function toPrismaListingCondition(condition: ApiListingCondition) {
  const map = {
    new: ListingCondition.NEW,
    good: ListingCondition.GOOD,
    fair: ListingCondition.FAIR,
    poor: ListingCondition.POOR,
    has_writing: ListingCondition.HAS_WRITING
  } satisfies Record<ApiListingCondition, ListingCondition>;

  return map[condition];
}
