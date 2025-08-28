import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ProjectController } from "./project.controller";
import zodValidator from "../../../middleware/zodValidator";
import { ZodProjectSchema } from "./project.validation";

const router = Router();

router.get("/get-all", auth("SUPERVISOR"), ProjectController.getAllProject);

router.get(
  "/get-single-project/:projectId",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  ProjectController.getProjectData
);

router.get(
  "/get-phase-details/:phaseId",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  ProjectController.getPhaseDetails
);
router.patch(
  "/update-work-progress/:phaseId",
  auth("EMPLOYEE"),
  ProjectController.updateWorkProgress
);

router.get(
  "/get-my-projects",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  ProjectController.getMyProject
);

router.get(
  "/get-my-team-projects",
  auth("LEADER", "EMPLOYEE"),
  ProjectController.getMyTeamProjects
);

router.post(
  "/add",
  auth("LEADER"),
  zodValidator(ZodProjectSchema),
  ProjectController.addProject
);

router.post(
  "/assign-employee-to-project",
  auth("SUPERVISOR", "LEADER"),
  ProjectController.assignEmployeeToProject
);

router.get(
  "/get-project-status-list",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE", "ADMIN"),
  ProjectController.getProjectStatusList
);

export const ProjectRoute = router;
