/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { PipelineStage } from "mongoose";
import { TeamStatus } from "./team.interface";
import { Team } from "./team.model";

const createTeam = async (name: string, createdBy: string) => {
  const team = await Team.create({ name, createdBy });
  return team;
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

export const TeamService = {
  createTeam,
  getTeamList,
};
