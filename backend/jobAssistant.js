const { randomUUID } = require('crypto');
const { matchCvPayload } = require('./matchController');

const SOURCE_ALIASES = [
  { source: 'topcv', patterns: ['topcv', 'top cv'] },
  { source: 'itviec', patterns: ['itviec', 'it viec', 'it việc'] },
  { source: 'vietnamworks', patterns: ['vietnamworks', 'vietnam works'] },
];

const SKILL_KEYWORDS = [
  'Python',
  'FastAPI',
  'Django',
  'Node.js',
  'React',
  'TypeScript',
  'JavaScript',
  'Flutter',
  'Dart',
  'SQL Server',
  'Docker',
  'AWS',
  'NLP',
];

const DEFAULT_SESSION_STORE = new Map();

function parseJobSearchIntent(message = '') {
  const raw = String(message || '').trim();
  const normalized = normalizeText(raw);
  const jobSources = SOURCE_ALIASES
    .filter(({ patterns }) => patterns.some((pattern) => normalized.includes(normalizeText(pattern))))
    .map(({ source }) => source);
  const salary = extractSalary(normalized);
  const location = extractLocation(normalized);
  const workMode = extractWorkMode(normalized);
  const requiredSkills = SKILL_KEYWORDS.filter((skill) => normalized.includes(normalizeText(skill)));
  const targetRole = extractTargetRole(raw, requiredSkills);

  return {
    target_role: targetRole,
    required_skills: requiredSkills,
    preferred_skills: [],
    job_sources: [...new Set(jobSources)],
    location,
    work_mode: workMode,
    salary_min: salary.salary_min,
    salary_max: null,
    currency: salary.currency,
    level: extractLevel(normalized),
    company_type: extractCompanyType(normalized),
    industry_domain: null,
    must_have_filters: [],
    nice_to_have_filters: [],
    excluded_keywords: [],
  };
}

function filterJobsByIntent(jobs = [], intent = {}) {
  return jobs.filter((job) => {
    if (!matchesSource(job, intent)) return false;
    if (!matchesSalary(job, intent)) return false;
    if (!matchesLocation(job, intent)) return false;
    if (!matchesWorkMode(job, intent)) return false;
    if (!matchesRoleOrSkills(job, intent)) return false;
    return true;
  });
}

async function handleJobAssistantChat({
  payload = {},
  jobs = [],
  aiServiceUrl,
  requestTimeoutMs,
  matchCv = matchCvPayload,
  logger,
  sessionStore = DEFAULT_SESSION_STORE,
} = {}) {
  const message = payload.message || '';
  const conversationId = payload.conversation_id || payload.conversationId || randomUUID();
  const previousSession = readSession(sessionStore, conversationId);
  const currentIntent = payload.parsed_intent || parseJobSearchIntent(message);
  const parsedIntent = mergeJobSearchIntent(previousSession.parsed_intent, currentIntent);
  const filteredJobs = filterJobsByIntent(jobs, parsedIntent);
  const followUpQuestions = buildFollowUpQuestions(parsedIntent, message);
  const cvPayload = mergeCvPayload(previousSession.cv_payload, buildCvPayload(payload));
  const hasCvContext = hasCvPayload(cvPayload);
  const matchResponse = filteredJobs.length > 0
    ? hasCvContext
      ? await matchCv({
          payload: cvPayload,
          jobs: filteredJobs,
          aiServiceUrl,
          requestTimeoutMs,
          logger,
        })
      : buildIntentOnlyMatchResponse(filteredJobs)
    : {
        success: true,
        source: 'no-filtered-jobs',
        recommendedJobs: [],
      };
  const rankedJobs = matchResponse.recommendedJobs || [];
  const jobDetails = buildJobDetails(filteredJobs, rankedJobs);
  const storableCvPayload = buildStorableCvPayload(cvPayload, matchResponse);

  const response = {
    success: true,
    conversation_id: conversationId,
    assistant_message: buildAssistantMessage(rankedJobs, parsedIntent),
    parsed_intent: parsedIntent,
    selected_sources: parsedIntent.job_sources || [],
    filters: {
      location: parsedIntent.location,
      work_mode: parsedIntent.work_mode,
      salary_min: parsedIntent.salary_min,
      salary_max: parsedIntent.salary_max,
      currency: parsedIntent.currency,
      level: parsedIntent.level,
      company_type: parsedIntent.company_type,
    },
    ranked_jobs: rankedJobs,
    job_details: jobDetails,
    follow_up_questions: followUpQuestions,
    source: matchResponse.source || 'job-assistant',
  };

  writeSession(sessionStore, conversationId, {
    parsed_intent: parsedIntent,
    cv_payload: storableCvPayload,
    selected_sources: response.selected_sources,
    filters: response.filters,
    ranked_jobs: rankedJobs,
    job_details: jobDetails,
    updated_at: new Date().toISOString(),
  });

  return response;
}

