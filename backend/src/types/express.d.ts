import type { UserStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        name: string;
        userStatus: UserStatus;
      };
    }
  }
}

export {};

