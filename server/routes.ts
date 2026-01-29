import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

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
  notificationChannel: z.string().default("sms"),
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
});

const createJobSchema = z.object({
  employerId: z.string().min(1),
  workerId: z.string().nullable().optional(),
  service: z.string().min(1),
  date: z.string().min(1),
  area: z.string().min(1),
  status: z.string().default("pending"),
  rating: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

const updateJobSchema = z.object({
  workerId: z.string().nullable().optional(),
  status: z.string().optional(),
  rating: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Workers endpoints
  app.get("/api/workers", async (req, res) => {
    try {
      const { area, skill } = req.query;
      let workers;
      
      if (area && skill) {
        workers = await storage.getWorkersByAreaAndSkill(area as string, skill as string);
      } else if (area) {
        workers = await storage.getWorkersByArea(area as string);
      } else if (skill) {
        workers = await storage.getWorkersBySkill(skill as string);
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
      const { workerId, employerId } = req.query;
      let jobs;
      
      if (workerId) {
        jobs = await storage.getJobsByWorker(workerId as string);
      } else if (employerId) {
        jobs = await storage.getJobsByEmployer(employerId as string);
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
      
      const job = await storage.createJob(result.data);
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

  return httpServer;
}
