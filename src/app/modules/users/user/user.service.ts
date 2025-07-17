/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { UserProfile } from "../userProfile/userProfile.model";

const getMyData = async (userId: string) => {
  const user = await UserProfile.findOne({ user: userId }).populate("user");
  return user;
};

export const UserService = {
  getMyData,
};
