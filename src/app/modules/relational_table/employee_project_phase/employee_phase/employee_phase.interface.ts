import { Types } from "mongoose";

export interface IEmployeePhase {
  projectPhase: Types.ObjectId;
  employee: Types.ObjectId;
  progress: number;
}
