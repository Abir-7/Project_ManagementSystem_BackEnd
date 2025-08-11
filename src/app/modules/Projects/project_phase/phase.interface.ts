import { Types } from "mongoose";

export interface IProjectPhase {
  name: string;
  budget: number;
  deadline: Date;
  status: IPhaseStatus;
  project: Types.ObjectId;
  fixed_kpi: number;
  kpi: number;
}

export enum IPhaseStatus {
  COMPLETED = "COMPLETED",
  ONGOING = "ONGOING",
  HOLD = "HOLD",
  CANCELED = "CANCELED", // fixed spelling
}
