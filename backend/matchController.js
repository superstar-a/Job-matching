const {
  DEFAULT_AI_SERVICE_URL,
  DEFAULT_AI_SERVICE_TIMEOUT_MS,
  buildLocalFallbackMatchResponse,
  recommendJobsViaAiService,
} = require('./aiGateway');
const { randomUUID } = require('crypto');

async function matchCvPayload({
  payload = {},
  jobs = [],
  aiServiceUrl = DEFAULT_AI_SERVICE_URL,
  requestTimeoutMs = DEFAULT_AI_SERVICE_TIMEOUT_MS,
  recommendJobs = recommendJobsViaAiService,
  logger = console,
} = {}) {
  const startedAt = Date.now();
  const requestId = payload.requestId || payload.request_id || randomUUID();

  try {
    return await recommendJobs({
      aiServiceUrl,
      cvPayload: payload,
      jobs,
      requestTimeoutMs,
    });
  } catch (error) {
    logger.warn({
      level: 'warn',
      event: 'ai_match_fallback',
      endpoint: '/api/match',
      request_id: requestId,
      duration_ms: Date.now() - startedAt,
      status: 'fallback',
      error_code: 'AI_SERVICE_UNAVAILABLE',
      message: error.message,
    });

    return buildLocalFallbackMatchResponse({
      cvPayload: payload,
      jobs,
    });
  }
}

module.exports = {
  matchCvPayload,
};
