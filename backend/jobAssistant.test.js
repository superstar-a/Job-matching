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
