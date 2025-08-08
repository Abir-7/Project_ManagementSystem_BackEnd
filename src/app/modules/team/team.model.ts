import { Schema, model } from "mongoose";
import { ITeamDoc, TeamStatus } from "./team.interface";

const teamSchema = new Schema<ITeamDoc>(
  {
    name: { type: String, required: true, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TeamStatus),
      default: TeamStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

teamSchema.index({ name: 1, createdBy: 1 }, { unique: true });

export const Team = model<ITeamDoc>("Team", teamSchema);
