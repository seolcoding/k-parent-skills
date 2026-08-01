#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const CANDIDATES_FILE = "tmp/data_portal_k_parent_candidates.json";
const CURATED_FILE = "tmp/data_portal_k_parent_curated.json";
const OUTPUT_JSON = "tmp/data_portal_k_parent_apply_queue.json";
const OUTPUT_MD = "docs/data_portal_k_parent_apply_queue.md";

const VERIFIED_OR_OBSERVED = new Set([
  "15155058",
  "15000563",
  "15001673",
  "15058311",
  "15109775",
  "15132083",
  "15143076",
  "15143089",
  "15143215",
  "3057832",
  "15034033",
  "15101897",
  "15034075",
  "15056770",
  "15148252",
  "15148259",
  "15148262",
  "15148268",
  "15148269",
  "15148276",
  "15148277",
  "15148121",
  "15147936",
  "15147943",
  "15147990",
  "15147966",
  "15147948",
  "15147995",
  "15147946",
  "15147779",
  "15157491",
  "15156427",
  "15154822",
  "15154791",
  "15157804",
  "15059689",
  "15157805",
  "15108347",
  "15078213",
  "15131954",
  "15109201",
  "15008891",
  "15132110",
  "15106080",
  "15077181",
  "15114180",
  "15098821",
  "15073554",
  "15143780",
  "15157814",
  "15097373",
  "15125774",
  "15057259",
  "15096004",
  "15158796",
  "15143213",
  "15143091",
  "15063759",
  "15143087",
]);

const KNOWN_NO_APPLY = new Set([
  "15149543",
  "15101154",
  "15059064",
  "15058732",
  "15095278",
  "15058413",
  "15056614",
]);

const KNOWN_MISSING_OPENAPI = new Set([
  "15138637",
  "15130626",
  "15102788",
]);

const PRIORITY_IDS = new Set([
  "15101154",
  "15059064",
  "15157814",
  "15138637",
  "15057399",
  "15108347",
  "15108167",
  "15157805",
  "15098821",
  "15058732",
  "15114180",
  "15143780",
  "15095278",
  "15058413",
  "15130626",
  "15102788",
  "15056614",
  "15056664",
  "15077181",
  "15131954",
  "15106080",
  "15132110",
  "15073554",
  "15125774",
  "15097373",
]);

const EXCLUDE_PATTERNS = [
  /마사회|씨암말|포입말|교배정보|승마/u,
  /동물약국|반려동물|맹견/u,
  /노인복지|재가노인|노인맞춤돌봄/u,
  /HACCP/u,
  /집단급식소/u,
  /민원콜센터/u,
  /방사능/u,
];

const STRONG_PATTERNS = [
  /어린이집|유치원|보육/u,
  /지역아동센터|다함께돌봄|방과후|아이돌봄/u,
  /아동.*복지|부모급여|양육수당|한부모|임산부|다자녀|가족사랑/u,
  /어린이.*놀이|놀이시설|어린이공원|도시공원|농촌교육농장|유아숲|산림교육/u,
  /어린이보호구역|스쿨존|안전체험|교통사고/u,
  /약국|응급|안전상비/u,
  /도서관.*강좌|문화.*행사|공공예약|강좌|체육.*프로그램/u,
  /수유실|공중화장실|무장애|편의시설/u,
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function idFromUrl(url) {
  return String(url || "").match(/\/data\/(\d+)\//u)?.[1] || null;
}

function textOf(candidate) {
  return [
    candidate.title,
    candidate.provider,
    candidate.category,
    candidate.desc,
    ...(candidate.tags || []),
  ].filter(Boolean).join(" ");
}

function isOpenApiCandidate(candidate) {
  return candidate.type === "API" || Boolean(candidate.apiType) || /openapi\.do/u.test(candidate.url || "");
}

function baseDecision(candidate) {
  const id = String(candidate.id || candidate.listKey || idFromUrl(candidate.url));
  const text = textOf(candidate);
  if (VERIFIED_OR_OBSERVED.has(id)) return { bucket: "observed_applied", reason: "마이페이지/이전 배치에서 신청 또는 승인 관측" };
  if (KNOWN_NO_APPLY.has(id)) return { bucket: "no_apply_button", reason: "상세 페이지에 활용신청 버튼 없음 또는 바로가기형으로 관측" };
  if (KNOWN_MISSING_OPENAPI.has(id)) return { bucket: "missing_openapi_detail", reason: "openapi.do 상세 페이지 없음으로 관측" };
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(text))) return { bucket: "exclude", reason: "부모·아동 생활정보와 직접성이 낮은 오탐 패턴" };
  if (!isOpenApiCandidate(candidate)) return { bucket: "file_or_non_api", reason: "OpenAPI가 아닌 파일/비API 목록" };
  if (!/openapi\.do/u.test(candidate.url || "")) return { bucket: "link_or_external", reason: "공공데이터포털 OpenAPI 신청 페이지가 아닌 외부/링크형" };
  if (PRIORITY_IDS.has(id)) return { bucket: "apply_next", reason: "서브에이전트가 지적한 핵심 후보이며 신청 완료 증거 없음" };
  if (STRONG_PATTERNS.some((pattern) => pattern.test(text))) return { bucket: "review_next", reason: "k-parent 관련성이 강하지만 우선순위/중복 확인 필요" };
  return { bucket: "hold", reason: "관련성은 있으나 즉시 신청 우선순위 낮음" };
}

