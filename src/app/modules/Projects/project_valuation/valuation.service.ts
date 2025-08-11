/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ProjectValuation, ProjectValuationType } from "./valuation.model";
import AppError from "../../../errors/AppError";
import status from "http-status";
import PhaseValuation from "../../relational_table/project_valuation_project_phase/valuation_phase.model";

interface PhaseInput {
  phase: string;
  percent: number;
}

interface ValuationTypeInput {
  type: string;
  fixedPercent: number;
  phases: PhaseInput[];
}
const saveProjectValuations = async (data: ValuationTypeInput[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const valuationType of data) {
      // Save ProjectValuationType
      const savedType = await ProjectValuationType.create(
        [
          {
            type: valuationType.type,
            fixedPercent: valuationType.fixedPercent,
          },
        ],
        { session }
      );

      // Prepare phase docs with reference
      const phaseDocs = valuationType.phases.map((phase) => ({
        project_valuation_type: savedType[0]._id,
        phase: phase.phase,
        percent: phase.percent,
      }));

      // Insert all phases at once (bulk insert)
      await ProjectValuation.insertMany(phaseDocs, { session });
    }

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();

    throw new Error(error); // rethrow so caller can handle
  } finally {
    session.endSession();
  }
};

const getValuationData = async () => {
  const result = await ProjectValuation.aggregate([
    {
      $lookup: {
        from: "projectvaluationtypes",
        localField: "project_valuation_type",
        foreignField: "_id",
        as: "valuationTypeDetails",
      },
    },
    { $unwind: "$valuationTypeDetails" },
    {
      $group: {
        _id: "$project_valuation_type",
        projectValuationType: { $first: "$valuationTypeDetails.type" },
        fixedPercent: { $first: "$valuationTypeDetails.fixedPercent" },
        phases: {
          $push: {
            _id: "$_id",
            phase: "$phase",
            percent: "$percent",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        projectValuationType: 1,
        fixedPercent: 1,
        phases: 1,
      },
    },
  ]);

  return result;
};

const addValuationToProjectPhase = async (
  valuationId: string,
  projectPhase: string
) => {
  const valuationData = await ProjectValuation.findOne({
    _id: valuationId,
  }).lean();

  if (!valuationData)
    throw new AppError(status.NOT_FOUND, "Valuation data not found.");

  const valuationType = await ProjectValuationType.findOne({
    _id: valuationData?.project_valuation_type,
  });

  if (!valuationType)
    throw new AppError(status.NOT_FOUND, "Valuation type data not found.");

  const result = await PhaseValuation.create({
    project_valuation_type: valuationData.project_valuation_type,
    projectPhase,
    valuationId,
    present_fixed_percent: valuationType.fixedPercent,
    present_percent: valuationData.percent,
  });

  return result;
};

export const ProjectValuationService = {
  saveProjectValuations,
  getValuationData,
  addValuationToProjectPhase,
};
