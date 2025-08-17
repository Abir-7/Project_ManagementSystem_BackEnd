import httpStatus from "http-status";
import catchAsync from "../../utils/serverTools/catchAsync";
import sendResponse from "../../utils/serverTools/sendResponse";
import { DeliveryService } from "./delivery.service";

const savePhaseDeliveryData = catchAsync(async (req, res) => {
  const result = await DeliveryService.savePhaseDeliveryData(
    req.user.userId,
    req.body.phaseId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Delivery data stored successfully",
    data: result,
  });
});

export const DeliveryController = {
  savePhaseDeliveryData,
};
