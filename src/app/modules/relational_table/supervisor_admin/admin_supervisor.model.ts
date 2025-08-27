import { model, Schema } from "mongoose";
import { ISupervisorAdmin } from "./admin_supervisor.interface";

const SupervisorAdminSchema = new Schema<ISupervisorAdmin>(
  {
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming supervisor is in the User collection
      required: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming employee is in the User collection
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

SupervisorAdminSchema.index({ supervisor: 1 });
SupervisorAdminSchema.index({ admin: 1 });

SupervisorAdminSchema.index({ supervisor: 1, admin: 1 }, { unique: true });
export const SupervisorAdmin = model<ISupervisorAdmin>(
  "SupervisorAdmin",
  SupervisorAdminSchema
);
