import { Types } from "mongoose";

export interface ITeamProject {
  team: Types.ObjectId;
  project: Types.ObjectId;
}
