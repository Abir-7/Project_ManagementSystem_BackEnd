import { Router } from "express";
import { TeamController } from "./team.controller";
import { auth } from "../../middleware/auth/auth";

const router = Router();

router.post("/create", auth("SUPERVISOR"), TeamController.createTeam);

router.get(
  "/team-list",
  auth("ADMIN", "SUPERVISOR", "LEADER", "EMPLOYEE"),
  TeamController.getTeamList
);

export const TeamRoute = router;
