import { Router } from "express";
import {
  cancelListing,
  createListing,
  getListing,
  listListings,
  listMyListings
} from "../controllers/listingsController.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParamSchema } from "../validators/common.js";
import {
  createListingSchema,
  listingQuerySchema
} from "../validators/listingValidators.js";

export const listingsRouter = Router();

listingsRouter.get("/me", requireAuth, listMyListings);
listingsRouter.get("/", validate({ query: listingQuerySchema }), listListings);
listingsRouter.post("/", requireAuth, validate({ body: createListingSchema }), createListing);
listingsRouter.get("/:id", optionalAuth, validate({ params: idParamSchema }), getListing);
listingsRouter.delete("/:id", requireAuth, validate({ params: idParamSchema }), cancelListing);

