/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { model, Schema } from "mongoose";
import { IUser, UserStatus } from "./user.interface";
import { userRole } from "../../../interface/auth.interface";

import bcrypt from "bcryptjs";
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: userRole, required: true },
    authentication: {
      expDate: { type: Date, default: null },
      otp: { type: Number, default: null },
      token: { type: String, default: null },
    },
    isVerified: { type: Boolean, default: false },
    needToResetPass: { type: Boolean, default: false },

    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.WORKING,
    },

    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: function (value: any) {
          // If role is ADMIN, no need to have addedBy
          if ((this as any).role === "ADMIN") return true;
          // For others, addedBy must be present
          return value != null;
        },
        message: "addedBy is required for non-ADMIN users",
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ addedBy: 1 });
userSchema.index({ addedBy: 1, _id: 1 });
userSchema.index({ role: 1 });

userSchema.index({ createdAt: -1 });

userSchema.methods.comparePassword = async function (enteredPassword: string) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error("Error comparing password");
  }
};

const User = model<IUser>("User", userSchema);

export default User;
