/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import logger from "../utils/serverTools/logger";
import { getChannel } from "./rabbitMq";

export const publishJob = async (queueName: string, payload: object) => {
  const channel = await getChannel();

  await channel.assertQueue(queueName, { durable: true });

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  });

  logger.info(`Job published to ${queueName}`);
};
