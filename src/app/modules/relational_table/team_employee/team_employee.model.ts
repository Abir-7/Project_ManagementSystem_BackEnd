import { model, Schema } from "mongoose";
import { ITeamEmployee } from "./team_employee.interface";

const TeamEmployeeSchema = new Schema<ITeamEmployee>(
  {
    employee: {
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

TeamEmployeeSchema.index({ employee: 1, team: 1 }, { unique: true });

export const TeamEmployee = model<ITeamEmployee>(
  "TeamEmployee",
  TeamEmployeeSchema
);
