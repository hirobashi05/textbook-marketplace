import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { AppError } from "../utils/errors.js";

type TokenPayload = {
  uid: string;
};

async function resolveUserFromRequest(req: Request) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await prisma.user.findUnique({
      where: { uid: payload.uid },
      select: {
        uid: true,
        email: true,
        name: true,
        userStatus: true
      }
    });

    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUserFromRequest(req);

  if (!user) {
    next(new AppError(401, "UNAUTHORIZED", "認証が必要です"));
    return;
  }

  req.user = user;
  next();
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUserFromRequest(req);

  if (user) {
    req.user = user;
  }

  next();
}

