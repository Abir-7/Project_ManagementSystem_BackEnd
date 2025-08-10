import { model, Schema } from "mongoose";
import { IEmployeeProject } from "./employee_project.interface";

const EmployeeProjectSchema = new Schema<IEmployeeProject>(
  {
    projectPhase: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPhase",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
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
EmployeeProjectSchema.index(
  { projectPhase: 1, projectId: 1, employee: 1 },
  { unique: true }
);
EmployeeProjectSchema.index({ projectPhase: 1, employee: 1 }, { unique: true });

export const EmployeeProject = model<IEmployeeProject>(
  "EmployeeProject",
  EmployeeProjectSchema
);
