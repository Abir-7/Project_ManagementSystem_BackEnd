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
        project_valuation_type: savedType[0]._id,
        phase: phase.phase,
        percentOne: phase.percent,
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

export const ProjectValuationService = {
  saveProjectValuations,
};
