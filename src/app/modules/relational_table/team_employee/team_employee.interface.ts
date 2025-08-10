import { Types } from "mongoose";

export interface ITeamEmployee {
  employee: Types.ObjectId;
  team: Types.ObjectId;
}
