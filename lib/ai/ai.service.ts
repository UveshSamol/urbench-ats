import { prisma } from "@/lib/prisma";

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  yearsExperience: number;
  sapModules: string[];
  otherErp: string[];
  certifications: string[];
  industries: string[];
  visaStatus: string;
  availability: string;
  rateExpectation: string;
  employmentType: string;
  summary: string;
}

export interface ParsedJD {
  title: string;
  client: string;
  location: string;
  type: string;
  duration: string;
  durationMonths: number;
  rate: string;
  rateNumeric: number;
  requiredModules: string[];
  preferredModules: string[];
  requiredYears: number;
  requiredCerts: string[];
  industries: string[];
  visaSponsorship: string;
  remote: string;
  summary: string;
}

export interface MatchResult {
  overallScore: number;
  moduleScore: number;
  experienceScore: number;
  industryScore: number;
  certificationScore: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  summary: string;
  nextSteps: string;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const model = "gemini-2.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) throw new Error("GEMINI_RATE_LIMITED");
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callClaude(
  system: string,
  user: string,
  model: "haiku" | "sonnet" = "haiku"
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const modelMap = {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-20250514",
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelMap[model],
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

function truncateText(text: string, maxWords = 3000): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "\n\n[Truncated]";
}

const parseCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCacheKey(text: string): string {
  return `${text.slice(0, 100).replace(/\s/g, "")}_${text.length}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = parseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    parseCache.delete(key);
    return null;
  }
  return cached.result as T;
}

function setCache(key: string, result: any): void {
  parseCache.set(key, { result, timestamp: Date.now() });
  if (parseCache.size > 500) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey) parseCache.delete(firstKey);
  }
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const truncated = truncateText(resumeText, 3000);
  const cacheKey = getCacheKey(truncated);
  const cached = getFromCache<ParsedResume>(cacheKey);
  if (cached) return cached;

  const prompt = `You are an SAP recruiting expert. Extract candidate info from this resume.
Return ONLY valid JSON, no markdown, no explanation.
{
  "name":"","email":"","phone":"","location":"",
  "yearsExperience":0,
  "sapModules":["SAP FICO","SAP MM","S/4HANA"],
  "otherErp":["Workday","Oracle"],
  "certifications":[],
  "industries":[],
  "visaStatus":"US Citizen/GC/H1B/OPT/EAD/Unknown",
  "availability":"Immediate/2 weeks/1 month",
  "rateExpectation":"$XX/hr or Unknown",
  "employmentType":"Contract/Permanent/Both",
  "summary":"2-sentence SAP-focused summary"
}
RESUME:
${truncated}`;

  let raw: string;
  try {
    raw = await callGemini(prompt);
  } catch (err: any) {
    if (err.message === "GEMINI_RATE_LIMITED" || err.message.includes("GEMINI")) {
      raw = await callClaude("You are an SAP recruiting expert. Return ONLY valid JSON.", prompt, "haiku");
    } else {
      throw err;
    }
  }

  const result = parseJSON<ParsedResume>(raw);
  setCache(cacheKey, result);
  return result;
}

export async function parseJobDescription(jdText: string): Promise<ParsedJD> {
  const truncated = truncateText(jdText, 2000);
  const cacheKey = "jd_" + getCacheKey(truncated);
  const cached = getFromCache<ParsedJD>(cacheKey);
  if (cached) return cached;

  const prompt = `You are an SAP recruiting expert. Extract job requirements.
Return ONLY valid JSON, no markdown, no explanation.
{
  "title":"","client":"Unknown","location":"",
  "type":"Contract/Permanent/ContractToHire",
  "duration":"6 months","durationMonths":0,
  "rate":"$XX/hr","rateNumeric":0,
  "requiredModules":["SAP FICO"],
  "preferredModules":[],
  "requiredYears":0,"requiredCerts":[],
  "industries":[],"visaSponsorship":"Yes/No/Unknown",
  "remote":"Yes/No/Hybrid",
  "summary":"2-sentence summary"
}
JOB DESCRIPTION:
${truncated}`;

  let raw: string;
  try {
    raw = await callGemini(prompt);
  } catch (err: any) {
    if (err.message === "GEMINI_RATE_LIMITED" || err.message.includes("GEMINI")) {
      raw = await callClaude("You are an SAP recruiting expert. Return ONLY valid JSON.", prompt, "haiku");
    } else {
      throw err;
    }
  }

  const result = parseJSON<ParsedJD>(raw);
  setCache(cacheKey, result);
  return result;
}

export async function matchCandidateToJob(
  candidate: {
    name: string;
    yearsExperience?: number | null;
    sapModules: string[];
    certifications: string[];
    industries: string[];
    visaStatus?: string | null;
    availability?: string | null;
    rateExpectation?: string | null;
  },
  job: {
    title: string;
    requiredModules: string[];
    preferredModules: string[];
    requiredYears?: number | null;
    requiredCerts: string[];
    industries: string[];
    visaSponsorship?: string | null;
    rate?: string | null;
  },
  useHighQuality = false
): Promise<MatchResult> {
  const system = `You are a senior SAP recruiter with 15 years experience.
Score candidate vs job. Be realistic.
Return ONLY valid JSON, no markdown:
{
  "overallScore":0,
  "moduleScore":0,
  "experienceScore":0,
  "industryScore":0,
  "certificationScore":0,
  "strengths":["strength1","strength2"],
  "gaps":["gap1","gap2"],
  "recommendation":"Strong Match/Good Match/Partial Match/Poor Match",
  "summary":"2-3 sentence recruiter note",
  "nextSteps":"Specific next action"
}`;

  const user = `CANDIDATE: ${candidate.name}
Experience: ${candidate.yearsExperience ?? "?"}yrs
SAP: ${candidate.sapModules.join(", ") || "None"}
Certs: ${candidate.certifications.join(", ") || "None"}
Industries: ${candidate.industries.join(", ") || "?"}
Visa: ${candidate.visaStatus ?? "?"}, Rate: ${candidate.rateExpectation ?? "?"}

JOB: ${job.title}
Required: ${job.requiredModules.join(", ") || "?"}
Preferred: ${job.preferredModules.join(", ") || "None"}
Years needed: ${job.requiredYears ?? "?"}, Visa: ${job.visaSponsorship ?? "?"}
Rate: ${job.rate ?? "?"}`;

  const raw = await callClaude(system, user, useHighQuality ? "sonnet" : "haiku");
  return parseJSON<MatchResult>(raw);
}

export async function detectDuplicate(
  email?: string,
  phone?: string
): Promise<{ isDuplicate: boolean; existingId?: string }> {
  if (!email && !phone) return { isDuplicate: false };

  const conditions: any[] = [];
  if (email) conditions.push({ email: email.toLowerCase().trim() });
  if (phone) {
    const normalized = phone.replace(/\D/g, "").slice(-10);
    if (normalized.length >= 10) conditions.push({ phone: { endsWith: normalized } });
  }

  const existing = await prisma.candidate.findFirst({ where: { OR: conditions } });
  return existing ? { isDuplicate: true, existingId: existing.id } : { isDuplicate: false };
}