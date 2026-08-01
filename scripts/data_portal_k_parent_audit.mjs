#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const CATALOG_OAS_URL = "https://infuser.odcloud.kr/oas/docs?namespace=15062804/v1";
const CATALOG_API_BASE = "https://api.odcloud.kr/api";
const DEFAULT_OUTPUT_DIR = "tmp";
const CATALOG_PAGE_SIZE = 1000;

const TARGETS = [
  {
    priority: 1,
    skill: "k-parent-public-restroom-baby",
    id: "15155058",
    why: "기저귀교환대/어린이용 변기/개방시간 포함 전국 공중화장실",
  },
  {
    priority: 2,
    skill: "k-parent-emergency-care",
    id: "15000563",
    why: "전국 응급의료기관/응급실 가용 정보",
  },
  {
    priority: 3,
    skill: "k-parent-pharmacy-finder",
    id: "15001673",
    why: "건강보험심사평가원 약국정보",
  },
  {
    priority: 4,
    skill: "k-parent-playground-safety",
    id: "15149543",
    why: "생활안전지도 어린이놀이시설 위치정보",
  },
  {
    priority: 5,
    skill: "k-parent-school-zone-risk",
    id: "15058311",
    why: "어린이보호구역 내 어린이 교통사고 다발지역",
  },
  {
    priority: 6,
    skill: "k-parent-idolbom-info",
    id: "15109775",
    why: "아이돌봄 교육기관 정보",
  },
  {
    priority: 7,
    skill: "k-parent-idolbom-cost",
    id: "15132083",
    why: "아이돌봄 서비스 이용금액 정보",
  },
  {
    priority: 8,
    skill: "k-parent-culture-course-busan",
    id: "15143076",
    why: "부산진구 강좌 정보, 어린이 대상 과정 포함",
  },
  {
    priority: 9,
    skill: "k-parent-library-course-busan-dongnae",
    id: "15143089",
    why: "동래구 도서관 강좌 정보",
  },
  {
    priority: 9,
    skill: "k-parent-reservation-busan-jin",
    id: "15143215",
    why: "부산진구 통합 예약 현황",
  },
  {
    priority: 9,
    skill: "k-parent-forest-education",
    id: "3057832",
    why: "유아숲/산림교육 프로그램",
  },
  {
    priority: 9,
    skill: "k-parent-nursing-room-busan",
    id: "15034033",
    why: "부산 수유실 보유 시설",
  },
  {
    priority: 9,
    skill: "k-parent-accessible-travel",
    id: "15101897",
    why: "영유아 가족 포함 무장애 여행 정보",
  },
  {
    priority: 9,
    skill: "k-parent-family-card-busan",
    id: "15034075",
    why: "다자녀 가족사랑카드 참여업체/혜택",
  },
  {
    priority: 9,
    skill: "k-parent-child-traffic-stats",
    id: "15056770",
    why: "지자체별 어린이 교통사고 통계",
  },
];

const GROUPS = [
  ["childcare_kindergarten", /어린이집|보육|유치원|유아교육|육아종합지원센터/u],
  ["childcare_national_childinfo", /어린이집정보공개|유치원알리미|보육통합|어린이집.*정보|유치원.*현황/u],
  ["playground_safety", /어린이놀이시설|놀이터|놀이시설.*안전|생활안전지도.*어린이놀이시설/u],
  ["park_play_outdoor", /도시공원|어린이공원|물놀이장|유아숲|숲체험|공공체육시설/u],
  ["after_school_care", /지역아동센터|다함께돌봄|공동육아|아이돌봄|방과후|돌봄센터/u],
  ["welfare_parenting", /아동수당|부모급여|양육수당|보육료|유아학비|출산지원|임신|다자녀|한부모|복지서비스|바우처/u],
  ["emergency_medical", /응급의료|응급실|소아응급|달빛어린이병원|휴일.*병원|야간.*진료|약국|휴일지킴이|안전상비의약품/u],
  ["library_programs", /도서관.*(행사|강좌|프로그램)|어린이도서관|장난감도서관|북스타트|독서프로그램/u],
  ["culture_reservation", /공공예약|공공서비스예약|통합 예약|시설예약|강좌예약|교육신청|체험신청|문화행사|평생학습/u],
  ["school_zone_safety", /어린이보호구역|스쿨존|통학로|어린이통학버스|보행안전/u],
  ["baby_facilities", /수유실|유아휴게실|공중화장실|개방화장실|무장애/u],
];

