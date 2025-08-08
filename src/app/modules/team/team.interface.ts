import { Document, Types } from "mongoose";

export enum TeamStatus {
  ACTIVE = "ACTIVE",
  DEACTIVE = "DEACTIVE",
}

export interface ITeam {
  name: string;
  createdBy: Types.ObjectId;
  status: TeamStatus;
}

export interface ITeamDoc extends ITeam, Document {}
