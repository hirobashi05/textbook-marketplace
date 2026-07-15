import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

const uploadRoot = path.resolve(process.cwd(), "storage", "uploads");
const imageUploadRoot = path.join(uploadRoot, "images");
const maxFilesystemImageBytes = 5 * 1024 * 1024;
const maxDataUrlImageBytes = 1_250_000;

const allowedImageMimeTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
} as const;

type UploadPayload = {
  fileName: string;
  dataUrl: string;
};

type ImageMimeType = keyof typeof allowedImageMimeTypes;

function parseImageDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/u.exec(dataUrl.trim());

  if (!match) {
    throw new AppError(400, "VALIDATION_ERROR", "画像データの形式が不正です");
  }

  return {
    contentType: match[1],
    base64Data: match[2]
  };
}

function assertSupportedImage(contentType: string): asserts contentType is ImageMimeType {
  if (!(contentType in allowedImageMimeTypes)) {
    throw new AppError(400, "VALIDATION_ERROR", "JPEG / PNG / WEBP 画像のみアップロードできます");
  }
}

function buildStoredFileName(originalFileName: string, contentType: ImageMimeType) {
  const rawBaseName = path.basename(originalFileName, path.extname(originalFileName));
  const safeBaseName = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) || "image";
  const extension = allowedImageMimeTypes[contentType];

  return `${Date.now()}-${safeBaseName}-${randomUUID()}${extension}`;
}

export async function saveImageUpload(payload: UploadPayload) {
  const { contentType, base64Data } = parseImageDataUrl(payload.dataUrl);
  assertSupportedImage(contentType);

  const imageBuffer = Buffer.from(base64Data, "base64");
  const maxImageBytes =
    env.UPLOAD_STORAGE === "data_url" ? maxDataUrlImageBytes : maxFilesystemImageBytes;

  if (!imageBuffer.length) {
    throw new AppError(400, "VALIDATION_ERROR", "画像データが空です");
  }

  if (imageBuffer.length > maxImageBytes) {
    throw new AppError(400, "VALIDATION_ERROR", "画像サイズは5MB以下にしてください");
  }

  if (env.UPLOAD_STORAGE === "data_url") {
    return `data:${contentType};base64,${base64Data}`;
  }

  await fs.mkdir(imageUploadRoot, { recursive: true });

  const storedFileName = buildStoredFileName(payload.fileName, contentType);
  const outputPath = path.join(imageUploadRoot, storedFileName);

  await fs.writeFile(outputPath, imageBuffer);

  return `/uploads/images/${storedFileName}`;
}

export function toPublicUploadUrl(req: Request, imagePath: string) {
  if (imagePath.startsWith("data:")) {
    return imagePath;
  }

  const host = req.get("host");

  if (!host) {
    return imagePath;
  }

  return `${req.protocol}://${host}${imagePath}`;
}
