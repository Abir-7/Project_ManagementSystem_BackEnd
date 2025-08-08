import { z } from "zod";
import { userRole } from "../../interface/auth.interface";

export const zodCreateUserSchema = z.object({
  body: z
    .object({
      fullName: z.string(),
      email: z.string().email(),
      password: z.string(),
      phone: z.string(),
      role: z.enum([...userRole] as [(typeof userRole)[number]]),
    })
    .strict(),
});
