/* eslint-disable @typescript-eslint/no-explicit-any */
import logger from "../utils/serverTools/logger";
import { getChannel } from "./rabbitMq";

type JobHandler = (data: any) => Promise<void>;

export const consumeQueue = async (
  queueName: string,
  handler: JobHandler
): Promise<void> => {
  const channel = await getChannel();
  await channel.assertQueue(queueName, { durable: true });

  logger.info(` [*] Waiting for messages in ${queueName}`);

  channel.consume(
    queueName,
    async (msg) => {
      logger.info(`Message received in queue: ${queueName}`); // <-- Log here to confirm receipt
      if (msg) {
        const content = msg.content.toString();
        const data = JSON.parse(content);
        try {
          await handler(data);
          channel.ack(msg);
        } catch (error) {
          logger.error(`Error processing ${queueName}:`, error);
          channel.nack(msg, false, true); // Optionally retry the message
        }
      }
    },
    { noAck: false }
  );
};
