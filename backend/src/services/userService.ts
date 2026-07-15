import { UserStatus, type User } from "@prisma/client";
import { AppError } from "../utils/errors.js";

export function assertActiveUser(user: Pick<User, "userStatus">) {
  if (user.userStatus !== UserStatus.ACTIVE) {
    throw new AppError(403, "USER_NOT_ACTIVE", "このユーザーは現在操作できません");
  }
}