function mergeCandidates() {
  const byId = new Map();
  const add = (candidate, source) => {
    const id = String(candidate.listKey || candidate.id || idFromUrl(candidate.url));
    if (!id || id === "undefined") return;
    const existing = byId.get(id) || {};
    byId.set(id, { ...existing, ...candidate, id, sources: [...new Set([...(existing.sources || []), source])] });
  };

  const broad = readJson(CANDIDATES_FILE);
  for (const candidate of broad.top || []) add(candidate, "broad_top250");

  const curated = readJson(CURATED_FILE);
  for (const group of curated.groups || []) {
    for (const candidate of group.top || []) add(candidate, `curated:${group.name}`);
  }

  return [...byId.values()].sort((a, b) => {
    const aPriority = PRIORITY_IDS.has(String(a.id)) ? 1 : 0;
    const bPriority = PRIORITY_IDS.has(String(b.id)) ? 1 : 0;
    return (bPriority - aPriority) || ((b.score || 0) - (a.score || 0)) || String(a.title).localeCompare(String(b.title), "ko");
  });
}

async function fetchDetail(candidate) {
  if (!["apply_next", "review_next"].includes(candidate.bucket)) return candidate;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(candidate.url, {
      headers: { "user-agent": "k-parent-skills-queue" },
      signal: controller.signal,
    });
    const html = await response.text();
    const detailPk = html.match(/id="publicDataDetailPk"\s+value="([^"]+)"/u)?.[1] || null;
    const applyButtonPresent = html.includes(`fn_goOpenAPIRequestForm('${candidate.id}')`);
    const title = html.match(/<title>(.*?)<\/title>/iu)?.[1]?.replace(/\s+/gu, " ").trim() || candidate.title;
    return {
      ...candidate,
      httpStatus: response.status,
      detailTitle: title,
      detailPk,
      applyButtonPresent,
      bucket: applyButtonPresent ? candidate.bucket : "no_apply_button",
      reason: applyButtonPresent ? candidate.reason : "공개 상세 페이지에서 활용신청 버튼 미확인",
    };
  } catch (error) {
    return { ...candidate, detailError: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function renderMarkdown(items, summary) {
  const lines = [];
  lines.push("# k-parent-skills data.go.kr 신청 큐");
  lines.push("");
  lines.push("공공데이터포털 목록개방현황 스냅샷과 상세 페이지 공개 HTML을 기준으로 만든 신청/검토 큐다.");
  lines.push("");
  lines.push("## 요약");
  lines.push("");
  for (const [bucket, count] of Object.entries(summary)) {
    lines.push(`- \`${bucket}\`: ${count}건`);
  }
  lines.push("");

  for (const bucket of ["apply_next", "review_next", "observed_applied", "no_apply_button", "missing_openapi_detail", "exclude", "file_or_non_api", "hold"]) {
    const rows = items.filter((item) => item.bucket === bucket);
    if (!rows.length) continue;
    lines.push(`## ${bucket}`);
    lines.push("");
    lines.push("| ID | 제목 | API 유형 | 신청버튼 | 판단 근거 | 매핑 힌트 |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const item of rows.slice(0, bucket === "review_next" ? 60 : 80)) {
      lines.push([
        `[${item.id}](${item.url})`,
        String(item.title || item.detailTitle || "").replace(/\|/gu, "/"),
        item.apiType || item.type || "",
        item.applyButtonPresent === true ? "있음" : (item.applyButtonPresent === false ? "없음" : "-"),
        String(item.reason || "").replace(/\|/gu, "/"),
        (item.tags || item.sources || []).join(", ").replace(/\|/gu, "/"),
      ].join(" | ").replace(/^/u, "| ").replace(/$/u, " |"));
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  const merged = mergeCandidates().map((candidate) => ({ ...candidate, ...baseDecision(candidate) }));
  const enriched = await Promise.all(merged.map((candidate) => fetchDetail(candidate)));
  const summary = enriched.reduce((acc, item) => {
    acc[item.bucket] = (acc[item.bucket] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), summary, items: enriched }, null, 2));
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(enriched, summary));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
