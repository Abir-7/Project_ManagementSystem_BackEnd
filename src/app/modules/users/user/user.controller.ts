import status from "http-status";
import catchAsync from "../../../utils/serverTools/catchAsync";
import sendResponse from "../../../utils/serverTools/sendResponse";
import { UserService } from "./user.service";

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

  const result = await UserService.getSuperVisorList(
    Number(page),
    Number(limit),
    searchTerm as string
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
};
