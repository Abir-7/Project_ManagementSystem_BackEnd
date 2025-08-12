import { model, Schema } from "mongoose";
import { IEmployeePhase } from "./employee_phase.interface";

const EmployeePhaseSchema = new Schema<IEmployeePhase>(
  {
    projectPhase: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPhase",
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming employee is from User model
      required: true,
    },
    progress: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent duplicate assignments

EmployeePhaseSchema.index({ projectPhase: 1, employee: 1 }, { unique: true });

export const EmployeePhase = model<IEmployeePhase>(
  "EmployeePhase",
  EmployeePhaseSchema
);
