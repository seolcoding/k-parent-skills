const { getActionPolicy } = require("./hitl");

const ERROR_STATUS = Object.freeze({
  AMBIGUOUS: "ambiguous",
  NOT_FOUND: "not_found",
  STALE: "stale",
  UPSTREAM_ERROR: "upstream_error",
  MISSING_CONFIG: "missing_config",
});

const SENSITIVE_ACTION_TYPES = Object.freeze([
  "calendar_write",
  "reservation",
  "application",
  "purchase",
  "payment",
  "message_send",
  "cancellation",
  "login",
  "credential_entry",
  "child_personal_data_entry",
  "external_data_share",
]);

const OFFICIAL_SITE_HANDOFF_TYPES = Object.freeze([
  "reservation",
  "application",
  "payment",
  "purchase",
  "login",
  "credential_entry",
  "child_personal_data_entry",
]);

function isSensitiveActionType(type) {
  return SENSITIVE_ACTION_TYPES.includes(String(type || ""));
}

function requiresOfficialSiteHandoff(type) {
  return OFFICIAL_SITE_HANDOFF_TYPES.includes(String(type || ""));
}

function guardActionCandidate(action = {}) {
  if (!action.type) {
    throw new Error("action.type is required.");
  }

  const sensitive = isSensitiveActionType(action.type);
  const requiresHandoff = requiresOfficialSiteHandoff(action.type);
  const hitlPolicy = getActionPolicy(action.type);

  return {
    id: action.id || null,
    type: action.type,
    label: action.label || action.title || action.type,
    title: action.title || action.label || action.type,
    description: action.description || null,
    officialUrl: action.officialUrl || action.url || null,
    dueAt: action.dueAt || null,
    requiresConfirmation: action.requiresConfirmation === true || sensitive,
    requiresOfficialSiteHandoff: action.requiresOfficialSiteHandoff === true || requiresHandoff,
    executable: sensitive ? false : action.executable === true,
    approvalState: hitlPolicy.requiresApproval ? "awaiting_approval" : "approved",
    hitl: hitlPolicy,
    source: action.source || null,
    metadata: action.metadata || {},
  };
}

function createErrorResult(status, message, details = {}) {
  if (!Object.values(ERROR_STATUS).includes(status)) {
    throw new Error(`unsupported error status: ${status}`);
  }

  return {
    ok: false,
    status,
    message,
    ...details,
  };
}

module.exports = {
  ERROR_STATUS,
  SENSITIVE_ACTION_TYPES,
  guardActionCandidate,
  isSensitiveActionType,
  requiresOfficialSiteHandoff,
  createErrorResult,
};
