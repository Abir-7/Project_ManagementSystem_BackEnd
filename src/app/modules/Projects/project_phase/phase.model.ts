import { model, Schema } from "mongoose";
import { IPhaseStatus, IProjectPhase } from "./phase.interface";

const ProjectPhaseSchema = new Schema<IProjectPhase>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(IPhaseStatus),
      default: IPhaseStatus.HOLD,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project", // Replace with your actual Project model name
      required: true,
    },
    fixed_kpi: { type: Number, default: 0 },
    kpi: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const ProjectPhase = model<IProjectPhase>(
  "ProjectPhase",
  ProjectPhaseSchema
);