function loadDotEnv(file = ".env") {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/u);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith("\"") && value.endsWith("\""))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function dataGoKrKey() {
  const key = process.env.KSKILL_DATAGOKR_KEY || process.env.DATA_GO_KR_API_KEY;
  if (!key) {
    throw new Error("KSKILL_DATAGOKR_KEY or DATA_GO_KR_API_KEY is required.");
  }
  return decodeURIComponent(key);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/xml,*/*",
      "user-agent": "k-parent-skills-data-portal-audit",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  try {
    return { response, json: JSON.parse(text), text };
  } catch {
    return { response, json: null, text };
  }
}

async function latestCatalogEndpoint() {
  const { response, json } = await fetchJson(CATALOG_OAS_URL);
  if (!response.ok || !json?.paths) {
    throw new Error(`Catalog OAS fetch failed: ${response.status}`);
  }
  const latest = Object.entries(json.paths)
    .map(([apiPath, value]) => {
      const summary = value.get?.summary || "";
      const date = summary.match(/_(\d{8})$/u)?.[1] || null;
      return { path: apiPath, summary, date };
    })
    .filter((entry) => entry.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
  if (!latest) throw new Error("No dated catalog endpoint found.");
  return { ...latest, url: `${CATALOG_API_BASE}${latest.path}` };
}

async function fetchCatalogRows(endpoint, serviceKey) {
  const rows = [];
  let totalCount = null;
  for (let page = 1; ; page += 1) {
    const url = new URL(endpoint.url);
    url.searchParams.set("page", String(page));
    url.searchParams.set("perPage", String(CATALOG_PAGE_SIZE));
    url.searchParams.set("serviceKey", serviceKey);
    const { response, json } = await fetchJson(url);
    if (!response.ok || !Array.isArray(json?.data)) {
      throw new Error(`Catalog page ${page} failed: ${response.status} ${json?.msg || ""}`);
    }
    rows.push(...json.data);
    totalCount = json.totalCount;
    if (rows.length >= totalCount) {
      return { rows, totalCount };
    }
  }
}

function searchableText(row) {
  return [
    row["목록명"],
    row["파일데이터명"],
    row["키워드"],
    row["설명"],
    row["분류체계"],
    row["제공기관"],
    row["공간범위"],
  ].filter(Boolean).join(" ");
}

function isUsableOpenApi(row) {
  return row["목록유형"] === "API"
    && /무료/u.test(row["비용부과유무"] || "")
    && /openapi\.do/u.test(row["목록 URL"] || "");
}

function pickGroup(rows, name, pattern) {
  const hits = rows
    .filter((row) => isUsableOpenApi(row) && pattern.test(searchableText(row)))
    .sort((a, b) => {
      const aAuto = /자동승인/u.test(a["심의 유형"] || "") ? 1 : 0;
      const bAuto = /자동승인/u.test(b["심의 유형"] || "") ? 1 : 0;
      const aRest = /REST/u.test(a["API 유형"] || "") ? 1 : 0;
      const bRest = /REST/u.test(b["API 유형"] || "") ? 1 : 0;
      const aNational = /전국|대한민국/u.test(a["공간범위"] || "") ? 1 : 0;
      const bNational = /전국|대한민국/u.test(b["공간범위"] || "") ? 1 : 0;
      return (bNational - aNational)
        || (bRest - aRest)
        || (bAuto - aAuto)
        || String(b["수정일"] || "").localeCompare(String(a["수정일"] || ""), "ko");
    });

  return {
    name,
    count: hits.length,
    top: hits.slice(0, 10).map((row) => ({
      listKey: row["목록키"],
      title: row["목록명"],
      provider: row["제공기관"],
      apiType: row["API 유형"],
      review: row["심의 유형"],
      traffic: row["신청가능 트래픽"],
      updated: row["수정일"],
      url: row["목록 URL"],
      desc: String(row["설명"] || "").slice(0, 180),
    })),
  };
}

function parseSwaggerJson(html) {
  const start = html.indexOf("var swaggerJson = `");
  if (start < 0) return null;
  const bodyStart = start + "var swaggerJson = `".length;
  const end = html.indexOf("`;", bodyStart);
  if (end < 0 || end === bodyStart) return null;
  return JSON.parse(html.slice(bodyStart, end));
}

async function extractTargetSpec(target) {
  const url = `https://www.data.go.kr/data/${target.id}/openapi.do`;
  const response = await fetch(url, {
    headers: { "user-agent": "k-parent-skills-data-portal-audit" },
  });
  const html = await response.text();
  let spec = null;
  let parseError = null;
  try {
    spec = parseSwaggerJson(html);
  } catch (error) {
    parseError = error.message;
  }

  return {
    ...target,
    url,
    detailPk: html.match(/id="publicDataDetailPk"\s+value="([^"]+)"/u)?.[1] || null,
    applyButtonPresent: html.includes(`fn_goOpenAPIRequestForm('${target.id}')`),
    title: spec?.info?.title || null,
    description: spec?.info?.description || null,
    host: spec?.host || null,
    schemes: spec?.schemes || null,
    basePath: spec?.basePath || "",
    operations: spec?.paths ? Object.entries(spec.paths).map(([apiPath, value]) => ({
      path: apiPath,
      summary: value.get?.summary || null,
      required: (value.get?.parameters || [])
        .filter((param) => param.required)
        .map((param) => param.name),
    })) : [],
    specParseError: parseError,
    spec,
  };
}

function firstOperationUrl(target, serviceKey) {
  if (!target.spec?.host || !target.spec?.paths) return null;
  const apiPath = Object.keys(target.spec.paths)[0];
  const operation = target.spec.paths[apiPath]?.get;
  if (!operation) return null;
  const scheme = target.spec.schemes?.includes("https") ? "https" : "http";
  const url = new URL(`${scheme}://${target.spec.host}${target.spec.basePath || ""}${apiPath}`);
  for (const param of operation.parameters || []) {
    if (param.in !== "query") continue;
    if (param.name === "serviceKey") url.searchParams.set(param.name, serviceKey);
    else if (/^pageNo$|^page$/u.test(param.name)) url.searchParams.set(param.name, "1");
    else if (/^numOfRows$|^perPage$/u.test(param.name)) url.searchParams.set(param.name, "3");
    else if (/returnType|type|_type/iu.test(param.name)) url.searchParams.set(param.name, "json");
    else if (param.required) url.searchParams.set(param.name, "");
  }
  return {
    operation: operation.summary || null,
    path: apiPath,
    safeUrl: `${url.origin}${url.pathname}`,
    url,
  };
}

async function verifyTarget(target, serviceKey) {
  const first = firstOperationUrl(target, serviceKey);
  if (!first) {
    return { status: "no_spec", parseError: target.specParseError || null };
  }
  try {
    const { response, json, text } = await fetchJson(first.url);
    let resultCode = null;
    let resultMsg = text.slice(0, 200).replace(/\s+/gu, " ");
    let ok = false;
    if (json) {
      const header = json.response?.header || json.header || {};
      resultCode = header.resultCode || header.RESULT_CODE || json.code || null;
      resultMsg = header.resultMsg || header.RESULT_MSG || json.msg || JSON.stringify(json).slice(0, 120);
      ok = response.ok && ["0", "00", "000", "NORMAL_SERVICE"].includes(String(resultCode));
    }
    return {
      httpStatus: response.status,
      ok,
      resultCode,
      resultMsg,
      operation: first.operation,
      path: first.path,
      url: first.safeUrl,
    };
  } catch (error) {
    return {
      status: "fetch_error",
      message: error.message,
      operation: first.operation,
      path: first.path,
      url: first.safeUrl,
    };
  }
}

function stripSpec(target) {
  const { spec, ...rest } = target;
  return rest;
}

function renderMarkdown(targets, curated) {
  const lines = [];
  lines.push("# k-parent-skills 공공데이터포털 API 후보");
  lines.push("");
  lines.push(`카탈로그 스냅샷: \`${curated.snapshot.date}\`, 전체 ${curated.totalRows.toLocaleString("ko-KR")}건.`);
  lines.push("");
  lines.push("## 우선 신청 대상");
  lines.push("");
  lines.push("| 우선순위 | proposed skill | data.go.kr | API | 신청버튼 | 스펙 | 현재 호출 | 왜 필요한가 |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const target of targets) {
    const spec = target.host
      ? `${target.host}${target.operations?.[0]?.path || ""}`
      : "상세 HTML 내 swagger 비어 있음";
    const test = target.test?.ok
      ? "성공"
      : (target.test?.httpStatus
        ? `${target.test.httpStatus} ${target.test.resultMsg || ""}`
        : (target.test?.parseError ? "스펙 파싱 불가" : target.test?.status || "미검증"));
    lines.push([
      `P${target.priority}`,
      `\`${target.skill}\``,
      `[${target.id}](${target.url})`,
      target.title || "-",
      target.applyButtonPresent ? "있음" : "없음/이미신청 가능성",
      spec,
      String(test).replace(/\|/gu, "/"),
      target.why,
    ].join(" | ").replace(/^/u, "| ").replace(/$/u, " |"));
  }
  lines.push("");
  lines.push("## 카테고리별 후보 수");
  lines.push("");
  for (const group of curated.groups) {
    lines.push(`- \`${group.name}\`: ${group.count}건`);
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  loadDotEnv();
  const outputDir = process.argv[2] || DEFAULT_OUTPUT_DIR;
  fs.mkdirSync(outputDir, { recursive: true });

  const serviceKey = dataGoKrKey();
  const snapshot = await latestCatalogEndpoint();
  const { rows } = await fetchCatalogRows(snapshot, serviceKey);

  const curated = {
    snapshot,
    totalRows: rows.length,
    groups: GROUPS.map(([name, pattern]) => pickGroup(rows, name, pattern)),
  };

  const targets = [];
  for (const target of TARGETS) {
    const withSpec = await extractTargetSpec(target);
    const test = await verifyTarget(withSpec, serviceKey);
    targets.push(stripSpec({ ...withSpec, test }));
  }

  fs.writeFileSync(
    path.join(outputDir, "data_portal_k_parent_curated.json"),
    JSON.stringify(curated, null, 2),
  );
  fs.writeFileSync(
    path.join(outputDir, "data_portal_k_parent_targets.json"),
    JSON.stringify(targets, null, 2),
  );
  fs.writeFileSync(
    "docs/data_portal_k_parent_skill_candidates.md",
    renderMarkdown(targets, curated),
  );

  console.log(JSON.stringify({
    snapshot: snapshot.date,
    totalRows: rows.length,
    targetCount: targets.length,
    successfulTargets: targets.filter((target) => target.test?.ok).length,
    unauthorizedTargets: targets.filter((target) => target.test?.httpStatus === 401).length,
    noSpecTargets: targets.filter((target) => target.test?.status === "no_spec").length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
