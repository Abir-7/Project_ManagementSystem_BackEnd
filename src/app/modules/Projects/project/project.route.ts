import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ProjectController } from "./project.controller";
import zodValidator from "../../../middleware/zodValidator";
import { ZodProjectSchema } from "./project.validation";

const router = Router();

router.post(
  "/add",
  auth("SUPERVISOR", "LEADER"),
  zodValidator(ZodProjectSchema),
  ProjectController.addProject
);

export const ProjectRoute = router;
