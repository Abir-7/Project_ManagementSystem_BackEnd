import status from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { UserService } from "./user.service";
import { userRoles } from "../../../interface/auth.interface";

const getMyData = catchAsync(async (req, res) => {
  const result = await UserService.getMyData(req.user.userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User data is fetched successfully",
    data: result,
  });
});
const getSuperVisorList = catchAsync(async (req, res) => {
  const { page = 1, limit = 12, searchTerm } = req.query;

  const result = await UserService.getSupervisorList(
    Number(page),
    Number(limit),
    searchTerm as string,
    userRoles.SUPERVISOR
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Supervisor data is fetched successfully",
    data: result.simplifiedData,
    meta: result.meta,
  });
});

const getEmployeeList = catchAsync(async (req, res) => {
  const { page = 1, limit = 12, searchTerm, teamId } = req.query;

  const result = await UserService.getAllUserUnderASupervisor(
    Number(page),
    Number(limit),
    searchTerm ? String(searchTerm) : undefined,
    teamId as string,
    req.user.userId
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Supervisor data is fetched successfully",
    data: result.simplifiedData,
    meta: result.meta,
  });
});

export const UserController = {
  getMyData,
  getSuperVisorList,
  getEmployeeList,
};
