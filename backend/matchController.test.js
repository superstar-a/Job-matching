const assert = require('node:assert/strict');
const { test } = require('node:test');

const { matchCvPayload } = require('./matchController');

const sampleJob = {
  id: 'job-3',
  title: 'AI & Data NLP Engineer (Python / FastAPI)',
  company: 'AI Automation Lab',
  salary: '$2,000 - $3,500',
  skills: ['Python', 'FastAPI', 'Docker'],
};

test('matchCvPayload returns the AI-service response when matching succeeds', async () => {
  const response = await matchCvPayload({
    payload: { fileName: 'cv.pdf', skills: ['Python'] },
    jobs: [sampleJob],
    recommendJobs: async () => ({
      success: true,
      cvName: 'cv.pdf',
      extractedSkills: ['Python'],
      overallCompatibility: 91,
      recommendedJobs: [
        {
          jobId: 'job-3',
          jobTitle: sampleJob.title,
          company: sampleJob.company,
          salary: sampleJob.salary,
          score: 91,
          matchedSkills: ['Python'],
          missingSkills: ['Docker'],
        },
      ],
      source: 'ai-service',
    }),
  });

  assert.equal(response.source, 'ai-service');
  assert.equal(response.recommendedJobs[0].jobId, 'job-3');
});

test('matchCvPayload falls back locally and logs no raw CV payload when AI-service fails', async () => {
  const logs = [];

  const response = await matchCvPayload({
    payload: {
      fileName: 'private-cv.pdf',
      fileBase64: 'sensitive-base64-content',
      skills: ['Python'],
    },
    jobs: [sampleJob],
    recommendJobs: async () => {
      throw new Error('AI-service unavailable');
    },
    logger: {
      warn: (entry) => logs.push(entry),
    },
  });

  assert.equal(response.success, true);
  assert.equal(response.source, 'local-fallback');
  assert.equal(response.cvName, 'private-cv.pdf');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].event, 'ai_match_fallback');
  assert.equal(logs[0].endpoint, '/api/match');
  assert.equal(logs[0].status, 'fallback');
  assert.equal(logs[0].error_code, 'AI_SERVICE_UNAVAILABLE');
  assert.equal(typeof logs[0].request_id, 'string');
  assert.equal(typeof logs[0].duration_ms, 'number');
  assert.equal(JSON.stringify(logs[0]).includes('sensitive-base64-content'), false);
});
