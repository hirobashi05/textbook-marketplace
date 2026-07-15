import { Router } from "express";
import {
  createOrder,
  listMyOrders,
  listMySalesOrders,
  updateTransactionStatus
} from "../controllers/ordersController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  createOrderSchema,
  updateTransactionStatusSchema
} from "../validators/orderValidators.js";

export const ordersRouter = Router();

ordersRouter.post("/", requireAuth, validate({ body: createOrderSchema }), createOrder);
ordersRouter.get("/me", requireAuth, listMyOrders);
ordersRouter.get("/sales/me", requireAuth, listMySalesOrders);
ordersRouter.patch(
  "/:id/transaction-status",
  requireAuth,
  validate({ params: idParamSchema, body: updateTransactionStatusSchema }),
  updateTransactionStatus
);