function buildCvPayload(payload = {}) {
  const cv = payload.cv || payload.cvPayload || {};
  const attachment = Array.isArray(payload.attachments) ? payload.attachments[0] : null;
  return {
    ...cv,
    fileName: cv.fileName || cv.filename || payload.fileName || payload.filename || (attachment && attachment.filename),
    fileBase64: cv.fileBase64 || cv.file_base64 || payload.fileBase64 || payload.file_base64 || (attachment && attachment.file_base64),
    skills: cv.skills || payload.skills,
  };
}

function readSession(sessionStore, conversationId) {
  if (!sessionStore || typeof sessionStore.get !== 'function' || !conversationId) {
    return {};
  }
  return sessionStore.get(conversationId) || {};
}

function writeSession(sessionStore, conversationId, session) {
  if (!sessionStore || typeof sessionStore.set !== 'function' || !conversationId) {
    return;
  }
  sessionStore.set(conversationId, session);
}

function mergeJobSearchIntent(previous = {}, current = {}) {
  const scalarFields = [
    'target_role',
    'location',
    'work_mode',
    'salary_min',
    'salary_max',
    'currency',
    'level',
    'company_type',
    'industry_domain',
  ];
  const merged = { ...current };

  for (const field of scalarFields) {
    merged[field] = hasValue(current[field]) ? current[field] : previous[field] ?? null;
  }

  merged.job_sources = pickCurrentOrPreviousArray(previous.job_sources, current.job_sources);
  merged.required_skills = mergeUniqueArrays(previous.required_skills, current.required_skills);
  merged.preferred_skills = mergeUniqueArrays(previous.preferred_skills, current.preferred_skills);
  merged.must_have_filters = mergeUniqueArrays(previous.must_have_filters, current.must_have_filters);
  merged.nice_to_have_filters = mergeUniqueArrays(previous.nice_to_have_filters, current.nice_to_have_filters);
  merged.excluded_keywords = mergeUniqueArrays(previous.excluded_keywords, current.excluded_keywords);

  return merged;
}

function mergeCvPayload(previous = {}, current = {}) {
  const merged = { ...previous };
  for (const [key, value] of Object.entries(current || {})) {
    if (Array.isArray(value)) {
      if (value.length > 0) merged[key] = value;
      continue;
    }
    if (hasValue(value)) merged[key] = value;
  }
  return merged;
}

function buildJobDetails(filteredJobs = [], rankedJobs = []) {
  const jobIndex = new Map();
  for (const job of filteredJobs) {
    for (const key of getJobKeys(job)) {
      jobIndex.set(key, job);
    }
  }

  return rankedJobs
    .map((rankedJob) => {
      const rankedJobId = getRankedJobId(rankedJob);
      const sourceJob = rankedJobId ? jobIndex.get(String(rankedJobId)) : null;
      const job = sourceJob || {};
      const jobId = firstValue(rankedJobId, job.id, job.job_id, job.jobId);
      const title = firstValue(rankedJob.jobTitle, rankedJob.title, job.title, job.name);

      return {
        job_id: jobId || null,
        title: title || null,
        company_name: firstValue(rankedJob.company, rankedJob.companyName, rankedJob.company_name, job.company, job.company_name) || null,
        source: firstValue(rankedJob.source, job.source) || null,
        location: firstValue(rankedJob.location, job.location) || null,
        salary: firstValue(rankedJob.salary, job.salary) || null,
        description: firstValue(job.description, job.description_text, rankedJob.description) || null,
        skills: toArray(firstValue(job.skills, job.required_skills, rankedJob.skills)),
        score: firstValue(rankedJob.score, rankedJob.overall_score, rankedJob.match_score) || 0,
        matched_skills: toArray(firstValue(rankedJob.matchedSkills, rankedJob.matched_skills)),
        missing_skills: toArray(firstValue(rankedJob.missingSkills, rankedJob.missing_required_skills, rankedJob.missing_skills)),
        recommendation_reason: firstValue(rankedJob.recommendationReason, rankedJob.recommendation_reason, rankedJob.reason) || null,
      };
    })
    .filter((detail) => detail.job_id || detail.title);
}

