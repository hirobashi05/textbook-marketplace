import { z } from "zod";
import { listingConditions, listingStatuses } from "../utils/enums.js";
import {
  isAcademicDepartmentForFaculty,
  isAcademicFaculty,
  isKnownAcademicDepartment
} from "../utils/academicOptions.js";

export const listingQuerySchema = z
  .object({
    faculty: z.string().trim().optional(),
    department: z.string().trim().optional(),
    courseName: z.string().trim().optional(),
    keyword: z.string().trim().optional(),
    status: z.enum(listingStatuses).optional()
  })
  .superRefine((data, ctx) => {
    if (data.faculty && !isAcademicFaculty(data.faculty)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["faculty"],
        message: "指定できない学部です"
      });
    }

    if (data.department && !data.faculty && !isKnownAcademicDepartment(data.department)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["department"],
        message: "指定できない学科です"
      });
    }

    if (
      data.faculty &&
      data.department &&
      isAcademicFaculty(data.faculty) &&
      !isAcademicDepartmentForFaculty(data.faculty, data.department)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["department"],
        message: "選択した学部に存在する学科を指定してください"
      });
    }
  });

export const createListingSchema = z.object({
  masterId: z.string().min(1, "masterId は必須です"),
  sellingPrice: z.number().int("sellingPrice は整数です").min(0, "sellingPrice は0以上です"),
  condition: z.enum(listingConditions),
  imageUrl: z.string().trim().min(1, "商品の画像は必須です").max(2_000_000, "画像データが大きすぎます"),
  description: z.string().trim().max(1000, "description は1000文字以内です").optional()
});
