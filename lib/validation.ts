import { z } from "zod";

// ---------------------------------------------------------------
// Shared validation. These run on BOTH client (react-hook-form)
// and server (API routes) — client-side is UX only, never trust.
// ---------------------------------------------------------------

export const CATEGORY_VALUES = [
  "MENS_SINGLES",
  "WOMENS_SINGLES",
  "MENS_DOUBLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
] as const;

export const DOUBLES_CATEGORIES = new Set([
  "MENS_DOUBLES",
  "WOMENS_DOUBLES",
  "MIXED_DOUBLES",
]);

// Fee in INR (whole rupees); converted to paise at write time.
export const FEE_PER_PLAYER = 500;

// Strict name: letters, spaces, hyphens, apostrophes only — blocks
// script payloads and SQL meta-characters at the schema boundary.
const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name may only contain letters, spaces, hyphens and apostrophes");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{10}$/, "Enter a valid 10-digit phone number");

const playerSchema = z.object({
  fullName: nameSchema,
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int()
    .min(6, "Minimum age is 6")
    .max(100, "Enter a valid age"),
  contactEmail: z.string().trim().email("Enter a valid email").max(254),
  contactPhone: phoneSchema,
});

export const registrationSchema = z
  .object({
    category: z.enum(CATEGORY_VALUES),
    player: playerSchema,
    // only required for doubles categories
    partner: playerSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const isDoubles = DOUBLES_CATEGORIES.has(data.category);
    if (isDoubles && !data.partner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner details are required for doubles categories",
        path: ["partner"],
      });
    }
    if (!isDoubles && data.partner) {
      // strip silently server-side; client shouldn't send this
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner details are not allowed for singles categories",
        path: ["partner"],
      });
    }
    if (
      isDoubles &&
      data.partner &&
      data.partner.contactEmail.toLowerCase() === data.player.contactEmail.toLowerCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Partner must use a different email address",
        path: ["partner", "contactEmail"],
      });
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function feeForCategory(category: (typeof CATEGORY_VALUES)[number]): number {
  return DOUBLES_CATEGORIES.has(category) ? FEE_PER_PLAYER * 2 : FEE_PER_PLAYER;
}

// ---- Auth schemas ----

export const signupSchema = z.object({
  name: nameSchema,
  email: z.string().trim().email("Enter a valid email").max(254),
  // Strong password policy, enforced server-side too
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(72, "Password is too long")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number")
    .regex(/[^a-zA-Z0-9]/, "Include at least one symbol"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required").max(72),
});
