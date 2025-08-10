import { model, Schema } from "mongoose";
import { IProjects, IProjectStatus } from "./project.interface";

const ProjectSchema = new Schema<IProjects>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1, // at least 1 month
    },
    salesName: {
      type: String,
      default: "",
      trim: true,
    },
    googleSheetLink: {
      type: String,
      default: "",
      trim: true,
    },

    teamGrouplink: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(IProjectStatus),
      default: IProjectStatus.HOLD,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = model<IProjects>("Project", ProjectSchema);
