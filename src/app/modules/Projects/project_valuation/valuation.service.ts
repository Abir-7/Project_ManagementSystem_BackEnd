/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { ProjectValuation, ProjectValuationType } from "./valuation.model";

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
        projectValuationType: savedType[0]._id,
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
        localField: "projectValuationType",
        foreignField: "_id",
        as: "valuationTypeDetails",
      },
    },
    { $unwind: "$valuationTypeDetails" },
    {
      $group: {
        _id: "$projectValuationType",
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

export const ProjectValuationService = {
  saveProjectValuations,
  getValuationData,
};
