import { z } from "zod";

const PhaseSchema = z
  .object({
    name: z.string().min(1),
    budget: z.number().min(1),
    deadline: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
  })
  .strict(); // <-- makes phase object strict (no extra keys allowed)

export const ZodProjectSchema = z.object({
  body: z
    .object({
      name: z.string().min(1),
      clientName: z.string().min(1),
      budget: z.number().min(0),
      duration: z.number().int().min(1),
      salesName: z.string().min(1),
      googleSheetLink: z.string().url(),
      teamGrouplink: z.string().url(),
      phases: z.array(PhaseSchema).optional(), // phases optional, but if present each phase is strict
      teamId: z.string().optional(),
    })
    .strict(),
});
