import { model, Schema } from "mongoose";
import { ITeamSupervisor } from "./team_supervisor.interface";

const TeamSupervisorSchema = new Schema<ITeamSupervisor>(
  {
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

TeamSupervisorSchema.index({ supervisor: 1, team: 1 }, { unique: true });
TeamSupervisorSchema.index({ supervisor: 1 });
export const TeamSupervisor = model<ITeamSupervisor>(
  "TeamSupervisor",
  TeamSupervisorSchema
);
