/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import amqplib from "amqplib";
import logger from "../utils/serverTools/logger";
import { appConfig } from "../config";

const uri = appConfig.rabbitMq.url as string;

export const getChannel = async () => {
  try {
    const connection = await amqplib.connect(uri);
    const channel = await connection.createChannel();
    return channel;
  } catch (error: any) {
    logger.error(`Error connecting to RabbitMQ:${error}`);
    throw new Error(error);
  }
};
