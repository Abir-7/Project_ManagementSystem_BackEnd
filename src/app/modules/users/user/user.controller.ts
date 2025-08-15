import status from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { UserService } from "./user.service";
import { UserStatus } from "./user.interface";

const updateUserRole = catchAsync(async (req, res) => {
  const userData = req.body;
  const result = await UserService.updateUserRole(userData, req.user.userRole);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User role  successfully updated",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const { userId, status: userStatus } = req.body;
  const result = await UserService.updateUserStatus(
    userId,
    userStatus,
    req.user.userRole
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User role  successfully updated",
    data: result,
  });
});

const getMyData = catchAsync(async (req, res) => {
  const result = await UserService.getMyData(req.user.userId);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User data is fetched successfully",
    data: result,
  });
});

const getEmployeeListOfSupervisor = catchAsync(async (req, res) => {
  console.log("object");
  const {
    page = 1,
    limit = 12,
    searchTerm,
    teamId,
    employeeStatus,
  } = req.query;

  const result = await UserService.getAllUserUnderASupervisor(
    Number(page),
    Number(limit),
    searchTerm ? String(searchTerm) : undefined,
    teamId as string,
    req.user.userId,
    employeeStatus as UserStatus
  );

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Supervisor data is fetched successfully",
    data: result.simplifiedData,
    meta: result.meta,
  });
});
const getAllEmloyeeStatusList = catchAsync(async (req, res) => {
  const result = await UserService.getAllEmloyeeStatusList();

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Employee status list fetched successfully",
    data: result,
  });
});

export const UserController = {
  updateUserRole,
  updateUserStatus,
  getMyData,
  getEmployeeListOfSupervisor,
  getAllEmloyeeStatusList,
};
