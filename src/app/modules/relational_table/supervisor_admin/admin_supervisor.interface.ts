import { Types } from "mongoose";

export interface ISupervisorAdmin {
  supervisor: Types.ObjectId;
  admin: Types.ObjectId;
}
