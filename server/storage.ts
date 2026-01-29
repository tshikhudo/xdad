import type { Worker, InsertWorker, Job, InsertJob, Employer, InsertEmployer } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Workers
  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkersByArea(area: string): Promise<Worker[]>;
  getWorkersBySkill(skill: string): Promise<Worker[]>;
  getWorkersByAreaAndSkill(area: string, skill: string): Promise<Worker[]>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, data: Partial<Worker>): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<boolean>;

  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByWorker(workerId: string): Promise<Job[]>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<Job>): Promise<Job | undefined>;

  // Employers
  getEmployer(id: string): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
}

export class MemStorage implements IStorage {
  private workers: Map<string, Worker>;
  private jobs: Map<string, Job>;
  private employers: Map<string, Employer>;

  constructor() {
    this.workers = new Map();
    this.jobs = new Map();
    this.employers = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed demo workers
    const demoWorkers: InsertWorker[] = [
      {
        name: "Thandi Nkosi",
        phone: "+27 82 123 4567",
        photo: null,
        area: "Johannesburg CBD",
        skills: ["cleaning", "laundry", "ironing"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 47,
        rating: 235,
        ratingCount: 50,
        notificationChannel: "sms",
      },
      {
        name: "Nomvula Dlamini",
        phone: "+27 83 234 5678",
        photo: null,
        area: "Sandton",
        skills: ["cleaning", "cooking", "childcare"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 32,
        rating: 144,
        ratingCount: 30,
        notificationChannel: "whatsapp",
      },
      {
        name: "Precious Mokoena",
        phone: "+27 84 345 6789",
        photo: null,
        area: "Soweto",
        skills: ["cleaning", "laundry", "eldercare"],
        isVerified: true,
        isAvailable: false,
        jobsCompleted: 28,
        rating: 126,
        ratingCount: 28,
        notificationChannel: "sms",
      },
      {
        name: "Grace Mthembu",
        phone: "+27 85 456 7890",
        photo: null,
        area: "Pretoria",
        skills: ["cleaning", "ironing", "cooking"],
        isVerified: false,
        isAvailable: true,
        jobsCompleted: 15,
        rating: 68,
        ratingCount: 15,
        notificationChannel: "sms",
      },
      {
        name: "Lindiwe Zulu",
        phone: "+27 86 567 8901",
        photo: null,
        area: "Durban",
        skills: ["cleaning", "childcare", "cooking"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 52,
        rating: 247,
        ratingCount: 52,
        notificationChannel: "whatsapp",
      },
      {
        name: "Sibongile Khumalo",
        phone: "+27 87 678 9012",
        photo: null,
        area: "Cape Town",
        skills: ["cleaning", "laundry", "ironing", "cooking"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 89,
        rating: 436,
        ratingCount: 90,
        notificationChannel: "sms",
      },
    ];

    demoWorkers.forEach((worker) => {
      const id = randomUUID();
      this.workers.set(id, { ...worker, id });
    });

    // Create a demo worker with a known ID for the worker profile page
    const demoWorkerId = "demo-worker";
    this.workers.set(demoWorkerId, {
      id: demoWorkerId,
      name: "Your Profile",
      phone: "+27 88 999 0000",
      photo: null,
      area: "Johannesburg CBD",
      skills: ["cleaning", "laundry", "ironing"],
      isVerified: true,
      isAvailable: true,
      jobsCompleted: 12,
      rating: 58,
      ratingCount: 12,
      notificationChannel: "sms",
    });

    // Seed some demo jobs
    const demoJobs: InsertJob[] = [
      {
        employerId: "employer-1",
        workerId: demoWorkerId,
        service: "cleaning",
        date: new Date().toISOString().split("T")[0],
        area: "Johannesburg CBD",
        status: "completed",
        rating: 5,
        completedAt: new Date().toISOString(),
      },
      {
        employerId: "employer-2",
        workerId: demoWorkerId,
        service: "laundry",
        date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        area: "Sandton",
        status: "completed",
        rating: 5,
        completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    demoJobs.forEach((job) => {
      const id = randomUUID();
      this.jobs.set(id, { ...job, id });
    });
  }

  // Workers
  async getWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async getWorker(id: string): Promise<Worker | undefined> {
    return this.workers.get(id);
  }

  async getWorkersByArea(area: string): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(
      (worker) => worker.area === area && worker.isAvailable
    );
  }

  async getWorkersBySkill(skill: string): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(
      (worker) => worker.isAvailable && worker.skills.includes(skill)
    );
  }

  async getWorkersByAreaAndSkill(area: string, skill: string): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(
      (worker) => 
        worker.area === area && 
        worker.isAvailable && 
        worker.skills.includes(skill)
    );
  }

  async createWorker(insertWorker: InsertWorker): Promise<Worker> {
    const id = randomUUID();
    const worker: Worker = {
      id,
      name: insertWorker.name,
      phone: insertWorker.phone,
      photo: insertWorker.photo ?? null,
      area: insertWorker.area,
      skills: insertWorker.skills ?? [],
      isVerified: insertWorker.isVerified ?? false,
      isAvailable: insertWorker.isAvailable ?? true,
      jobsCompleted: insertWorker.jobsCompleted ?? 0,
      rating: insertWorker.rating ?? 0,
      ratingCount: insertWorker.ratingCount ?? 0,
      notificationChannel: insertWorker.notificationChannel ?? "sms",
    };
    this.workers.set(id, worker);
    return worker;
  }

  async updateWorker(id: string, data: Partial<Worker>): Promise<Worker | undefined> {
    const worker = this.workers.get(id);
    if (!worker) return undefined;
    const updated = { ...worker, ...data };
    this.workers.set(id, updated);
    return updated;
  }

  async deleteWorker(id: string): Promise<boolean> {
    return this.workers.delete(id);
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobsByWorker(workerId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((job) => job.workerId === workerId);
  }

  async getJobsByEmployer(employerId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((job) => job.employerId === employerId);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      id,
      employerId: insertJob.employerId,
      workerId: insertJob.workerId ?? null,
      service: insertJob.service,
      date: insertJob.date,
      area: insertJob.area,
      status: insertJob.status ?? "pending",
      rating: insertJob.rating ?? null,
      completedAt: insertJob.completedAt ?? null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    // If completing a job with a rating, update the worker's rating
    if (data.status === "completed" && data.rating && job.workerId) {
      const worker = this.workers.get(job.workerId);
      if (worker) {
        worker.rating += data.rating;
        worker.ratingCount += 1;
        worker.jobsCompleted += 1;
        this.workers.set(job.workerId, worker);
      }
    }

    const updated = { ...job, ...data };
    this.jobs.set(id, updated);
    return updated;
  }

  // Employers
  async getEmployer(id: string): Promise<Employer | undefined> {
    return this.employers.get(id);
  }

  async createEmployer(insertEmployer: InsertEmployer): Promise<Employer> {
    const id = randomUUID();
    const employer: Employer = { ...insertEmployer, id };
    this.employers.set(id, employer);
    return employer;
  }
}

export const storage = new MemStorage();
