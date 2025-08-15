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
router.get("/team-list", auth("SUPERVISOR"), TeamController.getTeamList);

router.get(
  "/team-list-filter",
  auth("SUPERVISOR"),
  TeamController.getTeamListForFilterSuperVisor
);

router.patch("/split-team", auth("SUPERVISOR"), TeamController.splitTeam);

router.get(
  "/get-my-team",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  TeamController.getMyTeam
);

router.get(
  "/get-status-list-of-team",
  auth("SUPERVISOR", "LEADER", "EMPLOYEE"),
  TeamController.getAllStausListOfTeam
);

router.get(
  "/team-details/:tId",
  auth("SUPERVISOR", "EMPLOYEE"),
  TeamController.teamDetails
);

router.get(
  "/team-member-list/:tId",
  auth("SUPERVISOR", "EMPLOYEE"),
  TeamController.getEmployeeOfTeam
);

export const TeamRoute = router;
