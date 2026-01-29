import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { calculatePrice, HOUSE_SIZES, TASKS, AVAILABILITY_WINDOWS } from "@shared/schema";

const createWorkerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  photo: z.string().nullable().optional(),
  area: z.string().min(1),
  skills: z.array(z.string()).default([]),
  isVerified: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  jobsCompleted: z.number().default(0),
  rating: z.number().default(0),
  ratingCount: z.number().default(0),
  notificationChannel: z.string().default("whatsapp"),
  workMode: z.string().default("both"),
  consistencyScore: z.number().default(100),
  subscriptionActive: z.boolean().default(true),
});

const updateWorkerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  photo: z.string().nullable().optional(),
  area: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  isVerified: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  jobsCompleted: z.number().optional(),
  rating: z.number().optional(),
  ratingCount: z.number().optional(),
  notificationChannel: z.string().optional(),
  workMode: z.string().optional(),
  consistencyScore: z.number().optional(),
  subscriptionActive: z.boolean().optional(),
});

const validHouseSizes = HOUSE_SIZES.map(h => h.key);
const validTasks = TASKS.map(t => t.key);
const validWindows = AVAILABILITY_WINDOWS.map(w => w.key);

const createJobSchema = z.object({
  employerId: z.string().min(1),
  workerId: z.string().nullable().optional(),
  houseSize: z.enum(validHouseSizes as [string, ...string[]]),
  tasks: z.array(z.enum(validTasks as [string, ...string[]])).min(1),
  availabilityWindow: z.enum(validWindows as [string, ...string[]]),
  date: z.string().min(1),
  area: z.string().min(1),
  status: z.string().default("pending"),
  jobMode: z.string().default("managed"),
});

const updateJobSchema = z.object({
  workerId: z.string().nullable().optional(),
  status: z.string().optional(),
  jobMode: z.string().optional(),
  workerPayout: z.number().nullable().optional(),
  photoBefore: z.string().nullable().optional(),
  photoAfter: z.string().nullable().optional(),
  employerRating: z.number().nullable().optional(),
  workerRating: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

const createEmployerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  area: z.string().min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Pricing endpoint - calculate price for employer
  app.post("/api/pricing/calculate", async (req, res) => {
    try {
      const schema = z.object({
        houseSize: z.string(),
        tasks: z.array(z.string()).min(1),
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body" });
      }
      
      const { houseSize, tasks } = result.data;
      const pricingRules = await storage.getPricingRules();
      
      const houseSizeMultipliers = pricingRules 
        ? JSON.parse(pricingRules.houseSizeMultipliers)
        : { small: 1, medium: 1.5, large: 2 };
      const taskWeights = pricingRules 
        ? JSON.parse(pricingRules.taskWeights)
        : { general_cleaning: 1, ironing: 0.5, laundry: 0.6, windows: 0.4, deep_clean: 1.2 };
      const basePrice = pricingRules?.basePrice ?? 150;
      
      const price = calculatePrice(
        houseSize as any, 
        tasks as any[], 
        basePrice, 
        houseSizeMultipliers, 
        taskWeights
      );
      
      res.json({ price });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate price" });
    }
  });

  // Get pricing rules (for admin)
  app.get("/api/pricing", async (req, res) => {
    try {
      const rules = await storage.getPricingRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pricing rules" });
    }
  });

  // Update pricing rules (for admin)
  app.patch("/api/pricing", async (req, res) => {
    try {
      const rules = await storage.updatePricingRules(req.body);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pricing rules" });
    }
  });

  // Workers endpoints
  app.get("/api/workers", async (req, res) => {
    try {
      const { area, tasks, mode } = req.query;
      let workers;
      
      if (area && tasks) {
        const taskList = (tasks as string).split(",");
        workers = await storage.getAvailableWorkers(area as string, taskList, mode as string);
      } else if (area) {
        workers = await storage.getWorkersByArea(area as string);
      } else if (tasks) {
        const taskList = (tasks as string).split(",");
        workers = await storage.getWorkersByTasks(taskList);
      } else {
        workers = await storage.getWorkers();
      }
      
      res.json(workers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workers" });
    }
  });

  app.get("/api/workers/:id", async (req, res) => {
    try {
      const worker = await storage.getWorker(req.params.id);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch worker" });
    }
  });

  app.post("/api/workers", async (req, res) => {
    try {
      const result = createWorkerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.issues });
      }
      
      const worker = await storage.createWorker(result.data);
      res.status(201).json(worker);
    } catch (error) {
      console.error("Error creating worker:", error);
      res.status(400).json({ error: "Failed to create worker" });
    }
  });

  app.patch("/api/workers/:id", async (req, res) => {
    try {
      const result = updateWorkerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.issues });
      }
      
      const worker = await storage.updateWorker(req.params.id, result.data);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }
      res.json(worker);
    } catch (error) {
      res.status(500).json({ error: "Failed to update worker" });
    }
  });

  app.delete("/api/workers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorker(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Worker not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete worker" });
    }
  });

  // Jobs endpoints
  app.get("/api/jobs", async (req, res) => {
    try {
      const { workerId, employerId, status } = req.query;
      let jobs;
      
      if (workerId) {
        jobs = await storage.getJobsByWorker(workerId as string);
      } else if (employerId) {
        jobs = await storage.getJobsByEmployer(employerId as string);
      } else if (status === "pending") {
        jobs = await storage.getPendingJobs();
      } else {
        jobs = await storage.getJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const result = createJobSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.issues });
      }
      
      // Calculate price server-side using admin pricing rules
      const pricingRules = await storage.getPricingRules();
      const houseSizeMultipliers = pricingRules 
        ? JSON.parse(pricingRules.houseSizeMultipliers)
        : { small: 1, medium: 1.5, large: 2 };
      const taskWeights = pricingRules 
        ? JSON.parse(pricingRules.taskWeights)
        : { general_cleaning: 1, ironing: 0.5, laundry: 0.6, windows: 0.4, deep_clean: 1.2 };
      const basePrice = pricingRules?.basePrice ?? 150;
      const workerPayoutPercent = pricingRules?.workerPayoutPercent ?? 70;
      
      const price = calculatePrice(
        result.data.houseSize as any,
        result.data.tasks as any[],
        basePrice,
        houseSizeMultipliers,
        taskWeights
      );
      
      const workerPayout = Math.round(price * (workerPayoutPercent / 100));
      
      const job = await storage.createJob({
        ...result.data,
        price,
        workerPayout,
      });
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ error: "Failed to create job" });
    }
  });

  app.patch("/api/jobs/:id", async (req, res) => {
    try {
      const result = updateJobSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.issues });
      }
      
      const job = await storage.updateJob(req.params.id, result.data);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to update job" });
    }
  });

  // Employers endpoints
  app.get("/api/employers/:id", async (req, res) => {
    try {
      const employer = await storage.getEmployer(req.params.id);
      if (!employer) {
        return res.status(404).json({ error: "Employer not found" });
      }
      res.json(employer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employer" });
    }
  });

  app.post("/api/employers", async (req, res) => {
    try {
      const result = createEmployerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request body", details: result.error.issues });
      }
      
      const employer = await storage.createEmployer(result.data);
      res.status(201).json(employer);
    } catch (error) {
      console.error("Error creating employer:", error);
      res.status(400).json({ error: "Failed to create employer" });
    }
  });

  return httpServer;
}
