import { Router } from "express";
import { UserController } from "./user.controller";

import { auth } from "../../../middleware/auth/auth";

const router = Router();

router.get(
  "/me",
  auth("ADMIN", "SUPERVISOR", "EMPLOYEE", "LEADER"),
  UserController.getMyData
);
router.get(
  "/get-supervisor-list",
  auth("ADMIN"),
  UserController.getSuperVisorList
);

router.get(
  "/get-employee-list",
  auth("SUPERVISOR"),
  UserController.getEmployeeList
);

export const UserRoute = router;
