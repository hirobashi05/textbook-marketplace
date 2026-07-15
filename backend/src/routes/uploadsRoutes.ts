import { Router } from "express";
import { uploadImage } from "../controllers/uploadsController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { uploadImageSchema } from "../validators/uploadValidators.js";

export const uploadsRouter = Router();

uploadsRouter.post("/images", requireAuth, validate({ body: uploadImageSchema }), uploadImage);
