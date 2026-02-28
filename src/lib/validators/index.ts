import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const searchSchema = z.object({
  query: z.string().optional(),
  districts: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  minRent: z.number().optional(),
  maxRent: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  floor: z.string().optional(),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "area_asc", "area_desc", "recent"])
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(12),
});

export const onboardingSchema = z.object({
  businessType: z.string().min(1, "Business type is required"),
  businessDesc: z.string().optional(),
  districts: z.array(z.string()).optional(),
  propertyTypes: z.array(z.string()).optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  areaMin: z.number().optional(),
  areaMax: z.number().optional(),
  priorities: z
    .object({
      price: z.number().min(1).max(5),
      location: z.number().min(1).max(5),
      size: z.number().min(1).max(5),
      compliance: z.number().min(1).max(5),
      condition: z.number().min(1).max(5),
    })
    .optional(),
});

export const shortlistSchema = z.object({
  propertyId: z.string().min(1),
  notes: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
