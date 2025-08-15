import { TeamService } from "./team.service";
import { TeamStatus } from "./team.interface";

import sendResponse from "../../utils/serverTools/sendResponse";
import httpStatus from "http-status";
import catchAsync from "../../utils/serverTools/catchAsync";

const createTeam = catchAsync(async (req, res) => {
  const { name } = req.body;
  const createdBy = req.user.userId;

  const result = await TeamService.createTeam(name, createdBy);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Team created successfully",
    data: result,
  });
});

const assignEmployeeToTeam = catchAsync(async (req, res) => {
  const { userId, teamId } = req.body;

  const result = await TeamService.assignEmployeeToTeam(
    userId,
    teamId,
    req.user.userId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Employee assinged to a team successfully",
    data: result,
  });
});

const assignEmployeeToNewTeam = catchAsync(async (req, res) => {
  const { userId, teamId } = req.body;

  const result = await TeamService.assignEmployeeToNewTeam(
    userId,
    teamId,
    req.user.userId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Employee assinged to a new team successfully",
    data: result,
  });
});

const getTeamList = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, searchTerm, status } = req.query;

  let teamStatus: TeamStatus | undefined = undefined;
  if (status && Object.values(TeamStatus).includes(status as TeamStatus)) {
    teamStatus = status as TeamStatus;
  }

  const result = await TeamService.getTeamList(
    Number(page),
    Number(limit),
    searchTerm as string,
    teamStatus,
    req.user.userId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team list fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});
const splitTeam = catchAsync(async (req, res) => {
  const { originalTeamId, newTeamName, employeeIdsToMove } = req.body;

  const result = await TeamService.splitTeam(
    originalTeamId,
    newTeamName,
    employeeIdsToMove,
    req.user.userId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team splited successfully",
    data: result,
  });
});
const teamDetails = catchAsync(async (req, res) => {
  const result = await TeamService.teamDetails(
    req.params.tId,
    req.user.userId,
    req.user.userRole
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team details fetched successfully",
    data: result,
  });
});

const getEmployeeOfTeam = catchAsync(async (req, res) => {
  const result = await TeamService.getEmployeeOfTeam(
    req.params.tId,
    req.query.searchTerm as string,
    req.user.userId,
    req.user.userRole
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Member of a team fetched successfully",
    data: result,
  });
});

const getMyTeam = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await TeamService.getMyTeam(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team of user fetched successfully",
    data: result,
  });
});

const getTeamListForFilterSuperVisor = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const result = await TeamService.getTeamListForFilterSuperVisor(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team list fetched successfully",
    data: result,
  });
});

const getAllStausListOfTeam = catchAsync(async (req, res) => {
  const result = await TeamService.getAllStausListOfTeam();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team status list fetched successfully",
    data: result,
  });
});

export const TeamController = {
  createTeam,
  assignEmployeeToTeam,
  assignEmployeeToNewTeam,
  getTeamList,
  teamDetails,
  getEmployeeOfTeam,
  splitTeam,
  getMyTeam,
  getTeamListForFilterSuperVisor,
  getAllStausListOfTeam,
};
