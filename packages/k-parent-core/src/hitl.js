const { createHash, randomUUID } = require("node:crypto");

const HITL_STATUS = Object.freeze({
  PROPOSED: "proposed",
  AWAITING_APPROVAL: "awaiting_approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  EXECUTED: "executed",
});

const HITL_RISK = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
});

const ACTION_POLICIES = Object.freeze({
  checklist: policy(HITL_RISK.LOW, false, false, 0),
  calendar_write: policy(HITL_RISK.MEDIUM, true, false, 30),
  message_send: policy(HITL_RISK.HIGH, true, false, 15),
  login: policy(HITL_RISK.HIGH, true, true, 15),
  reservation: policy(HITL_RISK.HIGH, true, true, 15),
  application: policy(HITL_RISK.HIGH, true, true, 15),
  cancellation: policy(HITL_RISK.HIGH, true, true, 15),
  external_data_share: policy(HITL_RISK.CRITICAL, true, false, 5),
  child_personal_data_entry: policy(HITL_RISK.CRITICAL, true, true, 5),
  credential_entry: policy(HITL_RISK.CRITICAL, true, true, 5),
  purchase: policy(HITL_RISK.CRITICAL, true, true, 5),
  payment: policy(HITL_RISK.CRITICAL, true, true, 5),
});

const FORBIDDEN_SCOPE_KEYS = Object.freeze([
  "password",
  "secret",
  "token",
  "cookie",
  "authorization",
  "apikey",
  "clientsecret",
  "accesstoken",
  "refreshtoken",
  "residentregistrationnumber",
  "rrn",
  "birthdate",
  "childname",
  "certificatepassword",
  "paymentpassword",
]);

function policy(risk, requiresApproval, requiresOfficialSiteHandoff, approvalTtlMinutes) {
  return Object.freeze({ risk, requiresApproval, requiresOfficialSiteHandoff, approvalTtlMinutes });
}

function getActionPolicy(type) {
  const normalizedType = String(type || "");
  if (!normalizedType) throw new Error("action type is required.");

  return ACTION_POLICIES[normalizedType] || policy(HITL_RISK.HIGH, true, false, 15);
}

function createActionRequest(action = {}, options = {}) {
  if (!action.type) throw new Error("action.type is required.");
  if (!action.label && !action.title) throw new Error("action label or title is required.");

  const createdAt = toIso(options.now || new Date());
  const scope = action.scope || {};
  assertSafeApprovalScope(scope);
  const actionPolicy = getActionPolicy(action.type);
  const status = actionPolicy.requiresApproval ? HITL_STATUS.AWAITING_APPROVAL : HITL_STATUS.APPROVED;

  return {
    id: action.id || randomUUID(),
    type: action.type,
    label: action.label || action.title,
    status,
    risk: actionPolicy.risk,
    requiresApproval: actionPolicy.requiresApproval,
    requiresOfficialSiteHandoff: actionPolicy.requiresOfficialSiteHandoff,
    oneTimeApproval: true,
    scope,
    scopeDigest: digestApprovalScope(scope),
    officialUrl: action.officialUrl || null,
    requestedBy: action.requestedBy || "agent",
    createdAt,
    approval: actionPolicy.requiresApproval
      ? null
      : {
          decision: "policy_allowed",
          actor: "system_policy",
          decidedAt: createdAt,
          expiresAt: null,
          constraints: [],
          reason: "Low-risk action allowed by repository policy.",
        },
    execution: null,
    auditTrail: [{ event: status, at: createdAt, actor: action.requestedBy || "agent" }],
  };
}

function decideActionRequest(request, decision = {}, options = {}) {
  assertRequestState(request, HITL_STATUS.AWAITING_APPROVAL);
  if (!request.requiresApproval) throw new Error("action does not require human approval.");
  if (!decision.actor) throw new Error("approval actor is required.");
  if (!["approved", "rejected"].includes(decision.decision)) {
    throw new Error("decision must be approved or rejected.");
  }

  const decidedAt = toIso(options.now || decision.decidedAt || new Date());
  const nextStatus = decision.decision === "approved" ? HITL_STATUS.APPROVED : HITL_STATUS.REJECTED;
  const ttlMinutes = getActionPolicy(request.type).approvalTtlMinutes;
  const expiresAt = nextStatus === HITL_STATUS.APPROVED
    ? toIso(decision.expiresAt || new Date(Date.parse(decidedAt) + ttlMinutes * 60_000))
    : null;

  return {
    ...request,
    status: nextStatus,
    approval: {
      decision: decision.decision,
      actor: decision.actor,
      decidedAt,
      expiresAt,
      constraints: Array.isArray(decision.constraints) ? decision.constraints.map(String) : [],
      reason: decision.reason || null,
    },
    auditTrail: [...request.auditTrail, { event: nextStatus, at: decidedAt, actor: decision.actor }],
  };
}

function assertActionExecutable(request, options = {}) {
  if (!request || typeof request !== "object") throw new Error("action request is required.");
  if (request.status !== HITL_STATUS.APPROVED) {
    throw new Error(`action is not approved: ${request.status || "unknown"}`);
  }
  if (request.execution) throw new Error("one-time approval has already been consumed.");

  const now = Date.parse(toIso(options.now || new Date()));
  if (request.approval?.expiresAt && now >= Date.parse(request.approval.expiresAt)) {
    throw new Error("approval has expired.");
  }

  if (options.scope) {
    assertSafeApprovalScope(options.scope);
    if (digestApprovalScope(options.scope) !== request.scopeDigest) {
      throw new Error("execution scope does not match the approved scope.");
    }
  }

  return true;
}

function markActionExecuted(request, execution = {}, options = {}) {
  assertActionExecutable(request, { now: options.now, scope: execution.scope });
  const executedAt = toIso(options.now || execution.executedAt || new Date());
  const actor = execution.actor || "executor";

  return {
    ...request,
    status: HITL_STATUS.EXECUTED,
    execution: {
      actor,
      executedAt,
      resultRef: execution.resultRef || null,
    },
    auditTrail: [...request.auditTrail, { event: HITL_STATUS.EXECUTED, at: executedAt, actor }],
  };
}

function expireActionRequest(request, options = {}) {
  assertRequestState(request, HITL_STATUS.APPROVED);
  const at = toIso(options.now || new Date());
  return {
    ...request,
    status: HITL_STATUS.EXPIRED,
    auditTrail: [...request.auditTrail, { event: HITL_STATUS.EXPIRED, at, actor: options.actor || "system" }],
  };
}

function digestApprovalScope(scope) {
  assertSafeApprovalScope(scope);
  return createHash("sha256").update(stableStringify(scope)).digest("hex");
}

function assertSafeApprovalScope(value, currentPath = "scope") {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeApprovalScope(item, `${currentPath}[${index}]`));
    return;
  }
  if (typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (FORBIDDEN_SCOPE_KEYS.includes(normalizedKey)) {
      throw new Error(`${currentPath}.${key} is forbidden in persisted approval scope.`);
    }
    assertSafeApprovalScope(child, `${currentPath}.${key}`);
  }
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertRequestState(request, expected) {
  if (!request || request.status !== expected) {
    throw new Error(`action request must be ${expected}.`);
  }
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid timestamp.");
  return date.toISOString();
}

module.exports = {
  ACTION_POLICIES,
  FORBIDDEN_SCOPE_KEYS,
  HITL_RISK,
  HITL_STATUS,
  assertActionExecutable,
  assertSafeApprovalScope,
  createActionRequest,
  decideActionRequest,
  digestApprovalScope,
  expireActionRequest,
  getActionPolicy,
  markActionExecuted,
};
