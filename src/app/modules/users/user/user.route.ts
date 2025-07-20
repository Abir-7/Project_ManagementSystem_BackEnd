import { Router } from "express";
import { UserController } from "./user.controller";

import { auth } from "../../../middleware/auth/auth";

const router = Router();

router.get("/me", auth("ADMIN"), UserController.getMyData);

export const UserRoute = router;
