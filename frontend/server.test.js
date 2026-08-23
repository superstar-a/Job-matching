const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { test } = require('node:test');

test('frontend serves the job assistant chat workspace', async () => {
  const port = 3301;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_PUBLIC_API_URL: 'http://localhost:4400',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForServer('http://127.0.0.1:' + port);
    const response = await fetch('http://127.0.0.1:' + port);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /id="tab-assistant" class="view-content active"/);
    assert.match(html, /\/api\/job-assistant\/chat/);
    assert.match(html, /id="assistantJobResults"/);
    assert.match(html, /id="assistantDetailPanel"/);
    assert.doesNotMatch(html, /id="tab-jobs"/);
    assert.doesNotMatch(html, /id="searchInput"/);
    assert.doesNotMatch(html, /switchTab\('jobs'/);
    assert.doesNotMatch(html, /\/api\/jobs/);
    assert.doesNotMatch(html, /function filterJobs/);
    assert.doesNotMatch(html, /function filterByTag/);
    assert.doesNotMatch(html, /function fetchJobsFromBackend/);
    assert.doesNotMatch(html, /assistantDefaultCvSkills/);

    const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
    assert.doesNotThrow(() => new Function(script));
  } finally {
    child.kill();
    await waitForExit(child);
  }
});

function waitForServer(url) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      fetch(url)
        .then(() => resolve())
        .catch((error) => {
          if (Date.now() - started > 5000) {
            reject(error);
            return;
          }
          setTimeout(ping, 50);
        });
    };
    ping();
  });
}

function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    child.once('exit', resolve);
  });
}
