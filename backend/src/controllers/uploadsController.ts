import { assertActiveUser } from "../services/userService.js";
import { saveImageUpload, toPublicUploadUrl } from "../services/uploadService.js";
import { asyncHandler } from "../utils/errors.js";

export const uploadImage = asyncHandler(async (req, res) => {
  assertActiveUser(req.user!);

  const imagePath = await saveImageUpload({
    fileName: req.body.fileName,
    dataUrl: req.body.dataUrl
  });

  res.status(201).json({
    imageUrl: toPublicUploadUrl(req, imagePath)
  });
});
