const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  filterJobsByIntent,
  handleJobAssistantChat,
  parseJobSearchIntent,
} = require('./jobAssistant');

const sampleJobs = [
  {
    id: 'job-topcv-python',
    source: 'topcv',
    title: 'Python Backend Developer',
    company: 'Product Lab',
    location: 'TP. Ho Chi Minh (Remote)',
    salary: '25,000,000 - 35,000,000 VND',
    skills: ['Python', 'FastAPI', 'Docker'],
    description: 'Build backend APIs with Python and FastAPI.',
  },
  {
    id: 'job-itviec-python',
    source: 'itviec',
    title: 'Python Backend Developer',
    company: 'IT Outsourcing Co',
    location: 'TP. Ho Chi Minh',
    salary: '30,000,000 VND',
    skills: ['Python', 'Django'],
    description: 'Build Django services.',
  },
  {
    id: 'job-topcv-low-salary',
    source: 'topcv',
    title: 'Python Intern',
    company: 'Starter Co',
    location: 'TP. Ho Chi Minh',
    salary: '8,000,000 - 12,000,000 VND',
    skills: ['Python'],
    description: 'Internship role.',
  },
  {
    id: 'job-topcv-flutter',
    source: 'topcv',
    title: 'Flutter Developer',
    company: 'Mobile Lab',
    location: 'TP. Ho Chi Minh',
    salary: '28,000,000 VND',
    skills: ['Flutter', 'Dart'],
    description: 'Build mobile apps.',
  },
];

test('parseJobSearchIntent extracts source, salary, location, work mode, and role from Vietnamese chat', () => {
  const intent = parseJobSearchIntent('Tìm job TopCV lương 20tr ở HCM remote cho Python backend');

  assert.deepEqual(intent.job_sources, ['topcv']);
  assert.equal(intent.salary_min, 20000000);
  assert.equal(intent.currency, 'VND');
  assert.equal(intent.location, 'ho chi minh');
  assert.equal(intent.work_mode, 'remote');
  assert.equal(intent.target_role, 'Python Backend');
  assert.deepEqual(intent.required_skills, ['Python']);
});

test('filterJobsByIntent keeps jobs matching source, salary, location, and role intent', () => {
  const intent = {
    job_sources: ['topcv'],
    salary_min: 20000000,
    currency: 'VND',
    location: 'ho chi minh',
    work_mode: 'remote',
    target_role: 'Python Backend',
    required_skills: ['Python'],
  };

  const filtered = filterJobsByIntent(sampleJobs, intent);

  assert.deepEqual(filtered.map((job) => job.id), ['job-topcv-python']);
});

test('filterJobsByIntent rejects jobs without source when source is requested', () => {
  const filtered = filterJobsByIntent(
    [
      {
        id: 'job-missing-source',
        title: 'Python Backend Developer',
        company: 'Unknown Source Co',
        location: 'TP. Ho Chi Minh (Remote)',
        salary: '30,000,000 VND',
        skills: ['Python', 'FastAPI'],
        description: 'Build backend APIs.',
      },
      sampleJobs[0],
    ],
    {
      job_sources: ['topcv'],
      location: 'ho chi minh',
      target_role: 'Python Backend',
      required_skills: ['Python'],
    },
  );

  assert.deepEqual(filtered.map((job) => job.id), ['job-topcv-python']);
});

test('handleJobAssistantChat returns chat response with parsed intent and ranked jobs', async () => {
  const response = await handleJobAssistantChat({
    payload: {
      conversation_id: 'conversation-1',
      message: 'Tìm job TopCV lương 20tr ở HCM remote cho Python backend',
      cv: {
        fileName: 'candidate-cv.pdf',
        skills: ['Python', 'FastAPI'],
      },
    },
    jobs: sampleJobs,
    matchCv: async ({ jobs }) => ({
      success: true,
      source: 'test-match',
      recommendedJobs: jobs.map((job) => ({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        salary: job.salary,
        score: 91,
        matchedSkills: ['Python', 'FastAPI'],
        missingSkills: ['Docker'],
        recommendationReason: 'Strong backend match with one Docker gap.',
      })),
    }),
  });

  assert.equal(response.success, true);
  assert.equal(response.conversation_id, 'conversation-1');
  assert.equal(response.parsed_intent.target_role, 'Python Backend');
  assert.deepEqual(response.selected_sources, ['topcv']);
  assert.equal(response.ranked_jobs.length, 1);
  assert.equal(response.ranked_jobs[0].jobId, 'job-topcv-python');
  assert.match(response.assistant_message, /1 job/i);
  assert.deepEqual(response.follow_up_questions, []);
});

test('handleJobAssistantChat ranks filtered jobs by intent when no CV is provided', async () => {
  let matchCalls = 0;

  const response = await handleJobAssistantChat({
    payload: {
      conversation_id: 'conversation-no-cv',
      message: 'Tìm job TopCV lương 20tr ở HCM remote cho Python backend',
    },
    jobs: sampleJobs,
    matchCv: async () => {
      matchCalls += 1;
      throw new Error('CV matcher should not be called without CV context');
    },
  });

  assert.equal(matchCalls, 0);
  assert.equal(response.source, 'intent-filter');
  assert.equal(response.ranked_jobs[0].jobId, 'job-topcv-python');
  assert.deepEqual(response.ranked_jobs[0].matchedSkills, []);
  assert.match(response.ranked_jobs[0].recommendationReason, /Attach a CV/);
});

