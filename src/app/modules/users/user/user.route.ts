import { Router } from "express";
import { UserController } from "./user.controller";

import { auth } from "../../../middleware/auth/auth";

const router = Router();

router.patch(
  "/update-status-role",
  auth("SUPERVISOR"),
  UserController.updateUserStatusRole
);
router.get(
  "/employee-status-list",
  auth("SUPERVISOR"),
  UserController.getAllEmloyeeStatusList
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
router.get(
  "/get-supervisor-list",
  auth("ADMIN"),
  UserController.getSupervisorList
);

export const UserRoute = router;
