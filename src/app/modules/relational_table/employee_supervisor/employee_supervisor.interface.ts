import { Types } from "mongoose";

export interface ISupervisorEmployee {
  supervisor: Types.ObjectId;
  employee: Types.ObjectId;
}
