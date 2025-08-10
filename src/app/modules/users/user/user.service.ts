/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import status from "http-status";
import { TUserRole, userRoles } from "../../../interface/auth.interface";
import { UserProfile } from "../user_profile/userProfile.model";
import User from "./user.model";
import { PipelineStage, Types } from "mongoose";
import AppError from "../../../errors/AppError";
import { UserStatus } from "./user.interface";

const updateUserRole = async (
  data: { userId: string; role: TUserRole },
  authRole: TUserRole
) => {
  if (authRole === userRoles.ADMIN && data.role !== userRoles.SUPERVISOR) {
    throw new AppError(
      status.BAD_REQUEST,
      `ADMIN can only assign the ${userRoles.SUPERVISOR} role`
    );
  }

  if (
    authRole === userRoles.SUPERVISOR &&
    data.role !== userRoles.LEADER &&
    data.role !== userRoles.EMPLOYEE
  ) {
    throw new AppError(
      status.BAD_REQUEST,
      `SUPERVISOR can only assign the ${userRoles.LEADER} &  ${userRoles.EMPLOYEE} role`
    );
  }

  const user = await User.findOneAndUpdate(
    { _id: data.userId },
    { role: data.role },
    { new: true }
  );
  if (!user) {
    throw new AppError(status.NOT_FOUND, "Role not updated.");
  }
  return user;
};
const updateUserStatus = async (
  userId: string,
  userStatus: UserStatus, // Use enum type here for clarity
  authRole: TUserRole
) => {
  // Example role-based permission check
  if (authRole !== "SUPERVISOR") {
    throw new Error("Unauthorized to update user status");
  }

  // Validate status is a valid UserStatus enum value
  if (!Object.values(UserStatus).includes(userStatus)) {
    throw new Error("Invalid status value");
  }

  // Update user status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { status: userStatus },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

const getMyData = async (userId: string) => {
  const user = await UserProfile.findOne({ user: userId }).populate("user");
  return user;
};

const getAllUserUnderASupervisor = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  teamId: string = "all", // "all" | "no-team" | <teamId>
  supervisorId?: string
) => {
  const skip = (page - 1) * limit;

  const andConditions: any[] = [
    { role: { $in: [userRoles.EMPLOYEE, userRoles.LEADER] } },
  ];

  // Search filter
  if (searchTerm) {
    andConditions.push({
      $or: [
        { email: { $regex: searchTerm, $options: "i" } },
        { "profile.fullName": { $regex: searchTerm, $options: "i" } },
        { "profile.phone": { $regex: searchTerm, $options: "i" } },
      ],
    });
  }

  // Aggregation
  const pipeline: PipelineStage[] = [
    // Join profile
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "user",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

    // Join TeamEmployee to get teamId
    {
      $lookup: {
        from: "teamemployees", // collection name for TeamEmployee model
        localField: "_id",
        foreignField: "employee",
        as: "teamRelation",
      },
    },
    { $unwind: { path: "$teamRelation", preserveNullAndEmptyArrays: true } },

    // Join team info
    {
      $lookup: {
        from: "teams",
        localField: "teamRelation.team",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },

    // Join SupervisorEmployee to get supervisor
    {
      $lookup: {
        from: "supervisoremployees", // collection name for SupervisorEmployee model
        localField: "_id",
        foreignField: "employee",
        as: "supervisorRelation",
      },
    },
    {
      $unwind: {
        path: "$supervisorRelation",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  // Apply teamId filter
  if (teamId !== "all") {
    if (teamId === "no-team") {
      andConditions.push({ "teamRelation.team": { $exists: false } });
    } else {
      andConditions.push({ "teamRelation.team": new Types.ObjectId(teamId) });
    }
  }

  // Apply supervisor filter
  if (supervisorId) {
    andConditions.push({
      "supervisorRelation.supervisor": new Types.ObjectId(supervisorId),
    });
  }

  // Add match stage
  pipeline.push({ $match: { $and: andConditions } });

  // Count total
  const countPipeline = [...pipeline, { $count: "totalItem" }];
  const countResult = await User.aggregate(countPipeline);
  const totalItem = countResult[0]?.totalItem || 0;
  const totalPage = Math.ceil(totalItem / limit);

  // Get paginated results
  const resultPipeline: PipelineStage[] = [
    ...pipeline,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { password: 0 } },
  ];

  const data = await User.aggregate(resultPipeline);
  console.log(data);
  const simplifiedData = data.map((item) => ({
    _id: item._id,
    email: item.email,
    name: item.profile?.fullName || null,
    role: item.role,
    status: item.status,
    phone: item.profile?.phone || "",
    image: item.profile?.image || "",
    teamId: item.team?._id || "",
    teamName: item.team?.name || "",
  }));

  return {
    simplifiedData,
    meta: { totalItem, totalPage, limit, page },
  };
};

export default getAllUserUnderASupervisor;

export const UserService = {
  updateUserRole,
  updateUserStatus,
  getMyData,

  getAllUserUnderASupervisor,
};
