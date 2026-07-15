import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", `${req.method} ${req.path} は存在しません`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error.issues.map((issue) => issue.message).join(", ")
      }
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "データベース制約に違反しました"
      }
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "サーバー内部でエラーが発生しました"
    }
  });
}

