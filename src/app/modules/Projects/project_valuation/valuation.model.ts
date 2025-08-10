import { Schema, model } from "mongoose";
import {
  IProjectValuation,
  IProjectValuationPhase,
  IProjectValuationType,
} from "./valuation.interface";

// Project Valuation Type Schema
const ProjectValuationTypeSchema = new Schema<IProjectValuationType>(
  {
    type: { type: String, required: true },
    fixedPercent: { type: Number, required: true },
  },
  { timestamps: true }
);

// Project Valuation Schema
const ProjectValuationSchema = new Schema<IProjectValuation>(
  {
    project_valuation_type: {
      type: Schema.Types.ObjectId,
      ref: "ProjectValuationType",
      required: true,
    },
    phase: {
      type: String,
      enum: Object.values(IProjectValuationPhase),
      required: true,
    },
    percent: { type: Number, required: true },
  },
  { timestamps: true }
);

export const ProjectValuationType = model<IProjectValuationType>(
  "ProjectValuationType",
  ProjectValuationTypeSchema
);

export const ProjectValuation = model<IProjectValuation>(
  "ProjectValuation",
  ProjectValuationSchema
);
