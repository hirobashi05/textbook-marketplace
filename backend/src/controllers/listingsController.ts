import { ListingStatus, Prisma, UserStatus } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import {
  toApiListingStatus,
  toPrismaListingCondition,
  toPrismaListingStatus
} from "../utils/enums.js";
import { toListingResponse } from "../utils/serializers.js";
import { assertActiveUser } from "../services/userService.js";

const listingInclude = {
  textbook: true,
  seller: {
    select: {
      uid: true,
      name: true
    }
  }
} satisfies Prisma.ListingInclude;

type ListingQuery = {
  faculty?: string;
  department?: string;
  courseName?: string;
  keyword?: string;
  status?: "available" | "sold" | "cancelled";
};

function buildListingWhere(query: ListingQuery): Prisma.ListingWhereInput {
  const textbookWhere: Prisma.TextbookMasterWhereInput = {};

  if (query.faculty) {
    textbookWhere.faculty = query.faculty;
  }

  if (query.department) {
    textbookWhere.department = query.department;
  }

  if (query.courseName) {
    textbookWhere.courseName = { contains: query.courseName };
  }

  if (query.keyword) {
    textbookWhere.OR = [
      { title: { contains: query.keyword } },
      { courseName: { contains: query.keyword } },
      { faculty: { contains: query.keyword } },
      { department: { contains: query.keyword } },
      { isbn: { contains: query.keyword } }
    ];
  }

  return {
    status: query.status ? toPrismaListingStatus(query.status) : ListingStatus.AVAILABLE,
    textbook: textbookWhere
  };
}

export const listListings = asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: buildListingWhere(req.query as ListingQuery),
    include: listingInclude,
    orderBy: { createdAt: "desc" }
  });

  res.json(listings.map(toListingResponse));
});

export const getListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: listingInclude
  });

  if (!listing) {
    throw new AppError(404, "LISTING_NOT_FOUND", "出品が見つかりません");
  }

  const isOwnListing = req.user?.uid === listing.sellerId;
  const canPurchase =
    listing.status === ListingStatus.AVAILABLE &&
    !isOwnListing &&
    (!req.user || req.user.userStatus === UserStatus.ACTIVE);

  res.json({
    ...toListingResponse(listing),
    canPurchase,
    isOwnListing
  });
});

export const createListing = asyncHandler(async (req, res) => {
  assertActiveUser(req.user!);

  const textbook = await prisma.textbookMaster.findUnique({
    where: { id: req.body.masterId }
  });

  if (!textbook) {
    throw new AppError(400, "VALIDATION_ERROR", "masterId が存在しません");
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: req.user!.uid,
      masterId: req.body.masterId,
      sellingPrice: req.body.sellingPrice,
      condition: toPrismaListingCondition(req.body.condition),
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      status: ListingStatus.AVAILABLE
    },
    include: listingInclude
  });

  res.status(201).json(toListingResponse(listing));
});

export const cancelListing = asyncHandler(async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: req.params.id },
    include: listingInclude
  });

  if (!listing) {
    throw new AppError(404, "LISTING_NOT_FOUND", "出品が見つかりません");
  }

  if (listing.sellerId !== req.user!.uid) {
    throw new AppError(403, "FORBIDDEN", "他人の出品は取り下げできません");
  }

  if (listing.status !== ListingStatus.AVAILABLE) {
    throw new AppError(409, "LISTING_NOT_AVAILABLE", "available の出品のみ取り下げできます");
  }

  const cancelled = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: ListingStatus.CANCELLED },
    include: listingInclude
  });

  res.json({
    ...toListingResponse(cancelled),
    message: "出品を取り下げました",
    listingStatus: toApiListingStatus(cancelled.status)
  });
});

export const listMyListings = asyncHandler(async (req, res) => {
  const listings = await prisma.listing.findMany({
    where: { sellerId: req.user!.uid },
    include: listingInclude,
    orderBy: { createdAt: "desc" }
  });

  res.json(listings.map(toListingResponse));
});
