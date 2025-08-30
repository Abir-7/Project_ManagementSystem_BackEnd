import { model, Schema } from "mongoose";
import { ITeamProject } from "./team_project.interfacee";

const TeamProjectSchema = new Schema<ITeamProject>(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: prevent duplicate team-project assignments
TeamProjectSchema.index({ team: 1, project: 1 }, { unique: true });

TeamProjectSchema.index({ project: 1 }, { unique: true });
TeamProjectSchema.index({ team: 1 });

export const TeamProject = model<ITeamProject>(
  "TeamProject",
  TeamProjectSchema
);
