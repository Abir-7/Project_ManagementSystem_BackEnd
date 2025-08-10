import { Router } from "express";
import { TeamController } from "./team.controller";
import { auth } from "../../middleware/auth/auth";

const router = Router();

router.post("/create", auth("SUPERVISOR"), TeamController.createTeam);
router.post(
  "/assign-employee-to-a-team",
  auth("SUPERVISOR"),
  TeamController.assignEmployeeToTeam
);
router.post(
  "/assign-employee-to-a-new-team",
  auth("SUPERVISOR"),
  TeamController.assignEmployeeToNewTeam
);
router.get(
  "/team-list",
  auth("ADMIN", "SUPERVISOR", "LEADER", "EMPLOYEE"),
  TeamController.getTeamList
);

router.patch(
  "/split-team",
  auth("ADMIN", "SUPERVISOR", "LEADER", "EMPLOYEE"),
  TeamController.splitTeam
);

export const TeamRoute = router;