test('handleJobAssistantChat preserves prior intent and CV when user refines filters', async () => {
  const sessionStore = new Map();
  const calls = [];

  const firstResponse = await handleJobAssistantChat({
    sessionStore,
    payload: {
      conversation_id: 'conversation-keep-context',
      message: 'Tìm job TopCV lương 20tr ở HCM cho Python backend',
      cv: {
        fileName: 'candidate-cv.pdf',
        skills: ['Python', 'FastAPI'],
      },
    },
    jobs: sampleJobs,
    matchCv: async ({ payload, jobs }) => {
      calls.push({ payload, jobs });
      return {
        success: true,
        source: 'test-match',
        recommendedJobs: jobs.map((job) => ({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          salary: job.salary,
          score: 90,
        })),
      };
    },
  });

  const refinedResponse = await handleJobAssistantChat({
    sessionStore,
    payload: {
      conversation_id: firstResponse.conversation_id,
      message: 'lọc thêm remote',
    },
    jobs: sampleJobs,
    matchCv: async ({ payload, jobs }) => {
      calls.push({ payload, jobs });
      return {
        success: true,
        source: 'test-match',
        recommendedJobs: jobs.map((job) => ({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          salary: job.salary,
          score: 91,
        })),
      };
    },
  });

  assert.equal(refinedResponse.parsed_intent.target_role, 'Python Backend');
  assert.equal(refinedResponse.parsed_intent.work_mode, 'remote');
  assert.deepEqual(refinedResponse.parsed_intent.job_sources, ['topcv']);
  assert.equal(calls[1].payload.fileName, 'candidate-cv.pdf');
  assert.deepEqual(calls[1].payload.skills, ['Python', 'FastAPI']);
  assert.deepEqual(calls[1].jobs.map((job) => job.id), ['job-topcv-python']);
  assert.deepEqual(refinedResponse.follow_up_questions, []);
});

test('handleJobAssistantChat stores parsed CV profile without retaining raw file content', async () => {
  const sessionStore = new Map();
  const calls = [];

  const firstResponse = await handleJobAssistantChat({
    sessionStore,
    payload: {
      conversation_id: 'conversation-sanitized-cv',
      message: 'Tìm job TopCV lương 20tr ở HCM cho Python backend',
      cv: {
        fileName: 'candidate-cv.pdf',
        fileBase64: 'raw-base64-cv',
      },
    },
    jobs: sampleJobs,
    matchCv: async ({ payload, jobs }) => {
      calls.push({ payload, jobs });
      return {
        success: true,
        source: 'test-match',
        extractedSkills: ['Python', 'FastAPI'],
        recommendedJobs: jobs.map((job) => ({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          salary: job.salary,
          score: 91,
        })),
      };
    },
  });

  const storedSession = sessionStore.get(firstResponse.conversation_id);
  assert.equal(storedSession.cv_payload.fileName, 'candidate-cv.pdf');
  assert.equal(storedSession.cv_payload.fileBase64, undefined);
  assert.deepEqual(storedSession.cv_payload.skills, ['Python', 'FastAPI']);

  await handleJobAssistantChat({
    sessionStore,
    payload: {
      conversation_id: firstResponse.conversation_id,
      message: 'lọc thêm remote',
    },
    jobs: sampleJobs,
    matchCv: async ({ payload, jobs }) => {
      calls.push({ payload, jobs });
      return {
        success: true,
        source: 'test-match',
        recommendedJobs: jobs.map((job) => ({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          salary: job.salary,
          score: 91,
        })),
      };
    },
  });

  assert.equal(calls[1].payload.fileBase64, undefined);
  assert.deepEqual(calls[1].payload.skills, ['Python', 'FastAPI']);
});

test('handleJobAssistantChat returns detail records for ranked jobs', async () => {
  const response = await handleJobAssistantChat({
    payload: {
      conversation_id: 'conversation-details',
      message: 'Tìm job TopCV lương 20tr ở HCM remote cho Python backend',
      cv: {
        skills: ['Python', 'FastAPI'],
      },
    },
    jobs: sampleJobs,
    matchCv: async ({ jobs }) => ({
      success: true,
      source: 'test-match',
      recommendedJobs: jobs.map((job) => ({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        salary: job.salary,
        score: 91,
        matchedSkills: ['Python', 'FastAPI'],
        missingSkills: ['Docker'],
        recommendationReason: 'Strong backend match with one Docker gap.',
      })),
    }),
  });

  assert.equal(response.job_details.length, 1);
  assert.equal(response.job_details[0].job_id, 'job-topcv-python');
  assert.equal(response.job_details[0].title, 'Python Backend Developer');
  assert.deepEqual(response.job_details[0].matched_skills, ['Python', 'FastAPI']);
  assert.deepEqual(response.job_details[0].missing_skills, ['Docker']);
  assert.match(response.job_details[0].recommendation_reason, /Docker gap/);
});
