import { Router } from "express";
import { auth } from "../../middleware/auth/auth";
import { DeliveryController } from "./delivery.controller";

const router = Router();
router.get(
  "/save-new-delivery-data",
  auth("EMPLOYEE"),
  DeliveryController.savePhaseDeliveryData
);

export const DeliveryRoute = router;
