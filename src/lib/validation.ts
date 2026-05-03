import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters.")
  .max(80, "Slug must be 80 characters or fewer.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single dashes.");

export const campaignSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120, "Name is too long."),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  targetUrl: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "Only HTTP and HTTPS URLs are allowed.",
    ),
  description: z
    .string()
    .trim()
    .max(240, "Description is too long.")
    .optional()
    .transform((value) => value || undefined),
});

export const eventSchema = z.object({
  slug: slugSchema,
});

export type CampaignInput = z.infer<typeof campaignSchema>;
