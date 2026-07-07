#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const QUEUE_FILE = "tmp/data_portal_k_parent_apply_queue.json";
const OUTPUT_JSON = "tmp/data_portal_k_parent_api_specs.json";
const OUTPUT_MD = "docs/data_portal_k_parent_api_specs.md";

const INCLUDED_BUCKETS = new Set(["observed_applied", "apply_next", "review_next"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function textOf(item) {
  return [
    item.title,
    item.provider,
    item.category,
    item.desc,
    ...(item.tags || []),
    ...(item.sources || []),
  ].filter(Boolean).join(" ");
}

function parseSwaggerJson(html) {
  const start = html.indexOf("var swaggerJson = `");
  if (start < 0) return null;
  const bodyStart = start + "var swaggerJson = `".length;
  const end = html.indexOf("`;", bodyStart);
  if (end < 0 || end === bodyStart) return null;
  return JSON.parse(html.slice(bodyStart, end));
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function mapWrapper(item) {
  const text = textOf(item);
  if (/어린이보호구역|스쿨존|통학로|교통사고|옐로우 카펫|안전정보/u.test(text)) {
    return {
      skill: "k-parent-school-info",
      package: "packages/k-parent-source-traffic-safety",
      wrapper: "school-zone safety source",
    };
  }
  if (/지역아동센터|다함께돌봄|아이돌봄|아동복지|한부모|복지서비스|임신|다자녀|가족사랑/u.test(text)) {
    return {
      skill: "k-parent-application-helper",
      package: "packages/k-parent-source-welfare",
      wrapper: "welfare/care service source",
    };
  }
  if (/응급|응급실|약국|안전상비의약품|병원|의료/u.test(text)) {
    return {
      skill: "k-parent-application-helper",
      package: "packages/k-parent-source-emergency",
      wrapper: "emergency/pharmacy lookup",
    };
  }
  if (/어린이집|유치원|보육/u.test(text)) {
    return {
      skill: "k-parent-kindergarten-info",
      package: "packages/k-parent-source-childinfo",
      wrapper: "childcare/kindergarten directory",
    };
  }
  if (/놀이시설|도시공원|어린이공원|물놀이장|유아숲|산림교육|농촌교육농장|공공체육시설|국민체육센터|생활체육/u.test(text)) {
    return {
      skill: "k-parent-play-finder",
      package: "packages/k-parent-source-playground",
      wrapper: "play/outdoor facility source",
    };
  }
  if (/도서관|문화행사|문화가 있는 날|평생학습|강좌|통합 예약|공공예약|영화상영|문화기반시설|지방문화원/u.test(text)) {
    return {
      skill: "k-parent-culture-center-events",
      package: "packages/k-parent-source-culture",
      wrapper: "culture/course/reservation source",
    };
  }
  if (/수유실|공중화장실|개방화장실|무장애|편의시설|철도/u.test(text)) {
    return {
      skill: "k-parent-travel-recommender",
      package: "packages/k-parent-source-tourapi",
      wrapper: "baby-friendly facility/travel source",
    };
  }
  return {
    skill: "k-parent-data-collector",
    package: "packages/k-parent-core",
    wrapper: "generic data.go.kr source",
  };
}

function classifyAction(item) {
  const text = textOf(item);
  if (item.bucket === "apply_next") return "apply";
  if (item.bucket === "observed_applied") return "verify_and_wrap";
  if (item.apiType === "LINK") return "hold_link_type";
  if (item.applyButtonPresent === true) return "review_then_apply";
  return "review_detail_again";
}

function specSummary(spec) {
  if (!spec?.paths) {
    return {
      hasSpec: false,
      title: spec?.info?.title || null,
      host: null,
      basePath: null,
      operations: [],
    };
  }
  const operations = Object.entries(spec.paths).flatMap(([apiPath, value]) => {
    const operation = value.get || value.post;
    if (!operation) return [];
    return [{
      method: value.get ? "GET" : "POST",
      path: apiPath,
      summary: operation.summary || null,
      required: (operation.parameters || [])
        .filter((param) => param.required)
        .map((param) => param.name),
      optional: (operation.parameters || [])
        .filter((param) => !param.required)
        .map((param) => param.name),
    }];
  });
  return {
    hasSpec: true,
    title: spec.info?.title || null,
    description: spec.info?.description || null,
    host: spec.host || null,
    basePath: spec.basePath || "",
    schemes: spec.schemes || [],
    operations,
  };
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "k-parent-skill-spec-matrix" },
      signal: controller.signal,
    });
    return { response, text: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

async function enrich(item) {
  const wrapper = mapWrapper(item);
  const action = classifyAction(item);
  try {
    const { response, text } = await fetchWithTimeout(item.url);
    const detailTitle = text.match(/<title>(.*?)<\/title>/isu)?.[1]
      ?.replace(/\s+/gu, " ")
      .replace(/\s*\|\s*공공데이터포털\s*$/u, "")
      .trim();
    let spec = null;
    let specError = null;
    try {
      spec = parseSwaggerJson(text);
    } catch (error) {
      specError = error.message;
    }
    const summary = specSummary(spec);
    return {
      ...summary,
      id: String(item.id),
      title: item.title || detailTitle || summary.title,
      provider: item.provider || null,
      bucket: item.bucket,
      action,
      apiType: item.apiType || null,
      url: item.url,
      detailPk: firstDefined(
        item.detailPk,
        text.match(/id="publicDataDetailPk"\s+value="([^"]+)"/u)?.[1],
      ) || null,
      applyButtonPresent: firstDefined(
        item.applyButtonPresent,
        text.includes(`fn_goOpenAPIRequestForm('${item.id}')`),
      ),
      httpStatus: response.status,
      specError,
      ...wrapper,
    };
  } catch (error) {
    return {
      id: String(item.id),
      title: item.title,
      provider: item.provider || null,
      bucket: item.bucket,
      action,
      apiType: item.apiType || null,
      url: item.url,
      fetchError: error.message,
      ...wrapper,
    };
  }
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function renderMarkdown(items) {
  const lines = [];
  lines.push("# k-parent-skill data.go.kr API 스펙/래핑 매트릭스");
  lines.push("");
  lines.push("`tmp/data_portal_k_parent_apply_queue.json`의 신청/검토/관측 완료 후보를 기준으로 공개 상세 페이지에서 swagger 명세를 다시 추출한 결과다.");
  lines.push("");
  lines.push("## 요약");
  lines.push("");
  const byAction = items.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] || 0) + 1;
    return acc;
  }, {});
  for (const [action, count] of Object.entries(byAction)) {
    lines.push(`- \`${action}\`: ${count}건`);
  }
  lines.push(`- swagger 명세 있음: ${items.filter((item) => item.hasSpec).length}건`);
  lines.push(`- swagger 명세 없음/비어 있음: ${items.filter((item) => !item.hasSpec).length}건`);
  lines.push("");

  for (const action of ["apply", "review_then_apply", "verify_and_wrap", "hold_low_parent_runtime_value", "hold_link_type", "review_detail_again"]) {
    const rows = items.filter((item) => item.action === action);
    if (!rows.length) continue;
    lines.push(`## ${action}`);
    lines.push("");
    lines.push("| ID | 제목 | 스킬 | 패키지 | 신청버튼 | endpoint | operations | 비고 |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const item of rows) {
      const endpoint = item.hasSpec ? `${item.host || ""}${item.basePath || ""}` : "swaggerJson 없음";
      const operations = (item.operations || []).slice(0, 3).map((operation) => operation.path).join("<br>");
      const note = item.fetchError || item.specError || item.wrapper || "";
      lines.push([
        `[${item.id}](${item.url})`,
        String(item.title || "").replace(/\|/gu, "/"),
        `\`${item.skill}\``,
        `\`${item.package}\``,
        item.applyButtonPresent === true ? "있음" : (item.applyButtonPresent === false ? "없음" : "-"),
        endpoint.replace(/\|/gu, "/"),
        operations.replace(/\|/gu, "/"),
        String(note).replace(/\|/gu, "/"),
      ].join(" | ").replace(/^/u, "| ").replace(/$/u, " |"));
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  const queue = readJson(QUEUE_FILE);
  const candidates = queue.items.filter((item) => INCLUDED_BUCKETS.has(item.bucket));
  const enriched = await mapLimit(candidates, 6, (item) => enrich(item));
  const sorted = enriched.sort((a, b) => {
    const order = {
      apply: 0,
      review_then_apply: 1,
      verify_and_wrap: 2,
      hold_low_parent_runtime_value: 3,
      hold_link_type: 4,
      review_detail_again: 5,
    };
    return (order[a.action] ?? 99) - (order[b.action] ?? 99)
      || String(a.package).localeCompare(String(b.package), "ko")
      || String(a.title).localeCompare(String(b.title), "ko");
  });
  const summary = sorted.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), summary, items: sorted }, null, 2));
  fs.writeFileSync(OUTPUT_MD, renderMarkdown(sorted));
  console.log(JSON.stringify({
    total: sorted.length,
    summary,
    hasSpec: sorted.filter((item) => item.hasSpec).length,
    missingSpec: sorted.filter((item) => !item.hasSpec).length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
