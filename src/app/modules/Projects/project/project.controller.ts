import httpStatus from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { ProjectService } from "./project.service";
import { IProjectStatus } from "./project.interface";

const addProject = catchAsync(async (req, res) => {
  const result = await ProjectService.addProject(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Project added successfully",
    data: result,
  });
});
const getAllProject = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const searchTerm = (req.query.searchTerm as string) || "";

  const teamId = req.query.teamId as string | undefined;
  const projectStatus = req.query.projectStatus as IProjectStatus | undefined;

  const result = await ProjectService.getAllProject(
    page,
    limit,
    searchTerm,
    teamId,
    projectStatus
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "All Project fetched successfully",
    data: result,
  });
});

const getPhaseDetails = catchAsync(async (req, res) => {
  const result = await ProjectService.getPhaseDetails(req.params.phaseId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Phase details fetched successfully",
    data: result,
  });
});

const assignEmployeeToProject = catchAsync(async (req, res) => {
  const result = await ProjectService.assignEmployeeToProject(
    req.body.employee,
    req.body.projectPhase
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Employee assign to a project phase successfully",
    data: result,
  });
});

const updateWorkProgress = catchAsync(async (req, res) => {
  const result = await ProjectService.updateWorkProgress(
    req.user.userId,
    req.params.phaseId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Work progress updated successfully",
    data: result,
  });
});

const getMyProject = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  // Get query params with defaults
  const projectStatus =
    (req.query.projectStatus as IProjectStatus) || IProjectStatus.ONGOING;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await ProjectService.getMyProject(
    userId,
    projectStatus,
    page,
    limit
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All projects of user fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMyTeam = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await ProjectService.getMyTeam(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team of user fetched successfully",
    data: result,
  });
});

const getMyTeamProjects = catchAsync(async (req, res) => {
  const teamId = req.params.teamId;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const searchProject = (req.query.searchTerm as string) || "";
  const projectStatus = req.query.projectStatus as IProjectStatus;

  const result = await ProjectService.getMyTeamProjects(
    teamId,
    page,
    limit,
    searchProject,
    projectStatus
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team of user fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const ProjectController = {
  addProject,
  getAllProject,
  getPhaseDetails,
  assignEmployeeToProject,
  updateWorkProgress,
  getMyProject,
  getMyTeam,
  getMyTeamProjects,
};
