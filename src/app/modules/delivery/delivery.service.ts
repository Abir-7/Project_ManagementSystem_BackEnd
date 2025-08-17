import logger from "../../utils/serverTools/logger";

const savePhaseDeliveryData = async (userId: string, phaseId: string) => {
  logger.info(`${userId} ${phaseId}`);
};

export const DeliveryService = {
  savePhaseDeliveryData,
};