function buildStorableCvPayload(cvPayload = {}, matchResponse = {}) {
  const extractedSkills = toArray(matchResponse.extractedSkills || matchResponse.extracted_skills);
  const storable = {};
  const fileName = firstValue(cvPayload.fileName, cvPayload.filename);
  const skills = extractedSkills.length > 0 ? extractedSkills : toArray(cvPayload.skills);

  if (fileName) {
    storable.fileName = fileName;
  }
  if (skills.length > 0) {
    storable.skills = skills;
  }
  if (hasValue(cvPayload.title)) {
    storable.title = cvPayload.title;
  }
  if (hasValue(cvPayload.location)) {
    storable.location = cvPayload.location;
  }
  if (hasValue(cvPayload.totalYearsExperience)) {
    storable.totalYearsExperience = cvPayload.totalYearsExperience;
  }

  return storable;
}

function buildIntentOnlyMatchResponse(jobs = []) {
  const recommendedJobs = jobs
    .map((job) => ({
      jobId: job.id || job.jobId || job.job_id || null,
      jobTitle: job.title || 'Untitled job',
      company: job.company || job.company_name || null,
      salary: job.salary || null,
      score: Number.isFinite(Number(job.matchScore)) ? Number(job.matchScore) : 0,
      matchedSkills: [],
      missingSkills: [],
      recommendationReason: 'Filtered by your search intent. Attach a CV to rank this job by fit.',
    }))
    .sort((a, b) => b.score - a.score);

  return {
    success: true,
    source: 'intent-filter',
    recommendedJobs,
  };
}

function buildAssistantMessage(rankedJobs, intent) {
  const count = rankedJobs.length;
  const role = intent.target_role ? ` for ${intent.target_role}` : '';
  const location = intent.location ? ` in ${intent.location}` : '';

  if (count === 0) {
    return `I could not find matching jobs${role}${location}. Try relaxing salary, source, or location filters.`;
  }

  return `Found ${count} job${count === 1 ? '' : 's'}${role}${location}. I ranked them by CV fit and available filters.`;
}

function getJobKeys(job = {}) {
  return [job.id, job.jobId, job.job_id, job.external_id, job.url, job.source_url]
    .filter(hasValue)
    .map((key) => String(key));
}

function getRankedJobId(rankedJob = {}) {
  return firstValue(rankedJob.jobId, rankedJob.job_id, rankedJob.id, rankedJob.external_id, rankedJob.url, rankedJob.source_url);
}

function firstValue(...values) {
  return values.find(hasValue);
}

function pickCurrentOrPreviousArray(previousValue, currentValue) {
  const current = toArray(currentValue);
  if (current.length > 0) return [...new Set(current)];
  return [...new Set(toArray(previousValue))];
}

function mergeUniqueArrays(previousValue, currentValue) {
  return [...new Set([...toArray(previousValue), ...toArray(currentValue)])];
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(hasValue);
  if (hasValue(value)) return [value];
  return [];
}

