const crypto = require("node:crypto");
const { guardActionCandidate } = require("k-parent-core");

function clean(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = String(value).trim();
  return text === "" ? null : text;
}

function candidateId(title, date, location) {
  const basis = `${clean(title) || ""}|${clean(date) || ""}|${clean(location) || ""}`;
  return crypto.createHash("sha256").update(basis, "utf8").digest("hex");
}

/**
 * Build a calendar candidate. The candidate is run through guardActionCandidate
 * with type "calendar_write", so it is always requiresConfirmation=true and
 * executable=false. K-Parent skills must NEVER auto-write to a calendar.
 */
function calendarCandidate(input = {}) {
  const title = clean(input.title);
  if (!title) {
    throw new Error("calendar candidate title is required.");
  }

  const date = clean(input.date);
  if (!date) {
    throw new Error("calendar candidate date is required.");
  }

  const location = clean(input.location);
  const id = candidateId(title, date, location);

  const details = {
    date,
    time: clean(input.time),
    location,
    supplies: normalizeList(input.supplies),
    cost: clean(input.cost),
    deadline: clean(input.deadline),
    targetGrade: clean(input.targetGrade),
    sourceDocId: clean(input.sourceDocId),
  };

  const guarded = guardActionCandidate({
    id,
    type: "calendar_write",
    title,
    label: title,
    description: buildDescription(details),
    dueAt: details.deadline || date,
    metadata: details,
  });

  return {
    ...guarded,
    date,
    time: details.time,
    location,
    supplies: details.supplies,
    cost: details.cost,
    deadline: details.deadline,
    targetGrade: details.targetGrade,
    sourceDocId: details.sourceDocId,
  };
}

function normalizeList(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function buildDescription(details) {
  const parts = [];
  if (details.time) parts.push(`시간: ${details.time}`);
  if (details.location) parts.push(`장소: ${details.location}`);
  if (details.supplies.length) parts.push(`준비물: ${details.supplies.join(", ")}`);
  if (details.cost) parts.push(`비용: ${details.cost}`);
  if (details.deadline) parts.push(`마감: ${details.deadline}`);
  if (details.targetGrade) parts.push(`대상: ${details.targetGrade}`);
  return parts.length ? parts.join(" / ") : null;
}

function dedupeCandidates(list = []) {
  const seen = new Map();
  for (const candidate of Array.isArray(list) ? list : []) {
    if (!candidate || !candidate.id) {
      continue;
    }
    if (!seen.has(candidate.id)) {
      seen.set(candidate.id, candidate);
    }
  }
  return Array.from(seen.values());
}

function pad(num) {
  return String(num).padStart(2, "0");
}

function toIcsDate(date) {
  // Accept YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD -> YYYYMMDD
  const match = String(date).match(/(\d{4})\D?(\d{1,2})\D?(\d{1,2})/);
  if (!match) {
    return null;
  }
  return `${match[1]}${pad(match[2])}${pad(match[3])}`;
}

function escapeIcs(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldLine(line) {
  // RFC5545 lines SHOULD be folded at 75 octets; keep simple ASCII-safe folding.
  if (Buffer.byteLength(line, "utf8") <= 75) {
    return line;
  }
  const chunks = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > 73) {
      chunks.push(current);
      current = " " + char;
    } else {
      current += char;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks.join("\r\n");
}

function stamp(now = new Date()) {
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  );
}

function toICS(candidates = [], options = {}) {
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const dtstamp = stamp(options.now ? new Date(options.now) : new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//k-parent-skills//k-parent-calendar//KO",
    "CALSCALE:GREGORIAN",
  ];

  for (const candidate of list) {
    if (!candidate || !candidate.date) {
      continue;
    }
    const icsDate = toIcsDate(candidate.date);
    if (!icsDate) {
      continue;
    }
    const uid = `${candidate.id || candidateId(candidate.title, candidate.date, candidate.location)}@k-parent-skills`;
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${uid}`));
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate}`);
    lines.push(foldLine(`SUMMARY:${escapeIcs(candidate.title || "(제목 없음)")}`));
    if (candidate.location) {
      lines.push(foldLine(`LOCATION:${escapeIcs(candidate.location)}`));
    }
    if (candidate.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcs(candidate.description)}`));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

module.exports = {
  calendarCandidate,
  candidateId,
  dedupeCandidates,
  toICS,
};
