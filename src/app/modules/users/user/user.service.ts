/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TUserRole, userRoles } from "../../../interface/auth.interface";
import { UserProfile } from "../userProfile/userProfile.model";
import User from "./user.model";
import { PipelineStage, Types } from "mongoose";
const getMyData = async (userId: string) => {
  const user = await UserProfile.findOne({ user: userId }).populate("user");
  return user;
};

const getSupervisorList = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  selectedRole: TUserRole
) => {
  const skip = (page - 1) * limit;

  // Build dynamic $match
  const matchStage: PipelineStage.Match = {
    $match: {
      role: selectedRole,
      ...(searchTerm
        ? {
            $or: [
              { email: { $regex: searchTerm, $options: "i" } },
              { "profile.fullName": { $regex: searchTerm, $options: "i" } },
              { "profile.phone": { $regex: searchTerm, $options: "i" } },
            ],
          }
        : {}),
    },
  };

  const basePipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "user",
        as: "profile",
      },
    },
    {
      $unwind: {
        path: "$profile",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const countPipeline: PipelineStage[] = [
    ...basePipeline,
    matchStage,
    { $count: "totalItem" },
  ];

  const resultPipeline: PipelineStage[] = [
    ...basePipeline,
    matchStage,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        password: 0,
      },
    },
  ];

  // Count total items
  const countResult = await User.aggregate(countPipeline);
  const totalItem = countResult[0]?.totalItem || 0;
  const totalPage = Math.ceil(totalItem / limit);

  // Get paginated data
  const data = await User.aggregate(resultPipeline);

  const simplifiedData = data.map((item) => ({
    email: item.email,
    name: item.profile?.fullName || null,
    role: item.role,
    status: item.status,
    image: item.profile?.image,
    phone: item.profile?.phone,
    _id: item._id,
  }));

  const meta = {
    totalItem,
    totalPage,
    limit,
    page,
  };

  return { simplifiedData, meta };
};

// const getAllUserUnderASupervisor = async (
//   page: number = 1,
//   limit: number = 10,
//   searchTerm: string = "",
//   teamId: string = "all", // "all" | "no-team" | <teamId>
//   supervisorId?: string
// ) => {
//   const skip = (page - 1) * limit;

//   // Always filter by EMPLOYEE & LEADER
//   const match: any = {
//     role: { $in: [userRoles.EMPLOYEE, userRoles.LEADER] },
//   };

//   // Team filter
//   if (teamId && teamId !== "all") {
//     if (teamId === "no-team") {
//       match.$or = [{ teamId: { $exists: false } }, { teamId: null }];
//     } else {
//       match.teamId = new Types.ObjectId(teamId);
//     }
//   }

//   // Supervisor filter
//   if (supervisorId) {
//     match.present_supervisor = new Types.ObjectId(supervisorId);
//   }

//   // Search filter
//   if (searchTerm) {
//     match.$or = [
//       { email: { $regex: searchTerm, $options: "i" } },
//       { "profile.fullName": { $regex: searchTerm, $options: "i" } },
//       { "profile.phone": { $regex: searchTerm, $options: "i" } },
//     ];
//   }

//   // Lookup pipelines
//   const basePipeline: PipelineStage[] = [
//     {
//       $lookup: {
//         from: "userprofiles",
//         localField: "_id",
//         foreignField: "user",
//         as: "profile",
//       },
//     },
//     { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
//     {
//       $lookup: {
//         from: "teams",
//         localField: "teamId",
//         foreignField: "_id",
//         as: "team",
//       },
//     },
//     { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
//   ];

//   const countPipeline: PipelineStage[] = [
//     ...basePipeline,
//     { $match: match },
//     { $count: "totalItem" },
//   ];

//   const resultPipeline: PipelineStage[] = [
//     ...basePipeline,
//     { $match: match },
//     { $sort: { createdAt: -1 } },
//     { $skip: skip },
//     { $limit: limit },
//     { $project: { password: 0 } },
//   ];

//   const countResult = await User.aggregate(countPipeline);
//   const totalItem = countResult[0]?.totalItem || 0;
//   const totalPage = Math.ceil(totalItem / limit);

//   const data = await User.aggregate(resultPipeline);

//   const simplifiedData = data.map((item) => ({
//     _id: item._id,
//     email: item.email,
//     name: item.profile?.fullName || null,
//     role: item.role,
//     status: item.status,
//     phone: item.profile?.phone || "",
//     image: item.profile?.image || "",
//     teamId: item?.team?._id || "",
//     teamName: item?.team?.name || "",
//   }));

//   return {
//     simplifiedData,
//     meta: { totalItem, totalPage, limit, page },
//   };
// };

const getAllUserUnderASupervisor = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = "",
  teamId: string = "all", // "all" | "no-team" | <teamId>
  supervisorId?: string
) => {
  console.log(teamId);

  const skip = (page - 1) * limit;

  // Start $and with role filter
  const andConditions: any[] = [
    { role: { $in: [userRoles.EMPLOYEE, userRoles.LEADER] } },
  ];

  // Team filter
  if (teamId && teamId !== "all") {
    if (teamId === "no-team") {
      andConditions.push({
        $or: [{ teamId: { $exists: false } }, { teamId: null }],
      });
    } else {
      andConditions.push({ teamId: new Types.ObjectId(teamId) });
    }
  }

  // Supervisor filter
  if (supervisorId) {
    andConditions.push({
      present_supervisor: new Types.ObjectId(supervisorId),
    });
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

  const matchStage: PipelineStage.Match = { $match: { $and: andConditions } };

  // Lookup pipelines
  const basePipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "userprofiles",
        localField: "_id",
        foreignField: "user",
        as: "profile",
      },
    },
    { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "teams",
        localField: "teamId",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
  ];

  // Count pipeline
  const countPipeline: PipelineStage[] = [
    ...basePipeline,
    matchStage,
    { $count: "totalItem" },
  ];

  // Result pipeline
  const resultPipeline: PipelineStage[] = [
    ...basePipeline,
    matchStage,
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { password: 0 } },
  ];

  // Count total
  const countResult = await User.aggregate(countPipeline);
  const totalItem = countResult[0]?.totalItem || 0;
  const totalPage = Math.ceil(totalItem / limit);

  // Get paginated data
  const data = await User.aggregate(resultPipeline);

  // Simplify output
  const simplifiedData = data.map((item) => ({
    _id: item._id,
    email: item.email,
    name: item.profile?.fullName || null,
    role: item.role,
    status: item.status,
    phone: item.profile?.phone || "",
    image: item.profile?.image || "",
    teamId: item?.team?._id || "",
    teamName: item?.team?.name || "",
  }));

  return {
    simplifiedData,
    meta: { totalItem, totalPage, limit, page },
  };
};

export default getAllUserUnderASupervisor;

export const UserService = {
  getMyData,
  getSupervisorList,
  getAllUserUnderASupervisor,
};
