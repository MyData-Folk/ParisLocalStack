import { z } from "zod";

export const roles = ["super_admin", "hotel_admin", "receptionist", "guest"] as const;
export const hotelStatuses = ["active", "inactive", "draft"] as const;
export const requestStatuses = ["new", "in_progress", "done", "urgent", "closed"] as const;
export const priorities = ["low", "medium", "high", "urgent"] as const;

export type Role = (typeof roles)[number];

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

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

export const guestCreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  language: z.string().default("fr"),
  marketingConsent: z.boolean().default(false)
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
  priority: z.enum(priorities).default("medium")
});

export const reviewCreateSchema = z.object({
  guestId: z.string().uuid(),
  stayId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional()
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
  languages: z.array(z.string()).optional(),
  modules: z.record(z.boolean()).optional()
});

export const analyticsEventSchema = z.object({
  guestId: z.string().uuid().optional(),
  eventType: z.string().min(1),
  eventPayload: z.record(z.unknown()).default({})
});

export type HotelCreateInput = z.infer<typeof hotelCreateSchema>;
