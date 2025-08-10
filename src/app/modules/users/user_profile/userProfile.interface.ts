import { Types } from "mongoose";

export interface IUserProfile {
  fullName: string;
  nickname?: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
  image?: string;
  user: Types.ObjectId;
}
