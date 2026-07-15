import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { listingsRouter } from "./listingsRoutes.js";
import { ordersRouter } from "./ordersRoutes.js";
import { textbooksRouter } from "./textbooksRoutes.js";
import { uploadsRouter } from "./uploadsRoutes.js";
import { usersRouter } from "./usersRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.use("/users", usersRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/uploads", uploadsRouter);
apiRouter.use("/textbooks", textbooksRouter);
apiRouter.use("/listings", listingsRouter);
apiRouter.use("/orders", ordersRouter);
