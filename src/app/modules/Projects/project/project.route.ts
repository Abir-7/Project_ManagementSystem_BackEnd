import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ProjectController } from "./project.controller";
import zodValidator from "../../../middleware/zodValidator";
import { ZodProjectSchema } from "./project.validation";

const router = Router();

router.get(
  "/get-all",
  auth("SUPERVISOR", "LEADER"),
  ProjectController.getAllProject
);
router.get(
  "/get-phase-details/:phaseId",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  ProjectController.getPhaseDetails
);

router.post(
  "/add",
  auth("SUPERVISOR", "LEADER"),
  zodValidator(ZodProjectSchema),
  ProjectController.addProject
);

router.post(
  "/assign-employee-to-project",
  auth("SUPERVISOR", "LEADER"),
  ProjectController.assignEmployeeToProject
);

export const ProjectRoute = router;
