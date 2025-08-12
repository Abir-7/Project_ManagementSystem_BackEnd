/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { ClientSession, startSession, Types } from "mongoose";
import { Project } from "./project.model";
import { ProjectPhase } from "../project_phase/phase.model";
import { TeamProject } from "../../relational_table/team_project/team_project.model";
import { Team } from "../../team/team.model";
import { EmployeePhase } from "../../relational_table/employee_project_phase/employee_phase/employee_phase.model";
import AppError from "../../../errors/AppError";
import status from "http-status";
import { IProjectStatus } from "./project.interface";
import { IPhaseStatus } from "../project_phase/phase.interface";
import { EmployeeProject } from "../../relational_table/employee_project_phase/employee_project/employee_project.model";

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Find project phase
    const projectPhaseData = await ProjectPhase.findById(projectPhase).session(
      session
    );
    if (!projectPhaseData) {
      throw new AppError(status.NOT_FOUND, "Project phase not found.");
    }

    // 2️⃣ Check if EmployeeProject already exists
    let employeeProject = await EmployeeProject.findOne({
      project: projectPhaseData.project,
      employee,
    }).session(session);

    // 3️⃣ If not exists, create it
    if (!employeeProject) {
      [employeeProject] = await EmployeeProject.create(
        [
          {
            project: projectPhaseData.project,
            employee,
          },
        ],
        { session }
      );
    }

    // 4️⃣ Check if already assigned to this exact phase
    const alreadyInPhase = await EmployeePhase.findOne({
      projectPhase,
      employee,
    }).session(session);

    if (alreadyInPhase) {
      throw new AppError(
        status.CONFLICT,
        "Employee already assigned to this phase."
      );
    }

    // 5️⃣ Create EmployeePhase
    await EmployeePhase.create(
      [
        {
          projectPhase,
          employee,
        },
      ],
      { session }
    );

    // 6️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return employeeProject;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(error);
  }
};

const updateWorkProgress = async (
  userId: string,
  phaseId: string,
  data: {
    phaseStatus: IPhaseStatus;
    progress: number;
  }
) => {
  const userPhaseRelation = await EmployeePhase.findOne({
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

const getMyProject = async (
  userId: string,
  projectStatus: IProjectStatus,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const data = await EmployeeProject.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(userId),
      },
    },
    // Join projects to filter by projectStatus
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projectDetails",
      },
    },
    {
      $unwind: "$projectDetails",
    },
    {
      $match: {
        "projectDetails.status": projectStatus,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
    // your existing $lookup to get phases & nested data here...
    {
      $lookup: {
        from: "projectphases",
        let: { projectId: "$project" },
        pipeline: [
          { $match: { $expr: { $eq: ["$project", "$$projectId"] } } },
          {
            $lookup: {
              from: "employeephases",
              let: { phaseId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$projectPhase", "$$phaseId"] } } },
                {
                  $lookup: {
                    from: "users",
                    let: { empId: "$employee" },
                    pipeline: [
                      { $match: { $expr: { $eq: ["$_id", "$$empId"] } } },
                      {
                        $project: {
                          _id: 1,
                          email: 1,
                          role: 1,
                          status: 1,
                        },
                      },
                      {
                        $lookup: {
                          from: "userprofiles",
                          let: { uId: "$_id" },
                          pipeline: [
                            { $match: { $expr: { $eq: ["$user", "$$uId"] } } },
                            {
                              $project: {
                                _id: 0,
                                fullName: 1,
                                image: 1,
                                phone: 1,
                              },
                            },
                          ],
                          as: "profile",
                        },
                      },
                      {
                        $unwind: {
                          path: "$profile",
                          preserveNullAndEmptyArrays: true,
                        },
                      },
                    ],
                    as: "user",
                  },
                },
                {
                  $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
                },
              ],
              as: "assignedEmployees",
            },
          },
        ],
        as: "phases",
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
