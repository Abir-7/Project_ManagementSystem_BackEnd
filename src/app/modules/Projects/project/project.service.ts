/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, startSession } from "mongoose";
import { Project } from "./project.model";
import { ProjectPhase } from "../project_phase/phase.model";
import { TeamProject } from "../../relational_table/team_project/team_project.model";
import { Team } from "../../team/team.model";

interface PhaseInput {
  name: string;
  budget: number;
  deadline: string; // ISO date string
  status?: string; // optional, fallback handled by schema
}

interface AddProjectInput {
  name: string;
  clientName?: string;
  budget?: number;
  duration: number;
  salesName?: string;
  googleSheetLink?: string;
  teamGrouplink?: string;
  status?: string;
  phases?: PhaseInput[];
  teamId?: string;
}

const addProject = async (data: AddProjectInput) => {
  const session: ClientSession = await startSession();
  session.startTransaction();

  try {
    // 1. Create project
    const project = await Project.create(
      [
        {
          name: data.name,
          clientName: data.clientName || "",
          budget: data.budget ?? 0,
          duration: data.duration,
          salesName: data.salesName || "",
          googleSheetLink: data.googleSheetLink || "",
          teamGrouplink: data.teamGrouplink || "",
          status: data.status,
        },
      ],
      { session }
    );

    const projectId = project[0]._id;

    // 2. Create phases if any
    if (Array.isArray(data.phases) && data.phases.length > 0) {
      const phasesToCreate = data.phases.map((phase) => ({
        name: phase.name,
        budget: phase.budget,
        deadline: new Date(phase.deadline),
        status: phase.status,
        project: projectId,
      }));
      await ProjectPhase.insertMany(phasesToCreate, { session });
    }

    // 3. Link team to project
    if (data.teamId) {
      const teamExists = await Team.exists({ _id: data.teamId }).session(
        session
      );

      if (!teamExists) {
        throw new Error(`Team with id ${data.teamId} not found`);
      }

      await TeamProject.create(
        [
          {
            team: data.teamId,
            project: projectId,
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return project[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const ProjectService = {
  addProject,
};