function hasCvPayload(cvPayload = {}) {
  return Boolean(
    hasValue(cvPayload.fileBase64) ||
      hasValue(cvPayload.file_base64) ||
      hasValue(cvPayload.cvText) ||
      hasValue(cvPayload.text) ||
      toArray(cvPayload.skills).length > 0,
  );
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function buildFollowUpQuestions(intent, message) {
  if (!String(message || '').trim()) {
    return ['Bạn muốn tìm job vị trí nào, ở đâu và mức lương mong muốn là bao nhiêu?'];
  }

  const questions = [];
  if (!intent.target_role && intent.required_skills.length === 0) {
    questions.push('Bạn muốn tìm job theo vị trí hoặc kỹ năng nào?');
  }
  if (!intent.location) {
    questions.push('Bạn muốn ưu tiên địa điểm nào hoặc remote/hybrid?');
  }
  return questions;
}

function matchesSource(job, intent) {
  if (!intent.job_sources || intent.job_sources.length === 0) return true;
  if (!job.source) return false;
  return intent.job_sources.includes(normalizeText(job.source));
}

function matchesSalary(job, intent) {
  if (!intent.salary_min) return true;
  const salary = parseJobSalary(job.salary);
  if (!salary.salary_max) return true;
  if (intent.currency && salary.currency && intent.currency !== salary.currency) return true;
  return salary.salary_max >= intent.salary_min;
}

function matchesLocation(job, intent) {
  if (!intent.location) return true;
  return normalizeText(job.location).includes(normalizeText(intent.location));
}

function matchesWorkMode(job, intent) {
  if (!intent.work_mode) return true;
  const text = normalizeText(`${job.title || ''} ${job.location || ''} ${job.description || ''} ${job.type || ''}`);
  return text.includes(normalizeText(intent.work_mode));
}

function matchesRoleOrSkills(job, intent) {
  const terms = [...(intent.required_skills || [])];
  if (intent.target_role) terms.push(intent.target_role);
  if (terms.length === 0) return true;

  const haystack = normalizeText(`${job.title || ''} ${(job.skills || []).join(' ')} ${job.description || ''}`);
  return terms.some((term) => haystack.includes(normalizeText(term)));
}

function extractSalary(normalizedMessage) {
  const millionMatch = normalizedMessage.match(/(\d+(?:[.,]\d+)?)\s*(tr|trieu|million|m)\b/);
  if (millionMatch) {
    return {
      salary_min: Math.round(Number(millionMatch[1].replace(',', '.')) * 1000000),
      currency: 'VND',
    };
  }

  const usdMatch = normalizedMessage.match(/\$+\s*(\d+(?:[,.]\d+)?)/);
  if (usdMatch) {
    return {
      salary_min: Number(usdMatch[1].replace(/,/g, '')),
      currency: 'USD',
    };
  }

  return {
    salary_min: null,
    currency: null,
  };
}

function extractLocation(normalizedMessage) {
  if (/\b(hcm|ho chi minh|sai gon|saigon|tp hcm|tp ho chi minh)\b/.test(normalizedMessage)) {
    return 'ho chi minh';
  }
  if (/\b(ha noi|hanoi)\b/.test(normalizedMessage)) {
    return 'ha noi';
  }
  if (/\b(da nang|danang)\b/.test(normalizedMessage)) {
    return 'da nang';
  }
  return null;
}

function extractWorkMode(normalizedMessage) {
  if (normalizedMessage.includes('remote')) return 'remote';
  if (normalizedMessage.includes('hybrid')) return 'hybrid';
  if (normalizedMessage.includes('onsite') || normalizedMessage.includes('on site')) return 'onsite';
  return null;
}

function extractLevel(normalizedMessage) {
  if (normalizedMessage.includes('senior')) return 'senior';
  if (normalizedMessage.includes('junior')) return 'junior';
  if (normalizedMessage.includes('fresher')) return 'fresher';
  if (normalizedMessage.includes('intern')) return 'intern';
  if (normalizedMessage.includes('lead')) return 'lead';
  return null;
}

function extractCompanyType(normalizedMessage) {
  if (normalizedMessage.includes('product')) return 'product';
  if (normalizedMessage.includes('outsourcing')) return 'outsourcing';
  if (normalizedMessage.includes('startup')) return 'startup';
  return null;
}

function extractTargetRole(rawMessage, requiredSkills) {
  const afterFor = rawMessage.match(/\b(?:cho|for)\s+(.+)$/i);
  const phrase = afterFor ? afterFor[1] : rawMessage;
  const normalized = normalizeText(phrase);

  if (normalized.includes('backend')) {
    const prefix = requiredSkills.find((skill) => normalizeText(skill) !== 'fastapi') || '';
    return titleCase(`${prefix} Backend`.trim());
  }
  if (normalized.includes('frontend')) return 'Frontend Developer';
  if (normalized.includes('fullstack') || normalized.includes('full stack')) return 'Fullstack Developer';
  if (normalized.includes('data')) return 'Data Engineer';
  if (normalized.includes('mobile') || normalized.includes('flutter')) return 'Mobile Developer';
  return null;
}

function parseJobSalary(value = '') {
  const raw = String(value || '');
  const normalized = normalizeText(raw);
  const currency = normalized.includes('vnd') || normalized.includes('tr') ? 'VND' : raw.includes('$') ? 'USD' : null;
  const numbers = [...raw.matchAll(/\d[\d,.]*/g)]
    .map((match) => Number(match[0].replace(/,/g, '')))
    .filter((number) => Number.isFinite(number));

  if (normalized.includes('tr') && numbers.length > 0 && Math.max(...numbers) < 1000) {
    return {
      salary_min: Math.min(...numbers) * 1000000,
      salary_max: Math.max(...numbers) * 1000000,
      currency: 'VND',
    };
  }

  return {
    salary_min: numbers.length ? Math.min(...numbers) : null,
    salary_max: numbers.length ? Math.max(...numbers) : null,
    currency,
  };
}

function titleCase(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  filterJobsByIntent,
  handleJobAssistantChat,
  parseJobSearchIntent,
};
