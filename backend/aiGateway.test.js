const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  buildAiCvProfile,
  mapBackendJobToAiJob,
  mapAiRecommendationsToBackendResponse,
  recommendJobsViaAiService,
} = require('./aiGateway');

const samplePayload = {
  fileName: 'backend-cv.pdf',
  candidateName: 'Nguyen Van A',
  title: 'Python Backend Developer',
  location: 'Ho Chi Minh City',
  skills: ['Python', 'FastAPI', 'SQL', 'Git'],
  totalYearsExperience: 2,
};

const sampleJob = {
  id: 'job-3',
  title: 'AI & Data NLP Engineer (Python / FastAPI)',
  company: 'AI Automation Lab',
  location: 'Da Nang (Remote)',
  salary: '$2,000 - $3,500',
  type: 'Full-time',
  skills: ['Python', 'FastAPI', 'NLP', 'Docker'],
  description: 'Build NLP services with FastAPI.',
};

test('buildAiCvProfile maps frontend match payload into AI-service CV schema', () => {
  const cv = buildAiCvProfile(samplePayload);

  assert.equal(cv.candidate_name, 'Nguyen Van A');
  assert.equal(cv.title, 'Python Backend Developer');
  assert.equal(cv.location, 'Ho Chi Minh City');
  assert.deepEqual(cv.skills, ['Python', 'FastAPI', 'SQL', 'Git']);
  assert.equal(cv.total_years_experience, 2);
  assert.equal(cv.raw_text, null);
});

test('mapBackendJobToAiJob maps backend jobs into AI-service job schema', () => {
  const job = mapBackendJobToAiJob(sampleJob);

  assert.equal(job.source, 'backend_mock');
  assert.equal(job.external_id, 'job-3');
  assert.equal(job.title, sampleJob.title);
  assert.equal(job.company_name, 'AI Automation Lab');
  assert.equal(job.salary_min, 2000);
  assert.equal(job.salary_max, 3500);
  assert.equal(job.currency, 'USD');
  assert.equal(job.job_type, 'full_time');
  assert.deepEqual(job.required_skills, ['Python', 'FastAPI', 'NLP', 'Docker']);
  assert.equal(job.description_text, sampleJob.description);
});

test('recommendJobsViaAiService posts the expected payload and maps AI ranking response', async () => {
  const calls = [];
  const fetchImpl = async (requestUrl, options) => {
    calls.push({ requestUrl, options });
    return {
      ok: true,
      status: 200,
      json: async () => [
        {
          job_id: 'job-3',
          title: sampleJob.title,
          company_name: sampleJob.company,
          overall_score: 87.6,
          matched_skills: ['Python', 'FastAPI'],
          missing_required_skills: ['Docker'],
          recommendation_reason: 'Strong Python backend fit with a small Docker gap.',
        },
      ],
    };
  };

  const response = await recommendJobsViaAiService({
    aiServiceUrl: 'http://ai-service:8000',
    cvPayload: samplePayload,
    jobs: [sampleJob],
    fetchImpl,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].requestUrl, 'http://ai-service:8000/api/recommend-jobs');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');

  const postedBody = JSON.parse(calls[0].options.body);
  assert.deepEqual(postedBody.cv.skills, samplePayload.skills);
  assert.equal(postedBody.jobs[0].external_id, 'job-3');

  assert.equal(response.success, true);
  assert.equal(response.cvName, 'backend-cv.pdf');
  assert.equal(response.overallCompatibility, 88);
  assert.deepEqual(response.extractedSkills, samplePayload.skills);
  assert.deepEqual(response.recommendedJobs[0], {
    jobId: 'job-3',
    jobTitle: sampleJob.title,
    company: sampleJob.company,
    salary: sampleJob.salary,
    score: 88,
    matchedSkills: ['Python', 'FastAPI'],
    missingSkills: ['Docker'],
    recommendationReason: 'Strong Python backend fit with a small Docker gap.',
  });
});

test('recommendJobsViaAiService parses an uploaded CV before recommending jobs', async () => {
  const calls = [];
  const fetchImpl = async (requestUrl, options) => {
    calls.push({ requestUrl, options });

    if (requestUrl.endsWith('/api/parse-cv')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidate_name: 'Nguyen Van A',
          title: 'Parsed Python Developer',
          summary: null,
          email: null,
          phone: null,
          location: 'Ho Chi Minh City',
          skills: ['Python', 'FastAPI', 'Docker'],
          languages: [],
          total_years_experience: 3,
          experiences: [],
          education: [],
          projects: [],
          certificates: [],
          raw_text: null,
        }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => [
        {
          job_id: 'job-3',
          title: sampleJob.title,
          company_name: sampleJob.company,
          overall_score: 92.2,
          matched_skills: ['Python', 'FastAPI', 'Docker'],
          missing_required_skills: [],
        },
      ],
    };
  };

  const response = await recommendJobsViaAiService({
    aiServiceUrl: 'http://ai-service:8000',
    cvPayload: {
      fileName: 'uploaded-cv.pdf',
      fileBase64: 'YmFzZTY0LWN2',
    },
    jobs: [sampleJob],
    fetchImpl,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].requestUrl, 'http://ai-service:8000/api/parse-cv');
  assert.equal(calls[1].requestUrl, 'http://ai-service:8000/api/recommend-jobs');

  const parseBody = JSON.parse(calls[0].options.body);
  assert.deepEqual(parseBody, {
    filename: 'uploaded-cv.pdf',
    file_base64: 'YmFzZTY0LWN2',
    include_raw_text: false,
    mask_pii: true,
  });

  const recommendBody = JSON.parse(calls[1].options.body);
  assert.equal(recommendBody.cv.title, 'Parsed Python Developer');
  assert.deepEqual(recommendBody.cv.skills, ['Python', 'FastAPI', 'Docker']);
  assert.equal(response.cvName, 'uploaded-cv.pdf');
  assert.deepEqual(response.extractedSkills, ['Python', 'FastAPI', 'Docker']);
  assert.equal(response.overallCompatibility, 92);
});

test('recommendJobsViaAiService attaches an abort signal to AI-service requests', async () => {
  const calls = [];
  const fetchImpl = async (requestUrl, options) => {
    calls.push({ requestUrl, options });
    return {
      ok: true,
      status: 200,
      json: async () => [],
    };
  };

  await recommendJobsViaAiService({
    aiServiceUrl: 'http://ai-service:8000',
    cvPayload: samplePayload,
    jobs: [sampleJob],
    fetchImpl,
    requestTimeoutMs: 5000,
  });

  assert.equal(calls.length, 1);
  assert.equal(typeof calls[0].options.signal.aborted, 'boolean');
});

test('mapAiRecommendationsToBackendResponse falls back to original job metadata', () => {
  const response = mapAiRecommendationsToBackendResponse({
    cvPayload: samplePayload,
    jobs: [sampleJob],
    aiRecommendations: [
      {
        job_id: 'job-3',
        title: 'AI changed title',
        company_name: 'AI changed company',
        overall_score: 81.2,
        matched_skills: ['Python'],
        missing_required_skills: ['Docker'],
      },
    ],
  });

  assert.equal(response.recommendedJobs[0].jobTitle, sampleJob.title);
  assert.equal(response.recommendedJobs[0].company, sampleJob.company);
  assert.equal(response.recommendedJobs[0].salary, sampleJob.salary);
});
