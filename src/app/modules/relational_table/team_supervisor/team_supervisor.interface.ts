import { Types } from "mongoose";

export interface ITeamSupervisor {
  supervisor: Types.ObjectId;
  team: Types.ObjectId;
}
