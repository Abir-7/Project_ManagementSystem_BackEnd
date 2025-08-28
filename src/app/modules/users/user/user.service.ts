/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TUserRole, userRoles } from "../../../interface/auth.interface";
import { UserProfile } from "../user_profile/userProfile.model";
import User from "./user.model";
import { PipelineStage, Types } from "mongoose";

import { UserStatus } from "./user.interface";
import { SupervisorAdmin } from "../../relational_table/supervisor_admin/admin_supervisor.model";
import { IMeta } from "../../../utils/serverTools/sendResponse";
import { SupervisorEmployee } from "../../relational_table/employee_supervisor/employee_supervisor.model";

const updateUserStatusRole = async (
  authId: string,
  userId: string,
  userStatus?: UserStatus,
  userRole?: TUserRole,
  authRole?: TUserRole
) => {
  if ((await isThisEmployeeUnderThisSupervisor(userId, authId)) === false) {
    throw new Error("You can't change.");
  }
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
  teamId: string = "ALL",
  supervisorId?: string,
  employeeStatus: UserStatus | "ALL" = "ALL"
): Promise<{ data: any[]; meta: IMeta }> => {
  const skip = (page - 1) * limit;

  // Initial match: role + optional status
  const initialMatch: any = {
    role: { $in: [userRoles.EMPLOYEE, userRoles.LEADER] },
  };
  if (employeeStatus !== "ALL") {
    initialMatch.status = employeeStatus;
  }

  const pipeline: PipelineStage[] = [
    { $match: initialMatch },

    // Lookup profile
    {
      $lookup: {
        from: "userprofiles",
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
          { $project: { fullName: 1, phone: 1, image: 1, nickname: 1 } },
        ],
        as: "profile",
      },
    },
    { $addFields: { profile: { $arrayElemAt: ["$profile", 0] } } },

    // Lookup teamRelation
    {
      $lookup: {
        from: "teamemployees",
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$employee", "$$userId"] } } },
          { $project: { team: 1 } },
        ],
        as: "teamRelation",
      },
    },
    { $addFields: { teamRelation: { $arrayElemAt: ["$teamRelation", 0] } } },

    // Lookup team info
    {
      $lookup: {
        from: "teams",
        let: { teamId: "$teamRelation.team" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$teamId"] } } },
          { $project: { name: 1 } },
        ],
        as: "team",
      },
    },
    {
      $addFields: {
        team: { $ifNull: [{ $arrayElemAt: ["$team", 0] }, {}] }, // <-- ensures team is always object
      },
    },

    // Lookup supervisorRelation
    {
      $lookup: {
        from: "supervisoremployees",
        let: { userId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$employee", "$$userId"] } } },
          { $project: { supervisor: 1 } },
        ],
        as: "supervisorRelation",
      },
    },
    {
      $addFields: {
        supervisorRelation: { $arrayElemAt: ["$supervisorRelation", 0] },
      },
    },

    // Filters that depend on joined fields
    ...(searchTerm.trim() !== ""
      ? [
          {
            $match: {
              $or: [
                { email: { $regex: searchTerm, $options: "i" } },
                { "profile.fullName": { $regex: searchTerm, $options: "i" } },
                { "profile.phone": { $regex: searchTerm, $options: "i" } },
              ],
            },
          },
        ]
      : []),

    ...(teamId !== "ALL"
      ? [
          {
            $match:
              teamId === "no-team"
                ? { "teamRelation.team": { $exists: false } }
                : { "teamRelation.team": new Types.ObjectId(teamId) },
          },
        ]
      : []),

    ...(supervisorId
      ? [
          {
            $match: {
              "supervisorRelation.supervisor": new Types.ObjectId(supervisorId),
            },
          },
        ]
      : []),

    // Facet for pagination + total count
    {
      $facet: {
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              email: 1,
              role: 1,
              status: 1,
              "profile.fullName": 1,
              "profile.phone": 1,
              "profile.image": 1,
              teamId: { $ifNull: ["$team._id", ""] },
              teamName: { $ifNull: ["$team.name", ""] },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await User.aggregate(pipeline);

  const data = result?.data || [];
  const totalItem = result?.totalCount[0]?.count || 0;
  const totalPage = Math.ceil(totalItem / limit);

  return {
    data,
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

const getSupervisorList = async (
  status: UserStatus,
  adminId: string,
  searchTerm?: string,
  page = 1,
  limit = 10
): Promise<{ data: any[]; meta: IMeta }> => {
  const matchStage: any = {
    admin: new Types.ObjectId(adminId),
    "supervisor.status": status,
  };

  if (searchTerm && searchTerm.trim() !== "") {
    matchStage.$or = [
      { "supervisor.profile.fullName": { $regex: searchTerm, $options: "i" } },
      { "supervisor.profile.nickname": { $regex: searchTerm, $options: "i" } },
    ];
  }

  const pipeline: any[] = [
    { $match: { admin: new Types.ObjectId(adminId) } },

    // Lookup supervisor
    {
      $lookup: {
        from: "users",
        localField: "supervisor",
        foreignField: "_id",
        as: "supervisor",
      },
    },
    { $unwind: "$supervisor" },

    // Lookup profile
    {
      $lookup: {
        from: "userprofiles",
        localField: "supervisor._id",
        foreignField: "user",
        as: "supervisor.profile",
      },
    },
    {
      $unwind: {
        path: "$supervisor.profile",
        preserveNullAndEmptyArrays: true,
      },
    },

    // Filter by status + searchTerm
    { $match: matchStage },

    // Count total items
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              supervisorId: "$supervisor._id",
              email: "$supervisor.email",
              role: "$supervisor.role",
              status: "$supervisor.status",
              "profile.fullName": "$supervisor.profile.fullName",
              "profile.nickname": "$supervisor.profile.nickname",
              "profile.phone": "$supervisor.profile.phone",
              "profile.address": "$supervisor.profile.address",
              "profile.image": "$supervisor.profile.image",
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await SupervisorAdmin.aggregate(pipeline);

  const data = result[0].data;
  const totalItem = result[0].totalCount[0]?.count || 0;
  const totalPage = Math.ceil(totalItem / limit);

  const meta: IMeta = {
    totalItem,
    totalPage,
    limit,
    page,
  };

  return { data, meta };
};
export const UserService = {
  updateUserStatusRole,
  getMyData,
  getAllUserUnderASupervisor,
  getAllEmloyeeStatusList,
  getSupervisorList,
};

//!-------------------------HELPER---------------------!//

export const isThisEmployeeUnderThisSupervisor = async (
  employeeId: string,
  supervisorId: string
) => {
  const data = await SupervisorEmployee.findOne({
    employee: employeeId,
    supervisor: supervisorId,
  });

  if (data) {
    return true;
  } else {
    return false;
  }
};
