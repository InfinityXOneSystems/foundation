// src/utils/in-memory-scheduler.ts
// Lightweight in-memory scheduler used for demo/testing in SmartRouter
// Not intended for production — replace with a robust scheduler (Cloud Tasks / Cloud Scheduler / Kubernetes CronJob)

type Job = {
  id: string;
  name: string;
  intervalMs: number;
  lastRun?: string;
  active: boolean;
};

export class InMemoryScheduler {
  private jobs: Map<string, Job> = new Map();
  private timers: Map<string, NodeJS.Timer> = new Map();

  public createJob(name: string, intervalMs: number): Job {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = { id, name, intervalMs, active: false };
    this.jobs.set(id, job);
    return job;
  }

  public listJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  public startJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.active) return false;

    const timer = setInterval(() => {
      job.lastRun = new Date().toISOString();
      // emit an event via global event bus in SmartRouter instead of executing tasks here
    }, job.intervalMs);

    this.timers.set(id, timer);
    job.active = true;
    this.jobs.set(id, job);
    return true;
  }

  public stopJob(id: string): boolean {
    const timer = this.timers.get(id);
    if (!timer) return false;
    clearInterval(timer);
    this.timers.delete(id);
    const job = this.jobs.get(id);
    if (job) job.active = false;
    return true;
  }

  public deleteJob(id: string): boolean {
    this.stopJob(id);
    return this.jobs.delete(id);
  }

  public getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }
}

export const scheduler = new InMemoryScheduler();
