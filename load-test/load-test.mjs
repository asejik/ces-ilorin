#!/usr/bin/env node

/**
 * Citizens Elementary School (CES) Platform
 * Milestone M6: 100-Concurrent-User Load Testing Suite
 *
 * Simulates 100 concurrent users against key endpoints.
 * Target can be specified via CLI argument (e.g. node load-test.mjs http://localhost:3000)
 */

import http from 'node:http';
import https from 'node:https';
import { performance } from 'node:perf_hooks';

const TARGET_BASE = process.argv[2] || process.env.LOAD_TEST_TARGET || 'http://localhost:3000';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
const DURATION_SEC = parseInt(process.env.DURATION || '15', 10);

console.log('='.repeat(70));
console.log('  CITIZENS ELEMENTARY SCHOOL (CES) — CONCURRENT LOAD TEST');
console.log('='.repeat(70));
console.log(`Target URL  : ${TARGET_BASE}`);
console.log(`Concurrency : ${CONCURRENCY} concurrent virtual users`);
console.log(`Duration    : ${DURATION_SEC} seconds per endpoint`);
console.log(`Timestamp   : ${new Date().toISOString()}`);
console.log('='.repeat(70));

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: CONCURRENCY + 20 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: CONCURRENCY + 20 });

function calculatePercentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

async function runScenario(scenarioName, path) {
  console.log(`\n▶ Starting Scenario: ${scenarioName} (${path})`);
  const targetUrl = new URL(path, TARGET_BASE);
  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? https : http;
  const agent = isHttps ? httpsAgent : httpAgent;

  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  const statusCodes = {};

  const startTime = performance.now();
  const endTime = startTime + DURATION_SEC * 1000;
  let activeWorkers = 0;

  async function worker() {
    activeWorkers++;
    while (performance.now() < endTime) {
      const reqStart = performance.now();
      try {
        await new Promise((resolve) => {
          const req = client.get(
            targetUrl,
            {
              agent,
              headers: {
                'User-Agent': 'CES-LoadTest/1.0',
                Accept: '*/*',
              },
              timeout: 10000,
            },
            (res) => {
              res.resume(); // consume response body
              res.on('end', () => {
                const reqEnd = performance.now();
                const latency = reqEnd - reqStart;
                latencies.push(latency);
                statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;
                if (res.statusCode >= 200 && res.statusCode < 400) {
                  successCount++;
                } else {
                  errorCount++;
                }
                resolve();
              });
            }
          );

          req.on('error', (err) => {
            errorCount++;
            statusCodes['ERR'] = (statusCodes['ERR'] || 0) + 1;
            resolve();
          });

          req.on('timeout', () => {
            req.destroy();
            errorCount++;
            statusCodes['TIMEOUT'] = (statusCodes['TIMEOUT'] || 0) + 1;
            resolve();
          });
        });
      } catch {
        errorCount++;
      }
    }
    activeWorkers--;
  }

  // Launch CONCURRENCY concurrent worker loops
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  const totalDurationSec = (performance.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const totalRequests = successCount + errorCount;
  const rps = (totalRequests / totalDurationSec).toFixed(1);
  const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1) : 0;
  const p50 = calculatePercentile(latencies, 50).toFixed(1);
  const p90 = calculatePercentile(latencies, 90).toFixed(1);
  const p95 = calculatePercentile(latencies, 95).toFixed(1);
  const p99 = calculatePercentile(latencies, 99).toFixed(1);
  const minLatency = latencies.length > 0 ? latencies[0].toFixed(1) : 0;
  const maxLatency = latencies.length > 0 ? latencies[latencies.length - 1].toFixed(1) : 0;

  console.log(`\n--- Results for: ${scenarioName} ---`);
  console.log(`Total Requests  : ${totalRequests} requests in ${totalDurationSec.toFixed(1)}s`);
  console.log(`Throughput      : ${rps} req/sec`);
  console.log(`Success / Error : ${successCount} OK (${((successCount / Math.max(1, totalRequests)) * 100).toFixed(1)}%) | ${errorCount} Errors`);
  console.log(`Status Breakdown: ${JSON.stringify(statusCodes)}`);
  console.log(`Latency (ms)    : Min: ${minLatency}ms | Avg: ${avgLatency}ms | Max: ${maxLatency}ms`);
  console.log(`Percentiles     : p50: ${p50}ms | p90: ${p90}ms | p95: ${p95}ms | p99: ${p99}ms`);

  const p95Passed = parseFloat(p95) < 1200;
  const errorRatePassed = errorCount === 0;

  console.log(`Verdict         : ${p95Passed && errorRatePassed ? '✅ PASS' : '❌ FAIL'} (p95 < 1200ms: ${p95Passed}, 0 errors: ${errorRatePassed})`);

  return {
    scenario: scenarioName,
    totalRequests,
    rps,
    p95,
    errorCount,
    passed: p95Passed && errorRatePassed,
  };
}

async function main() {
  const results = [];

  // Scenario 1: Health API baseline
  results.push(await runScenario('Health Check Endpoint', '/api/health'));

  // Scenario 2: Heavy Admin Broadsheet Roster Page
  results.push(await runScenario('Admin Broadsheet Roster Page', '/admin/broadsheet'));

  console.log('\n' + '='.repeat(70));
  console.log('  LOAD TEST SUMMARY');
  console.log('='.repeat(70));
  let allPassed = true;
  for (const r of results) {
    console.log(`• ${r.scenario.padEnd(30)}: ${r.totalRequests} reqs | ${r.rps} req/s | p95: ${r.p95}ms | ${r.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (!r.passed) allPassed = false;
  }
  console.log('='.repeat(70));
  console.log(`OVERALL STATUS: ${allPassed ? '✅ ALL LOAD SCENARIOS PASSED' : '❌ ONE OR MORE SCENARIOS FAILED'}\n`);

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
