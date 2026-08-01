"use strict";

const DEFAULT_RETRY = Object.freeze({
  maxAttempts: 3,
  initialDelayMs: 1_000,
  factor: 2,
  maxDelayMs: 30_000,
});

const FRESHNESS_STATUSES = new Set(["fresh", "stale", "lag-prone", "unknown"]);
const SUMMARY_FIELDS = Object.freeze([
  "itemCount",
  "addedCount",
  "updatedCount",
  "removedCount",
  "skippedCount",
]);
const JOB_NAME_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/;
const ERROR_CODE_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;

class RefreshJobError extends Error {
  constructor(jobName, failure, cause) {
    super(`Refresh job "${jobName}" failed after ${failure.attempts} attempt(s).`, { cause });
    this.name = "RefreshJobError";
    this.code = "REFRESH_JOB_FAILED";
    this.jobName = jobName;
    this.failure = failure;
  }
}

function createRefreshScheduler(options = {}) {
  const allowlist = normalizeAllowlist(options.allowlist);
  const clock = normalizeClock(options.clock);
  const sleep = typeof options.sleep === "function" ? options.sleep : defaultSleep;
  const setIntervalFn = typeof options.setInterval === "function" ? options.setInterval : setInterval;
  const clearIntervalFn = typeof options.clearInterval === "function" ? options.clearInterval : clearInterval;
  const onFailure = typeof options.onFailure === "function" ? options.onFailure : null;
  const defaultRetry = normalizeRetry(options.retry, DEFAULT_RETRY);
  const defaultMaxAgeHours = normalizeMaxAgeHours(options.maxAgeHours, 24);
  const jobs = new Map();

  function register(jobName, definition = {}) {
    assertJobName(jobName);
    if (!allowlist.has(jobName)) {
      throw new Error(`Job "${jobName}" is not in the scheduler allowlist.`);
    }
    if (jobs.has(jobName)) {
      throw new Error(`Job "${jobName}" is already registered.`);
    }

    const adapter = definition.adapter || definition.run;
    if (typeof adapter !== "function") {
      throw new TypeError(`Job "${jobName}" requires an adapter function.`);
    }

    const intervalMs = normalizeIntervalMs(definition.intervalMs);
    const state = {
      adapter,
      fallbackProvenance: definition.provenance || null,
      inFlight: null,
      intervalMs,
      maxAgeHours: normalizeMaxAgeHours(definition.maxAgeHours, defaultMaxAgeHours),
      name: jobName,
      nextRunAt: null,
      retry: normalizeRetry(definition.retry, defaultRetry),
      status: "idle",
      timer: null,
      totals: {
        runs: 0,
        successes: 0,
        failures: 0,
        attempts: 0,
        retries: 0,
        overlapsPrevented: 0,
      },
      lastStartedAt: null,
      lastCompletedAt: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastResult: null,
      lastFailure: null,
    };

    jobs.set(jobName, state);
    return getStatus(jobName);
  }

  function runOnce(jobName) {
    const job = requireJob(jobs, jobName);
    if (job.inFlight) {
      job.totals.overlapsPrevented += 1;
      return job.inFlight;
    }

    const task = executeJob(job).finally(() => {
      if (job.inFlight === task) job.inFlight = null;
    });
    job.inFlight = task;
    return task;
  }

  async function executeJob(job) {
    const started = readClock(clock);
    const startedAt = started.toISOString();
    job.status = "running";
    job.totals.runs += 1;
    job.lastStartedAt = startedAt;

    let attempts = 0;
    let lastError = null;

    while (attempts < job.retry.maxAttempts) {
      attempts += 1;
      job.totals.attempts += 1;

      try {
        const adapterResult = await job.adapter({
          attempt: attempts,
          jobName: job.name,
          startedAt,
        });
        const completed = readClock(clock);
        const envelope = createSuccessEnvelope({
          adapterResult,
          attempts,
          completed,
          fallbackProvenance: job.fallbackProvenance,
          jobName: job.name,
          maxAgeHours: job.maxAgeHours,
          started,
        });

        job.status = "succeeded";
        job.totals.successes += 1;
        job.lastCompletedAt = envelope.completedAt;
        job.lastSuccessAt = envelope.completedAt;
        job.lastResult = toStatusResult(envelope);
        return envelope;
      } catch (error) {
        lastError = error;
      }

      if (attempts < job.retry.maxAttempts) {
        const delayMs = calculateRetryDelay(job.retry, attempts);
        job.totals.retries += 1;
        try {
          await sleep(delayMs, {
            attempt: attempts,
            jobName: job.name,
            nextAttempt: attempts + 1,
          });
        } catch (error) {
          lastError = error;
          break;
        }
      }
    }

    const completed = readClock(clock);
    const failure = createFailureRecord(job.name, lastError, attempts, completed);
    job.status = "failed";
    job.totals.failures += 1;
    job.lastCompletedAt = failure.completedAt;
    job.lastFailureAt = failure.completedAt;
    job.lastFailure = failure;

    const refreshError = new RefreshJobError(job.name, failure, lastError);
    notifyFailure(onFailure, refreshError, getStatus(job.name));
    throw refreshError;
  }

  function start(jobName) {
    if (jobName !== undefined && jobName !== null) {
      startJob(requireJob(jobs, jobName));
      return getStatus(jobName);
    }

    for (const job of jobs.values()) {
      if (job.intervalMs !== null) startJob(job);
    }
    return getStatus();
  }

  function startJob(job) {
    if (job.intervalMs === null) {
      throw new Error(`Job "${job.name}" does not define intervalMs.`);
    }
    if (job.timer !== null) return;

    job.nextRunAt = addMilliseconds(readClock(clock), job.intervalMs).toISOString();
    job.timer = setIntervalFn(() => {
      job.nextRunAt = addMilliseconds(readClock(clock), job.intervalMs).toISOString();
      runOnce(job.name).catch(() => {
        // executeJob already records the failure and notifies onFailure.
      });
    }, job.intervalMs);
  }

  function stop(jobName) {
    if (jobName !== undefined && jobName !== null) {
      stopJob(requireJob(jobs, jobName));
      return getStatus(jobName);
    }

    for (const job of jobs.values()) stopJob(job);
    return getStatus();
  }

  function stopJob(job) {
    if (job.timer !== null) clearIntervalFn(job.timer);
    job.timer = null;
    job.nextRunAt = null;
  }

  function getStatus(jobName) {
    if (jobName !== undefined && jobName !== null) {
      return snapshotJob(requireJob(jobs, jobName));
    }
    return Array.from(jobs.values(), snapshotJob);
  }

  return Object.freeze({
    getStatus,
    register,
    runOnce,
    start,
    stop,
  });
}

