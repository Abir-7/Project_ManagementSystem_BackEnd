/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import mongoose, { PipelineStage, Types } from "mongoose";
import { TeamStatus } from "./team.interface";
import { Team } from "./team.model";
import { TeamSupervisor } from "../relational_table/team_supervisor/team.supervisor.model";
import { TeamEmployee } from "../relational_table/team_employee/team_employee.model";

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
const assignEmployeeToTeam = async (userId: string, teamId: string) => {
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

const assignEmployeeToNewTeam = async (userId: string, teamId: string) => {
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
  status?: TeamStatus
) => {
  const skip = (page - 1) * limit;

  const matchStage: PipelineStage.Match = {
    $match: {
      ...(searchTerm ? { name: { $regex: searchTerm, $options: "i" } } : {}),
      ...(status ? { status } : {}),
    },
  };

  const countPipeline: PipelineStage[] = [matchStage, { $count: "totalItem" }];
  const resultPipeline: PipelineStage[] = [
    matchStage,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const countResult = await Team.aggregate(countPipeline);
  const totalItem = countResult[0]?.totalItem || 0;
  const totalPage = Math.ceil(totalItem / limit);

  const data = await Team.aggregate(resultPipeline);

  return {
    simplifiedData: data.map((item) => ({
      _id: item._id,
      name: item.name,
      createdBy: item.createdBy,
      status: item.status,
      createdAt: item.createdAt,
    })),
    meta: { totalItem, totalPage, limit, page },
  };
};

const splitTeam = async (
  originalTeamId: string,
  newTeamName: string,
  employeeIdsToMove: string[],
  createdBy: string
) => {
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

export const TeamService = {
  createTeam,
  assignEmployeeToTeam,
  assignEmployeeToNewTeam,
  getTeamList,
  splitTeam,
};
