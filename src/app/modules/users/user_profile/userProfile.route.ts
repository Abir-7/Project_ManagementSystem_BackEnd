import { Router } from "express";
import zodValidator from "../../../middleware/zodValidator";
import { zodUpdateProfileSchema } from "./userProfile.validation";
import { upload } from "../../../middleware/fileUpload/fileUploadHandler";
import { auth } from "../../../middleware/auth/auth";
import { UserProfileController } from "./userProfile.controller";

const router = Router();

router.patch(
  "/update-profile-image",
  auth("ADMIN"),
  upload.single("image"),
  UserProfileController.updateProfileImage
);

router.patch(
  "/update-profile-data",
  auth("ADMIN"),
  zodValidator(zodUpdateProfileSchema),
  UserProfileController.updateProfileData
);

export const UserProfileRoute = router;