function createSuccessEnvelope(options) {
  const { adapterResult, completed, fallbackProvenance, jobName, maxAgeHours, started } = options;
  const metadata = extractMetadata(adapterResult);
  const provenance = normalizeProvenance(metadata.provenance || fallbackProvenance, completed);
  const freshness = normalizeFreshness(metadata.freshness, provenance, maxAgeHours, completed);

  return {
    ok: true,
    jobName,
    attempts: options.attempts,
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    durationMs: Math.max(0, completed.getTime() - started.getTime()),
    provenance,
    freshness,
    summary: normalizeSummary(metadata.summary, metadata.data),
    data: metadata.data,
  };
}

function extractMetadata(adapterResult) {
  if (!adapterResult || typeof adapterResult !== "object" || Array.isArray(adapterResult)) {
    return {
      data: adapterResult,
      freshness: null,
      provenance: null,
      summary: null,
    };
  }

  const metadata = isPlainObject(adapterResult.metadata) ? adapterResult.metadata : null;
  const hasData = Object.prototype.hasOwnProperty.call(adapterResult, "data");
  return {
    data: hasData ? adapterResult.data : adapterResult,
    freshness:
      adapterResult.freshness ||
      adapterResult.provenance?.freshness ||
      adapterResult.source?.freshness ||
      metadata?.freshness ||
      metadata?.source?.freshness ||
      null,
    provenance:
      adapterResult.provenance ||
      adapterResult.source ||
      metadata?.source ||
      metadata ||
      null,
    summary: adapterResult.summary || metadata?.summary || null,
  };
}

