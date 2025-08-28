import server from "./app";
import { appConfig } from "./app/config";
import mongoose from "mongoose";
import logger from "./app/utils/serverTools/logger";
import seedAdmin from "./app/DB";
import { startConsumers } from "./app/rabbitMq/worker";
import globalValidationPlugin from "./app/utils/serverTools/mongooseGlobalValidator";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection:", err);

  process.exit(1);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received: closing server gracefully...");
  await mongoose.disconnect();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received: closing server gracefully...");
  await mongoose.disconnect();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

const main = async () => {
  await mongoose
    .plugin(globalValidationPlugin)
    .connect(appConfig.database.dataBase_uri as string, {
      autoIndex: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // IPv4
    });
  logger.info("MongoDB connected");
  await seedAdmin();

  startConsumers();
  // Wait up to 15 minutes for request to finish uploading //
  server.setTimeout(15 * 60 * 1000);
  //------------------------//
  server.listen(
    Number(appConfig.server.port),
    appConfig.server.ip as string,
    () => {
      logger.info(
        `Example app listening on port ${appConfig.server.port} & ip:${
          appConfig.server.ip as string
        }`
      );
    }
  );
};
main().catch((err) => logger.error("Error connecting to MongoDB:", err));

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose connection lost!");
});

mongoose.connection.on("reconnected", () => {
  logger.info("Mongoose reconnected successfully");
});
