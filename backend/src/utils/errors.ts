import type { NextFunction, Request, Response } from "express";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_DOMAIN_NOT_ALLOWED"
  | "EMAIL_ALREADY_EXISTS"
  | "INVALID_CREDENTIALS"
  | "USER_NOT_ACTIVE"
  | "LISTING_NOT_FOUND"
  | "LISTING_NOT_AVAILABLE"
  | "CANNOT_BUY_OWN_LISTING"
  | "INVALID_SHIPPING_FEE"
  | "INSUFFICIENT_POINTS"
  | "INVALID_POINT_PURCHASE"
  | "PURCHASE_CONFLICT"
  | "INVALID_TRANSACTION_STATUS_TRANSITION"
  | "TRANSACTION_STATUS_CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
