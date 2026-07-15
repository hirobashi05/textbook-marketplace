import cors from "cors";
import express from "express";
import path from "node:path";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

export const app = express();
const uploadDirectory = path.resolve(process.cwd(), "storage", "uploads");

app.set("trust proxy", 1);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use("/uploads", express.static(uploadDirectory));
app.use(express.json({ limit: "8mb" }));

app.use(apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
