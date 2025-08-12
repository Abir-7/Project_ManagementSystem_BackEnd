import { Types } from "mongoose";

export interface IEmployeeProject {
  project: Types.ObjectId;
  employee: Types.ObjectId;
  progress: number;
}
