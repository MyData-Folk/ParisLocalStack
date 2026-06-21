import { z } from "zod";

export const roles = ["super_admin", "hotel_admin", "receptionist", "guest"] as const;
export const adminManagedHotelRoles = ["hotel_admin", "receptionist"] as const;
export const userStatuses = ["active", "inactive"] as const;
export const hotelStatuses = ["active", "inactive", "draft"] as const;
export const requestStatuses = ["new", "in_progress", "done", "urgent", "closed"] as const;
export const priorities = ["low", "medium", "high", "urgent"] as const;
export const relationshipStatuses = ["normal", "priority", "watch"] as const;
export const guestThemes = ["parisian_boutique", "modern_minimal", "palace_luxury"] as const;
export const reviewStatuses = ["pending_review", "approved", "rejected", "negative_alert", "resolved"] as const;

export type Role = (typeof roles)[number];

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(16, "Password must be at least 16 characters").max(128)
});

export const passwordResetSchema = z.object({
  newPassword: z.string().min(16, "Password must be at least 16 characters").max(128),
  confirmPassword: z.string().min(16, "Password must be at least 16 characters").max(128)
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Password confirmation does not match",
  path: ["confirmPassword"]
});

export const adminPasswordResetSchema = passwordResetSchema;

export const hotelCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default("Paris"),
  country: z.string().optional().default("France"),
  phone: z.string().optional().default(""),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  primaryColor: z.string().default("#c9a84c"),
  secondaryColor: z.string().default("#0f172a"),
  status: z.enum(hotelStatuses).default("draft")
});

export const hotelUpdateSchema = hotelCreateSchema.partial();

export const receptionUserCreateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional()
});

export const adminUserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional(),
  role: z.enum(adminManagedHotelRoles).optional(),
  status: z.enum(userStatuses).optional()
});

export const guestCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  language: z.string().default("fr"),
  marketingConsent: z.boolean().default(false)
});

export const guestCrmUpdateSchema = z.object({
  internalNotes: z.string().max(4000).optional(),
  crmTags: z.array(z.string().min(1).max(40)).max(20).optional(),
  preferences: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  relationshipStatus: z.enum(relationshipStatuses).optional()
});

export const stayCreateSchema = z.object({
  guestId: z.string().uuid().optional(),
  guest: guestCreateSchema.optional(),
  roomNumber: z.string().min(1),
  checkinDate: z.string().optional(),
  checkoutDate: z.string().optional(),
  status: z.string().default("active")
});

export const stayUpdateSchema = z.object({
  roomNumber: z.string().min(1).optional(),
  checkinDate: z.string().optional().nullable(),
  checkoutDate: z.string().optional().nullable(),
  status: z.string().min(1).optional()
});

export const messageCreateSchema = z.object({
  guestId: z.string().uuid(),
  stayId: z.string().uuid().optional(),
  content: z.string().min(1).max(4000),
  priority: z.enum(priorities).default("medium")
});

export const publicMessagesQuerySchema = z.object({
  guestId: z.string().uuid(),
  stayId: z.string().uuid()
});

export const replyCreateSchema = z.object({
  content: z.string().min(1).max(4000)
});

export const serviceRequestCreateSchema = z.object({
  guestId: z.string().uuid(),
  stayId: z.string().uuid().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  details: z.record(z.unknown()).optional(),
  priority: z.enum(priorities).default("medium")
});

export const reviewCreateSchema = z.object({
  guestId: z.string().uuid(),
  stayId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
});

export const reviewStatusUpdateSchema = z.object({
  status: z.enum(reviewStatuses)
});

export const recommendationSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  address: z.string().default(""),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  distance: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  openingHours: z.string().optional(),
  googlePlaceId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  source: z.string().optional().default("manual"),
  isFeatured: z.boolean().default(false)
});

export const settingsUpdateSchema = z.object({
  wifiName: z.string().optional(),
  wifiPassword: z.string().optional(),
  breakfastHours: z.string().optional(),
  checkinTime: z.string().optional(),
  checkoutTime: z.string().optional(),
  roomServiceHours: z.string().optional(),
  receptionPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  guestTheme: z.enum(guestThemes).optional(),
  languages: z.array(z.string()).optional(),
  modules: z.record(z.boolean()).optional()
});

export const analyticsEventSchema = z.object({
  guestId: z.string().uuid().optional(),
  eventType: z.string().min(1),
  eventPayload: z.record(z.unknown()).default({})
});

export const remoteFileCreateSchema = z.object({
  url: z.string().url(),
  originalName: z.string().min(1).max(160).optional(),
  mimeType: z.string().min(1).max(80).optional(),
  size: z.number().int().nonnegative().optional()
});

export type HotelCreateInput = z.infer<typeof hotelCreateSchema>;

export * from "./guestCards.js";
export * from "./hotelPlans.js";
export * from "./hotelServices.js";
export * from "./serviceCatalog.js";
