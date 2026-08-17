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
} = {}) {
  const message = payload.message || '';
  const parsedIntent = payload.parsed_intent || parseJobSearchIntent(message);
  const filteredJobs = filterJobsByIntent(jobs, parsedIntent);
  const followUpQuestions = buildFollowUpQuestions(parsedIntent, message);
  const cvPayload = buildCvPayload(payload);
  const matchResponse = filteredJobs.length > 0
    ? await matchCv({
        payload: cvPayload,
        jobs: filteredJobs,
        aiServiceUrl,
        requestTimeoutMs,
        logger,
      })
    : {
        success: true,
        source: 'no-filtered-jobs',
        recommendedJobs: [],
      };
  const rankedJobs = matchResponse.recommendedJobs || [];

  return {
    success: true,
    conversation_id: payload.conversation_id || payload.conversationId || randomUUID(),
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
    follow_up_questions: followUpQuestions,
    source: matchResponse.source || 'job-assistant',
  };
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

function buildAssistantMessage(rankedJobs, intent) {
  const count = rankedJobs.length;
  const role = intent.target_role ? ` for ${intent.target_role}` : '';
  const location = intent.location ? ` in ${intent.location}` : '';

  if (count === 0) {
    return `I could not find matching jobs${role}${location}. Try relaxing salary, source, or location filters.`;
  }

  return `Found ${count} job${count === 1 ? '' : 's'}${role}${location}. I ranked them by CV fit and available filters.`;
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
  if (!intent.job_sources || intent.job_sources.length === 0 || !job.source) return true;
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
