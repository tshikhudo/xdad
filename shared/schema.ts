import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  notificationChannel: text("notification_channel").notNull().default("sms"),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true });
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Worker = typeof workers.$inferSelect;

// Employers table
export const employers = pgTable("employers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  area: text("area").notNull(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({ id: true });
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Employer = typeof employers.$inferSelect;

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employerId: varchar("employer_id").notNull(),
  workerId: varchar("worker_id"),
  service: text("service").notNull(),
  date: text("date").notNull(),
  area: text("area").notNull(),
  status: text("status").notNull().default("pending"),
  rating: integer("rating"),
  completedAt: text("completed_at"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({ id: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

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

// Service types
export const SERVICES = ["cleaning", "laundry", "ironing", "cooking", "childcare", "eldercare"] as const;
export type ServiceType = typeof SERVICES[number];

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

// Skills icons mapping
export const SKILL_ICONS: Record<string, string> = {
  cleaning: "sparkles",
  laundry: "shirt",
  ironing: "flame",
  cooking: "chefHat",
  childcare: "baby",
  eldercare: "heart",
};
