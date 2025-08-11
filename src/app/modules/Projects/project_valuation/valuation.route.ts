import { Router } from "express";
import { auth } from "../../../middleware/auth/auth";
import { ProjectValuationController } from "./valuation.controller";

const router = Router();
router.get(
  "/get-project-valuation-data",
  auth("SUPERVISOR"),
  ProjectValuationController.getValuationData
);
router.post(
  "/add-project-valuation-data",
  auth("SUPERVISOR"),
  ProjectValuationController.addProjectValuationData
);
router.post(
  "/add-valuation-to-phase",
  auth("SUPERVISOR"),
  ProjectValuationController.addValuationToProjectPhase
);

export const ProjectValuationRoute = router;
