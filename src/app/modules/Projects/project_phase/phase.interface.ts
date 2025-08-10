import { Types } from "mongoose";

export interface IProjectPhase {
  name: string;
  budget: number;
  deadline: Date;
  status: IPhaseStatus;
  project: Types.ObjectId;
}

export enum IPhaseStatus {
  COMPLETED = "COMPLETED",
  ONGOING = "ONGOING",
  HOLD = "HOLD",
  CANCELED = "CANCELED", // fixed spelling
}
