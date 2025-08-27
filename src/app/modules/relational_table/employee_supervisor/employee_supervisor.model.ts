import { model, Schema } from "mongoose";
import { ISupervisorEmployee } from "./employee_supervisor.interface";

const SupervisorEmployeeSchema = new Schema<ISupervisorEmployee>(
  {
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming supervisor is in the User collection
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming employee is in the User collection
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);
SupervisorEmployeeSchema.index({ supervisor: 1 });
SupervisorEmployeeSchema.index({ employee: 1 });
export const SupervisorEmployee = model<ISupervisorEmployee>(
  "SupervisorEmployee",
  SupervisorEmployeeSchema
);
