const DEFAULT_AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const DEFAULT_AI_SERVICE_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 10000);
const DEFAULT_USER_SKILLS = ['Flutter', 'Node.js', 'SQL Server', 'Git', 'JavaScript'];

function buildAiCvProfile(payload = {}) {
  const skills = normalizeStringList(payload.skills || DEFAULT_USER_SKILLS);
  return {
    candidate_name: payload.candidateName || payload.candidate_name || null,
    title: payload.title || 'Candidate Profile',
    summary: payload.summary || null,
    email: null,
    phone: null,
    location: payload.location || null,
    skills,
    languages: normalizeStringList(payload.languages || []),
    total_years_experience: Number.isFinite(Number(payload.totalYearsExperience))
      ? Number(payload.totalYearsExperience)
      : null,
    experiences: [],
    education: [],
    projects: [],
    certificates: normalizeStringList(payload.certificates || []),
    raw_text: null,
  };
}

function mapBackendJobToAiJob(job) {
  const salary = parseSalaryRange(job.salary);
  return {
    source: 'backend_mock',
    source_url: null,
    external_id: job.id || null,
    title: job.title,
    company_name: job.company || null,
    location: job.location || null,
    salary_min: salary.salary_min,
    salary_max: salary.salary_max,
    currency: salary.currency,
    job_type: mapJobType(job.type),
    level: inferLevel(job.title),
    posted_at: null,
    expired_at: null,
    required_skills: normalizeStringList(job.skills || []),
    nice_to_have_skills: [],
    min_years_experience: null,
    description_text: job.description || job.title,
    requirements_text: normalizeStringList(job.skills || []).join(', '),
    benefits_text: null,
    raw_html: null,
    crawl_status: 'success',
    crawled_at: null,
  };
}

async function recommendJobsViaAiService({
  aiServiceUrl = DEFAULT_AI_SERVICE_URL,
  cvPayload = {},
  jobs = [],
  fetchImpl = globalThis.fetch,
  requestTimeoutMs = DEFAULT_AI_SERVICE_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available for AI-service request');
  }

  const cvProfile = await resolveAiCvProfile({
    aiServiceUrl,
    cvPayload,
    fetchImpl,
    requestTimeoutMs,
  });

  const aiRecommendations = await postRecommendJobs({
    aiServiceUrl,
    cvProfile,
    jobs,
    fetchImpl,
    requestTimeoutMs,
  });

  return mapAiRecommendationsToBackendResponse({
    cvPayload,
    cvProfile,
    jobs,
    aiRecommendations,
  });
}

async function resolveAiCvProfile({ aiServiceUrl, cvPayload, fetchImpl, requestTimeoutMs }) {
  if (hasCvSourceForParsing(cvPayload)) {
    return parseCvViaAiService({ aiServiceUrl, cvPayload, fetchImpl, requestTimeoutMs });
  }

  return buildAiCvProfile(cvPayload);
}

async function parseCvViaAiService({ aiServiceUrl, cvPayload, fetchImpl, requestTimeoutMs }) {
  const endpoint = `${aiServiceUrl.replace(/\/+$/, '')}/api/parse-cv`;
  const fileBase64 = cvPayload.fileBase64 || cvPayload.file_base64;
  const text = cvPayload.cvText || cvPayload.text;
  const body = fileBase64
    ? {
        filename: cvPayload.fileName || cvPayload.filename || 'Candidate_CV.pdf',
        file_base64: fileBase64,
        include_raw_text: false,
        mask_pii: true,
      }
    : {
        text,
        include_raw_text: false,
        mask_pii: true,
      };

  const response = await postJson({
    endpoint,
    body,
    fetchImpl,
    requestTimeoutMs,
  });

  if (!response.ok) {
    throw new Error(`AI-service parse-cv failed with status ${response.status}`);
  }

  return response.json();
}

async function postRecommendJobs({ aiServiceUrl, cvProfile, jobs, fetchImpl, requestTimeoutMs }) {
  const endpoint = `${aiServiceUrl.replace(/\/+$/, '')}/api/recommend-jobs`;
  const response = await postJson({
    endpoint,
    body: {
      cv: cvProfile,
      jobs: jobs.map(mapBackendJobToAiJob),
    },
    fetchImpl,
    requestTimeoutMs,
  });

  if (!response.ok) {
    throw new Error(`AI-service recommend-jobs failed with status ${response.status}`);
  }

  return response.json();
}

