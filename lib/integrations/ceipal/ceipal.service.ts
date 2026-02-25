import { prisma } from "@/lib/prisma";
import { CandidateStatus } from "@prisma/client";

const CEIPAL_BASE_URL = process.env.CEIPAL_BASE_URL || "https://api.ceipal.com/v1";
const CEIPAL_API_KEY = process.env.CEIPAL_API_KEY;
const CEIPAL_API_SECRET = process.env.CEIPAL_API_SECRET;

interface CeipalCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  location: string;
  experience: number;
  skills: string;
  visa_status: string;
  availability: string;
  expected_rate: string;
  resume_text?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CeipalJob {
  id: string;
  job_title: string;
  client_name: string;
  location: string;
  job_type: string;
  duration: string;
  pay_rate: string;
  skills_required: string;
  experience_required: number;
  visa_sponsorship: string;
  remote: string;
  description: string;
  status: string;
  created_at: string;
}

class CeipalAPIClient {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      "Content-Type": "application/json",
      "X-API-Key": CEIPAL_API_KEY || "",
      "X-API-Secret": CEIPAL_API_SECRET || "",
    };
  }

  private isConfigured(): boolean {
    return !!(CEIPAL_API_KEY && CEIPAL_API_SECRET);
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    if (!this.isConfigured()) throw new Error("CEIPAL_NOT_CONFIGURED");

    const url = new URL(`${CEIPAL_BASE_URL}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { method: "GET", headers: this.headers });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Ceipal API error ${res.status}: ${error}`);
    }
    return res.json() as T;
  }
}

const ceipalClient = new CeipalAPIClient();

function mapCeipalCandidate(c: CeipalCandidate) {
  const skills = c.skills?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const sapModules = skills.filter((s) =>
    s.toLowerCase().includes("sap") || s.toLowerCase().includes("s/4") || s.toLowerCase().includes("hana")
  );
  const otherErp = skills.filter((s) =>
    !s.toLowerCase().includes("sap") && !s.toLowerCase().includes("s/4")
  );

  return {
    name: `${c.first_name} ${c.last_name}`.trim(),
    email: c.email || null,
    phone: c.mobile || null,
    location: c.location || null,
    yearsExperience: c.experience || null,
    sapModules,
    otherErp,
    certifications: [],
    industries: [],
    visaStatus: c.visa_status || null,
    availability: c.availability || null,
    rateExpectation: c.expected_rate || null,
    resumeText: c.resume_text || null,
    status: "sourcing" as CandidateStatus,
    ceipalId: c.id,
  };
}

function mapCeipalJob(j: CeipalJob) {
  const skills = j.skills_required?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const requiredModules = skills.filter((s) =>
    s.toLowerCase().includes("sap") || s.toLowerCase().includes("s/4")
  );

  const contractTypeMap: Record<string, string> = {
    contract: "Contract",
    permanent: "Permanent",
    "contract-to-hire": "ContractToHire",
    c2h: "ContractToHire",
    fulltime: "Permanent",
  };

  return {
    title: j.job_title,
    location: j.location || null,
    type: contractTypeMap[j.job_type?.toLowerCase()] || "Contract",
    duration: j.duration || null,
    rate: j.pay_rate || null,
    requiredModules,
    preferredModules: [],
    requiredYears: j.experience_required || null,
    visaSponsorship: j.visa_sponsorship || null,
    remote: j.remote || null,
    description: j.description || null,
    ceipalId: j.id,
  };
}

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export async function syncCandidatesFromCeipal(
  options: { page?: number; limit?: number; updatedAfter?: Date } = {}
): Promise<SyncResult> {
  const result: SyncResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  const defaultRecruiterId = process.env.CEIPAL_DEFAULT_RECRUITER_ID;
  if (!defaultRecruiterId) {
    return { ...result, errors: ["CEIPAL_DEFAULT_RECRUITER_ID not set"] };
  }

  let ceipalCandidates: CeipalCandidate[] = [];

  try {
    const params: Record<string, string> = {
      page: String(options.page || 1),
      limit: String(options.limit || 50),
    };
    if (options.updatedAfter) params.updated_after = options.updatedAfter.toISOString();

    const response = await ceipalClient.get<{ data: CeipalCandidate[]; total: number }>("/applicants", params);
    ceipalCandidates = response.data || [];
    result.total = response.total || ceipalCandidates.length;
  } catch (err: any) {
    if (err.message === "CEIPAL_NOT_CONFIGURED") {
      return { ...result, errors: ["Ceipal API not configured."] };
    }
    throw err;
  }

  for (const c of ceipalCandidates) {
    try {
      const mapped = mapCeipalCandidate(c);
      const existing = await prisma.candidate.findUnique({ where: { ceipalId: c.id } });

      if (existing) {
        await prisma.candidate.update({
          where: { ceipalId: c.id },
          data: { name: mapped.name, email: mapped.email, phone: mapped.phone, sapModules: mapped.sapModules },
        });
        await prisma.ceipalSyncLog.create({
          data: { entityType: "candidate", entityId: existing.id, ceipalId: c.id, status: "success" },
        });
        result.updated++;
      } else {
        const created = await prisma.candidate.create({
          data: { ...mapped, recruiterId: defaultRecruiterId },
        });
        await prisma.ceipalSyncLog.create({
          data: { entityType: "candidate", entityId: created.id, ceipalId: c.id, status: "success" },
        });
        result.created++;
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push(`Candidate ${c.id}: ${err.message}`);
      await prisma.ceipalSyncLog.create({
        data: { entityType: "candidate", entityId: "unknown", ceipalId: c.id, status: "failed", errorMessage: err.message },
      });
    }
  }

  return result;
}

export async function syncJobsFromCeipal(
  options: { page?: number; limit?: number; clientId?: string } = {}
): Promise<SyncResult> {
  const result: SyncResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  const defaultRecruiterId = process.env.CEIPAL_DEFAULT_RECRUITER_ID;
  const defaultClientId = options.clientId || process.env.CEIPAL_DEFAULT_CLIENT_ID;

  if (!defaultRecruiterId || !defaultClientId) {
    return { ...result, errors: ["CEIPAL_DEFAULT_RECRUITER_ID and CEIPAL_DEFAULT_CLIENT_ID required"] };
  }

  let ceipalJobs: CeipalJob[] = [];

  try {
    const response = await ceipalClient.get<{ data: CeipalJob[]; total: number }>("/jobs", {
      page: String(options.page || 1),
      limit: String(options.limit || 50),
      status: "active",
    });
    ceipalJobs = response.data || [];
    result.total = response.total || ceipalJobs.length;
  } catch (err: any) {
    if (err.message === "CEIPAL_NOT_CONFIGURED") {
      return { ...result, errors: ["Ceipal API not configured."] };
    }
    throw err;
  }

  for (const j of ceipalJobs) {
    try {
      const mapped = mapCeipalJob(j);
      const existing = await prisma.job.findUnique({ where: { ceipalId: j.id } });

      if (existing) {
        await prisma.job.update({
          where: { ceipalId: j.id },
          data: { title: mapped.title, location: mapped.location, rate: mapped.rate },
        });
        result.updated++;
      } else {
        await prisma.job.create({
          data: { ...mapped, type: mapped.type as any, clientId: defaultClientId, recruiterId: defaultRecruiterId },
        });
        result.created++;
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push(`Job ${j.id}: ${err.message}`);
    }
  }

  return result;
}