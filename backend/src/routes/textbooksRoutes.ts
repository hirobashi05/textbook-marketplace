import { Router } from "express";
import {
  createTextbook,
  getTextbook,
  listTextbooks
} from "../controllers/textbooksController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  createTextbookSchema,
  textbookQuerySchema
} from "../validators/textbookValidators.js";

export const textbooksRouter = Router();

textbooksRouter.get("/", validate({ query: textbookQuerySchema }), listTextbooks);
textbooksRouter.post("/", requireAuth, validate({ body: createTextbookSchema }), createTextbook);
textbooksRouter.get("/:id", validate({ params: idParamSchema }), getTextbook);