function mapAiRecommendationsToBackendResponse({
  cvPayload = {},
  cvProfile = buildAiCvProfile(cvPayload),
  jobs = [],
  aiRecommendations = [],
}) {
  const jobById = new Map(jobs.map((job) => [job.id, job]));
  const recommendedJobs = aiRecommendations.map((item) => {
    const originalJob = jobById.get(item.job_id) || {};
    return {
      jobId: item.job_id || originalJob.id || null,
      jobTitle: originalJob.title || item.title,
      company: originalJob.company || item.company_name || null,
      salary: originalJob.salary || null,
      score: Math.round(item.overall_score || 0),
      matchedSkills: item.matched_skills || [],
      missingSkills: item.missing_required_skills || [],
      recommendationReason: item.recommendation_reason || null,
    };
  });

  return {
    success: true,
    cvName: cvPayload.fileName || 'Candidate_CV.pdf',
    extractedSkills: normalizeStringList(cvProfile.skills || cvPayload.skills || DEFAULT_USER_SKILLS),
    overallCompatibility: recommendedJobs[0] ? recommendedJobs[0].score : 0,
    recommendedJobs,
    source: 'ai-service',
  };
}

function buildLocalFallbackMatchResponse({ cvPayload = {}, jobs = [] } = {}) {
  const userSkills = normalizeStringList(cvPayload.skills || DEFAULT_USER_SKILLS);
  const userSkillKeys = new Set(userSkills.map(normalizeKey));
  const recommendedJobs = jobs
    .map((job) => {
      const jobSkills = normalizeStringList(job.skills || []);
      const matchedSkills = jobSkills.filter((skill) => userSkillKeys.has(normalizeKey(skill)));
      const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));
      const score = Math.min(
        99,
        Math.max(50, Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 100) + 15),
      );

      return {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        salary: job.salary,
        score,
        matchedSkills,
        missingSkills,
        recommendationReason: `Matched ${matchedSkills.length} of ${jobSkills.length} required skills.`,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    success: true,
    cvName: cvPayload.fileName || 'Candidate_CV.pdf',
    extractedSkills: userSkills,
    overallCompatibility: recommendedJobs[0] ? recommendedJobs[0].score : 0,
    recommendedJobs,
    source: 'local-fallback',
  };
}

function parseSalaryRange(value = '') {
  const raw = String(value);
  const currency = raw.includes('$') || /usd/i.test(raw) ? 'USD' : null;
  const numbers = [...raw.matchAll(/\d+(?:[,.]\d+)?/g)]
    .map((match) => Number(match[0].replace(/,/g, '')))
    .filter((number) => Number.isFinite(number));

  if (numbers.length === 0) {
    return { salary_min: null, salary_max: null, currency };
  }

  return {
    salary_min: Math.min(...numbers),
    salary_max: Math.max(...numbers),
    currency,
  };
}

function mapJobType(value = '') {
  const normalized = normalizeKey(value).replace(/[-_]+/g, ' ');
  if (normalized.includes('full time')) return 'full_time';
  if (normalized.includes('part time')) return 'part_time';
  if (normalized.includes('contract')) return 'contract';
  if (normalized.includes('intern')) return 'internship';
  if (normalized.includes('remote')) return 'remote';
  return 'unknown';
}

function inferLevel(value = '') {
  const normalized = normalizeKey(value);
  if (normalized.includes('senior')) return 'senior';
  if (normalized.includes('junior')) return 'junior';
  if (normalized.includes('lead')) return 'lead';
  if (normalized.includes('manager')) return 'manager';
  if (normalized.includes('intern')) return 'intern';
  return 'unknown';
}

function normalizeStringList(values) {
  if (typeof values === 'string') {
    return values.split(/[,;/|]/).map((value) => value.trim()).filter(Boolean);
  }
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value).trim()).filter(Boolean);
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function hasCvSourceForParsing(cvPayload = {}) {
  return Boolean(
    cvPayload.fileBase64 ||
      cvPayload.file_base64 ||
      cvPayload.cvText ||
      cvPayload.text,
  );
}

async function postJson({ endpoint, body, fetchImpl, requestTimeoutMs }) {
  const timeout = createTimeoutSignal(requestTimeoutMs);

  try {
    return await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: timeout.signal,
    });
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw new Error(`AI-service request timed out after ${requestTimeoutMs}ms`);
    }
    throw error;
  } finally {
    timeout.clear();
  }
}

function createTimeoutSignal(requestTimeoutMs) {
  if (typeof AbortController === 'undefined' || !Number.isFinite(Number(requestTimeoutMs)) || Number(requestTimeoutMs) <= 0) {
    return {
      signal: undefined,
      clear: () => {},
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Number(requestTimeoutMs));

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

module.exports = {
  DEFAULT_AI_SERVICE_TIMEOUT_MS,
  DEFAULT_AI_SERVICE_URL,
  buildAiCvProfile,
  buildLocalFallbackMatchResponse,
  mapAiRecommendationsToBackendResponse,
  mapBackendJobToAiJob,
  recommendJobsViaAiService,
};
