import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// House sizes with pricing weights
export const HOUSE_SIZES = [
  { key: "small", bedrooms: "1-2", weight: 1.0 },
  { key: "medium", bedrooms: "3", weight: 1.5 },
  { key: "large", bedrooms: "4+", weight: 2.0 },
] as const;
export type HouseSizeKey = typeof HOUSE_SIZES[number]["key"];

// Tasks with complexity weights
export const TASKS = [
  { key: "general_cleaning", weight: 1.0, icon: "sparkles" },
  { key: "ironing", weight: 0.5, icon: "flame" },
  { key: "laundry", weight: 0.6, icon: "shirt" },
  { key: "windows", weight: 0.4, icon: "square" },
  { key: "deep_clean", weight: 1.2, icon: "sparkles" },
] as const;
export type TaskKey = typeof TASKS[number]["key"];

// Availability windows (routing only, not pricing)
export const AVAILABILITY_WINDOWS = [
  { key: "anytime", label: "8am - 4pm", startHour: 8, endHour: 16 },
  { key: "morning", label: "8am - 12pm", startHour: 8, endHour: 12 },
  { key: "afternoon", label: "12pm - 4pm", startHour: 12, endHour: 16 },
] as const;
export type AvailabilityKey = typeof AVAILABILITY_WINDOWS[number]["key"];

// Job execution modes (admin-controlled, invisible to employer)
export const JOB_MODES = ["managed", "direct"] as const;
export type JobMode = typeof JOB_MODES[number];

// Worker capability modes
export const WORKER_MODES = ["managed_only", "direct_only", "both"] as const;
export type WorkerMode = typeof WORKER_MODES[number];

// Areas in South Africa
export const AREAS = [
  "Johannesburg CBD",
  "Sandton",
  "Soweto",
  "Pretoria",
  "Durban",
  "Cape Town",
  "Port Elizabeth",
  "Bloemfontein",
] as const;
export type AreaType = typeof AREAS[number];

// Employer reliability levels (shown to workers only)
export const RELIABILITY_LEVELS = ["low", "medium", "high"] as const;
export type ReliabilityLevel = typeof RELIABILITY_LEVELS[number];

// Workers table
export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  photo: text("photo"),
  area: text("area").notNull(),
  skills: text("skills").array().notNull().default(sql`ARRAY[]::text[]`),
  isVerified: boolean("is_verified").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  jobsCompleted: integer("jobs_completed").notNull().default(0),
  rating: integer("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  notificationChannel: text("notification_channel").notNull().default("whatsapp"),
  workMode: text("work_mode").notNull().default("both"),
  consistencyScore: integer("consistency_score").notNull().default(100),
  subscriptionActive: boolean("subscription_active").notNull().default(true),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true });
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

// Employers table
export const employers = pgTable("employers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  photo: text("photo"),
  area: text("area").notNull(),
  reliabilityScore: integer("reliability_score").notNull().default(100),
  reliabilityCount: integer("reliability_count").notNull().default(0),
  jobsBooked: integer("jobs_booked").notNull().default(0),
  supportingDocuments: text("supporting_documents").array().default(sql`ARRAY[]::text[]`),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true });
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Employer = typeof employers.$inferSelect;

// Jobs table - scope-based
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id").notNull(),
  workerId: varchar("worker_id"),
  houseSize: text("house_size").notNull(),
  tasks: text("tasks").array().notNull(),
  availabilityWindow: text("availability_window").notNull(),
  date: text("date").notNull(),
  area: text("area").notNull(),
  price: real("price").notNull(),
  status: text("status").notNull().default("pending"),
  jobMode: text("job_mode").notNull().default("managed"),
  workerPayout: real("worker_payout"),
  photoBefore: text("photo_before"),
  photoAfter: text("photo_after"),
  employerRating: integer("employer_rating"),
  workerRating: integer("worker_rating"),
  completedAt: text("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Pricing rules (admin-configurable)
export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  basePrice: real("base_price").notNull().default(150),
  houseSizeMultipliers: text("house_size_multipliers").notNull().default('{"small":1,"medium":1.5,"large":2}'),
  taskWeights: text("task_weights").notNull().default('{"general_cleaning":1,"ironing":0.5,"laundry":0.6,"windows":0.4,"deep_clean":1.2}'),
  workerPayoutPercent: real("worker_payout_percent").notNull().default(70),
  platformFeePercent: real("platform_fee_percent").notNull().default(30),
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({ id: true });
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;

// Admin users
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true });
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

// Keep legacy users for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Helper to calculate reliability level from score
export function getReliabilityLevel(score: number): ReliabilityLevel {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

// Helper to calculate price from house size and tasks
export function calculatePrice(
  houseSize: HouseSizeKey,
  tasks: TaskKey[],
  basePrice: number = 150,
  houseSizeMultipliers: Record<string, number> = { small: 1, medium: 1.5, large: 2 },
  taskWeights: Record<string, number> = { general_cleaning: 1, ironing: 0.5, laundry: 0.6, windows: 0.4, deep_clean: 1.2 }
): number {
  const sizeMultiplier = houseSizeMultipliers[houseSize] || 1;
  const taskTotal = tasks.reduce((sum, task) => sum + (taskWeights[task] || 0), 0);
  return Math.round(basePrice * sizeMultiplier * Math.max(taskTotal, 1));
}