function normalizeProvenance(value, completed) {
  const input = isPlainObject(value) ? value : {};
  const fetchedAt = normalizeTimestamp(
    input.fetchedAt || input.checkedAt || input.confirmedAt || input.updatedAt,
    completed.toISOString()
  );

  return {
    sourceType: normalizeLabel(input.sourceType || input.type, "unknown"),
    sourceName: normalizeLabel(input.sourceName || input.name, "unknown"),
    sourceUrl: sanitizeSourceUrl(input.sourceUrl || input.url),
    fetchedAt,
    confirmedAt: normalizeTimestamp(input.confirmedAt, fetchedAt),
    updatedAt: normalizeTimestamp(input.updatedAt, null),
  };
}

function normalizeFreshness(value, provenance, maxAgeHours, completed) {
  const input = isPlainObject(value) ? value : {};
  const checkedAt = normalizeTimestamp(
    input.checkedAt || provenance.fetchedAt || provenance.confirmedAt || provenance.updatedAt,
    null
  );
  const normalizedMaxAgeHours = normalizeMaxAgeHours(input.maxAgeHours, maxAgeHours);
  const checkedTime = checkedAt ? new Date(checkedAt).getTime() : null;
  const ageHours = checkedTime === null
    ? null
    : roundHours(Math.max(0, completed.getTime() - checkedTime));
  const suppliedStatus = FRESHNESS_STATUSES.has(input.status) ? input.status : null;
  const status = suppliedStatus || (
    ageHours === null
      ? "unknown"
      : ageHours <= normalizedMaxAgeHours ? "fresh" : "stale"
  );

  return {
    status,
    checkedAt,
    ageHours: normalizeNonNegativeNumber(input.ageHours, ageHours),
    maxAgeHours: normalizedMaxAgeHours,
  };
}

function normalizeSummary(value, data) {
  const input = isPlainObject(value) ? value : {};
  const summary = {};

  for (const field of SUMMARY_FIELDS) {
    const normalized = normalizeNonNegativeInteger(input[field], null);
    if (normalized !== null) summary[field] = normalized;
  }

  if (summary.itemCount === undefined && Array.isArray(data)) {
    summary.itemCount = data.length;
  }
  return summary;
}

function toStatusResult(envelope) {
  return {
    ok: true,
    attempts: envelope.attempts,
    startedAt: envelope.startedAt,
    completedAt: envelope.completedAt,
    durationMs: envelope.durationMs,
    provenance: { ...envelope.provenance },
    freshness: { ...envelope.freshness },
    summary: { ...envelope.summary },
  };
}

function createFailureRecord(jobName, error, attempts, completed) {
  return {
    ok: false,
    jobName,
    attempts,
    completedAt: completed.toISOString(),
    error: {
      name: normalizeErrorName(error?.name),
      code: normalizeErrorCode(error?.code),
    },
  };
}

function snapshotJob(job) {
  return {
    name: job.name,
    status: job.status,
    running: job.status === "running",
    scheduled: job.timer !== null,
    intervalMs: job.intervalMs,
    nextRunAt: job.nextRunAt,
    totals: { ...job.totals },
    lastStartedAt: job.lastStartedAt,
    lastCompletedAt: job.lastCompletedAt,
    lastSuccessAt: job.lastSuccessAt,
    lastFailureAt: job.lastFailureAt,
    lastResult: job.lastResult ? cloneStatusValue(job.lastResult) : null,
    lastFailure: job.lastFailure ? cloneStatusValue(job.lastFailure) : null,
  };
}

function normalizeAllowlist(value) {
  if (!Array.isArray(value) && !(value instanceof Set)) {
    throw new TypeError("allowlist must be a non-empty array or Set of job names.");
  }
  const allowlist = new Set(value);
  if (allowlist.size === 0) {
    throw new TypeError("allowlist must contain at least one job name.");
  }
  for (const jobName of allowlist) assertJobName(jobName);
  return allowlist;
}

