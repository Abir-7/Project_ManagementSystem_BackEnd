import { Document, Types } from "mongoose";
import { TUserRole } from "../../../interface/auth.interface";

export interface IBaseUser {
  email: string;
  role: TUserRole;
  password: string;
  authentication: {
    expDate: Date;
    otp: number;
    token: string;
  };
  isVerified: boolean;
  needToResetPass: boolean;
  present_supervisor: Types.ObjectId;
  addedBy: Types.ObjectId;
  status: UserStatus;
  teamId: Types.ObjectId;
}

export enum UserStatus {
  DELETED = "DELETED",
  BLOCKED = "BLOCKED",
  WORKING = "WORKING",
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
