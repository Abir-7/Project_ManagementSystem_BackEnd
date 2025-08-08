import { TeamService } from "./team.service";
import { TeamStatus } from "./team.interface";
import catchAsync from "../../utils/serverTools/catchAsync";
import sendResponse from "../../utils/serverTools/sendResponse";
import httpStatus from "http-status";

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

export const TeamController = {
  createTeam,
  getTeamList,
};
