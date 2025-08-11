/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession, startSession, Types } from "mongoose";
import { Project } from "./project.model";
import { ProjectPhase } from "../project_phase/phase.model";
import { TeamProject } from "../../relational_table/team_project/team_project.model";
import { Team } from "../../team/team.model";
import { EmployeeProject } from "../../relational_table/employee_project_phase/employee_project.model";
import AppError from "../../../errors/AppError";
import status from "http-status";

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

const getAllProject = async (
  page: number,
  limit: number,
  searchTerm: string
) => {
  const matchStage = searchTerm
    ? {
        $match: {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { clientName: { $regex: searchTerm, $options: "i" } },
          ],
        },
      }
    : { $match: {} };

  const projects = await Project.aggregate([
    matchStage,

    {
      $lookup: {
        from: "projectphases",
        localField: "_id",
        foreignField: "project",
        as: "phases",
      },
    },

    {
      $sort: { createdAt: -1 }, // sort latest projects first
    },

    {
      $skip: (page - 1) * limit,
    },

    {
      $limit: limit,
    },
  ]);

  return projects;
};

const getPhaseDetails = async (phaseId: string) => {
  const phase = await ProjectPhase.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(phaseId),
      },
    },
    {
      $lookup: {
        from: "employeeprojects",
        localField: "_id",
        foreignField: "projectPhase",
        as: "employeeAssignments",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "employeeAssignments.employee",
        foreignField: "_id",
        as: "employees",
      },
    },
    // Exclude sensitive fields from employees
    {
      $addFields: {
        employees: {
          $map: {
            input: "$employees",
            as: "emp",
            in: {
              _id: "$$emp._id",
              email: "$$emp.email",
              role: "$$emp.role",
              status: "$$emp.status",
              // add any other non-sensitive fields here
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "userprofiles",
        localField: "employees._id",
        foreignField: "user",
        as: "userProfiles",
      },
    },
    {
      $addFields: {
        assignTo: {
          $map: {
            input: "$employeeAssignments",
            as: "assign",
            in: {
              $let: {
                vars: {
                  empIndex: {
                    $indexOfArray: ["$employees._id", "$$assign.employee"],
                  },
                  profileIndex: {
                    $indexOfArray: ["$userProfiles.user", "$$assign.employee"],
                  },
                },
                in: {
                  employee: { $arrayElemAt: ["$employees", "$$empIndex"] },
                  profile: {
                    $arrayElemAt: ["$userProfiles", "$$profileIndex"],
                  },
                  progress: "$$assign.progress",
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        budget: 1,
        deadline: 1,
        status: 1,
        project: 1,
        assignTo: 1,
      },
    },
  ]);

  return phase.length > 0 ? phase[0] : null;
};

const assignEmployeeToProject = async (
  employee: string,
  projectPhase: string
) => {
  const project = await ProjectPhase.findOne({ _id: projectPhase });

  if (!project) {
    throw new AppError(status.NOT_FOUND, "Project data not found.");
  }

  const result = await EmployeeProject.create({
    project: project._id,
    projectPhase,
    employee,
  });

  return result;
};

export const ProjectService = {
  addProject,
  getAllProject,
  getPhaseDetails,
  assignEmployeeToProject,
};
