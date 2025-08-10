import httpStatus from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { ProjectService } from "./project.service";

const addProject = catchAsync(async (req, res) => {
  const result = await ProjectService.addProject(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Project added successfully",
    data: result,
  });
});

export const ProjectController = {
  addProject,
};
