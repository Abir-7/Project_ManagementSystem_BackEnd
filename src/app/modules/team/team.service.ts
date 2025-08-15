/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import mongoose, { Types } from "mongoose";
import { TeamStatus } from "./team.interface";
import { Team } from "./team.model";
import { TeamSupervisor } from "../relational_table/team_supervisor/team.supervisor.model";
import { TeamEmployee } from "../relational_table/team_employee/team_employee.model";
import AppError from "../../errors/AppError";
import { TUserRole, userRoles } from "../../interface/auth.interface";

const createTeam = async (name: string, createdBy: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const team = await Team.create([{ name, createdBy }], { session });

    await TeamSupervisor.create(
      [{ supervisor: createdBy, team: team[0]._id }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return team[0];
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};
const assignEmployeeToTeam = async (
  userId: string,
  teamId: string,
  supervisorId: string
) => {
  const isTrue = await isTeamUnderThisSupervisor(supervisorId, teamId);
  if (isTrue === false) {
    throw new AppError(404, "Team data of this supervisor not found.");
  }
  const employeeObjectId = new Types.ObjectId(userId);
  const teamObjectId = new Types.ObjectId(teamId);

  // Check if already assigned
  const existingAssignment = await TeamEmployee.findOne({
    employee: employeeObjectId,
    team: teamObjectId,
  });

  if (existingAssignment) {
    return existingAssignment; // Already assigned, no duplicate
  }

  // Create new assignment
  const assignment = await TeamEmployee.create({
    employee: employeeObjectId,
    team: teamObjectId,
  });

  return assignment;
};

const assignEmployeeToNewTeam = async (
  userId: string,
  teamId: string,
  supervisorId: string
) => {
  const isTrue = await isTeamUnderThisSupervisor(supervisorId, teamId);
  if (isTrue === false) {
    throw new AppError(404, "Team data of this supervisor not found.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employeeObjectId = new Types.ObjectId(userId);
    const teamObjectId = new Types.ObjectId(teamId);

    const updated = await TeamEmployee.findOneAndUpdate(
      { employee: employeeObjectId },
      { team: teamObjectId },
      { new: true, session }
    );

    if (!updated) {
      await TeamEmployee.create(
        [{ employee: employeeObjectId, team: teamObjectId }],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return updated;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getTeamList = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  status?: TeamStatus | "ALL",
  supervisorId?: string
) => {
  const skip = (page - 1) * limit;

  const matchStage: any = {};
  if (supervisorId) {
    matchStage.supervisor = new mongoose.Types.ObjectId(supervisorId);
  }

  const teamMatch: any = {};
  if (status) {
    if (status !== "ALL") {
      teamMatch["team.status"] = status;
    }
  }
  if (searchTerm) {
    teamMatch["team.name"] = { $regex: searchTerm, $options: "i" };
  }

  const result = await TeamSupervisor.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: "$team" },

    { $match: teamMatch },

    {
      $lookup: {
        from: "teamemployees",
        localField: "team._id",
        foreignField: "team",
        as: "teamEmployees",
      },
    },
    { $unwind: { path: "$teamEmployees", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        localField: "teamEmployees.employee",
        foreignField: "_id",
        as: "employeeUser",
      },
    },
    { $unwind: { path: "$employeeUser", preserveNullAndEmptyArrays: true } },

    {
      $group: {
        _id: "$team._id",
        name: { $first: "$team.name" },
        createdBy: { $first: "$team.createdBy" },
        status: { $first: "$team.status" },
        createdAt: { $first: "$team.createdAt" },
        updatedAt: { $first: "$team.updatedAt" },
        totalWorkingEmployees: {
          $sum: { $cond: [{ $eq: ["$employeeUser.status", "WORKING"] }, 1, 0] },
        },
      },
    },

    { $sort: { createdAt: -1 } },

    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        meta: [{ $count: "totalItem" }],
      },
    },

    // Extract meta object instead of array
    {
      $addFields: {
        meta: {
          totalItem: { $ifNull: [{ $arrayElemAt: ["$meta.totalItem", 0] }, 0] },
          totalPage: {
            $ceil: {
              $divide: [
                { $ifNull: [{ $arrayElemAt: ["$meta.totalItem", 0] }, 0] },
                limit,
              ],
            },
          },
          limit: limit,
          page: page,
        },
      },
    },

    // Keep only data + meta
    { $project: { data: 1, meta: 1 } },
  ]);

  return result.length > 0
    ? { data: result[0].data, meta: result[0].meta[0] }
    : { data: [], meta: { totalItem: 0, totalPage: 0, limit, page } };
};

const splitTeam = async (
  originalTeamId: string,
  newTeamName: string,
  employeeIdsToMove: string[],
  createdBy: string
) => {
  const isTrue = await isTeamUnderThisSupervisor(createdBy, originalTeamId);

  if (isTrue === false) {
    throw new AppError(404, "Team data of this supervisor not found.");
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create new team
    const newTeam = await Team.create(
      [{ name: newTeamName, createdBy: new Types.ObjectId(createdBy) }],
      { session }
    );

    // 2. Update TeamEmployee for each moved employee
    const employeeObjectIds = employeeIdsToMove.map(
      (id) => new Types.ObjectId(id)
    );

    // Update team assignment for these employees from originalTeamId to newTeam._id
    await TeamEmployee.updateMany(
      {
        employee: { $in: employeeObjectIds },
        team: originalTeamId,
      },
      { $set: { team: newTeam[0]._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return {
      newTeam: newTeam[0],
      movedEmployeesCount: employeeIdsToMove.length,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};
const teamDetails = async (
  tId: string,
  userId: string,
  userRole: TUserRole
) => {
  if (userRole === userRoles.SUPERVISOR) {
    const isTrue = await isTeamUnderThisSupervisor(userId, tId);
    if (isTrue === false) {
      throw new AppError(404, "Team data of this supervisor not found.");
    }
  }
  if (userRole === userRoles.EMPLOYEE || userRole === userRoles.LEADER) {
    const isTrue = await isTeamUnderThisEmployee(userId, tId);
    if (isTrue === false) {
      throw new AppError(404, "Team data of this employee not found.");
    }
  }

  const teamData = await Team.findOne({ _id: tId });
  return teamData;
};

const getEmployeeOfTeam = async (
  teamId: string,
  searchTerm: string = "",
  userId: string,
  userRole: TUserRole
) => {
  if (userRole === userRoles.SUPERVISOR) {
    const isTrue = await isTeamUnderThisSupervisor(userId, teamId);
    if (isTrue === false) {
      throw new AppError(404, "Team data of this supervisor not found.");
    }
  }
  if (userRole === userRoles.EMPLOYEE || userRole === userRoles.LEADER) {
    const isTrue = await isTeamUnderThisEmployee(userId, teamId);
    if (isTrue === false) {
      throw new AppError(404, "Team data of this employee not found.");
    }
  }

  const matchSearch: any = {};

  if (searchTerm) {
    matchSearch.$or = [
      { "profile.fullName": { $regex: searchTerm, $options: "i" } },
      { "user.email": { $regex: searchTerm, $options: "i" } },
      { "profile.phone": { $regex: searchTerm, $options: "i" } },
    ];
  }

  const teamMembers = await Team.aggregate([
    // Match the specific team
    {
      $match: {
        _id: new mongoose.Types.ObjectId(teamId),
      },
    },

    // Lookup team employees
    {
      $lookup: {
        from: "teamemployees",
        localField: "_id",
        foreignField: "team",
        as: "teamEmployees",
      },
    },

    // Unwind employees
    { $unwind: "$teamEmployees" },

    // Lookup user info
    {
      $lookup: {
        from: "users",
        localField: "teamEmployees.employee",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // Filter only WORKING status
    {
      $match: {
        "user.status": "WORKING",
      },
    },

    // Lookup user profile info
    {
      $lookup: {
        from: "userprofiles",
        localField: "user._id",
        foreignField: "user",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

    // Apply search filter if provided
    ...(searchTerm
      ? [
          {
            $match: matchSearch,
          },
        ]
      : []),

    // Project required fields
    {
      $project: {
        _id: 0,
        fullName: "$profile.fullName",
        email: "$user.email",
        phone: "$profile.phone",
        image: "$profile.image",
      },
    },
  ]);

  return teamMembers;
};

const getMyTeam = async (userId: string) => {
  const teamData = await TeamEmployee.findOne({ employee: userId })
    .populate({
      path: "team",
    })
    .lean();
  return teamData;
};

const getTeamListForFilterSuperVisor = async (supervisorId: string) => {
  if (!supervisorId) return [];

  const teams = await TeamSupervisor.aggregate([
    // Filter by supervisor
    { $match: { supervisor: new mongoose.Types.ObjectId(supervisorId) } },

    // Lookup team details
    {
      $lookup: {
        from: "teams",
        localField: "team",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: "$team" },

    // Only active teams
    { $match: { "team.status": TeamStatus.ACTIVE } },

    // Project only necessary fields
    {
      $project: {
        _id: "$team._id",
        name: "$team.name",
        status: "$team.status",
      },
    },

    // Sort alphabetically or by createdAt
    { $sort: { name: 1 } },
  ]);

  return teams;
};
const getAllStausListOfTeam = async () => {
  const statusList = Object.values(TeamStatus).map((statusData) => ({
    name: statusData,
    value: statusData,
  }));
  return statusList;
};

export const TeamService = {
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

//--------------------------------------helper-------------------------------

const isTeamUnderThisSupervisor = async (
  supervisorId: string,
  teamId: string
) => {
  const findTeamOfSupervisor = await TeamSupervisor.findOne({
    supervisor: supervisorId,
    team: teamId,
  });

  if (!findTeamOfSupervisor) {
    return false;
  } else {
    return true;
  }
};

const isTeamUnderThisEmployee = async (employeeId: string, teamId: string) => {
  const findTeamOfEmployee = await TeamEmployee.findOne({
    employee: employeeId,
    team: teamId,
  });

  if (!findTeamOfEmployee) {
    return false;
  } else {
    return true;
  }
};
