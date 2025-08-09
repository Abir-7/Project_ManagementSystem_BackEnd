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

    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      validate: {
        validator: function (value: any) {
          if (["EMPLOYEE", "LEADER"].includes((this as any).role)) {
            return true; // optional, can be set later
          }
          return value == null; // prevent teamId for admin/supervisor
        },
        message: "Only EMPLOYEE and LEADER can have a teamId",
      },
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

    present_supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User", // or the correct model name
      validate: {
        validator: function (value: any) {
          // Required only when creating
          if (this.isNew) {
            if (["EMPLOYEE", "LEADER"].includes((this as any).role)) {
              return !!value; // must have a value
            }
          }
          // On updates, allow null or keep existing rules
          if (["EMPLOYEE", "LEADER"].includes((this as any).role)) {
            return true; // optional after creation
          }
          return value == null; // prevent for admin/supervisor
        },
        message:
          "EMPLOYEE and LEADER must have a present_supervisor when created",
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ addedBy: 1 });
userSchema.index({ addedBy: 1, _id: 1 });
userSchema.index({ role: 1 });
userSchema.index({ teamId: 1 });
userSchema.index({ teamId: 1, _id: 1 });
userSchema.index({ present_supervisor: 1 });
userSchema.index({ present_supervisor: 1, _id: 1 });
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
