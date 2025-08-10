import { Types } from "mongoose";

export interface IEmployeeProject {
  projectPhase: Types.ObjectId;
  project: Types.ObjectId;
  employee: Types.ObjectId;
  progress: number;
}
