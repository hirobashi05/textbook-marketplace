import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { AppError, asyncHandler } from "../utils/errors.js";
import { toTextbookResponse } from "../utils/serializers.js";
import { assertActiveUser } from "../services/userService.js";

type TextbookQuery = {
  keyword?: string;
  faculty?: string;
  department?: string;
  courseName?: string;
};

function buildTextbookWhere(query: TextbookQuery): Prisma.TextbookMasterWhereInput {
  const where: Prisma.TextbookMasterWhereInput = {};

  if (query.faculty) {
    where.faculty = query.faculty;
  }

  if (query.department) {
    where.department = query.department;
  }

  if (query.courseName) {
    where.courseName = { contains: query.courseName };
  }

  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword } },
      { courseName: { contains: query.keyword } },
      { faculty: { contains: query.keyword } },
      { department: { contains: query.keyword } },
      { isbn: { contains: query.keyword } }
    ];
  }

  return where;
}

export const listTextbooks = asyncHandler(async (req, res) => {
  const textbooks = await prisma.textbookMaster.findMany({
    where: buildTextbookWhere(req.query as TextbookQuery),
    orderBy: { createdAt: "desc" }
  });

  res.json(textbooks.map(toTextbookResponse));
});

export const getTextbook = asyncHandler(async (req, res) => {
  const textbook = await prisma.textbookMaster.findUnique({
    where: { id: req.params.id }
  });

  if (!textbook) {
    throw new AppError(404, "NOT_FOUND", "教科書マスタが見つかりません");
  }

  res.json(toTextbookResponse(textbook));
});

export const createTextbook = asyncHandler(async (req, res) => {
  assertActiveUser(req.user!);

  try {
    const textbook = await prisma.textbookMaster.create({
      data: req.body
    });

    res.status(201).json(toTextbookResponse(textbook));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(400, "VALIDATION_ERROR", "この ISBN はすでに登録されています");
    }

    throw error;
  }
});
