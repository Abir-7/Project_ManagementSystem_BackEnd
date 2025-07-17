import status from "http-status";
import AppError from "../../../errors/AppError";
import { getRelativePath } from "../../../middleware/fileUpload/getRelativeFilePath";
import User from "../user/user.model";
import unlinkFile from "../../../middleware/fileUpload/unlinkFiles";
import { UserProfile } from "./userProfile.model";
import { IUserProfile } from "./userProfile.interface";
import { removeFalsyFields } from "../../../utils/helper/removeFalsyField";

const updateProfileImage = async (path: string, email: string) => {
  const user = await User.findOne({ email: email });

  const image = getRelativePath(path);

  if (!image) {
    throw new AppError(status.NOT_FOUND, "Image not found.");
  }

  if (!user) {
    unlinkFile(image);

    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  const userProfile = await UserProfile.findOne({ user: user.id });

  if (!userProfile) {
    unlinkFile(image);
    throw new AppError(status.NOT_FOUND, "User profile not found.");
  }

  userProfile.image = image;

  const savedData = await userProfile.save();

  if (!savedData) {
    unlinkFile(image);
    throw new AppError(status.BAD_REQUEST, "Failed to update image.");
  }

  if (userProfile && userProfile.image) {
    unlinkFile(userProfile.image);
  }
  return savedData;
};

const updateProfileData = async (
  userdata: Partial<IUserProfile>,
  email: string
): Promise<IUserProfile | null> => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }
  const data = removeFalsyFields(userdata);
  const updated = await UserProfile.findOneAndUpdate({ user: user._id }, data, {
    new: true,
  });

  if (!updated) {
    throw new AppError(status.BAD_REQUEST, "Failed to update user info.");
  }

  return updated;
};

export const UserProfileService = { updateProfileData, updateProfileImage };
