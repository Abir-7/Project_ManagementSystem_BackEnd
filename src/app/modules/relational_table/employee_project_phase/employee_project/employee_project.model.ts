import { model, Schema } from "mongoose";
import { IEmployeeProject } from "./employee_project.interface";

const EmployeeProjectSchema = new Schema<IEmployeeProject>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPhase",
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming employee is from User model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent duplicate assignments

EmployeeProjectSchema.index({ project: 1, employee: 1 }, { unique: true });

export const EmployeeProject = model<IEmployeeProject>(
  "EmployeeProject",
  EmployeeProjectSchema
);
