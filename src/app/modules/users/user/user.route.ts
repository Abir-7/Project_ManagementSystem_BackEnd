import { Router } from "express";
import { UserController } from "./user.controller";

import { auth } from "../../../middleware/auth/auth";

const router = Router();

router.patch(
  "/update-role",
  auth("ADMIN", "SUPERVISOR"),
  UserController.updateUserRole
);

router.patch(
  "/update-status",
  auth("SUPERVISOR"),
  UserController.updateUserStatus
);

router.get(
  "/me",
  auth("ADMIN", "SUPERVISOR", "EMPLOYEE", "LEADER"),
  UserController.getMyData
);

router.get(
  "/get-employee-list",
  auth("SUPERVISOR"),
  UserController.getEmployeeListOfSupervisor
);

export const UserRoute = router;
