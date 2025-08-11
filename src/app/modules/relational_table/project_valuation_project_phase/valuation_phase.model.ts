import { model, Schema } from "mongoose";
import { IPhaseValuation } from "./valuation_phase.interface";

const PhaseValuationSchema = new Schema<IPhaseValuation>(
  {
    project_valuation_type: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ProjectValuationType",
    },
    valuationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Valuation",
    },
    projectPhase: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "ProjectPhase",
    },
  },
  {
    timestamps: true,
  }
);
PhaseValuationSchema.index(
  { project_valuation_type: 1, valuationId: 1, projectPhase: 1 },
  { unique: true }
);
PhaseValuationSchema.index(
  { valuationId: 1, projectPhase: 1 },
  { unique: true }
);

PhaseValuationSchema.index({ projectPhase: 1 });

const PhaseValuation = model<IPhaseValuation>(
  "PhaseValuation",
  PhaseValuationSchema
);

export default PhaseValuation;
