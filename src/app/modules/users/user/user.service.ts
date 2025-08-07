/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { userRoles } from "../../../interface/auth.interface";
import { UserProfile } from "../userProfile/userProfile.model";
import User from "./user.model";
import { PipelineStage } from "mongoose";
const getMyData = async (userId: string) => {
  const user = await UserProfile.findOne({ user: userId }).populate("user");
  return user;
};

const getSuperVisorList = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = ""
) => {
  const skip = (page - 1) * limit;

  // Build dynamic $match
  const matchStage: PipelineStage.Match = {
    $match: {
      role: userRoles.SUPERVISOR,
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

export const UserService = {
  getMyData,
  getSuperVisorList,
};
