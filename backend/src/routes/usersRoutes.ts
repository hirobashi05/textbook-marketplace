import { Router } from "express";
import {
  createUser,
  getMe,
  getMyPaymentSettings,
  listMyPointPurchases,
  listMyPointTransactions,
  purchasePoints,
  updateMyPaymentSettings
} from "../controllers/usersController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema } from "../validators/userValidators.js";
import { purchasePointsSchema } from "../validators/orderValidators.js";
import { updatePaymentSettingsSchema } from "../validators/paymentValidators.js";

export const usersRouter = Router();

usersRouter.post("/", validate({ body: createUserSchema }), createUser);
usersRouter.get("/me", requireAuth, getMe);
usersRouter.get("/me/payment-settings", requireAuth, getMyPaymentSettings);
usersRouter.patch(
  "/me/payment-settings",
  requireAuth,
  validate({ body: updatePaymentSettingsSchema }),
  updateMyPaymentSettings
);
usersRouter.post("/me/points/purchase", requireAuth, validate({ body: purchasePointsSchema }), purchasePoints);
usersRouter.get("/me/point-purchases", requireAuth, listMyPointPurchases);
usersRouter.get("/me/point-history", requireAuth, listMyPointTransactions);
