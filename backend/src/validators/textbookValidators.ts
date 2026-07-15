import { z } from "zod";
import {
  isAcademicDepartmentForFaculty,
  isAcademicFaculty,
  isKnownAcademicDepartment
} from "../utils/academicOptions.js";

function refineAcademicQuery(
  data: { faculty?: string; department?: string },
  ctx: z.RefinementCtx
) {
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
}

export const textbookQuerySchema = z
  .object({
    keyword: z.string().trim().optional(),
    faculty: z.string().trim().optional(),
    department: z.string().trim().optional(),
    courseName: z.string().trim().optional()
  })
  .superRefine(refineAcademicQuery);

export const createTextbookSchema = z
  .object({
    isbn: z.string().trim().min(10, "isbn は10文字以上です").max(20, "isbn は20文字以内です"),
    title: z.string().trim().min(1, "title は必須です").max(200, "title は200文字以内です"),
    publisher: z.string().trim().min(1, "publisher は必須です").max(120, "publisher は120文字以内です"),
    listPrice: z.number().int("listPrice は整数です").min(0, "listPrice は0以上です"),
    courseName: z.string().trim().min(1, "courseName は必須です").max(120, "courseName は120文字以内です"),
    faculty: z.string().trim().min(1, "faculty は必須です").max(80, "faculty は80文字以内です"),
    department: z.string().trim().min(1, "department は必須です").max(80, "department は80文字以内です"),
    academicYear: z.number().int("academicYear は整数です").min(1, "academicYear は1以上です").max(6, "academicYear は6以下です"),
    imageUrl: z.string().trim().min(1, "教科書画像は必須です").max(2_000_000, "画像データが大きすぎます")
  })
  .superRefine((data, ctx) => {
    if (!isAcademicFaculty(data.faculty)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["faculty"],
        message: "指定できない学部です"
      });
    }

    if (!isAcademicDepartmentForFaculty(data.faculty, data.department)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["department"],
        message: "選択した学部に存在する学科を指定してください"
      });
    }
  });
