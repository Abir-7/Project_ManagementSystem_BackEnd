import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ProjectValuationController } from "./valuation.controller";

const router = Router();

router.post(
  "/add-project-valuation-data",
  auth("SUPERVISOR"),
  ProjectValuationController.addProjectValuationData
);

export const ProjectValuationRoute = router;
