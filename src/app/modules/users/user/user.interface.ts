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
  addedBy: Types.ObjectId;
  status: UserStatus;
}

export enum UserStatus {
  RESIGNED = "RESIGNED",
  WORKING = "WORKING",
}

export interface IUser extends IBaseUser, Document {
  comparePassword(enteredPassword: string): Promise<boolean>;
}
