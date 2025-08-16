/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TUserRole, userRoles } from "../../../interface/auth.interface";
import { UserProfile } from "../user_profile/userProfile.model";
import User from "./user.model";
import { PipelineStage, Types } from "mongoose";

import { UserStatus } from "./user.interface";

const updateUserStatusRole = async (
  userId: string,
  userStatus?: UserStatus,
  userRole?: TUserRole,
  authRole?: TUserRole
) => {
  // Role-based permission check
  if (authRole !== "SUPERVISOR") {
    throw new Error("Unauthorized to update user status/role");
  }

  // Validate status if provided
  if (userStatus && !Object.values(UserStatus).includes(userStatus)) {
    throw new Error("Invalid status value");
  }

  // Validate role if provided
  if (userRole && !Object.values(userRoles).includes(userRole)) {
    throw new Error("Invalid role value");
  }

  // Find user
  const updatedUser = await User.findById(userId);
  if (!updatedUser) {
    throw new Error("User not found");
  }

  // Update fields if provided
  if (userStatus) updatedUser.status = userStatus;
  if (userRole) updatedUser.role = userRole;

  // Save changes
  await updatedUser.save();

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
  teamId: string = "ALL", // "all" | "no-team" |
  supervisorId?: string,
  employeeStatus: UserStatus | "ALL" = "ALL"
) => {
  const skip = (page - 1) * limit;

  const andConditions: any[] = [
    { role: { $in: [userRoles.EMPLOYEE, userRoles.LEADER] } },
  ];

  if (employeeStatus && employeeStatus !== "ALL") {
    andConditions.push({ status: employeeStatus });
  }

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
  if (teamId !== "ALL") {
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

const getAllEmloyeeStatusList = async () => {
  const statusList = Object.values(UserStatus).map((statusData) => ({
    name: statusData,
    value: statusData,
  }));
  return statusList;
};

export const UserService = {
  updateUserStatusRole,

  getMyData,

  getAllUserUnderASupervisor,
  getAllEmloyeeStatusList,
};
