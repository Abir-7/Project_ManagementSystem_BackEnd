import { Router } from "express";
import { AuthController } from "./auth.controller";
import { auth } from "../../middleware/auth/auth";

import zodValidator from "../../middleware/zodValidator";
import { zodCreateUserSchema } from "./auth.validation";

const router = Router();

router.post(
  "/create-user",
  auth("ADMIN", "SUPERVISOR"),
  zodValidator(zodCreateUserSchema),
  AuthController.createUser
);

router.post("/get-access-token", AuthController.getNewAccessToken);

router.post("/login", AuthController.userLogin);

router.patch("/verify-user", AuthController.verifyUser);
router.patch("/forgot-password-request", AuthController.forgotPasswordRequest);
router.patch("/reset-password", AuthController.resetPassword);
router.patch(
  "/update-password",
  auth("EMPLOYEE", "SUPERVISOR", "LEADER"),
  AuthController.updatePassword
);
router.patch("/resend-code", AuthController.reSendOtp);

export const AuthRoute = router;
