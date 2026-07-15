import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "email または password が正しくありません");
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError(401, "INVALID_CREDENTIALS", "email または password が正しくありません");
  }

  const token = jwt.sign({ uid: user.uid }, env.JWT_SECRET, { expiresIn: "7d" });

  res.json({
    token,
    user: {
      uid: user.uid,
      email: user.email,
      name: user.name
    }
  });
});

