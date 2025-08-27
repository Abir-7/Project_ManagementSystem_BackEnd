import { model, Schema } from "mongoose";
import { IDelivery } from "./delivery.interface";

const DeliverySchema = new Schema<IDelivery>(
  {
    phojectPhase: {
      type: Schema.Types.ObjectId,
      ref: "ProjectPhase", // reference model name
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// 3. Model export (reuse model if already compiled)
export const Delivery = model<IDelivery>("Delivery", DeliverySchema);
