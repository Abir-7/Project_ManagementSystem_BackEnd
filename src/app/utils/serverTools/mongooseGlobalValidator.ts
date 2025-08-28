/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Schema } from "mongoose";

const globalValidationPlugin = (schema: Schema) => {
  // Always enforce strict mode
  schema.set("strict", "throw");

  // Always enforce timestamps
  schema.set("timestamps", true);

  // Enforce validators on update queries
  schema.pre(["findOneAndUpdate", "updateMany", "updateOne"], function (next) {
    this.setOptions({ runValidators: true });
    next();
  });

  // Trim all string fields by default
  Object.keys(schema.paths).forEach((path) => {
    const field: any = schema.paths[path];
    if (field.instance === "String" && !field.options.trim) {
      field.options.trim = true;
    }
  });
};

export default globalValidationPlugin;
