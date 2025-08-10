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

  const result = await TeamService.assignEmployeeToTeam(userId, teamId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Employee assinged to a team successfully",
    data: result,
  });
});

const assignEmployeeToNewTeam = catchAsync(async (req, res) => {
  const { userId, teamId } = req.body;

  const result = await TeamService.assignEmployeeToNewTeam(userId, teamId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
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
    teamStatus
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team list fetched successfully",
    data: result.simplifiedData,
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

export const TeamController = {
  createTeam,
  assignEmployeeToTeam,
  assignEmployeeToNewTeam,
  getTeamList,
  splitTeam,
};
