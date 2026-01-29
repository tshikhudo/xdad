import type { 
  Worker, InsertWorker, 
  Job, InsertJob, 
  Employer, InsertEmployer,
  PricingRule, InsertPricingRule 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Workers
  getWorkers(): Promise<Worker[]>;
  getWorker(id: string): Promise<Worker | undefined>;
  getWorkersByArea(area: string): Promise<Worker[]>;
  getWorkersByTasks(tasks: string[]): Promise<Worker[]>;
  getAvailableWorkers(area: string, tasks: string[], mode?: string): Promise<Worker[]>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  updateWorker(id: string, data: Partial<Worker>): Promise<Worker | undefined>;
  deleteWorker(id: string): Promise<boolean>;

  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  getJobsByWorker(workerId: string): Promise<Job[]>;
  getJobsByEmployer(employerId: string): Promise<Job[]>;
  getPendingJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, data: Partial<Job>): Promise<Job | undefined>;

  // Employers
  getEmployers(): Promise<Employer[]>;
  getEmployer(id: string): Promise<Employer | undefined>;
  getEmployerByPhone(phone: string): Promise<Employer | undefined>;
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  updateEmployer(id: string, data: Partial<Employer>): Promise<Employer | undefined>;

  // Pricing
  getPricingRules(): Promise<PricingRule | undefined>;
  updatePricingRules(data: Partial<PricingRule>): Promise<PricingRule>;
}

export class MemStorage implements IStorage {
  private workers: Map<string, Worker>;
  private jobs: Map<string, Job>;
  private employers: Map<string, Employer>;
  private pricingRules: PricingRule;

  constructor() {
    this.workers = new Map();
    this.jobs = new Map();
    this.employers = new Map();
    this.pricingRules = {
      id: "default",
      basePrice: 150,
      houseSizeMultipliers: JSON.stringify({ small: 1, medium: 1.5, large: 2 }),
      taskWeights: JSON.stringify({ general_cleaning: 1, ironing: 0.5, laundry: 0.6, windows: 0.4, deep_clean: 1.2 }),
      workerPayoutPercent: 70,
      platformFeePercent: 30,
    };
    this.seedData();
  }

