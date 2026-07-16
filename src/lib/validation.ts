import { z } from "zod";

export const incidentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Please add a short title (min 4 characters).")
    .max(80, "Keep the title under 80 characters."),
  category: z.enum([
    "theft",
    "harassment",
    "accident",
    "medical",
    "lost_item",
    "scam",
    "natural_hazard",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z
    .string()
    .trim()
    .min(10, "Please describe what happened (min 10 characters).")
    .max(1000, "Keep the description under 1000 characters."),
  address: z.string().trim().max(160).optional().or(z.literal("")),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required."),
  nationality: z.string().trim().min(2, "Nationality is required."),
  passportNo: z.string().trim().min(3, "Passport number is required."),
  bloodGroup: z.string().trim().min(1, "Blood group is required."),
  insuranceProvider: z.string().trim().optional().or(z.literal("")),
  emergencyContactName: z.string().trim().min(2, "Emergency contact name is required."),
  emergencyContactPhone: z.string().trim().min(6, "Emergency contact phone is required."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
