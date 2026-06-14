import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Thresholds
export const options = {
  vus: 100,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    check_failure_rate: ['rate<0.05'],
  },
};

// Custom metrics
const apiErrorRate = new Rate('api_errors');
const apiDuration = new Trend('api_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-test-token';
const TENANT_ID = __ENV.TENANT_ID || 'test-tenant-id';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'x-tenant-id': TENANT_ID,
  };

  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'status is 200': (r) => r.status === 200,
    });
    apiDuration.add(res.timings.duration);
    apiErrorRate.add(res.status !== 200);
  });

  group('Assessment Flow', () => {
    // Start assessment session
    const startRes = http.post(
      `${BASE_URL}/api/assessments/sessions/start`,
      JSON.stringify({
        configId: 'test-config-id',
      }),
      { headers }
    );

    check(startRes, {
      'start session status is 200': (r) => r.status === 200,
      'session has ID': (r) => r.json('data.sessionId') !== undefined,
    });

    apiDuration.add(startRes.timings.duration);
    apiErrorRate.add(startRes.status !== 200);

    if (startRes.status === 200) {
      const sessionId = startRes.json('data.sessionId');
      sleep(1);

      // Get session
      const getRes = http.get(
        `${BASE_URL}/api/assessments/sessions/${sessionId}`,
        { headers }
      );

      check(getRes, {
        'get session status is 200': (r) => r.status === 200,
      });

      apiDuration.add(getRes.timings.duration);
      apiErrorRate.add(getRes.status !== 200);

      sleep(1);

      // Submit answers
      const submitRes = http.post(
        `${BASE_URL}/api/assessments/sessions/${sessionId}/submit`,
        JSON.stringify({
          answers: [
            {
              questionId: 'q1',
              selectedOptionId: 'opt3',
              timeTakenSec: 30,
            },
          ],
          metadata: {
            totalTimeTakenSec: 120,
            answeredCount: 1,
            skippedCount: 0,
          },
        }),
        { headers }
      );

      check(submitRes, {
        'submit status is 200': (r) => r.status === 200,
      });

      apiDuration.add(submitRes.timings.duration);
      apiErrorRate.add(submitRes.status !== 200);
    }
  });

  group('Analytics Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/analytics/dashboard`, { headers });

    check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'has summary data': (r) => r.json('data.summary') !== undefined,
    });

    apiDuration.add(res.timings.duration);
    apiErrorRate.add(res.status !== 200);
  });

  group('Reports API', () => {
    const listRes = http.get(`${BASE_URL}/api/reports/user/list`, { headers });

    check(listRes, {
      'list reports status is 200': (r) => r.status === 200,
      'returns array': (r) => Array.isArray(r.json('data')),
    });

    apiDuration.add(listRes.timings.duration);
    apiErrorRate.add(listRes.status !== 200);
  });

  sleep(Math.random() * 3);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const summary = [];
  summary.push('');
  summary.push('=== Test Summary ===');
  summary.push(`Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  summary.push(`Total Requests: ${data.metrics.http_reqs.value || 0}`);
  summary.push(`Request Errors: ${data.metrics.http_req_failed ? (data.metrics.http_req_failed.value * 100).toFixed(2) + '%' : '0%'}`);
  summary.push(`P95 Duration: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p95.toFixed(0) + 'ms' : 'N/A'}`);
  summary.push(`P99 Duration: ${data.metrics.http_req_duration ? data.metrics.http_req_duration.values.p99.toFixed(0) + 'ms' : 'N/A'}`);
  summary.push('');

  return summary.join('\n');
}
