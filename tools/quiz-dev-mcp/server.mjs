#!/usr/bin/env node
// quiz-dev MCP: 리포 전용 개발 조회 서버 (stdio JSON-RPC, 의존성 0).
// 성취기준 번들·NEIS fixture를 읽기 전용으로 노출한다. 리포 밖 파일은 읽지 않는다.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const require = createRequire(import.meta.url);

const STANDARDS_PATH = join(
  repoRoot,
  "skills/k-parent-quiz-maker/references/achievement-standards-elementary.json",
);
const TIMETABLE_FIXTURE_PATH = join(
  repoRoot,
  "packages/k-parent-source-neis/test/fixtures/timetable.json",
);

const GRADE_TO_BAND = { 1: "1-2", 2: "1-2", 3: "3-4", 4: "3-4", 5: "5-6", 6: "5-6" };

let standardsCache = null;
function loadStandardsFile() {
  if (!standardsCache) {
    standardsCache = JSON.parse(readFileSync(STANDARDS_PATH, "utf8"));
  }
  return standardsCache;
}

const TOOLS = [
  {
    name: "lookup_standards",
    description: "성취기준 코드로 단건 조회 (예: 2수01-01)",
    inputSchema: {
      type: "object",
      properties: { code: { type: "string", description: "성취기준 코드 (대괄호 없이)" } },
      required: ["code"],
    },
  },
  {
    name: "search_standards",
    description: "성취기준 검색: 과목·학년(또는 학년군)·영역·키워드 AND 필터",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "국어|수학|사회|과학|영어" },
        grade: { type: "integer", description: "1..6 (gradeBand로 변환)" },
        gradeBand: { type: "string", description: "1-2|3-4|5-6" },
        domain: { type: "string", description: "영역명 부분일치" },
        keyword: { type: "string", description: "statement/domain 부분일치" },
        limit: { type: "integer", description: "기본 10" },
      },
    },
  },
  {
    name: "list_timetable_fixture",
    description: "NEIS 시간표 fixture(packages/k-parent-source-neis/test/fixtures/timetable.json) 반환",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "generate_template_quiz",
    description: "packages/k-parent-quiz-core로 결정적 템플릿 퀴즈 생성 (트랙 A 머지 전에는 미가용)",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string" },
        grade: { type: "integer" },
        count: { type: "integer", description: "기본 5" },
        seed: { type: "string", description: "결정성 seed (기본 'dev')" },
      },
      required: ["subject", "grade"],
    },
  },
];

function runTool(name, args = {}) {
  if (name === "lookup_standards") {
    const code = String(args.code || "").replace(/[[\]]/g, "").trim();
    const { standards } = loadStandardsFile();
    const found = standards.find((s) => s.code === code);
    return found || { error: "not_found", code };
  }
  if (name === "search_standards") {
    const { standards } = loadStandardsFile();
    const limit = Number.isInteger(args.limit) && args.limit > 0 ? args.limit : 10;
    const gradeBand = args.gradeBand || (args.grade ? GRADE_TO_BAND[args.grade] : undefined);
    const rows = standards.filter((s) => {
      if (args.subject && s.subject !== args.subject) return false;
      if (gradeBand && s.gradeBand !== gradeBand) return false;
      if (args.domain && !s.domain.includes(args.domain)) return false;
      if (args.keyword && !(s.statement.includes(args.keyword) || s.domain.includes(args.keyword))) return false;
      return true;
    });
    return { total: rows.length, standards: rows.slice(0, limit) };
  }
  if (name === "list_timetable_fixture") {
    return JSON.parse(readFileSync(TIMETABLE_FIXTURE_PATH, "utf8"));
  }
  if (name === "generate_template_quiz") {
    let core;
    try {
      core = require(join(repoRoot, "packages/k-parent-quiz-core/src/index.js"));
    } catch {
      return {
        error: "quiz_core_not_available_yet",
        message: "packages/k-parent-quiz-core가 아직 없다 (트랙 A 머지 전 정상 상태).",
      };
    }
    return core.generateQuiz({
      subject: args.subject,
      grade: args.grade,
      count: Number.isInteger(args.count) && args.count > 0 ? args.count : 5,
      seed: typeof args.seed === "string" && args.seed ? args.seed : "dev",
    });
  }
  throw Object.assign(new Error(`unknown tool: ${name}`), { rpcCode: -32602 });
}

function handle(message) {
  const { id, method, params } = message;
  if (id === undefined || id === null) return null; // notification: 응답 없음
  if (method === "initialize") {
    return {
      protocolVersion: params?.protocolVersion || "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "quiz-dev", version: "0.1.0" },
    };
  }
  if (method === "ping") return {};
  if (method === "tools/list") return { tools: TOOLS };
  if (method === "tools/call") {
    const result = runTool(params?.name, params?.arguments || {});
    const isError = Boolean(result && typeof result === "object" && result.error);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError,
    };
  }
  throw Object.assign(new Error(`method not found: ${method}`), { rpcCode: -32601 });
}

function send(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse error" } });
    return;
  }
  try {
    const result = handle(message);
    if (result !== null) send({ jsonrpc: "2.0", id: message.id, result });
  } catch (error) {
    send({
      jsonrpc: "2.0",
      id: message.id ?? null,
      error: { code: error.rpcCode || -32603, message: error.message },
    });
  }
});