function assertJobName(jobName) {
  if (typeof jobName !== "string" || !JOB_NAME_PATTERN.test(jobName)) {
    throw new TypeError("jobName must use lowercase letters, digits, dot, colon, underscore, or hyphen.");
  }
}

function normalizeRetry(value, fallback) {
  const input = isPlainObject(value) ? value : {};
  return Object.freeze({
    maxAttempts: normalizeBoundedInteger(input.maxAttempts, fallback.maxAttempts, 1, 20, "maxAttempts"),
    initialDelayMs: normalizeBoundedInteger(
      input.initialDelayMs,
      fallback.initialDelayMs,
      0,
      24 * 60 * 60 * 1000,
      "initialDelayMs"
    ),
    factor: normalizeBoundedNumber(input.factor, fallback.factor, 1, 100, "factor"),
    maxDelayMs: normalizeBoundedInteger(
      input.maxDelayMs,
      fallback.maxDelayMs,
      0,
      24 * 60 * 60 * 1000,
      "maxDelayMs"
    ),
  });
}

function calculateRetryDelay(retry, failedAttempt) {
  const exponential = retry.initialDelayMs * (retry.factor ** (failedAttempt - 1));
  return Math.min(retry.maxDelayMs, exponential);
}

function normalizeIntervalMs(value) {
  if (value === undefined || value === null) return null;
  return normalizeBoundedInteger(value, null, 1, 2 ** 31 - 1, "intervalMs");
}

function normalizeMaxAgeHours(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return normalizeBoundedNumber(value, fallback, 0, Number.MAX_SAFE_INTEGER, "maxAgeHours");
}

function normalizeClock(clock) {
  if (clock === undefined) return () => new Date();
  if (typeof clock !== "function") throw new TypeError("clock must be a function.");
  return clock;
}

function readClock(clock) {
  const value = clock();
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("clock must return a valid date.");
  return date;
}

function normalizeTimestamp(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function sanitizeSourceUrl(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeLabel(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  return value.slice(0, 120);
}

function normalizeErrorName(value) {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(value)
    ? value.slice(0, 64)
    : "Error";
}

function normalizeErrorCode(value) {
  return typeof value === "string" && ERROR_CODE_PATTERN.test(value)
    ? value
    : "REFRESH_FAILED";
}

function normalizeNonNegativeNumber(value, fallback) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeNonNegativeInteger(value, fallback) {
  const number = normalizeNonNegativeNumber(value, fallback);
  return number !== fallback && Number.isInteger(number) ? number : fallback;
}

function normalizeBoundedInteger(value, fallback, minimum, maximum, label) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new TypeError(`${label} must be an integer between ${minimum} and ${maximum}.`);
  }
  return number;
}

function normalizeBoundedNumber(value, fallback, minimum, maximum, label) {
  if (value === undefined || value === null) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new TypeError(`${label} must be a number between ${minimum} and ${maximum}.`);
  }
  return number;
}

function addMilliseconds(date, milliseconds) {
  return new Date(date.getTime() + milliseconds);
}

function roundHours(milliseconds) {
  return Math.round((milliseconds / 36e5) * 100) / 100;
}

function requireJob(jobs, jobName) {
  assertJobName(jobName);
  const job = jobs.get(jobName);
  if (!job) throw new Error(`Job "${jobName}" is not registered.`);
  return job;
}

function notifyFailure(onFailure, error, snapshot) {
  if (!onFailure) return;
  try {
    Promise.resolve(onFailure({
      error,
      failure: cloneStatusValue(error.failure),
      jobName: error.jobName,
      status: snapshot,
    })).catch(() => {});
  } catch {
    // Observability callback failures must not replace the refresh failure.
  }
}

function cloneStatusValue(value) {
  if (Array.isArray(value)) return value.map(cloneStatusValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneStatusValue(entry)])
  );
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function defaultSleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

module.exports = {
  DEFAULT_RETRY,
  FRESHNESS_STATUSES,
  RefreshJobError,
  calculateRetryDelay,
  createRefreshScheduler,
  sanitizeSourceUrl,
};
