import type { Listing, Order, PointPurchase, PointTransaction, TextbookMaster, User } from "@prisma/client";
import {
  toApiListingCondition,
  toApiListingStatus,
  toApiOrderStatus,
  toApiPointPurchaseStatus,
  toApiPointTransactionType,
  toApiTransactionStatus,
  toApiUserStatus
} from "./enums.js";

export function toUserResponse(
  user: Pick<User, "uid" | "email" | "name" | "paymentMethod" | "points" | "userStatus" | "createdAt" | "updatedAt">
) {
  return {
    uid: user.uid,
    email: user.email,
    name: user.name,
    paymentMethod: user.paymentMethod,
    points: user.points,
    userStatus: toApiUserStatus(user.userStatus),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function toPublicUser(user: Pick<User, "uid" | "name">) {
  return {
    uid: user.uid,
    name: user.name
  };
}

export function toTextbookResponse(textbook: TextbookMaster) {
  return {
    id: textbook.id,
    isbn: textbook.isbn,
    title: textbook.title,
    publisher: textbook.publisher,
    listPrice: textbook.listPrice,
    courseName: textbook.courseName,
    faculty: textbook.faculty,
    department: textbook.department,
    academicYear: textbook.academicYear,
    imageUrl: textbook.imageUrl,
    createdAt: textbook.createdAt,
    updatedAt: textbook.updatedAt
  };
}

export function toListingResponse(
  listing: Listing & { textbook: TextbookMaster; seller: Pick<User, "uid" | "name"> }
) {
  return {
    id: listing.id,
    sellingPrice: listing.sellingPrice,
    condition: toApiListingCondition(listing.condition),
    description: listing.description,
    imageUrl: listing.imageUrl,
    status: toApiListingStatus(listing.status),
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    textbook: toTextbookResponse(listing.textbook),
    seller: toPublicUser(listing.seller)
  };
}

export function toOrderResponse(
  order: Order & {
    listing: Listing & { textbook: TextbookMaster; seller: Pick<User, "uid" | "name"> };
  }
) {
  return {
    id: order.id,
    listingId: order.listingId,
    buyerId: order.buyerId,
    shippingAddress: order.shippingAddress,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    status: toApiOrderStatus(order.status),
    transactionStatus: toApiTransactionStatus(order.transactionStatus),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    listing: toListingResponse(order.listing)
  };
}

export function toPointPurchaseResponse(purchase: PointPurchase) {
  return {
    id: purchase.id,
    userId: purchase.userId,
    amount: purchase.amount,
    paymentMethod: purchase.paymentMethod,
    providerReference: purchase.providerReference,
    status: toApiPointPurchaseStatus(purchase.status),
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt
  };
}

export function toPointTransactionResponse(transaction: PointTransaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: toApiPointTransactionType(transaction.type),
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    orderId: transaction.orderId,
    pointPurchaseId: transaction.pointPurchaseId,
    description: transaction.description,
    createdAt: transaction.createdAt
  };
}

export function toPaymentSettingsResponse(settings: {
  preferredMethod: string;
  creditCard: {
    holderName: string;
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  } | null;
  convenienceStore: {
    chain: string;
    payerName: string;
    payerPhone: string;
  } | null;
  updatedAt: string | null;
}) {
  return settings;
}