  private seedData() {
    const demoWorkers: InsertWorker[] = [
      {
        name: "Thandi Nkosi",
        phone: "+27 82 123 4567",
        photo: null,
        area: "Johannesburg CBD",
        skills: ["general_cleaning", "laundry", "ironing"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 47,
        rating: 235,
        ratingCount: 50,
        notificationChannel: "whatsapp",
        workMode: "both",
        consistencyScore: 95,
        subscriptionActive: true,
      },
      {
        name: "Nomvula Dlamini",
        phone: "+27 83 234 5678",
        photo: null,
        area: "Sandton",
        skills: ["general_cleaning", "deep_clean", "windows"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 32,
        rating: 144,
        ratingCount: 30,
        notificationChannel: "whatsapp",
        workMode: "managed_only",
        consistencyScore: 88,
        subscriptionActive: true,
      },
      {
        name: "Precious Mokoena",
        phone: "+27 84 345 6789",
        photo: null,
        area: "Soweto",
        skills: ["general_cleaning", "laundry", "ironing"],
        isVerified: true,
        isAvailable: false,
        jobsCompleted: 28,
        rating: 126,
        ratingCount: 28,
        notificationChannel: "sms",
        workMode: "direct_only",
        consistencyScore: 92,
        subscriptionActive: true,
      },
      {
        name: "Grace Mthembu",
        phone: "+27 85 456 7890",
        photo: null,
        area: "Pretoria",
        skills: ["general_cleaning", "ironing", "windows"],
        isVerified: false,
        isAvailable: true,
        jobsCompleted: 15,
        rating: 68,
        ratingCount: 15,
        notificationChannel: "whatsapp",
        workMode: "both",
        consistencyScore: 75,
        subscriptionActive: true,
      },
      {
        name: "Lindiwe Zulu",
        phone: "+27 86 567 8901",
        photo: null,
        area: "Durban",
        skills: ["general_cleaning", "deep_clean", "laundry"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 52,
        rating: 247,
        ratingCount: 52,
        notificationChannel: "whatsapp",
        workMode: "both",
        consistencyScore: 98,
        subscriptionActive: true,
      },
      {
        name: "Sibongile Khumalo",
        phone: "+27 87 678 9012",
        photo: null,
        area: "Cape Town",
        skills: ["general_cleaning", "laundry", "ironing", "windows", "deep_clean"],
        isVerified: true,
        isAvailable: true,
        jobsCompleted: 89,
        rating: 436,
        ratingCount: 90,
        notificationChannel: "whatsapp",
        workMode: "both",
        consistencyScore: 99,
        subscriptionActive: true,
      },
    ];

    demoWorkers.forEach((worker) => {
      const id = randomUUID();
      this.workers.set(id, { 
        id,
        name: worker.name,
        phone: worker.phone,
        photo: worker.photo ?? null,
        area: worker.area,
        skills: worker.skills ?? [],
        isVerified: worker.isVerified ?? false,
        isAvailable: worker.isAvailable ?? true,
        jobsCompleted: worker.jobsCompleted ?? 0,
        rating: worker.rating ?? 0,
        ratingCount: worker.ratingCount ?? 0,
        notificationChannel: worker.notificationChannel ?? "whatsapp",
        workMode: worker.workMode ?? "both",
        consistencyScore: worker.consistencyScore ?? 100,
        subscriptionActive: worker.subscriptionActive ?? true,
      });
    });

    // Create demo worker for worker profile page
    const demoWorkerId = "demo-worker";
    this.workers.set(demoWorkerId, {
      id: demoWorkerId,
      name: "Your Profile",
      phone: "+27 88 999 0000",
      photo: null,
      area: "Johannesburg CBD",
      skills: ["general_cleaning", "laundry", "ironing"],
      isVerified: true,
      isAvailable: true,
      jobsCompleted: 12,
      rating: 58,
      ratingCount: 12,
      notificationChannel: "whatsapp",
      workMode: "both",
      consistencyScore: 90,
      subscriptionActive: true,
    });

    // Create a demo employer
    const demoEmployerId = "demo-employer";
    this.employers.set(demoEmployerId, {
      id: demoEmployerId,
      name: "Demo Household",
      phone: "+27 11 123 4567",
      photo: null,
      area: "Johannesburg CBD",
      reliabilityScore: 85,
      reliabilityCount: 5,
      jobsBooked: 5,
      supportingDocuments: [],
    });

    // Seed demo jobs with scope-based data
    const demoJobs: InsertJob[] = [
      {
        employerId: demoEmployerId,
        workerId: demoWorkerId,
        houseSize: "medium",
        tasks: ["general_cleaning", "ironing"],
        availabilityWindow: "anytime",
        date: new Date().toISOString().split("T")[0],
        area: "Johannesburg CBD",
        price: 225,
        status: "completed",
        jobMode: "managed",
        workerPayout: 157.5,
        employerRating: 5,
        completedAt: new Date().toISOString(),
      },
      {
        employerId: demoEmployerId,
        workerId: demoWorkerId,
        houseSize: "small",
        tasks: ["general_cleaning", "laundry"],
        availabilityWindow: "morning",
        date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0],
        area: "Sandton",
        price: 240,
        status: "completed",
        jobMode: "managed",
        workerPayout: 168,
        employerRating: 5,
        completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ];

    demoJobs.forEach((job) => {
      const id = randomUUID();
      this.jobs.set(id, { 
        id,
        employerId: job.employerId,
        workerId: job.workerId ?? null,
        houseSize: job.houseSize,
        tasks: job.tasks,
        availabilityWindow: job.availabilityWindow,
        date: job.date,
        area: job.area,
        price: job.price,
        status: job.status ?? "pending",
        jobMode: job.jobMode ?? "managed",
        workerPayout: job.workerPayout ?? null,
        photoBefore: job.photoBefore ?? null,
        photoAfter: job.photoAfter ?? null,
        employerRating: job.employerRating ?? null,
        workerRating: job.workerRating ?? null,
        completedAt: job.completedAt ?? null,
      });
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
      (worker) => worker.area === area && worker.isAvailable && worker.subscriptionActive
    );
  }

  async getWorkersByTasks(tasks: string[]): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter(
      (worker) => worker.isAvailable && worker.subscriptionActive && 
        tasks.some(task => worker.skills.includes(task))
    );
  }

  async getAvailableWorkers(area: string, tasks: string[], mode?: string): Promise<Worker[]> {
    return Array.from(this.workers.values()).filter((worker) => {
      const matchesArea = worker.area === area;
      const isAvailable = worker.isAvailable && worker.subscriptionActive;
      const hasSkills = tasks.some(task => worker.skills.includes(task));
      const matchesMode = !mode || worker.workMode === "both" || worker.workMode === mode;
      return matchesArea && isAvailable && hasSkills && matchesMode;
    });
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
      notificationChannel: insertWorker.notificationChannel ?? "whatsapp",
      workMode: insertWorker.workMode ?? "both",
      consistencyScore: insertWorker.consistencyScore ?? 100,
      subscriptionActive: insertWorker.subscriptionActive ?? true,
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

  async getPendingJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((job) => job.status === "pending");
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = {
      id,
      employerId: insertJob.employerId,
      workerId: insertJob.workerId ?? null,
      houseSize: insertJob.houseSize,
      tasks: insertJob.tasks,
      availabilityWindow: insertJob.availabilityWindow,
      date: insertJob.date,
      area: insertJob.area,
      price: insertJob.price,
      status: insertJob.status ?? "pending",
      jobMode: insertJob.jobMode ?? "managed",
      workerPayout: insertJob.workerPayout ?? null,
      photoBefore: insertJob.photoBefore ?? null,
      photoAfter: insertJob.photoAfter ?? null,
      employerRating: insertJob.employerRating ?? null,
      workerRating: insertJob.workerRating ?? null,
      completedAt: insertJob.completedAt ?? null,
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    // If completing a job with rating, update worker stats
    if (data.status === "completed" && data.employerRating && job.workerId) {
      const worker = this.workers.get(job.workerId);
      if (worker) {
        worker.rating += data.employerRating;
        worker.ratingCount += 1;
        worker.jobsCompleted += 1;
        this.workers.set(job.workerId, worker);
      }
    }

    // If worker rates employer, update employer reliability
    if (data.workerRating && job.employerId) {
      const employer = this.employers.get(job.employerId);
      if (employer) {
        const newTotal = employer.reliabilityScore * employer.reliabilityCount + data.workerRating * 20;
        employer.reliabilityCount += 1;
        employer.reliabilityScore = Math.round(newTotal / employer.reliabilityCount);
        this.employers.set(job.employerId, employer);
      }
    }

    const updated = { ...job, ...data };
    this.jobs.set(id, updated);
    return updated;
  }

  // Employers
  async getEmployers(): Promise<Employer[]> {
    return Array.from(this.employers.values());
  }

  async getEmployer(id: string): Promise<Employer | undefined> {
    return this.employers.get(id);
  }

  async getEmployerByPhone(phone: string): Promise<Employer | undefined> {
    for (const employer of this.employers.values()) {
      if (employer.phone === phone) {
        return employer;
      }
    }
    return undefined;
  }

  async createEmployer(insertEmployer: InsertEmployer): Promise<Employer> {
    const id = randomUUID();
    const employer: Employer = { 
      id,
      name: insertEmployer.name,
      phone: insertEmployer.phone,
      photo: insertEmployer.photo ?? null,
      area: insertEmployer.area,
      reliabilityScore: insertEmployer.reliabilityScore ?? 100,
      reliabilityCount: insertEmployer.reliabilityCount ?? 0,
      jobsBooked: insertEmployer.jobsBooked ?? 0,
      supportingDocuments: insertEmployer.supportingDocuments ?? [],
    };
    this.employers.set(id, employer);
    return employer;
  }

  async updateEmployer(id: string, data: Partial<Employer>): Promise<Employer | undefined> {
    const employer = this.employers.get(id);
    if (!employer) return undefined;
    const updated = { ...employer, ...data };
    this.employers.set(id, updated);
    return updated;
  }

  // Pricing
  async getPricingRules(): Promise<PricingRule | undefined> {
    return this.pricingRules;
  }

  async updatePricingRules(data: Partial<PricingRule>): Promise<PricingRule> {
    this.pricingRules = { ...this.pricingRules, ...data };
    return this.pricingRules;
  }
}

export const storage = new MemStorage();
