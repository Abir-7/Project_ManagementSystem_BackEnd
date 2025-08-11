import { Types } from "mongoose";

export interface IPhaseValuation {
  project_valuation_type: Types.ObjectId;
  valuationId: Types.ObjectId;
  projectPhase: Types.ObjectId;

  present_percent: number;
  present_fixed_percent: number;
}
