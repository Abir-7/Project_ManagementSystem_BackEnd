import httpStatus from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";

import { ProjectValuationService } from "./valuation.service";
import { valuation_data } from "./valuation.data";

const addProjectValuationData = catchAsync(async (req, res) => {
  const result = await ProjectValuationService.saveProjectValuations(
    valuation_data
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Project valuation data added successfully",
    data: result,
  });
});

const getValuationData = catchAsync(async (req, res) => {
  const result = await ProjectValuationService.getValuationData();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Project valuation data fetched successfully",
    data: result,
  });
});
const addValuationToProjectPhase = catchAsync(async (req, res) => {
  const { valuationId, projectPhase } = req.body;
  const result = await ProjectValuationService.addValuationToProjectPhase(
    valuationId,
    projectPhase
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Project valuation data fetched successfully",
    data: result,
  });
});

export const ProjectValuationController = {
  addProjectValuationData,
  getValuationData,
  addValuationToProjectPhase,
};
