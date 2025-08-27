import { Types } from "mongoose";

export interface IDelivery {
  phojectPhase: Types.ObjectId;
  employee: Types.ObjectId;
  project: Types.ObjectId;
  supervisor: Types.ObjectId;
  team: Types.ObjectId;
}
