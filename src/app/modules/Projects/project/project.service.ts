/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { ClientSession, startSession, Types } from "mongoose";
import { Project } from "./project.model";
import { ProjectPhase } from "../project_phase/phase.model";
import { TeamProject } from "../../relational_table/team_project/team_project.model";
import { Team } from "../../team/team.model";
import { EmployeeProject } from "../../relational_table/employee_project_phase/employee_project.model";
import AppError from "../../../errors/AppError";
import status from "http-status";
import { IProjectStatus } from "./project.interface";
import { IPhaseStatus } from "../project_phase/phase.interface";

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
  searchTerm: string,
  teamId?: string,
  projectStatus?: IProjectStatus
) => {
  const matchConditions: any = {};

  // Search filter
  if (searchTerm) {
    matchConditions.$or = [
      { name: { $regex: searchTerm, $options: "i" } },
      { clientName: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Project status filter
  if (projectStatus) {
    matchConditions.status = projectStatus;
  }

  const projects = await Project.aggregate([
    { $match: matchConditions },

    {
      $lookup: {
        from: "teamprojects",
        localField: "_id",
        foreignField: "project",
        as: "teamProjects",
      },
    },

    ...(teamId
      ? [
          {
            $match: {
              "teamProjects.team": new mongoose.Types.ObjectId(teamId),
            },
          },
        ]
      : []),

    {
      $lookup: {
        from: "projectphases",
        localField: "_id",
        foreignField: "project",
        as: "phases",
      },
    },

    { $sort: { createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
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
  const projectPhaseData = await ProjectPhase.findOne({ _id: projectPhase });

  if (!projectPhaseData) {
    throw new AppError(status.NOT_FOUND, "Project data not found.");
  }

  const result = await EmployeeProject.create({
    project: projectPhaseData.project,
    projectPhase,
    employee,
  });

  return result;
};

const updateWorkProgress = async (
  userId: string,
  phaseId: string,
  data: {
    phaseStatus: IPhaseStatus;
    progress: number;
  }
) => {
  const userPhaseRelation = await EmployeeProject.findOne({
    employee: userId,
    projectPhase: phaseId,
  });

  if (!userPhaseRelation) {
    throw new AppError(
      status.NOT_FOUND,
      "User project relation data not found."
    );
  }

  const phaseData = await ProjectPhase.findOne({
    _id: userPhaseRelation.projectPhase,
  });

  if (!phaseData) {
    throw new AppError(status.NOT_FOUND, "Project phase data not found.");
  }

  if (data.phaseStatus) {
    phaseData.status = data.phaseStatus;
  }

  if (data.progress > 0) {
    userPhaseRelation.progress = data.progress;
  }

  await userPhaseRelation.save();
  await phaseData.save();

  return { ...phaseData.toObject(), progress: userPhaseRelation.progress };
};

const getMyProject = async (userId: string) => {
  const data = await EmployeeProject.aggregate([
    // 1. Only EmployeeProject docs for this user
    {
      $match: {
        employee: new mongoose.Types.ObjectId(userId),
      },
    },

    // 2. Join Project info
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "project",
      },
    },
    { $unwind: "$project" },

    // 3. Lookup all phases for the project
    {
      $lookup: {
        from: "projectphases",
        localField: "project._id",
        foreignField: "project",
        as: "phases",
      },
    },

    // 4. Unwind phases to process each one separately
    { $unwind: "$phases" },

    // 5. Find all EmployeeProject docs assigned to this phase (all users assigned to this phase)
    {
      $lookup: {
        from: "employeeprojects",
        localField: "phases._id",
        foreignField: "projectPhase",
        as: "phaseAssignments",
      },
    },

    // 6. Lookup users assigned to this phase
    {
      $lookup: {
        from: "users",
        localField: "phaseAssignments.employee",
        foreignField: "_id",
        as: "userData",
      },
    },

    // 7. Lookup profiles for these users
    {
      $lookup: {
        from: "userprofiles",
        localField: "userData._id",
        foreignField: "user",
        as: "userProfiles",
      },
    },

    // 8. Attach profile data into corresponding user with selected fields
    {
      $addFields: {
        userData: {
          $map: {
            input: "$userData",
            as: "user",
            in: {
              userId: "$$user._id",
              email: "$$user.email",
              status: "$$user.status",
              role: "$$user.role",
              name: {
                $let: {
                  vars: {
                    profile: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$userProfiles",
                            as: "profile",
                            cond: { $eq: ["$$profile.user", "$$user._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: "$$profile.fullName",
                },
              },
              phone: {
                $let: {
                  vars: {
                    profile: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$userProfiles",
                            as: "profile",
                            cond: { $eq: ["$$profile.user", "$$user._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: { $ifNull: ["$$profile.phone", ""] },
                },
              },
              image: {
                $let: {
                  vars: {
                    profile: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$userProfiles",
                            as: "profile",
                            cond: { $eq: ["$$profile.user", "$$user._id"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: { $ifNull: ["$$profile.image", ""] },
                },
              },
            },
          },
        },
      },
    },

    // 9. Find progress of this user in this phase
    {
      $addFields: {
        phaseProgress: {
          $let: {
            vars: {
              myAssignment: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$phaseAssignments",
                      as: "pa",
                      cond: {
                        $eq: [
                          "$$pa.employee",
                          new mongoose.Types.ObjectId(userId),
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
            },
            in: { $ifNull: ["$$myAssignment.progress", 0] },
          },
        },
      },
    },

    // 10. Group phases back into project array, adding userData & phaseProgress inside each phase
    {
      $group: {
        _id: "$project._id",
        project: { $first: "$project" },
        phases: {
          $push: {
            _id: "$phases._id",
            name: "$phases.name",
            budget: "$phases.budget",
            deadline: "$phases.deadline",
            status: "$phases.status",
            project: "$phases.project",
            createdAt: "$phases.createdAt",
            updatedAt: "$phases.updatedAt",
            fixed_kpi: "$phases.fixed_kpi",
            kpi: "$phases.kpi",
            userData: "$userData",
            phaseProgress: "$phaseProgress",
          },
        },
      },
    },
  ]);

  return data;
};

export const ProjectService = {
  addProject,
  getAllProject,
  getPhaseDetails,
  assignEmployeeToProject,
  updateWorkProgress,
  getMyProject,
};
