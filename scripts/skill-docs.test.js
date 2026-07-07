let test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const childProcess = require("node:child_process");

const repoRoot = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

// Skills live under skills/ (product) and examples/ (inherited upstream demos).
// Resolve a skill directory name to its container so path references stay
// correct regardless of which container a given skill currently lives in.
const SKILL_CONTAINER = (() => {
  const map = new Map();
  for (const container of ["skills", "examples"]) {
    const dir = path.join(repoRoot, container);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (fs.existsSync(path.join(dir, name, "SKILL.md"))) map.set(name, container);
    }
  }
  return map;
})();

function skillRel(name, ...rest) {
  return path.join(SKILL_CONTAINER.get(name) ?? "skills", name, ...rest);
}

function skillAbs(name, ...rest) {
  return path.join(repoRoot, skillRel(name, ...rest));
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listMarkdownFiles(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return relativePath.endsWith(".md") ? [relativePath] : [];

  return fs
    .readdirSync(absolutePath)
    .filter((name) => ![".git", "node_modules"].includes(name))
    .flatMap((name) => listMarkdownFiles(path.join(relativePath, name)));
}

function findSection(doc, heading) {
  const escaped = escapeRegex(heading);
  const match = doc.match(new RegExp(`${escaped}[\\s\\S]*?(?=\\n## |\\n### |$)`));

  assert.ok(match, `expected section headed by "${heading}"`);
  return match[0];
}

function assertOliveYoungCloneFallbackCommands(doc, label) {
  assert.match(doc, /node dist\/bin\.js health/, `${label} should document the runnable local health command`);
  assert.match(
    doc,
    /node dist\/bin\.js get \/api\/oliveyoung\/stores --keyword 명동 --limit 5 --json/,
    `${label} should document the runnable local store lookup command`,
  );
  assert.match(
    doc,
    /node dist\/bin\.js get \/api\/oliveyoung\/products --keyword 선크림 --size 5 --json/,
    `${label} should document the runnable local product lookup command`,
  );
  assert.match(
    doc,
    /node dist\/bin\.js get \/api\/oliveyoung\/inventory --keyword 선크림 --storeKeyword 명동 --size 5 --json/,
    `${label} should document the runnable local inventory lookup command`,
  );
  assert.doesNotMatch(doc, /^\s*npx daiso\b/m, `${label} should not publish broken clone-local npx commands`);
}

function assertOliveYoungCloneFallbackShorthand(doc, label) {
  assert.match(
    doc,
    /git clone https:\/\/github\.com\/hmmhmmhm\/daiso-mcp\.git && cd daiso-mcp && npm install && npm run build/,
    `${label} should include a runnable shorthand that changes into the clone before install/build`,
  );
  assert.doesNotMatch(
    doc,
    /git clone https:\/\/github\.com\/hmmhmmhm\/daiso-mcp\.git && npm install && npm run build/,
    `${label} should not publish the broken shorthand that skips cd daiso-mcp`,
  );
}

function extractQuotedEntries(block, indent) {
  return block
    .split("\n")
    .map((line) => line.match(new RegExp(`^ {${indent}}"([^"]+)":\\s*(.+?)(?:,)?$`)))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.trim()]);
}

function findPrintedObjectBlock(doc, carrier) {
  const block = [...doc.matchAll(/print\(json\.dumps\(\{\n([\s\S]*?)\n\}, ensure_ascii=False, indent=2\)\)/g)]
    .map((match) => match[1])
    .find((candidate) => candidate.includes(`"carrier": "${carrier}"`));

  assert.ok(block, `expected ${carrier} normalized JSON example`);
  return block;
}

function findRecentEventsBlock(doc, carrier) {
  const block = [...doc.matchAll(/normalized_events = \[\n\s*\{\n([\s\S]*?)\n\s*\}\n\s*for [^\n]+ in events\n\]/g)]
    .map((match) => match[1])
    .find((candidate) => candidate.includes('"status_code":') === (carrier === "cj"));

  assert.ok(block, `expected ${carrier} recent_events example`);
  return block;
}

function findJsonFenceAfterLabel(doc, label) {
  return JSON.parse(findJsonFenceTextAfterLabel(doc, label));
}

function findJsonFenceTextAfterLabel(doc, label) {
  const escaped = escapeRegex(label);
  const match = doc.match(new RegExp(`${escaped}[\\s\\S]*?\\\`\\\`\\\`json\\n([\\s\\S]*?)\\n\\\`\\\`\\\``));

  assert.ok(match, `expected JSON example after "${label}"`);
  return match[1];
}

function assertSampleProvenance(doc, sectionLabel, expected, docLabel) {
  const escapedSectionLabel = escapeRegex(sectionLabel);
  const escapedVerifiedAt = escapeRegex(expected.verified_at);
  const escapedInvoice = escapeRegex(expected.invoice);

  assert.match(
    doc,
    new RegExp(
      `${escapedSectionLabel}[\\s\\S]*?아래 값은 ${escapedVerifiedAt} 기준 live smoke test\\(\\x60${escapedInvoice}\\x60\\)에서 확인한 정규화 결과다\\.\\n\\n\\\`\\\`\\\`json`,
    ),
    `${docLabel} ${sectionLabel} provenance line must stay pinned to the verified smoke-test date and invoice`,
  );
}

function assertSanitizedPublicOutput(output, label) {
  const serialized = JSON.stringify(output);

  assert.doesNotMatch(serialized, /\bTEL\b/i, `${label} must not leak TEL fragments`);
  assert.doesNotMatch(
    serialized,
    /\d{2,4}[.\-]\d{3,4}[.\-]\d{4}/,
    `${label} must not leak phone-number-like strings anywhere in the published sample`,
  );
  assert.doesNotMatch(serialized, /crgNm/, `${label} must not leak CJ assignee/source fields`);
  assert.doesNotMatch(serialized, /sender/i, `${label} must not leak sender fields`);
  assert.doesNotMatch(serialized, /receiver/i, `${label} must not leak receiver fields`);
  assert.doesNotMatch(serialized, /delivered_to/i, `${label} must not leak delivered_to fields`);
}

function assertKakaoBarNearbySadangSmokeSnapshot(smoke, label) {
  assert.equal(smoke.anchor.name, "사당1동먹자골목상점가", `${label} anchor should stay on the verified area landmark`);
  assert.equal(smoke.meta.openNowCount, 4, `${label} should publish the verified open-now count`);
  assert.deepEqual(
    smoke.items.map((item) => item.name),
    ["우미노식탁", "방배을지로골뱅이술집포차 사당역점", "커먼테이블"],
    `${label} should keep the verified top-3 ordering`,
  );
}

if (readJson("package.json").name === "k-parent-skill") {
  const runParentSkillTest = test;
  const sourceCredentialRefs = {
    "k-parent-source-neis": ["KEDU_INFO_KEY"],
    "k-parent-source-tourapi": ["KSKILL_TOURAPI_KEY"],
    "k-parent-source-playground": ["KSKILL_DATAGOKR_KEY"],
    "k-parent-source-traffic-safety": ["KSKILL_DATAGOKR_KEY"],
    "k-parent-source-seoul": ["KSKILL_SEOUL_KEY"],
    "k-parent-source-library": ["KSKILL_LIBRARY_KEY"],
    "k-parent-source-culture": ["KSKILL_CULTURE_KEY"],
    "k-parent-source-childinfo": ["KSKILL_DATAGOKR_KEY"],
    "k-parent-source-emergency": ["KSKILL_DATAGOKR_KEY"],
    "k-parent-source-naver": ["KSKILL_NAVER_CLIENT_ID", "KSKILL_NAVER_CLIENT_SECRET"],
    "k-parent-source-coupang": ["KSKILL_COUPANG_ACCESS_KEY", "KSKILL_COUPANG_SECRET_KEY"],
    "k-parent-source-youtube": ["KSKILL_YOUTUBE_KEY"],
    "k-parent-source-welfare": ["KSKILL_DATAGOKR_KEY"],
  };

  runParentSkillTest("parent repository context documents the inherited architecture conventions", () => {
    const readme = read("README.md");
    const agents = read("AGENTS.md");
    const claudePath = path.join(repoRoot, "CLAUDE.md");
    const architecture = read(path.join("docs", "architecture.md"));
    const onboarding = read(path.join("docs", "onboarding.md"));
    const addingSkill = read(path.join("docs", "adding-a-skill.md"));
    const roadmap = read(path.join("docs", "roadmap.md"));
    const projectStructure = read(path.join("docs", "specs", "project-structure.md"));
    const departments = read(path.join("docs", "departments", "README.md"));
    const planning = read(path.join("docs", "planning", "README.md"));
    const scaffolding = read(path.join("docs", "planning", "scaffolding-plan.md"));
    const productization = read(path.join("docs", "productization-gstack.md"));
    const briefing = read(path.join("docs", "briefing.html"));

    assert.match(readme, /NomaDamas\/k-skill/);
    assert.match(readme, /^# 대한민국 부모 생활정보 스킬$/m);
    assert.doesNotMatch(readme, /^# k-parent-skill$/m);
    assert.match(readme, /\[아키텍처 컨벤션\]\(docs\/architecture\.md\)/);
    assert.match(readme, /\[처음 사용자 온보딩\]\(docs\/onboarding\.md\).*저장소 목적, 기능 지형도, 설치 후 확인, fixture-first 동작, 검증 명령/);
    assert.match(readme, /\[설치 방법\]\(docs\/install\.md\).*`k-parent-skill` 전체 설치, parent 제품 스킬 선택 설치, 예제 스킬 `--full-depth` 안내/);
    assert.match(readme, /필요한 제품 스킬\(`skills\/\*`\) 또는 예제 스킬\(`examples\/\*`\)의 `SKILL\.md`/);
    assert.doesNotMatch(readme, /필요한 데모 스킬/);
    assert.match(agents, /container skill folders/);
    assert.match(agents, /skills\/\*/);
    assert.match(agents, /examples\/\*/);
    assert.match(agents, /`SKILL\.md`-only concept docs/);
    assert.match(agents, /Promote a concept doc to `packages\/\*` or `scripts\/\*`/);
    assert.match(agents, /`skills\/<skill>\/references\/\*\.md` or `examples\/<skill>\/references\/\*\.md`/);
    assert.doesNotMatch(agents, /in `<skill>\/references\/\*\.md`/);
    assert.doesNotMatch(agents, /demo placeholders/);
    assert.match(agents, /Agent context conventions/);
    assert.match(agents, /SKILL\.md authoring rules/);
    assert.match(agents, /`## 데이터 소스` section/);
    assert.doesNotMatch(agents, /## 데이터 소스 \(deterministic packages\)/);
    assert.match(agents, /gstack productization/);
    assert.equal(fs.lstatSync(claudePath).isSymbolicLink(), true, "CLAUDE.md should be a compatibility symlink");
    assert.equal(fs.readlinkSync(claudePath), "AGENTS.md");
    assert.match(architecture, /^# 아키텍처 컨벤션$/m);
    assert.match(architecture, /^## 스킬 우선 패턴$/m);
    assert.match(architecture, /^## 구현 승격 경로$/m);
    assert.match(architecture, /^## 디파트먼트 분류$/m);
    assert.match(architecture, /^## gstack 개발 루프$/m);
    assert.doesNotMatch(
      architecture,
      /^## (?:Repository shape|Skill-first pattern|Progressive disclosure pattern|Department taxonomy|Implementation promotion path|Public data integration pattern|Normalization layer pattern|Cache and crawler pattern|Mobile agent product pattern|Document ingestion pattern|Commerce and affiliate pattern|Sensitive transaction boundary|gstack development loop|Parent-domain output schema|Safety and privacy|Agent context surfaces)$/m,
    );
    assert.match(architecture, /`SKILL\.md`-only concept docs for concept validation/);
    assert.match(architecture, /`SKILL\.md` concept doc: instructions, examples, failure modes, and safety rules/);
    assert.match(architecture, /`skills\/<skill>\/references\/\*\.md` or `examples\/<skill>\/references\/\*\.md`/);
    assert.doesNotMatch(architecture, /in a `<skill>\/references\/\*\.md` file/);
    assert.doesNotMatch(architecture, /placeholder docs/);
    assert.match(architecture, /`CLAUDE\.md`: compatibility symlink to `AGENTS\.md`/);
    assert.match(onboarding, /^# 처음 사용자 온보딩 가이드$/m);
    assert.match(onboarding, /^## 2\. 기능 지형도$/m);
    assert.match(onboarding, /^## 3\. 설치 후 첫 확인 흐름$/m);
    assert.match(onboarding, /^## 4\. 데이터가 실제로 어떻게 동작하는지$/m);
    assert.match(onboarding, /^## 7\. 개발자가 기능을 확인하는 방법$/m);
    assert.match(onboarding, /fixture-first/);
    assert.match(onboarding, /npm run ci/);
    assert.match(onboarding, /node --test scripts\/skill-docs\.test\.js/);
    assert.match(onboarding, /find \. \\?\( -name '\*\.tgz'/);
    assert.match(onboarding, /명시적 사용자 승인 전 실행하지 않는다/);
    assert.match(onboarding, /출처 URL/);
    assert.match(onboarding, /freshness/);
    assert.match(onboarding, /k-parent-school-info/);
    assert.match(onboarding, /k-parent-shopping-recommender/);
    assert.match(roadmap, /^# 로드맵$/m);
    assert.match(roadmap, /^## 디파트먼트 로드맵$/m);
    assert.match(roadmap, /^## 제품 스킬 상태$/m);
    assert.match(roadmap, /^## v1 구현 후보$/m);
    assert.match(roadmap, /^## 이후 후보$/m);
    assert.doesNotMatch(
      roadmap,
      /^## (?:Department roadmap|Product skill status|v1 implementation candidates|Later candidates)$/m,
    );
    assert.match(addingSkill, /`AGENTS\.md` 참고; `CLAUDE\.md`는 호환 symlink/);
    assert.match(addingSkill, /`CLAUDE\.md`는 `AGENTS\.md` symlink/);
    assert.match(addingSkill, /\| \*\*SKILL\.md 전용\*\* \| [^\n]+ \| `k-parent-knowledge-helper`, `k-parent-mobile-agent` \|/);
    assert.doesNotMatch(addingSkill, /\| \*\*SKILL\.md 전용\*\* \| [^\n]+ \| `k-parent-meal-planner`, `k-parent-school-info` \|/);
    assert.match(addingSkill, /새 제품 스킬이면 `README\.md`, `docs\/skill-routing\.md`, `docs\/roadmap\.md`, `docs\/departments\/README\.md` 갱신/);
    assert.match(addingSkill, /새 예제 스킬이면 `examples\/README\.md`/);
    assert.match(addingSkill, /`packages\/k-skill-proxy\/README\.md`와 `docs\/features\/k-skill-proxy\.md`/);
    assert.match(addingSkill, /`docs\/setup\.md`, `docs\/security-and-secrets\.md`, `docs\/sources\.md`, `\.env\.example`, `OWNER-TASKS\.md`/);
    assert.match(addingSkill, /phase: p0/);
    assert.match(addingSkill, /^  category: parenting$/m);
    assert.doesNotMatch(addingSkill, /^  category: utility$/m);
    assert.match(addingSkill, /`p0`\(핵심 제품 후보\), `implemented`\(runtime 패키지\/스크립트 구현 있음\), `concept`\(SKILL\.md-only 컨셉\)/);
    assert.doesNotMatch(addingSkill, /`v1`\s*\(안정\)\s*\/\s*`v1\.5`/);
    assert.match(addingSkill, /name: k-parent-my-new-skill/);
    assert.match(addingSkill, /`skills\/k-parent-my-new-skill\/references\/\*\.md`/);
    assert.match(addingSkill, /`skills\/k-parent-my-new-skill\/SKILL\.md`/);
    assert.match(addingSkill, /`docs\/features\/k-parent-my-new-skill\.md`/);
    assert.match(addingSkill, /scripts\/k_parent_my_new_skill\.py/);
    assert.doesNotMatch(addingSkill, /`skills\/my-new-skill/);
    assert.doesNotMatch(addingSkill, /scripts\/(?:my_new_skill|my_skill)\.py/);
    assert.match(addingSkill, /`examples\/korean-scholarship-search\/references\/\*\.md`/);
    assert.match(addingSkill, /해당 skill 폴더 내부 `references\/`/);
    assert.match(addingSkill, /`skills\/k-parent-\*` 제품 스킬은 `license: MIT`/);
    assert.match(addingSkill, /`metadata\.category: parenting`/);
    assert.match(addingSkill, /허용된 `metadata\.phase`/);
    assert.match(addingSkill, /^## 핵심 동작$/m);
    assert.match(addingSkill, /^## 사용 시점$/m);
    assert.match(addingSkill, /^## 전형적 흐름$/m);
    assert.match(addingSkill, /^## 완료 조건$/m);
    assert.match(addingSkill, /^## 실패 모드$/m);
    assert.match(addingSkill, /^## 참고$/m);
    assert.doesNotMatch(
      addingSkill,
      /^## (?:What this skill does|When to use|Workflow|Done when|Failure modes|Notes|Prerequisites)$/m,
    );
    assert.doesNotMatch(addingSkill, /## 데이터 소스 \(deterministic packages\)/);
    assert.doesNotMatch(addingSkill, /\*\*`<skill>\/references\/\*\.md`\*\*/);
    assert.match(addingSkill, /사용자\/client env와 proxy 운영자 env를 구분/);
    assert.match(projectStructure, /`AGENTS\.md` is the source of truth; `CLAUDE\.md` is a compatibility symlink/);
    assert.match(projectStructure, /The runtime layer is partially implemented/);
    assert.match(projectStructure, /Do not create additional packages from this outline until their implementation starts with fixtures/);
    assert.match(projectStructure, /skills\/[\s\S]*<skill-name>\/[\s\S]*SKILL\.md/);
    assert.match(projectStructure, /examples\/[\s\S]*<skill-name>\/[\s\S]*SKILL\.md/);
    assert.match(projectStructure, /Product skill directories under `skills\/` are the installable unit/);
    assert.match(projectStructure, /Inherited upstream demos live under `examples\/` and require `--full-depth`/);
    assert.match(projectStructure, /k-parent-source-childinfo\/\s+# kindergarten and childcare disclosure adapters/);
    assert.match(projectStructure, /k-parent-source-tourapi\/\s+# TourAPI event\/place adapters/);
    assert.match(projectStructure, /k-parent-brief\/\s+# Today Brief composition/);
    assert.match(projectStructure, /k-parent-calendar\/\s+# calendar candidates, dedupe, ICS/);
    assert.match(projectStructure, /k-parent-doc-extract\/\s+# notice text extraction/);
    assert.match(projectStructure, /k-parent-source-playground\/\s+# playground and urban park adapters/);
    assert.match(projectStructure, /k-parent-source-traffic-safety\/\s+# school-zone safety adapters/);
    assert.match(projectStructure, /k-parent-source-welfare\/\s+# Government24\/Bokjiro guidance adapters/);
    assert.match(projectStructure, /k-parent-source-seoul\/\s+# Seoul reservation adapters/);
    assert.match(projectStructure, /k-parent-source-emergency\/\s+# emergency\/pharmacy adapters/);
    assert.match(projectStructure, /k-parent-source-naver\/\s+# Naver shopping\/blog and collector runner/);
    assert.match(projectStructure, /k-parent-source-coupang\/\s+# Coupang Partners product adapter/);
    assert.match(projectStructure, /k-parent-source-youtube\/\s+# YouTube safe-search content adapter/);
    assert.match(projectStructure, /k-skill-proxy\/\s+# existing free\/public API proxy extended with parent-domain routes/);
    assert.match(projectStructure, /scripts\/[\s\S]*validate-skills\.sh/);
    assert.match(projectStructure, /scripts\/[\s\S]*data_portal_k_parent_\*\.mjs/);
    assert.match(projectStructure, /scripts\/[\s\S]*neis_\*_probe\.py/);
    assert.match(projectStructure, /python-packages\/[\s\S]*README\.md\s+# no Python package exists yet/);
    assert.match(projectStructure, /Future candidate files:[\s\S]*scripts\/sync-region-codes\.\*/);
    assert.match(projectStructure, /Future candidate files:[\s\S]*python-packages\/k-parent-etl\//);
    assert.match(projectStructure, /source inventory in `docs\/sources\.md`/);
    assert.match(projectStructure, /issue checklist per source/);
    assert.match(projectStructure, /Product skill folders stay flat under `skills\/\*`; inherited reference skills stay under `examples\/\*`/);
    assert.doesNotMatch(projectStructure, /Root-level skill directories remain the installable unit/);
    assert.doesNotMatch(projectStructure, /Root skill folders stay flat/);
    assert.doesNotMatch(projectStructure, /k-parent-proxy/);
    assert.doesNotMatch(projectStructure, /k-parent-source-(childcare|events|benefits)/);
    assert.doesNotMatch(projectStructure, /k-parent-recommender/);
    assert.doesNotMatch(projectStructure, /future structure, not current code/i);
    assert.doesNotMatch(projectStructure, /source inventory under future docs or issue tracker/);
    assert.match(departments, /`school`/);
    assert.match(departments, /`academy`/);
    assert.match(departments, /skills\/<skill-name>\/SKILL\.md/);
    assert.match(departments, /examples\/<skill-name>\/SKILL\.md/);
    assert.match(departments, /`play`/);
    assert.match(departments, /`life`/);
    assert.match(departments, /`trend`/);
    assert.match(departments, /`shopping`/);
    assert.match(departments, /`nutrition`/);
    assert.match(planning, /flat inside `skills\/`/);
    assert.match(planning, /under `examples\/`/);
    assert.match(planning, /일부 `packages\/k-parent-\*` 런타임이 구현/);
    assert.doesNotMatch(planning, /코드 변경 없이/);
    assert.match(scaffolding, /skills\/<skill>\/SKILL\.md/);
    assert.match(scaffolding, /examples\/<skill>\/SKILL\.md/);
    assert.match(scaffolding, /Current implemented files:[\s\S]*packages\/k-parent-core\//);
    assert.match(scaffolding, /Current implemented files:[\s\S]*packages\/k-parent-source-neis\//);
    assert.match(scaffolding, /packages\/k-parent-source-childinfo\//);
    assert.match(scaffolding, /packages\/k-parent-source-tourapi\//);
    assert.match(scaffolding, /packages\/k-parent-source-playground\//);
    assert.match(scaffolding, /packages\/k-parent-source-traffic-safety\//);
    assert.match(scaffolding, /packages\/k-parent-source-welfare\//);
    assert.match(scaffolding, /packages\/k-parent-source-seoul\//);
    assert.match(scaffolding, /packages\/k-parent-source-emergency\//);
    assert.match(scaffolding, /packages\/k-parent-brief\//);
    assert.match(scaffolding, /packages\/k-parent-source-naver\//);
    assert.match(scaffolding, /packages\/k-parent-source-youtube\//);
    assert.match(scaffolding, /docs\/research\/ranking-and-explanations\.md/);
    assert.match(scaffolding, /Current implemented files:[\s\S]*packages\/k-parent-doc-extract\//);
    assert.match(scaffolding, /Current implemented files:[\s\S]*packages\/k-parent-calendar\//);
    assert.match(scaffolding, /Future candidate files:[\s\S]*python-packages\/k-parent-ocr-eval\//);
    assert.match(scaffolding, /Future files:[\s\S]*apps\/mobile-web\//);
    assert.match(scaffolding, /Future files:[\s\S]*apps\/api\//);
    assert.match(scaffolding, /docs\/research\/culture-private-source-surface\.md/);
    assert.match(scaffolding, /Do not create a `packages\/k-parent-source-\*`/);
    assert.doesNotMatch(scaffolding, /packages\/k-parent-source-culture-private\//);
    assert.doesNotMatch(scaffolding, /packages\/k-parent-recommender\//);
    assert.doesNotMatch(scaffolding, /packages\/k-parent-doc-capture\//);
    assert.doesNotMatch(scaffolding, /packages\/k-parent-source-(childcare|events|benefits)\//);
    assert.match(productization, /gstack Operating Loop/i);
    assert.match(productization, /Mobile Parent Agent MVP/);
    assert.match(productization, /Coupang affiliate links are optional monetization/);
    assert.match(productization, /product skill folders under `skills\/\*`, inherited example skills under `examples\/\*`/);
    assert.match(read(path.join("docs", "planning", "omc-agent-plan.md")), /product skills under `skills\/\*`, inherited examples under `examples\/\*`/);
    assert.match(read(path.join("docs", "planning", "omc-agent-plan.md")), /skill concept docs/);
    assert.match(read(path.join("docs", "planning", "omc-agent-plan.md")), /Recommended current follow-up handoff/);
    assert.match(read(path.join("docs", "planning", "omc-agent-plan.md")), /packages\/k-parent-source-neis\/test\/fixtures\//);
    assert.doesNotMatch(productization, /root skill folders/i);
    assert.doesNotMatch(read(path.join("docs", "planning", "omc-agent-plan.md")), /root skill folders/i);
    assert.doesNotMatch(read(path.join("docs", "planning", "omc-agent-plan.md")), /skill placeholder docs/);
    assert.doesNotMatch(read(path.join("docs", "planning", "omc-agent-plan.md")), /Recommended first implementation handoff/);
    assert.doesNotMatch(read(path.join("docs", "planning", "omc-agent-plan.md")), /tests\/fixtures\/neis/);
    assert.match(briefing, /부모용 제품 스킬과 컨셉 워크플로우/);
    assert.match(briefing, /`application-helper`, `schedule-manager`, `academy-connector`, `mobile-agent`, `knowledge-helper`/);
    assert.doesNotMatch(briefing, /부모용 데모 스킬 플레이스홀더/);
    assert.match(addingSkill, /k-parent-skill/);
  });

  runParentSkillTest("parent product skills are advertised and documented", () => {
    const readme = read("README.md");
    const architecture = read(path.join("docs", "architecture.md"));
    const parentSkills = [
      "k-parent-meal-planner",
      "k-parent-school-info",
      "k-parent-kindergarten-info",
      "k-parent-play-finder",
      "k-parent-festival-finder",
      "k-parent-culture-center-events",
      "k-parent-application-helper",
      "k-parent-academy-connector",
      "k-parent-school-doc-capture",
      "k-parent-shopping-recommender",
      "k-parent-mobile-agent",
      "k-parent-data-collector",
      "k-parent-schedule-manager",
      "k-parent-travel-recommender",
      "k-parent-knowledge-helper",
      "k-parent-content-recommender",
      "k-parent-quiz-maker",
    ];

    for (const skillName of parentSkills) {
      assert.match(readme, new RegExp(`\\| [^\\n]+ \\| \`${escapeRegex(skillName)}\` \\|`));
      assert.ok(fs.existsSync(skillAbs(skillName, "SKILL.md")), `expected ${skillName}/SKILL.md`);
      assert.ok(
        fs.existsSync(path.join(repoRoot, "docs", "features", `${skillName}.md`)),
        `expected docs/features/${skillName}.md`,
      );
    }

    for (const skillName of [
      "k-parent-meal-planner",
      "k-parent-school-info",
      "k-parent-kindergarten-info",
      "k-parent-play-finder",
      "k-parent-festival-finder",
      "k-parent-culture-center-events",
      "k-parent-application-helper",
      "k-parent-school-doc-capture",
      "k-parent-shopping-recommender",
      "k-parent-data-collector",
      "k-parent-schedule-manager",
      "k-parent-travel-recommender",
      "k-parent-content-recommender",
      "k-parent-academy-connector",
      "k-parent-quiz-maker",
    ]) {
      assert.match(readme, new RegExp(`\\[[^\\]]+ 기능 문서\\]\\(docs/features/${escapeRegex(skillName)}\\.md\\)`));
    }

    for (const skillName of [
      "k-parent-knowledge-helper",
      "k-parent-mobile-agent",
    ]) {
      assert.match(readme, new RegExp(`\\[[^\\]]+ 컨셉 문서\\]\\(docs/features/${escapeRegex(skillName)}\\.md\\)`));
    }

    assert.match(readme, /`knowledge-helper`·`mobile-agent`는 아직 패키지 경계가 없는 컨셉/);
    assert.doesNotMatch(readme, /`knowledge-helper`·`mobile-agent`·`quiz-maker`는 아직 패키지 경계가 없는 컨셉/);
    assert.doesNotMatch(readme, /`academy-connector`·`knowledge-helper`·`mobile-agent`는 아직 패키지 경계가 없는 컨셉/);
    assert.match(readme, /\| 놀이 \| 놀거리 \| `k-parent-play-finder` \|/);
    assert.match(readme, /\| 쇼핑 \| 준비물 쇼핑 \| `k-parent-shopping-recommender` \|/);
    assert.doesNotMatch(readme, /\| 놀이 \| 놀것 \| `k-parent-play-finder` \|/);
    assert.doesNotMatch(readme, /\| 쇼핑 \| 상품 추천 \| `k-parent-shopping-recommender` \|/);
    assert.match(readme, /준비물 쇼핑 추천과 쿠팡 어필리에이트/);
    assert.doesNotMatch(readme, /상품 추천과 쿠팡 어필리에이트/);
    assert.match(architecture, /child age or grade/);
    assert.match(architecture, /confirmation date/);
    assert.match(architecture, /^## 문서 인입 패턴$/m);
    assert.match(architecture, /^## 모바일 에이전트 제품 패턴$/m);
    assert.match(architecture, /^## 커머스와 제휴 패턴$/m);
    assert.match(architecture, /Do not submit applications/);
  });

  runParentSkillTest("parent skill phase metadata distinguishes implemented and concept work", () => {
    const expectedPhases = {
      "k-parent-academy-connector": "implemented",
      "k-parent-application-helper": "implemented",
      "k-parent-content-recommender": "p0",
      "k-parent-culture-center-events": "p0",
      "k-parent-data-collector": "implemented",
      "k-parent-festival-finder": "p0",
      "k-parent-kindergarten-info": "p0",
      "k-parent-knowledge-helper": "concept",
      "k-parent-meal-planner": "p0",
      "k-parent-mobile-agent": "concept",
      "k-parent-play-finder": "p0",
      "k-parent-quiz-maker": "p0",
      "k-parent-schedule-manager": "implemented",
      "k-parent-school-doc-capture": "implemented",
      "k-parent-school-info": "p0",
      "k-parent-shopping-recommender": "implemented",
      "k-parent-travel-recommender": "p0",
    };

    for (const [skillName, phase] of Object.entries(expectedPhases)) {
      const skill = read(skillRel(skillName, "SKILL.md"));
      const featureDoc = read(path.join("docs", "features", `${skillName}.md`));
      assert.match(skill, new RegExp(`phase:\\s*${escapeRegex(phase)}\\b`), `${skillName} should use phase: ${phase}`);
      if (phase === "concept") {
        assert.match(featureDoc, /^## 다음 구현 후보$/m, `${skillName} concept feature doc should document implementation candidates`);
        assert.doesNotMatch(featureDoc, /^## 남은 확장 후보$/m, `${skillName} concept feature doc should not use runtime extension wording`);
      } else {
        assert.match(featureDoc, /^## 남은 확장 후보$/m, `${skillName} runtime feature doc should document remaining extension candidates`);
        assert.doesNotMatch(featureDoc, /^## 다음 구현 후보$/m, `${skillName} runtime feature doc should not use concept implementation wording`);
      }
    }

    const parentSkillNames = fs
      .readdirSync(path.join(repoRoot, "skills"))
      .filter((name) => name.startsWith("k-parent-") && fs.existsSync(skillAbs(name, "SKILL.md")))
      .sort();

    for (const skillName of parentSkillNames) {
      const skill = read(skillRel(skillName, "SKILL.md"));
      assert.ok(Object.hasOwn(expectedPhases, skillName), `${skillName} should be classified in expectedPhases`);
      assert.match(skill, /^license:\s*MIT$/m, `${skillName} should declare MIT license`);
      assert.match(skill, /^metadata:$/m, `${skillName} should declare metadata`);
      assert.match(skill, /^  category:\s*parenting$/m, `${skillName} should use parenting category`);
      assert.match(skill, /^  locale:\s*ko-KR$/m, `${skillName} should use ko-KR locale`);
      assert.match(skill, /phase:\s*(p0|implemented|concept)\b/, `${skillName} should use an allowed parent phase`);
      assert.doesNotMatch(skill, /phase:\s*demo\b/, `${skillName} should not use phase: demo`);
      assert.match(
        skill,
        new RegExp(escapeRegex(`docs/features/${skillName}.md`)),
        `${skillName} should link its parent-facing feature doc`,
      );
    }
  });

  runParentSkillTest("parent skill descriptions are Korean, give trigger examples, and cite backing packages", () => {
    const parentSkills = [
      "k-parent-meal-planner",
      "k-parent-school-info",
      "k-parent-kindergarten-info",
      "k-parent-play-finder",
      "k-parent-festival-finder",
      "k-parent-culture-center-events",
      "k-parent-application-helper",
      "k-parent-academy-connector",
      "k-parent-school-doc-capture",
      "k-parent-shopping-recommender",
      "k-parent-mobile-agent",
      "k-parent-data-collector",
      "k-parent-schedule-manager",
      "k-parent-travel-recommender",
      "k-parent-knowledge-helper",
      "k-parent-content-recommender",
      "k-parent-quiz-maker",
    ];

    // Backing source/logic packages each skill must cite in its one-line description.
    const packageRefs = {
      "k-parent-academy-connector": ["k-parent-doc-extract", "k-parent-calendar"],
      "k-parent-application-helper": ["k-parent-source-welfare"],
      "k-parent-content-recommender": ["k-parent-source-youtube"],
      "k-parent-culture-center-events": [
        "k-parent-source-seoul",
        "k-parent-source-library",
        "k-parent-source-culture",
      ],
      "k-parent-data-collector": ["k-parent-source-naver"],
      "k-parent-festival-finder": ["k-parent-source-tourapi"],
      "k-parent-kindergarten-info": ["k-parent-source-childinfo"],
      "k-parent-meal-planner": ["k-parent-source-neis", "k-parent-brief"],
      "k-parent-mobile-agent": ["k-parent-brief"],
      "k-parent-play-finder": ["k-parent-source-playground", "k-parent-source-tourapi"],
      "k-parent-quiz-maker": ["k-parent-quiz-core", "k-parent-source-neis"],
      "k-parent-schedule-manager": ["k-parent-calendar"],
      "k-parent-school-doc-capture": ["k-parent-doc-extract", "k-parent-calendar"],
      "k-parent-school-info": [
        "k-parent-source-neis",
        "k-parent-brief",
        "k-parent-source-traffic-safety",
      ],
      "k-parent-shopping-recommender": ["k-parent-source-naver", "k-parent-source-coupang"],
      "k-parent-travel-recommender": ["k-parent-source-tourapi"],
    };

    // Overlapping play-department skills must name a sibling in the description to disambiguate.
    const overlapSiblings = {
      "k-parent-play-finder": /k-parent-(festival-finder|travel-recommender|culture-center-events)/,
      "k-parent-festival-finder": /k-parent-(play-finder|travel-recommender)/,
      "k-parent-travel-recommender": /k-parent-(play-finder|festival-finder)/,
      "k-parent-culture-center-events": /k-parent-(play-finder|festival-finder)/,
    };

    for (const skillName of parentSkills) {
      const skill = read(skillRel(skillName, "SKILL.md"));
      const descMatch = skill.match(/^description: (.+)$/m);
      assert.ok(descMatch, `${skillName} SKILL.md must have a description`);
      const description = descMatch[1];

      assert.match(description, /[가-힣]/, `${skillName} description must be Korean`);
      assert.doesNotMatch(
        description,
        /^Use when\b/,
        `${skillName} description must not be the English "Use when ..." form`,
      );
      assert.match(
        description,
        /"[^"]+"/,
        `${skillName} description must include at least one quoted trigger utterance`,
      );

      if (packageRefs[skillName]) {
        assert.match(
          description,
          new RegExp(escapeRegex(`packages/${packageRefs[skillName][0]}`)),
          `${skillName} description must cite its first backing package as a packages/ path`,
        );
        for (const packageName of packageRefs[skillName]) {
          assert.match(
            description,
            new RegExp(escapeRegex(`packages/${packageName}`)),
            `${skillName} description must cite backing package packages/${packageName}`,
          );
        }
      }

      if (overlapSiblings[skillName]) {
        assert.match(
          description,
          overlapSiblings[skillName],
          `${skillName} description must name a sibling skill to disambiguate overlap`,
        );
      }
    }
  });

  runParentSkillTest("parent skill package references use packages paths", () => {
    const parentSkillNames = fs
      .readdirSync(path.join(repoRoot, "skills"))
      .filter((name) => name.startsWith("k-parent-") && fs.existsSync(skillAbs(name, "SKILL.md")))
      .sort();

    for (const skillName of parentSkillNames) {
      const skill = read(skillRel(skillName, "SKILL.md"));
      const packageRefs = [...skill.matchAll(/`packages\/(k-parent-[a-z0-9-]+)`/g)].map((match) => match[1]);

      assert.doesNotMatch(
        skill,
        /`k-parent-(?:source-[a-z-]+|brief|calendar|doc-extract|core)`/,
        `${skillName} should cite backing packages as packages/ paths`,
      );
      assert.doesNotMatch(skill, /^## 사용하는 패키지$/m, `${skillName} should use the shared package section label`);
      assert.doesNotMatch(skill, /^## 환경 변수$/m, `${skillName} should use the shared environment section label`);
      assert.doesNotMatch(
        skill,
        /^## (?:What this skill does|When to use|Workflow|Done when|Failure modes|Notes|Guardrails|Data sources & functions)$/m,
        `${skillName} should use Korean major section headings`,
      );
      assert.doesNotMatch(
        skill,
        /^# .*[A-Za-z].*$/m,
        `${skillName} should use a Korean user-facing H1 while keeping the install name in frontmatter`,
      );
      assert.doesNotMatch(
        skill,
        /^## .*(?:deterministic packages?|approval|Generic runner|data contract|freshness|envelope|워크플로).*$/m,
        `${skillName} should not use mixed-language legacy section headings`,
      );
      assert.doesNotMatch(
        skill,
        /^### .*[A-Za-z].*$/m,
        `${skillName} should use Korean third-level step headings`,
      );
      for (const packageName of packageRefs) {
        assert.ok(
          fs.existsSync(path.join(repoRoot, "packages", packageName, "package.json")),
          `${skillName} cites missing package ${packageName}`,
        );
      }
    }
  });

  runParentSkillTest("parent skills publish practical parent-domain output fields", () => {
    const parentSkills = [
      "k-parent-meal-planner",
      "k-parent-school-info",
      "k-parent-kindergarten-info",
      "k-parent-play-finder",
      "k-parent-festival-finder",
      "k-parent-culture-center-events",
      "k-parent-application-helper",
      "k-parent-academy-connector",
      "k-parent-school-doc-capture",
      "k-parent-shopping-recommender",
      "k-parent-mobile-agent",
      "k-parent-data-collector",
      "k-parent-schedule-manager",
      "k-parent-travel-recommender",
      "k-parent-knowledge-helper",
      "k-parent-content-recommender",
      "k-parent-quiz-maker",
    ];
    const requiredSignals = [
      /아이|대상/,
      /지역|장소|기관/,
      /날짜|기간|마감|확인 기준일/,
      /출처|source/i,
      /비용|지원금|무료/,
      /준비물|필요 서류|후속 활동/,
      /다음 행동|다음 질문|다음 수집/,
    ];

    for (const skillName of parentSkills) {
      const skill = read(skillRel(skillName, "SKILL.md"));
      assert.match(skill, /^## 출력 형식$/m, `${skillName} should use the shared Korean output section heading`);
      assert.doesNotMatch(skill, /^## Output fields$/m, `${skillName} should not use the legacy English output heading`);
      const outputSection = findSection(skill, "## 출력 형식");
      for (const signal of requiredSignals) {
        assert.match(outputSection, signal, `${skillName} output fields should include ${signal}`);
      }
    }
  });

  runParentSkillTest("skill routing index maps every parent skill", () => {
    const parentSkills = [
      "k-parent-meal-planner",
      "k-parent-school-info",
      "k-parent-kindergarten-info",
      "k-parent-play-finder",
      "k-parent-festival-finder",
      "k-parent-culture-center-events",
      "k-parent-application-helper",
      "k-parent-academy-connector",
      "k-parent-school-doc-capture",
      "k-parent-shopping-recommender",
      "k-parent-mobile-agent",
      "k-parent-data-collector",
      "k-parent-schedule-manager",
      "k-parent-travel-recommender",
      "k-parent-knowledge-helper",
      "k-parent-content-recommender",
      "k-parent-quiz-maker",
    ];
    const routing = read(path.join("docs", "skill-routing.md"));
    const readme = read("README.md");

    for (const skillName of parentSkills) {
      assert.match(routing, new RegExp(escapeRegex(skillName)), `routing index must list ${skillName}`);
    }
    assert.match(routing, /공통 출력 신호/);
    assert.match(routing, /출처 URL/);
    assert.match(routing, /확인 기준일/);
    assert.match(routing, /신청\/예약 마감/);
    assert.match(routing, /비용/);
    assert.match(routing, /필요 서류/);
    assert.match(routing, /신청·예약·취소·결제·아이 개인정보 입력/);
    assert.match(readme, /\[스킬 라우팅 인덱스\]\(docs\/skill-routing\.md\)/);
  });

  runParentSkillTest("skill routing index maps hosted proxy-backed example skills", () => {
    const routing = read(path.join("docs", "skill-routing.md"));
    const expectedRoutes = [
      ["블루리본 맛집", "blue-ribbon-nearby"],
      ["근처 공영주차장", "parking-lot-search"],
      ["네이버 쇼핑", "naver-shopping-search"],
      ["네이버 뉴스", "naver-news-search"],
      ["LH 청약 공고", "lh-notice-search"],
    ];

    assert.match(routing, /보조 예제 스킬/);
    assert.match(routing, /기본 hosted proxy/);
    assert.match(routing, /사용자 API key 없이/);
    for (const [signal, skillName] of expectedRoutes) {
      assert.match(routing, new RegExp(escapeRegex(signal)), `routing should mention ${signal}`);
      assert.match(routing, new RegExp(`\\\`${escapeRegex(skillName)}\\\``), `routing should mention ${skillName}`);
    }
    assert.match(routing, /위치를 먼저 묻/);
    assert.match(routing, /기사 제목·요약·발행시각·링크/);
    assert.match(routing, /공고 목록\/상세/);
  });

  runParentSkillTest("department index maps hosted proxy-backed example skills", () => {
    const departments = read(path.join("docs", "departments", "README.md"));
    const expectedExamples = [
      ["blue-ribbon-nearby", "play", "examples/blue-ribbon-nearby"],
      ["parking-lot-search", "play", "examples/parking-lot-search"],
      ["naver-shopping-search", "shopping", "examples/naver-shopping-search"],
      ["naver-news-search", "trend", "examples/naver-news-search"],
      ["lh-notice-search", "life", "examples/lh-notice-search"],
    ];

    assert.match(departments, /Hosted Proxy Example Map/);
    assert.match(departments, /기본 hosted proxy/);
    assert.match(departments, /product skill 승격 후보/);
    for (const [skillName, primaryDepartment, skillPath] of expectedExamples) {
      assert.match(departments, new RegExp(`\\\`${escapeRegex(skillName)}\\\``), `departments should mention ${skillName}`);
      assert.match(
        departments,
        new RegExp(`\\\`${escapeRegex(skillName)}\\\`\\s*\\|\\s*\\\`${escapeRegex(primaryDepartment)}\\\``),
        `departments should map ${skillName} to ${primaryDepartment}`,
      );
      assert.match(departments, new RegExp(`\\\`${escapeRegex(skillPath)}\\\``), `departments should mention ${skillPath}`);
    }
  });

  runParentSkillTest("parent feature docs do not expose source package fixture internals", () => {
    const featureRoot = path.join(repoRoot, "docs", "features");
    const featureDocs = fs
      .readdirSync(featureRoot)
      .filter((name) => name.startsWith("k-parent-") && name.endsWith(".md"))
      .sort();

    for (const name of featureDocs) {
      const doc = read(path.join("docs", "features", name));
      assert.doesNotMatch(
        doc,
        /packages\/k-parent-source-[^`\s]+\/test\/fixtures/,
        `${name} should not expose source package fixture file paths in parent-facing docs`,
      );
      assert.doesNotMatch(doc, /플레이스홀더/, `${name} should use feature/concept doc status labels`);
      assert.doesNotMatch(doc, /데모 스킬/, `${name} should use feature/concept doc status labels`);
      assert.doesNotMatch(doc, /초기 데모/, `${name} should describe promoted runtime work from SKILL.md-only flow`);
      assert.doesNotMatch(
        doc,
        /^# .*[A-Za-z].*$/m,
        `${name} should use a Korean user-facing feature doc H1`,
      );
    }
  });

  runParentSkillTest("implemented parent feature docs keep shared package and runtime status sections", () => {
    const runtimeDocs = [
      "k-parent-academy-connector",
      "k-parent-application-helper",
      "k-parent-content-recommender",
      "k-parent-culture-center-events",
      "k-parent-data-collector",
      "k-parent-festival-finder",
      "k-parent-kindergarten-info",
      "k-parent-meal-planner",
      "k-parent-play-finder",
      "k-parent-quiz-maker",
      "k-parent-schedule-manager",
      "k-parent-school-doc-capture",
      "k-parent-school-info",
      "k-parent-shopping-recommender",
      "k-parent-travel-recommender",
    ];

    for (const skillName of runtimeDocs) {
      const docName = `${skillName}.md`;
      const doc = read(path.join("docs", "features", docName));
      const packageRefs = [...doc.matchAll(/`packages\/(k-parent-[^`/\s]+)`/g)].map((match) => match[1]);

      assert.match(doc, /^## 사용 패키지$/m, `${docName} should have a shared package table section`);
      assert.match(doc, /^## 환경변수$/m, `${docName} should use the shared environment section heading`);
      assert.match(doc, /^## 픽스처 갱신$/m, `${docName} should use the shared fixture refresh section heading`);
      assert.match(doc, /^## 남은 확장 후보$/m, `${docName} should document remaining extension candidates`);
      assert.ok(packageRefs.length > 0, `${docName} should cite at least one k-parent package path`);
      assert.match(
        doc,
        /KSKILL_|KEDU_INFO_KEY|API key가 없다|필요한 API key가 없다|외부 API key 없이|외부 키 없이/,
        `${docName} should document environment variable or no-key runtime status`,
      );
      assert.match(
        doc,
        /픽스처 갱신|fixture refresh|refresh:fixtures/,
        `${docName} should document fixture refresh command or no-refresh status`,
      );
      assert.doesNotMatch(doc, /## 구현 패키지/, `${docName} should use the shared package section label`);
      assert.doesNotMatch(doc, /다음 구현 후보/, `${docName} should use current-state extension wording`);
      assert.doesNotMatch(doc, /초기 SKILL\.md-only/, `${docName} should not describe itself as SKILL.md-only`);
      assert.doesNotMatch(
        doc,
        /^## .*(?:deterministic packages?|approval|Generic runner|data contract|[Ff]reshness|envelope|워크플로).*$/m,
        `${docName} should not use mixed-language legacy section headings`,
      );
      assert.doesNotMatch(
        doc,
        /`k-parent-(?:source-[a-z-]+|brief|calendar|doc-extract|core)`/,
        `${docName} should cite backing packages as packages/ paths`,
      );

      for (const packageName of packageRefs) {
        assert.ok(
          fs.existsSync(path.join(repoRoot, "packages", packageName, "package.json")),
          `${docName} cites missing package ${packageName}`,
        );
      }
    }
  });

  runParentSkillTest("culture center events feature doc documents implemented source packages", () => {
    const doc = read(path.join("docs", "features", "k-parent-culture-center-events.md"));

    for (const packageName of [
      "k-parent-source-seoul",
      "k-parent-source-library",
      "k-parent-source-culture",
    ]) {
      assert.match(doc, new RegExp(escapeRegex(`packages/${packageName}`)), `culture doc should mention ${packageName}`);
      assert.match(
        doc,
        new RegExp(`npm run refresh:fixtures --workspace ${escapeRegex(packageName)}`),
        `culture doc should show refresh command for ${packageName}`,
      );
    }

    for (const envName of ["KSKILL_SEOUL_KEY", "KSKILL_LIBRARY_KEY", "KSKILL_CULTURE_KEY"]) {
      assert.match(doc, new RegExp(escapeRegex(envName)), `culture doc should mention ${envName}`);
    }

    assert.match(doc, /남은 확장 후보/);
    assert.doesNotMatch(doc, /다음 구현 후보/);
  });

  runParentSkillTest("application helper feature doc documents implemented welfare package", () => {
    const doc = read(path.join("docs", "features", "k-parent-application-helper.md"));

    assert.match(
      doc,
      /packages\/k-parent-source-welfare/,
      "application helper doc should mention the implemented welfare package",
    );
    assert.match(doc, /listServices\(\{ category \}\)/, "application helper doc should mention listServices");
    assert.match(doc, /getService\(serviceId\)/, "application helper doc should mention getService");
    assert.match(doc, /buildDeepLink\(service, params\)/, "application helper doc should mention buildDeepLink");
    assert.match(doc, /KSKILL_DATAGOKR_KEY/, "application helper doc should mention the optional live lookup key");
    assert.match(doc, /외부 API key 없이|외부 키 없이/, "application helper doc should document no-key curated catalog mode");
    assert.match(
      doc,
      /refresh:fixtures[\s\S]*제공하지 않는다/,
      "application helper doc should document that welfare has no refresh fixture command",
    );
    assert.match(doc, /남은 확장 후보/);
    assert.doesNotMatch(doc, /다음 구현 후보/);
  });

  runParentSkillTest("schedule and school doc capture docs document pure logic packages", () => {
    const scheduleDoc = read(path.join("docs", "features", "k-parent-schedule-manager.md"));
    const captureDoc = read(path.join("docs", "features", "k-parent-school-doc-capture.md"));

    assert.match(scheduleDoc, /packages\/k-parent-calendar/);
    for (const apiName of ["calendarCandidate", "dedupeCandidates", "toICS"]) {
      assert.match(scheduleDoc, new RegExp(`${apiName}\\(`), `schedule doc should mention ${apiName}`);
    }
    assert.match(scheduleDoc, /requiresConfirmation: true/);
    assert.match(scheduleDoc, /executable: false/);
    assert.match(scheduleDoc, /API key가 없다/);
    assert.match(scheduleDoc, /fixture refresh 명령이 없다/);
    assert.match(scheduleDoc, /남은 확장 후보/);
    assert.doesNotMatch(scheduleDoc, /다음 구현 후보/);

    for (const packageName of ["k-parent-doc-extract", "k-parent-calendar"]) {
      assert.match(
        captureDoc,
        new RegExp(`packages/${escapeRegex(packageName)}`),
        `school doc capture doc should mention ${packageName}`,
      );
    }
    for (const apiName of ["extractEvents", "extractSupplies", "extractDeadlines", "calendarCandidate", "toICS"]) {
      assert.match(captureDoc, new RegExp(`${apiName}\\(`), `school doc capture doc should mention ${apiName}`);
    }
    assert.match(captureDoc, /plain text/);
    assert.match(captureDoc, /API key가 없다/);
    assert.match(captureDoc, /fixture refresh 명령이 없다/);
    assert.match(captureDoc, /자동 실행하지 않는다/);
    assert.match(captureDoc, /남은 확장 후보/);
    assert.doesNotMatch(captureDoc, /다음 구현 후보/);
  });

  runParentSkillTest("kindergarten info feature doc documents childinfo source package", () => {
    const doc = read(path.join("docs", "features", "k-parent-kindergarten-info.md"));

    assert.match(doc, /packages\/k-parent-source-childinfo/);
    assert.match(doc, /fetchChildcareCenters\(\{ sidoCode, sigunguCode, name \}\)/);
    assert.match(doc, /fetchKindergartens\(\{ sidoCode, sggCode, name \}\)/);
    assert.match(doc, /KSKILL_DATAGOKR_KEY/);
    assert.match(doc, /npm run refresh:fixtures --workspace k-parent-source-childinfo/);
    assert.match(doc, /endpoint path와 파라미터명/);
    assert.match(doc, /EDSS\/KERIS 소재정보 별도 source 후보/);
    assert.match(doc, /남은 확장 후보/);
    assert.doesNotMatch(doc, /다음 구현 후보/);
  });

  runParentSkillTest("content recommender feature doc documents youtube source package", () => {
    const doc = read(path.join("docs", "features", "k-parent-content-recommender.md"));

    assert.match(doc, /packages\/k-parent-source-youtube/);
    assert.match(doc, /searchVideos\(\{ q, safeSearch: "strict" \}\)/);
    assert.match(doc, /safeSearch: "strict"/);
    assert.match(doc, /regionCode: "KR"/);
    assert.match(doc, /relevanceLanguage: "ko"/);
    assert.match(doc, /KSKILL_YOUTUBE_KEY/);
    assert.match(doc, /npm run refresh:fixtures --workspace k-parent-source-youtube -- "검색어"/);
    assert.match(doc, /https:\/\/youtu\.be\/<videoId>/);
    assert.match(doc, /남은 확장 후보/);
    assert.doesNotMatch(doc, /다음 구현 후보/);
  });

  runParentSkillTest("school info and meal planner docs document NEIS source packages", () => {
    const schoolDoc = read(path.join("docs", "features", "k-parent-school-info.md"));
    const mealDoc = read(path.join("docs", "features", "k-parent-meal-planner.md"));

    for (const packageName of ["k-parent-source-neis", "k-parent-brief"]) {
      assert.match(schoolDoc, new RegExp(`packages/${escapeRegex(packageName)}`));
      assert.match(mealDoc, new RegExp(`packages/${escapeRegex(packageName)}`));
    }
    assert.match(schoolDoc, /packages\/k-parent-source-traffic-safety/);
    assert.match(schoolDoc, /^## 결정형 구현$/m);
    assert.doesNotMatch(schoolDoc, /^## 결정형 구현 \(deterministic\)$/m);
    for (const apiName of ["resolveSchool", "getMeals", "getSchedule", "getTimetable", "composeTodayBrief"]) {
      assert.match(schoolDoc, new RegExp(`${apiName}\\b`), `school info doc should mention ${apiName}`);
    }
    assert.match(schoolDoc, /KEDU_INFO_KEY/);
    assert.match(schoolDoc, /KSKILL_DATAGOKR_KEY/);
    assert.match(schoolDoc, /npm run refresh:fixtures --workspace k-parent-source-neis/);
    assert.match(schoolDoc, /npm run refresh:fixtures --workspace k-parent-source-traffic-safety/);
    assert.match(schoolDoc, /남은 확장 후보/);
    assert.doesNotMatch(schoolDoc, /다음 구현 후보/);

    for (const apiName of ["resolveSchool", "getMeals", "getSchedule", "getTimetable", "composeTodayBrief"]) {
      assert.match(mealDoc, new RegExp(`${apiName}\\b`), `meal planner doc should mention ${apiName}`);
    }
    assert.match(mealDoc, /^## 결정형 구현$/m);
    assert.doesNotMatch(mealDoc, /^## 결정형 구현 \(deterministic\)$/m);
    assert.match(mealDoc, /KEDU_INFO_KEY/);
    assert.match(mealDoc, /npm run refresh:fixtures --workspace k-parent-source-neis/);
    assert.match(mealDoc, /남은 확장 후보/);
    assert.doesNotMatch(mealDoc, /다음 구현 후보/);
  });

  runParentSkillTest("data collector and shopping recommender docs describe promoted source packages", () => {
    const dataCollectorDoc = read(path.join("docs", "features", "k-parent-data-collector.md"));
    const shoppingDoc = read(path.join("docs", "features", "k-parent-shopping-recommender.md"));

    assert.match(dataCollectorDoc, /packages\/k-parent-source-naver/);
    assert.match(dataCollectorDoc, /runCollector\(tasks, options\)/);
    assert.match(dataCollectorDoc, /KSKILL_NAVER_CLIENT_ID/);
    assert.match(dataCollectorDoc, /KSKILL_NAVER_CLIENT_SECRET/);
    assert.match(dataCollectorDoc, /npm run refresh:fixtures --workspace k-parent-source-naver/);
    assert.doesNotMatch(dataCollectorDoc, /초기 SKILL\.md-only/);

    for (const packageName of ["k-parent-source-naver", "k-parent-source-coupang"]) {
      assert.match(shoppingDoc, new RegExp(`packages/${escapeRegex(packageName)}`));
      assert.match(shoppingDoc, new RegExp(`npm run refresh:fixtures --workspace ${escapeRegex(packageName)}`));
    }
    for (const apiName of ["fetchShopping", "fetchBlog", "fetchProducts"]) {
      assert.match(shoppingDoc, new RegExp(`${apiName}\\(`), `shopping doc should mention ${apiName}`);
    }
    for (const envName of [
      "KSKILL_NAVER_CLIENT_ID",
      "KSKILL_NAVER_CLIENT_SECRET",
      "KSKILL_COUPANG_ACCESS_KEY",
      "KSKILL_COUPANG_SECRET_KEY",
    ]) {
      assert.match(shoppingDoc, new RegExp(escapeRegex(envName)), `shopping doc should mention ${envName}`);
    }
    assert.match(shoppingDoc, /쿠팡 파트너스 활동의 일환으로 일정액의 수수료를 받을 수 있음/);
    assert.doesNotMatch(shoppingDoc, /초기 SKILL\.md-only/);
  });

  runParentSkillTest("academy connector feature doc documents pure logic packages", () => {
    const doc = read(path.join("docs", "features", "k-parent-academy-connector.md"));

    for (const packageName of ["k-parent-doc-extract", "k-parent-calendar"]) {
      assert.match(doc, new RegExp(`packages/${escapeRegex(packageName)}`));
    }
    for (const apiName of [
      "extractAcademyNotice",
      "extractDeadlines",
      "calendarCandidate",
      "dedupeCandidates",
      "toICS",
    ]) {
      assert.match(doc, new RegExp(`${apiName}\\(`), `academy connector doc should mention ${apiName}`);
    }
    assert.match(doc, /필요한 API key가 없다/);
    assert.match(doc, /fixture refresh 명령이 없다/);
    assert.match(doc, /사용자 승인 전 실행하지 않는다/);
    assert.match(doc, /남은 확장 후보/);
    assert.doesNotMatch(doc, /## 구현 패키지/);
  });

  runParentSkillTest("validate-skills scans both product and example containers", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "k-parent-validate-skills-"));
    const tmpScripts = path.join(tmpRoot, "scripts");
    const validator = path.join(tmpScripts, "validate-skills.sh");
    fs.mkdirSync(tmpScripts, { recursive: true });
    fs.cpSync(path.join(repoRoot, "scripts", "validate-skills.sh"), validator);
    fs.chmodSync(validator, 0o755);

    writeSkillFixture(tmpRoot, "skills", "product-skill", "product-skill");
    writeParentSkillFixture(tmpRoot, "k-parent-good-skill", "p0");
    writeSkillFixture(tmpRoot, "examples", "example-skill", "example-skill");

    const ok = childProcess.spawnSync("bash", [validator], {
      cwd: tmpRoot,
      encoding: "utf8",
    });
    assert.equal(ok.status, 0, ok.stderr || ok.stdout);
    assert.match(ok.stdout, /skill layout looks valid/);

    writeSkillFixture(tmpRoot, "examples", "bad-example", "wrong-name");
    const bad = childProcess.spawnSync("bash", [validator], {
      cwd: tmpRoot,
      encoding: "utf8",
    });
    assert.notEqual(bad.status, 0);
    assert.match(bad.stdout, /examples\/bad-example\/SKILL\.md declares 'wrong-name'/);

    writeParentSkillFixture(tmpRoot, "k-parent-missing-phase", "");
    const badParent = childProcess.spawnSync("bash", [validator], {
      cwd: tmpRoot,
      encoding: "utf8",
    });
    assert.notEqual(badParent.status, 0);
    assert.match(badParent.stdout, /missing or unsupported parent phase metadata/);
  });

  runParentSkillTest("parent source credential names stay aligned across owner docs and env template", () => {
    const envTemplate = read(".env.example");
    const ownerTasks = read("OWNER-TASKS.md");

    for (const [packageName, vars] of Object.entries(sourceCredentialRefs)) {
      const packageReadme = read(path.join("packages", packageName, "README.md"));
      assert.match(ownerTasks, new RegExp(escapeRegex(packageName)), `OWNER-TASKS.md should mention ${packageName}`);
      for (const envName of vars) {
        assert.match(envTemplate, new RegExp(`^${escapeRegex(envName)}=`, "m"), `.env.example should define ${envName}`);
        assert.match(ownerTasks, new RegExp(escapeRegex(envName)), `OWNER-TASKS.md should mention ${envName}`);
        assert.match(packageReadme, new RegExp(escapeRegex(envName)), `${packageName} README should mention ${envName}`);
        if (packageName !== "k-parent-source-welfare") {
          assert.match(
            packageReadme,
            new RegExp(`${escapeRegex(envName)}[\\s\\S]*npm run refresh:fixtures`),
            `${packageName} README should show ${envName} with the refresh:fixtures command`,
          );
        }
      }
    }

    assert.doesNotMatch(ownerTasks, /data\.go\.kr 서비스 3종/);
    assert.match(ownerTasks, /data\.go\.kr 2-1 목록 전체 활용신청 승인/);
  });

  runParentSkillTest("parent source packages expose refresh fixture scripts consistently", () => {
    const sourceRoot = path.join(repoRoot, "packages");
    const readme = read("README.md");
    const ownerTasks = read("OWNER-TASKS.md");
    const featureDocs = [
      path.join("docs", "features", "k-parent-festival-finder.md"),
      path.join("docs", "features", "k-parent-travel-recommender.md"),
      path.join("docs", "features", "k-parent-play-finder.md"),
      path.join("docs", "features", "k-parent-shopping-recommender.md"),
      path.join("docs", "features", "k-parent-data-collector.md"),
    ];
    const packageDirs = fs
      .readdirSync(sourceRoot)
      .filter((name) => name.startsWith("k-parent-source-"))
      .sort();

    for (const packageName of packageDirs) {
      const packageJsonPath = path.join("packages", packageName, "package.json");
      const packageJson = readJson(packageJsonPath);
      const packageReadme = read(path.join("packages", packageName, "README.md"));
      const refreshScriptPath = path.join(repoRoot, "packages", packageName, "scripts", "refresh-fixtures.mjs");
      const hasRefreshHelper = fs.existsSync(refreshScriptPath);
      const refreshCommand = packageJson.scripts && packageJson.scripts["refresh:fixtures"];
      const refreshHelper = hasRefreshHelper
        ? read(path.join("packages", packageName, "scripts", "refresh-fixtures.mjs"))
        : "";
      const packageTestRoot = path.join(repoRoot, "packages", packageName, "test");
      const usageSection = findSection(packageReadme, "## Usage");
      const configurationSection = findSection(packageReadme, "## Configuration");
      const testingSection = findSection(packageReadme, "## Testing");

      assert.match(
        packageReadme,
        /npm test/,
        `${packageName} README should document the package-local npm test command`,
      );
      assert.match(
        packageReadme,
        /## Testing/,
        `${packageName} README should keep npm test in a dedicated Testing section`,
      );
      assert.match(
        testingSection,
        /```bash\nnpm test\n```/,
        `${packageName} README Testing command should use a bash code fence`,
      );
      assert.match(
        testingSection,
        /fully offline|완전히 오프라인/,
        `${packageName} README Testing section should say tests run fully offline`,
      );
      assert.match(
        packageReadme,
        /## Usage/,
        `${packageName} README should document a minimal package usage example`,
      );
      assert.match(
        packageReadme,
        /## Configuration/,
        `${packageName} README should keep credentials and optional live settings in a Configuration section`,
      );
      assert.doesNotMatch(
        packageReadme,
        /^## (?:Credentials|Config|Environment|환경변수|Optional live lookup)$/m,
        `${packageName} README should not use legacy configuration section headings`,
      );
      assert.match(
        packageReadme,
        /provenance|source metadata|출처/,
        `${packageName} README should document provenance/source metadata in normalized outputs`,
      );
      assert.match(
        packageReadme,
        /freshness|최신성|staleness/,
        `${packageName} README should document freshness metadata in normalized outputs`,
      );
      if (configurationSection.includes("export ")) {
        assert.match(
          configurationSection,
          /```bash\n[\s\S]*?export [\s\S]*?```/,
          `${packageName} README Configuration shell examples should use a bash code fence`,
        );
      }
      assert.match(
        usageSection,
        /```(?:js|javascript)\n[\s\S]*?```/,
        `${packageName} README Usage should include a copyable JavaScript code block`,
      );
      assert.match(
        usageSection,
        new RegExp(`require\\("${escapeRegex(packageName)}"\\)`),
        `${packageName} README Usage should require its own package name`,
      );
      if (packageReadme.includes("await ")) {
        assert.match(
          packageReadme,
          /async function main\(\)|\(async \(\) =>/,
          `${packageName} README should wrap await usage examples in an async function or IIFE`,
        );
      }
      if (packageReadme.includes("async function main()")) {
        assert.match(
          packageReadme,
          /main\(\)\.then\(console\.log\)\.catch/,
          `${packageName} README should print async usage example results with main().then(console.log).catch(...)`,
        );
      }
      assert.doesNotMatch(
        packageReadme,
        /[,{]\s*payload\s*[,}]/,
        `${packageName} README should not use an undefined payload shorthand in examples`,
      );
      const readmeFixtureRequires = [...packageReadme.matchAll(/require\("\.\/(test\/fixtures\/[^"]+)"\)/g)];
      for (const match of readmeFixtureRequires) {
        assert.ok(
          fs.existsSync(path.join(sourceRoot, packageName, match[1])),
          `${packageName} README should only require fixture files that exist: ${match[1]}`,
        );
      }
      if (readmeFixtureRequires.length > 0) {
        assert.ok(
          packageJson.files.includes("test/fixtures"),
          `${packageName} files should include fixtures required by README Usage examples`,
        );
      }
      for (const match of packageReadme.matchAll(/require\("(k-parent-source-[^"]+)"\)/g)) {
        assert.equal(
          match[1],
          packageName,
          `${packageName} README should require its own package name in Usage examples`,
        );
      }
      assert.doesNotMatch(
        packageReadme,
        /node --test/,
        `${packageName} README should not bypass the package npm test script`,
      );
      assert.ok(
        packageJson.files.includes("test/*.test.js"),
        `${packageName} files should include test files advertised by README npm test`,
      );
      if (fs.existsSync(packageTestRoot)) {
        const testSources = fs
          .readdirSync(packageTestRoot)
          .filter((name) => name.endsWith(".test.js"))
          .map((name) => read(path.join("packages", packageName, "test", name)))
          .join("\n");
        if (/fixtures/.test(testSources)) {
          assert.ok(
            packageJson.files.includes("test/fixtures"),
            `${packageName} files should include fixtures required by package tests`,
          );
        }
      }

      if (packageName === "k-parent-source-welfare") {
        assert.equal(hasRefreshHelper, false, "welfare is a curated catalog and should not require live fixture refresh");
        assert.equal(refreshCommand, undefined, "welfare should not advertise a missing refresh:fixtures script");
        assert.match(
          packageReadme,
          /No API key required/,
          "welfare README should say the curated catalog requires no API key",
        );
        assert.match(
          packageReadme,
          /fully offline/,
          "welfare README should say the curated catalog works fully offline",
        );
        assert.match(
          packageReadme,
          /optional/i,
          "welfare README should describe KSKILL_DATAGOKR_KEY as optional",
        );
        assert.match(
          ownerTasks,
          /k-parent-source-welfare[\s\S]*외부 키 없이 동작[\s\S]*선택적으로 `KSKILL_DATAGOKR_KEY` 라이브 조회 stub/,
          "OWNER-TASKS.md should document welfare as no-key by default with optional live lookup stub",
        );
        assert.doesNotMatch(
          packageReadme,
          /## Fixtures refresh/,
          "welfare README should not document live fixture refresh for the curated catalog",
        );
        continue;
      }

      assert.equal(hasRefreshHelper, true, `${packageName} should ship scripts/refresh-fixtures.mjs`);
      assert.equal(
        refreshCommand,
        "node scripts/refresh-fixtures.mjs",
        `${packageName} should expose the standard refresh:fixtures command`,
      );
      assert.equal(
        packageJson.scripts["refresh-fixtures"],
        undefined,
        `${packageName} should not expose the legacy refresh-fixtures script alias`,
      );
      assert.ok(packageJson.files.includes("scripts"), `${packageName} files should include refresh helpers`);
      assert.ok(
        packageJson.files.includes("test/fixtures"),
        `${packageName} files should include fixture output targets for refresh helpers`,
      );
      assert.match(
        ownerTasks,
        new RegExp(`npm run refresh:fixtures --workspace ${escapeRegex(packageName)}`),
        `OWNER-TASKS.md should document the workspace refresh command for ${packageName}`,
      );
      assert.match(
        packageReadme,
        /npm run refresh:fixtures/,
        `${packageName} README should document the package-local refresh command`,
      );
      assert.doesNotMatch(
        packageReadme,
        /\\\n\s*npm run refresh:fixtures/,
        `${packageName} README should keep refresh commands on one copyable env-prefixed line`,
      );
      assert.match(
        packageReadme,
        /## Fixtures refresh/,
        `${packageName} README should keep live fixture refresh in a dedicated section`,
      );
      assert.match(
        findSection(packageReadme, "## Fixtures refresh"),
        /```bash\n[\s\S]*?npm run refresh:fixtures[\s\S]*?```/,
        `${packageName} README fixture refresh command should use a bash code fence`,
      );
      assert.match(
        findSection(packageReadme, "## Fixtures refresh"),
        /live API|live fixture|실제|라이브/i,
        `${packageName} README fixture refresh section should say the command calls live APIs`,
      );
      assert.doesNotMatch(
        packageReadme,
        /refresh-fixtures\.mjs/,
        `${packageName} README should not bypass the package refresh:fixtures script`,
      );
      assert.doesNotMatch(
        packageReadme,
        /node --test packages\/k-parent-source-[^/]+\/test\//,
        `${packageName} README should not publish root-relative package test commands`,
      );
      assert.match(
        packageJson.scripts.lint,
        /node --check scripts\/refresh-fixtures\.mjs/,
        `${packageName} lint should syntax-check its refresh helper`,
      );
      assert.doesNotMatch(
        refreshHelper,
        /node packages\/k-parent-source-[^/]+\/scripts\/refresh-fixtures\.mjs/,
        `${packageName} refresh helper should not document root-relative direct execution`,
      );
      for (const envName of sourceCredentialRefs[packageName] || []) {
        assert.match(
          refreshHelper,
          new RegExp(`${escapeRegex(envName)}[\\s\\S]*npm run refresh:fixtures`),
          `${packageName} refresh helper should print ${envName} with the refresh:fixtures command`,
        );
      }
    }

    assert.match(
      ownerTasks,
      /npm run refresh:fixtures --workspace k-parent-source-youtube -- "검색어"/,
      "OWNER-TASKS.md should document npm argument forwarding for YouTube refresh queries",
    );
    assert.doesNotMatch(
      ownerTasks,
      /\\\n\s*npm run refresh:fixtures/,
      "OWNER-TASKS.md should keep refresh commands on one copyable env-prefixed line",
    );
    assert.match(readme, /npm run refresh:fixtures --workspace <package>/);
    assert.doesNotMatch(readme, /scripts\/refresh-fixtures\.mjs/);
    assert.match(ownerTasks, /각 `refresh:fixtures` npm script 실행/);
    assert.doesNotMatch(ownerTasks, /각 `refresh-fixtures\.mjs` 실행/);
    assert.match(
      read(path.join("packages", "k-parent-source-youtube", "README.md")),
      /npm run refresh:fixtures -- "검색어"/,
      "YouTube README should document package-local npm argument forwarding",
    );
    for (const docPath of featureDocs) {
      const doc = read(docPath);
      assert.doesNotMatch(doc, /node packages\/k-parent-source-[^ ]+\/scripts\/refresh-fixtures\.mjs/);
      assert.doesNotMatch(doc, /node --test packages\/k-parent-source-[^/]+\/test\//);
    }
  });

  runParentSkillTest("install docs match development home-directory skill install rules", () => {
    const installDoc = read(path.join("docs", "install.md"));

    assert.match(installDoc, /~\/\.claude\/skills\/<skill-name>/);
    assert.match(installDoc, /~\/\.agents\/skills\/<skill-name>/);
    assert.match(installDoc, /symlink 같은 indirection/);
    assert.match(installDoc, /저장소 안에 `\.claude\/` 또는 `\.agents\/` 디렉터리를 만들지 않는다/);
  });

  runParentSkillTest("install docs name k-parent-skill as the repository install target", () => {
    const installDoc = read(path.join("docs", "install.md"));
    const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));

    assert.match(installDoc, /`k-parent-skill` 전체 스킬을 먼저 설치한다/);
    assert.match(installDoc, /k-parent-skill 전체 스킬을 먼저 설치해줘/);
    assert.doesNotMatch(installDoc, /k-skill 전체 스킬을 먼저 설치/);
    assert.match(installDoc, /제품 스킬은 표준 컨테이너 `skills\/<name>\/SKILL\.md` 에 있어 `--skill <name>` 으로 바로 설치된다/);
    assert.match(installDoc, /예제 포함 선택 설치 블록에서만 `--full-depth` 를 함께 둔다/);
    assert.match(installDoc, /parent 제품 스킬만 먼저 설치할 때:[\s\S]*npx --yes skills add <owner\/repo> \\\n  --skill k-parent-meal-planner/);
    assert.match(installDoc, /상속 예제까지 포함한 선택 설치[\s\S]*npx --yes skills add <owner\/repo> \\\n  --full-depth/);
    assert.match(proxyReadme, /`k-parent-skill`에서 부모용 무료\/공공 API를 중계/);
  });

  runParentSkillTest("install docs include every product skill in the selectable install examples", () => {
    const installDoc = read(path.join("docs", "install.md"));
    const listedSkills = new Set([...installDoc.matchAll(/--skill\s+([^\s\\]+)/g)].map((match) => match[1]));
    const productSkills = fs
      .readdirSync(path.join(repoRoot, "skills"))
      .filter((name) => fs.existsSync(path.join(repoRoot, "skills", name, "SKILL.md")));

    for (const skillName of productSkills) {
      assert.ok(listedSkills.has(skillName), `${skillName} should appear in docs/install.md --skill examples`);
    }
  });

  runParentSkillTest("install docs document newer hosted proxy-backed examples", () => {
    const installDoc = read(path.join("docs", "install.md"));
    const expectedSkills = [
      "blue-ribbon-nearby",
      "parking-lot-search",
      "naver-shopping-search",
      "naver-news-search",
      "lh-notice-search",
    ];
    const expectedFeatureLinks = [
      "features/blue-ribbon-nearby.md",
      "features/parking-lot-search.md",
      "features/naver-shopping-search.md",
      "features/naver-news-search.md",
      "features/lh-notice-search.md",
    ];
    const expectedOperatorKeys = [
      "BLUE_RIBBON_SESSION_ID",
      "DATA_GO_KR_API_KEY",
      "NAVER_SEARCH_CLIENT_ID",
      "NAVER_SEARCH_CLIENT_SECRET",
    ];

    for (const skillName of expectedSkills) {
      assert.match(installDoc, new RegExp(`--skill ${escapeRegex(skillName)}`), `install docs should include --skill ${skillName}`);
      assert.match(installDoc, new RegExp(`- \`${escapeRegex(skillName)}\``), `install docs setup list should include ${skillName}`);
    }
    for (const link of expectedFeatureLinks) {
      assert.match(installDoc, new RegExp(escapeRegex(link)), `install docs should link ${link}`);
    }
    for (const envName of expectedOperatorKeys) {
      assert.match(installDoc, new RegExp(envName), `install docs should mention proxy operator env ${envName}`);
    }
    assert.match(installDoc, /사용자 쪽 .*불필요|사용자 시크릿 불필요/u);
    assert.match(installDoc, /기본 hosted proxy/);
  });

  runParentSkillTest("README advertises newer hosted proxy-backed example skills", () => {
    const readme = read("README.md");
    const expectedRows = [
      ["블루리본 맛집 조회", "blue-ribbon-nearby", "docs/features/blue-ribbon-nearby.md"],
      ["근처 공영주차장 찾기", "parking-lot-search", "docs/features/parking-lot-search.md"],
      ["네이버 쇼핑 가격비교", "naver-shopping-search", "docs/features/naver-shopping-search.md"],
      ["네이버 뉴스 검색", "naver-news-search", "docs/features/naver-news-search.md"],
      ["LH 청약 공고 조회", "lh-notice-search", "docs/features/lh-notice-search.md"],
    ];

    assert.match(readme, /바로 쓸 수 있는 hosted proxy 예제/);
    assert.match(readme, /k-skill-proxy\.nomadamas\.org/);
    assert.match(readme, /사용자 쪽 API key 없이 바로 쓸 수/);
    for (const [label, skillName, docPath] of expectedRows) {
      assert.match(readme, new RegExp(escapeRegex(label)), `README should mention ${label}`);
      assert.match(readme, new RegExp(`\\\`${escapeRegex(skillName)}\\\``), `README should mention ${skillName}`);
      assert.match(readme, new RegExp(escapeRegex(docPath)), `README should link ${docPath}`);
    }
  });

  runParentSkillTest("examples README lists newer hosted proxy-backed examples", () => {
    const examplesReadme = read(path.join("examples", "README.md"));
    const expectedRows = [
      ["블루리본 맛집 조회", "blue-ribbon-nearby", "../docs/features/blue-ribbon-nearby.md"],
      ["근처 공영주차장 찾기", "parking-lot-search", "../docs/features/parking-lot-search.md"],
      ["네이버 쇼핑 가격비교", "naver-shopping-search", "../docs/features/naver-shopping-search.md"],
      ["네이버 뉴스 검색", "naver-news-search", "../docs/features/naver-news-search.md"],
      ["LH 청약 공고 조회", "lh-notice-search", "../docs/features/lh-notice-search.md"],
    ];

    assert.match(examplesReadme, /Hosted Proxy 예제/);
    assert.match(examplesReadme, /k-skill-proxy\.nomadamas\.org/);
    assert.match(examplesReadme, /일반 사용자 쪽 API key 없이/);
    for (const [label, skillName, docPath] of expectedRows) {
      assert.match(examplesReadme, new RegExp(escapeRegex(label)), `examples README should mention ${label}`);
      assert.match(examplesReadme, new RegExp(`\\\`${escapeRegex(skillName)}\\\``), `examples README should mention ${skillName}`);
      assert.match(examplesReadme, new RegExp(escapeRegex(docPath)), `examples README should link ${docPath}`);
    }
  });

  runParentSkillTest("hosted proxy example skills document user secret boundaries", () => {
    const expectedSkills = [
      ["blue-ribbon-nearby", "BLUE_RIBBON_SESSION_ID", "/v1/blue-ribbon/nearby"],
      ["parking-lot-search", "DATA_GO_KR_API_KEY", "/v1/parking-lots/search"],
      ["naver-shopping-search", "NAVER_SEARCH_CLIENT_ID", "/v1/naver-shopping/search"],
      ["naver-news-search", "NAVER_SEARCH_CLIENT_ID", "/v1/naver-news/search"],
      ["lh-notice-search", "DATA_GO_KR_API_KEY", "/v1/lh-notice"],
    ];

    for (const [skillName, envName, routePrefix] of expectedSkills) {
      const skill = read(path.join("examples", skillName, "SKILL.md"));
      assert.match(skill, /k-skill-proxy\.nomadamas\.org|기본 hosted proxy|기본값은 public\/read-only\/no-auth hosted proxy/);
      assert.match(skill, new RegExp(escapeRegex(routePrefix)), `${skillName} should mention ${routePrefix}`);
      assert.match(skill, new RegExp(`\\b${escapeRegex(envName)}\\b`), `${skillName} should mention ${envName}`);
      assert.match(skill, /사용자[^.\n]*(?:필요 없다|불필요|발급받지 않아도 된다|필요한 시크릿은 없다)/u);
      assert.match(skill, /proxy 운영자|self-host proxy 운영자|프록시 서버에서만|서버 쪽에만/u);
    }
  });

  runParentSkillTest("sources document newer hosted proxy-backed example surfaces", () => {
    const sources = read(path.join("docs", "sources.md"));
    const expectedSignals = [
      "블루리본 메인",
      "블루리본 지역 검색",
      "블루리본 주변 맛집 JSON",
      "전국주차장정보표준데이터",
      "Naver Shopping public BFF JSON",
      "Naver Developers Search API shopping docs",
      "Naver Developers Search API news docs",
      "openapi.naver.com/v1/search/news.json",
      "LH 청약플러스 공고 목록",
      "한국토지주택공사 임대공고문 정보 API",
    ];

    for (const signal of expectedSignals) {
      assert.match(sources, new RegExp(escapeRegex(signal)), `sources should include ${signal}`);
    }
  });

  runParentSkillTest("roadmap tracks newer hosted proxy-backed example surfaces", () => {
    const roadmap = read(path.join("docs", "roadmap.md"));
    const expectedRows = [
      ["블루리본 맛집 조회", "blue-ribbon-nearby"],
      ["근처 공영주차장 찾기", "parking-lot-search"],
      ["네이버 쇼핑 가격비교", "naver-shopping-search"],
      ["네이버 뉴스 검색", "naver-news-search"],
      ["LH 청약 공고 조회", "lh-notice-search"],
    ];

    assert.match(roadmap, /^## 제품 스킬 상태$/m);
    assert.match(roadmap, /`skills\/\*\/SKILL\.md` 지침을 유지/);
    assert.match(roadmap, /package[s]?\/|`packages\/`/);
    assert.match(roadmap, /concept workflow/);
    assert.doesNotMatch(roadmap, /Demo placeholders/);
    assert.doesNotMatch(roadmap, /플레이스홀더/);
    assert.match(roadmap, /지원 중인 hosted proxy 예제 표면/);
    assert.match(roadmap, /parent 제품 스킬 또는 `packages\/k-parent-\*` 구현으로 승격/);
    for (const [surface, skillName] of expectedRows) {
      assert.match(roadmap, new RegExp(escapeRegex(surface)), `roadmap should mention ${surface}`);
      assert.match(roadmap, new RegExp(`\\\`${escapeRegex(skillName)}\\\``), `roadmap should mention ${skillName}`);
      assert.match(roadmap, new RegExp(escapeRegex(`examples/${skillName}`)), `roadmap should mention examples/${skillName}`);
    }
  });

  runParentSkillTest("roadmap department package references use real package paths", () => {
    const roadmap = read(path.join("docs", "roadmap.md"));
    const packageRefs = [...roadmap.matchAll(/`packages\/(k-parent-[a-z0-9-]+)`/g)].map((match) => match[1]);

    assert.ok(packageRefs.length > 0, "roadmap should cite k-parent packages with packages/ paths");
    assert.doesNotMatch(roadmap, /`\-[a-z][^`]*`/, "roadmap should not use abbreviated package suffixes");
    assert.doesNotMatch(
      roadmap,
      /`k-parent-(?:source-[a-z-]+|brief|calendar|doc-extract)`/,
      "roadmap should use packages/ paths for k-parent package references",
    );
    for (const packageName of packageRefs) {
      assert.ok(
        fs.existsSync(path.join(repoRoot, "packages", packageName, "package.json")),
        `roadmap cites missing package ${packageName}`,
      );
    }
  });

  runParentSkillTest("setup product skill uses k-parent-skill repository branding", () => {
    const setupSkill = read(path.join("skills", "k-skill-setup", "SKILL.md"));

    assert.match(setupSkill, /After installing the full k-parent-skill bundle/);
    assert.match(setupSkill, /# k-parent-skill Setup/);
    assert.match(setupSkill, /전체 `k-parent-skill` 설치가 끝난 뒤/);
    assert.match(setupSkill, /`k-parent-skill` 전체 스킬 설치가 끝난 뒤/);
    assert.match(setupSkill, /gh repo star <owner>\/k-parent-skill/);
    assert.doesNotMatch(setupSkill, /전체 `k-skill` 설치|`k-skill` 전체 스킬 설치|NomaDamas\/k-skill|gh repo star NomaDamas\/k-skill/);
  });

  runParentSkillTest("moved skill helper paths use current containers", () => {
    const cleanerDoc = read(path.join("docs", "features", "k-skill-cleaner.md"));
    const coupangDoc = read(path.join("docs", "features", "coupang-product-search.md"));
    const coupangSkill = read(path.join("examples", "coupang-product-search", "SKILL.md"));
    const foresttripDoc = read(path.join("docs", "features", "foresttrip-vacancy.md"));
    const foresttripSkill = read(path.join("examples", "foresttrip-vacancy", "SKILL.md"));
    const rhwpEditDoc = read(path.join("docs", "features", "rhwp-edit.md"));
    const rhwpAdvancedDoc = read(path.join("docs", "features", "rhwp-advanced.md"));

    assert.match(cleanerDoc, /python3 skills\/k-skill-cleaner\/scripts\/k_skill_cleaner\.py/);
    assert.doesNotMatch(cleanerDoc, /python3 k-skill-cleaner\/scripts\/k_skill_cleaner\.py/);
    assert.match(coupangDoc, /python3 examples\/coupang-product-search\/scripts\/coupang_partners_mcp\.py/);
    assert.doesNotMatch(coupangDoc, /python3 coupang-product-search\/scripts\/coupang_partners_mcp\.py/);
    assert.match(foresttripDoc, /python3 examples\/foresttrip-vacancy\/scripts\/run_foresttrip_vacancy\.py/);
    assert.doesNotMatch(foresttripDoc, /python3 foresttrip-vacancy\/scripts\/run_foresttrip_vacancy\.py/);
    assert.match(coupangSkill, /python3 scripts\/coupang_partners_mcp\.py/);
    assert.doesNotMatch(coupangSkill, /python3 coupang-product-search\/scripts\/coupang_partners_mcp\.py/);
    assert.match(foresttripSkill, /python3 scripts\/run_foresttrip_vacancy\.py/);
    assert.doesNotMatch(foresttripSkill, /python3 foresttrip-vacancy\/scripts\/run_foresttrip_vacancy\.py/);
    assert.match(rhwpEditDoc, /\.\.\/\.\.\/examples\/rhwp-edit\/SKILL\.md/);
    assert.match(rhwpAdvancedDoc, /\.\.\/\.\.\/examples\/rhwp-advanced\/SKILL\.md/);
  });

  runParentSkillTest("thin-wrapper install and pin paths use current containers", () => {
    const privacyDoc = read(path.join("docs", "features", "korean-privacy-terms.md"));
    const privacySkill = read(path.join("examples", "korean-privacy-terms", "SKILL.md"));
    const jangbuDoc = read(path.join("docs", "features", "korean-jangbu-for.md"));
    const jangbuSkill = read(path.join("examples", "korean-jangbu-for", "SKILL.md"));
    const installDoc = read(path.join("docs", "install.md"));
    const irosDoc = read(path.join("docs", "features", "iros-registry-automation.md"));
    const irosSkill = read(path.join("examples", "iros-registry-automation", "SKILL.md"));
    const sources = read(path.join("docs", "sources.md"));

    assert.match(privacyDoc, /bash examples\/korean-privacy-terms\/scripts\/install\.sh/);
    assert.match(privacyDoc, /examples\/korean-privacy-terms\/scripts\/upstream\.pin/);
    assert.match(privacySkill, /bash scripts\/install\.sh/);
    assert.match(privacySkill, /scripts\/upstream\.pin/);
    assert.match(jangbuDoc, /bash examples\/korean-jangbu-for\/scripts\/install\.sh/);
    assert.match(jangbuDoc, /examples\/korean-jangbu-for\/scripts\/upstream\.pin/);
    assert.match(jangbuSkill, /bash scripts\/install\.sh/);
    assert.match(jangbuSkill, /scripts\/upstream\.pin/);
    assert.match(installDoc, /bash examples\/korean-jangbu-for\/scripts\/install\.sh/);
    assert.match(irosDoc, /examples\/iros-registry-automation\/scripts\/upstream\.pin/);
    assert.match(sources, /examples\/iros-registry-automation\/scripts\/upstream\.pin/);
    assert.match(irosSkill, /scripts\/upstream\.pin/);

    for (const doc of [privacyDoc, jangbuDoc, installDoc, irosDoc, sources]) {
      assert.doesNotMatch(doc, /(?:bash|cat) (?:korean-privacy-terms|korean-jangbu-for)\/scripts\//);
      assert.doesNotMatch(doc, /`(?:korean-privacy-terms|korean-jangbu-for|iros-registry-automation)\/scripts\/upstream\.pin`/);
    }
    for (const skill of [privacySkill, jangbuSkill, irosSkill]) {
      assert.doesNotMatch(skill, /(?:bash|cat) (?:korean-privacy-terms|korean-jangbu-for|iros-registry-automation)\/scripts\//);
      assert.doesNotMatch(skill, /`(?:korean-privacy-terms|korean-jangbu-for|iros-registry-automation)\/scripts\//);
    }
  });

  runParentSkillTest("parent proxy secret docs use the k-parent-skill secrets path", () => {
    const parentSecretDocs = [
      path.join("docs", "setup.md"),
      path.join("docs", "security-and-secrets.md"),
      path.join("docs", "adding-a-skill.md"),
      path.join("docs", "features", "fine-dust-location.md"),
      path.join("docs", "features", "foresttrip-vacancy.md"),
      path.join("docs", "features", "ktx-booking.md"),
      path.join("docs", "features", "srt-booking.md"),
      path.join("examples", "foresttrip-vacancy", "SKILL.md"),
      path.join("examples", "ktx-booking", "SKILL.md"),
      path.join("examples", "srt-booking", "SKILL.md"),
      path.join("packages", "k-skill-proxy", "README.md"),
      path.join("scripts", "check-setup.sh"),
      path.join("scripts", "fine_dust.py"),
      path.join("scripts", "ktx_booking.py"),
      path.join("scripts", "run-k-skill-proxy.sh"),
      path.join("skills", "k-skill-setup", "SKILL.md"),
    ];

    for (const docPath of parentSecretDocs) {
      const doc = read(docPath);
      assert.match(
        doc,
        /~\/\.config\/k-parent-skill\/secrets\.env|\$HOME\/\.config\/k-parent-skill\/secrets\.env/,
        `${docPath} should use the parent repository secrets path`,
      );
      assert.doesNotMatch(
        doc,
        /~\/\.config\/k-skill\/secrets\.env|\$HOME\/\.config\/k-skill\/secrets\.env/,
        `${docPath} should not use the inherited k-skill secrets path for parent proxy setup`,
      );
    }
  });

  runParentSkillTest("security docs document newer hosted proxy-backed secret boundaries", () => {
    const security = read(path.join("docs", "security-and-secrets.md"));
    const expectedFeatures = [
      "블루리본 맛집 조회",
      "근처 공영주차장 찾기",
      "네이버 쇼핑 가격비교",
      "네이버 뉴스 검색",
      "LH 청약 공고 조회",
    ];
    const expectedOperatorKeys = [
      "BLUE_RIBBON_SESSION_ID",
      "DATA_GO_KR_API_KEY",
      "NAVER_SEARCH_CLIENT_ID",
      "NAVER_SEARCH_CLIENT_SECRET",
    ];

    for (const feature of expectedFeatures) {
      assert.match(security, new RegExp(feature), `security docs should mention ${feature}`);
    }
    for (const envName of expectedOperatorKeys) {
      assert.match(security, new RegExp(`\\b${escapeRegex(envName)}\\b`), `security docs should mention ${envName}`);
    }
    assert.match(security, /일반 사용자\/client 쪽 secrets 파일에는/);
    assert.match(security, /self-host proxy 운영자 문맥에서만 서버에 주입/);
    assert.match(security, /기본 hosted path\(`k-skill-proxy\.nomadamas\.org`\)/);
  });

  runParentSkillTest("proxy docs document every public v1 GET route", () => {
    const proxyDocs = [
      ["proxy README", read(path.join("packages", "k-skill-proxy", "README.md"))],
      ["proxy feature doc", read(path.join("docs", "features", "k-skill-proxy.md"))],
    ];
    const proxyServer = read(path.join("packages", "k-skill-proxy", "src", "server.js"));
    const routeMatches = [...proxyServer.matchAll(/app\.get\("([^"]+)"/g)];
    const publicV1Routes = routeMatches.map((match) => match[1]).filter((route) => route.startsWith("/v1/")).sort();

    for (const [docName, doc] of proxyDocs) {
      for (const route of publicV1Routes) {
        assert.match(doc, new RegExp(`GET ${escapeRegex(route)}`), `${docName} should document ${route}`);
      }
    }
  });

  runParentSkillTest("proxy docs document every buildConfig environment variable", () => {
    const proxyDocs = [
      ["proxy README", read(path.join("packages", "k-skill-proxy", "README.md"))],
      ["proxy feature doc", read(path.join("docs", "features", "k-skill-proxy.md"))],
    ];
    const proxyServer = read(path.join("packages", "k-skill-proxy", "src", "server.js"));
    const buildConfigSource = proxyServer.match(/function buildConfig[\s\S]+?\n}\n/);
    assert.ok(buildConfigSource, "proxy server should expose buildConfig");
    const envNames = [...buildConfigSource[0].matchAll(/env\.([A-Z0-9_]+)/g)]
      .map((match) => match[1])
      .sort();
    const uniqueEnvNames = [...new Set(envNames)];

    for (const [docName, doc] of proxyDocs) {
      for (const envName of uniqueEnvNames) {
        assert.match(doc, new RegExp(`\\b${escapeRegex(envName)}\\b`), `${docName} should document ${envName}`);
      }
    }
  });

  runParentSkillTest("local markdown links resolve to files", () => {
    const markdownFiles = ["README.md", "AGENTS.md", "CLAUDE.md", "docs", "skills", "examples"].flatMap(listMarkdownFiles);
    const missingLinks = [];

    for (const markdownFile of markdownFiles) {
      const doc = read(markdownFile);
      for (const match of doc.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        let target = match[1].trim();
        if (!target || /^(?:https?:|mailto:|#)/.test(target) || target.startsWith("app://")) continue;
        target = target.split("#")[0];
        if (!target) continue;
        if (target.includes("%")) {
          try {
            target = decodeURIComponent(target);
          } catch {
            // Keep the raw target if it is not valid percent-encoding.
          }
        }

        const resolvedPath = path.normalize(path.join(path.dirname(markdownFile), target));
        if (!fs.existsSync(path.join(repoRoot, resolvedPath))) {
          missingLinks.push(`${markdownFile}: ${match[1]} -> ${resolvedPath}`);
        }
      }
    }

    assert.deepEqual(missingLinks, []);
  });

  runParentSkillTest("repository does not track local-only artifacts", () => {
    const result = childProcess.spawnSync("git", ["ls-files", "-z"], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    assert.equal(result.status, 0, result.stderr);
    const trackedFiles = result.stdout.split("\0").filter(Boolean);
    const forbidden = [
      /\.DS_Store$/,
      /(?:^|\/)\.env(?:$|\.(?!example$).+)/,
      /\.(?:dec|plaintext|log)$/,
      /(?:^|\/)(?:data-go-kr-login-state|[^/]+-login-state)\.png$/,
      /(?:^|\/)[^/]+\.session(?:\.json)?$/,
      /\.(?:sqlite|sqlite3|db)(?:$|-)/,
      /\.(?:bak|backup|tar|tar\.gz|tgz|zip|hwp)$/,
    ];

    for (const file of trackedFiles) {
      for (const pattern of forbidden) {
        assert.doesNotMatch(file, pattern, `${file} should not be tracked local/runtime state`);
      }
    }
  });

  runParentSkillTest("root pack:dry-run script covers every publishable workspace", () => {
    const rootPackageJson = readJson("package.json");
    const packScript = rootPackageJson.scripts["pack:dry-run"] || "";
    const packageRoot = path.join(repoRoot, "packages");
    const packageDirs = fs
      .readdirSync(packageRoot)
      .filter((name) => fs.existsSync(path.join(packageRoot, name, "package.json")))
      .sort();

    for (const packageDir of packageDirs) {
      const packageJson = readJson(path.join("packages", packageDir, "package.json"));
      if (packageJson.private === true || packageJson.publishConfig?.access !== "public") {
        continue;
      }
      assert.match(
        packScript,
        new RegExp(`npm pack --workspace ${escapeRegex(packageJson.name)} --dry-run`),
        `${packageJson.name} should be included in the root pack:dry-run script`,
      );
    }
  });

  runParentSkillTest("release automation stays disabled until publish targets exist", () => {
    const rootPackageJson = readJson("package.json");
    const packageScripts = rootPackageJson.scripts || {};
    const packageDevDependencies = rootPackageJson.devDependencies || {};
    const tracked = childProcess.execFileSync("git", ["ls-files"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const trackedFiles = tracked.split("\n").filter(Boolean);
    const pythonPackageRoot = path.join(repoRoot, "python-packages");
    const pythonPackageProjects = fs.existsSync(pythonPackageRoot)
      ? fs
          .readdirSync(pythonPackageRoot)
          .filter((name) => fs.existsSync(path.join(pythonPackageRoot, name, "pyproject.toml")))
      : [];

    if (pythonPackageProjects.length === 0) {
      assert.deepEqual(
        trackedFiles
          .filter((file) => file.startsWith(".github/release-please/"))
          .filter((file) => fs.existsSync(path.join(repoRoot, file))),
        [],
        "release-please config should not be tracked before a real Python package exists",
      );
    }

    assert.equal(packageScripts["version-packages"], undefined, "Changesets version script should be absent while release automation is disabled");
    assert.equal(packageScripts["release:npm"], undefined, "npm publish script should be absent while release automation is disabled");
    assert.equal(
      packageDevDependencies["@changesets/cli"],
      undefined,
      "Changesets CLI should be reintroduced only with a real npm publish workflow",
    );
    assert.equal(
      fs.existsSync(path.join(repoRoot, ".changeset", "config.json")),
      false,
      "Changesets config should be absent while npm release automation is disabled",
    );

    const workflowFiles = trackedFiles.filter((file) => file.startsWith(".github/workflows/"));
    for (const file of workflowFiles) {
      const workflow = read(file);
      assert.doesNotMatch(workflow, /\bnpm publish\b|changeset publish|pypi|twine upload|release-please/i);
      assert.doesNotMatch(workflow, /^on:\s*\n[\s\S]*?^\s*push:\s*[\s\S]*?\bpublish\b/im);
    }

    const releaseDisabledDocs = [
      path.join("docs", "features", "lck-analytics.md"),
      path.join("packages", "lck-analytics", "README.md"),
      path.join("examples", "lck-analytics", "SKILL.md"),
      path.join("examples", "lck-analytics", "README.md"),
      path.join("examples", "kleague-results", "SKILL.md"),
    ];
    for (const docPath of releaseDisabledDocs) {
      const doc = read(docPath);
      assert.doesNotMatch(
        doc,
        /Version Packages PR|npm publish(?:\s*\([^)]*\))?(?:가| workflow가|이)?\s*실행|Changesets가 Version Packages/i,
      );
      assert.match(doc, /release workflow는 비활성 상태|release automation is disabled|release workflow is disabled/);
    }
  });

  runParentSkillTest("setup docs document newer hosted proxy-backed skills", () => {
    const setup = read(path.join("docs", "setup.md"));
    const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
    const expectedFeatures = [
      "블루리본 맛집",
      "공영주차장",
      "네이버 쇼핑",
      "네이버 뉴스",
      "LH 청약 공고",
    ];
    const expectedOperatorKeys = [
      "BLUE_RIBBON_SESSION_ID",
      "DATA_GO_KR_API_KEY",
      "NAVER_SEARCH_CLIENT_ID",
      "NAVER_SEARCH_CLIENT_SECRET",
    ];

    for (const doc of [setup, setupSkill]) {
      for (const feature of expectedFeatures) {
        assert.match(doc, new RegExp(feature), `setup docs should mention ${feature}`);
      }
      for (const envName of expectedOperatorKeys) {
        assert.match(doc, new RegExp(envName), `setup docs should mention proxy operator env ${envName}`);
      }
      assert.match(doc, /사용자 시크릿 불필요/);
      assert.match(doc, /기본 hosted proxy/);
    }

    assert.match(setup, /\[블루리본 맛집 조회 가이드\]\(features\/blue-ribbon-nearby\.md\)/);
    assert.match(setup, /\[근처 공영주차장 찾기 가이드\]\(features\/parking-lot-search\.md\)/);
    assert.match(setup, /\[네이버 쇼핑 검색 가이드\]\(features\/naver-shopping-search\.md\)/);
    assert.match(setup, /\[네이버 뉴스 검색 가이드\]\(features\/naver-news-search\.md\)/);
    assert.match(setup, /\[LH 청약 공고 조회 가이드\]\(features\/lh-notice-search\.md\)/);
  });

  runParentSkillTest("setup docs document core hosted proxy-backed skills", () => {
    const setup = read(path.join("docs", "setup.md"));
    const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
    const expectedFeatures = [
      "미세먼지",
      "한강 수위",
      "주유소 가격",
      "부동산 실거래가",
      "한국 주식 정보 조회",
      "생활쓰레기 배출정보 조회",
      "학교 급식 식단 조회",
      "도서관 도서 조회",
      "의약품 안전 체크",
      "식품 안전 체크",
    ];
    const expectedRoutes = [
      "/v1/household-waste/info",
      "/v1/neis/school-search",
      "/v1/neis/school-meal",
      "/v1/data4library/",
      "/v1/mfds/drug-safety/lookup",
      "/v1/mfds/food-safety/search",
    ];
    const expectedOperatorKeys = [
      "DATA_GO_KR_API_KEY",
      "KEDU_INFO_KEY",
      "DATA4LIBRARY_AUTH_KEY",
      "FOODSAFETYKOREA_API_KEY",
      "KRX_API_KEY",
      "OPINET_API_KEY",
    ];

    for (const doc of [setup, setupSkill]) {
      for (const feature of expectedFeatures) {
        assert.match(doc, new RegExp(feature), `setup docs should mention ${feature}`);
      }
      for (const envName of expectedOperatorKeys) {
        assert.match(doc, new RegExp(envName), `setup docs should mention proxy operator env ${envName}`);
      }
      assert.match(doc, /사용자 시크릿 불필요/);
    }

    for (const route of expectedRoutes) {
      assert.match(setupSkill, new RegExp(escapeRegex(route)), `k-skill-setup should mention ${route}`);
    }

    assert.match(setup, /\[생활쓰레기 배출정보 조회 가이드\]\(features\/household-waste-info\.md\)/);
    assert.match(setup, /\[학교 급식 식단 조회 가이드\]\(features\/k-schoollunch-menu\.md\)/);
    assert.match(setup, /\[도서관 도서 조회 가이드\]\(features\/library-book-search\.md\)/);
    assert.match(setup, /\[의약품 안전 체크 가이드\]\(features\/mfds-drug-safety\.md\)/);
    assert.match(setup, /\[식품 안전 체크 가이드\]\(features\/mfds-food-safety\.md\)/);
  });

  runParentSkillTest("productization plan pins the first mobile Today Brief quality gate", () => {
    const productization = read(path.join("docs", "productization-gstack.md"));

    assert.match(productization, /Mobile MVP Acceptance Criteria/);
    assert.match(productization, /"이번 주 챙길 것"/);
    assert.match(productization, /child switcher/);
    assert.match(productization, /source freshness strip/);
    assert.match(productization, /calendar candidate confirmation modal/);
    assert.match(productization, /Today Brief Contract/);
    assert.match(productization, /guardActionCandidate/);
    assert.match(productization, /gstack Mobile QA Checklist/);
    assert.match(productization, /mobile text does not overlap/);
    assert.match(productization, /Canary Smoke Paths/);
    assert.match(productization, /never direct submission\/payment/);
  });

  test = test.skip;
}

function writeSkillFixture(root, container, dirName, declaredName) {
  const skillDir = path.join(root, container, dirName);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      `name: ${declaredName}`,
      "description: 테스트용 스킬입니다.",
      "license: MIT",
      "---",
      "",
      "# Test Skill",
      "",
    ].join("\n"),
  );
}

function writeParentSkillFixture(root, dirName, phase) {
  const skillDir = path.join(root, "skills", dirName);
  const phaseLines = phase ? ["metadata:", "  category: parenting", "  locale: ko-KR", `  phase: ${phase}`] : [];
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      `name: ${dirName}`,
      "description: 테스트용 부모 스킬입니다.",
      "license: MIT",
      ...phaseLines,
      "---",
      "",
      "# Test Parent Skill",
      "",
    ].join("\n"),
  );
}

test("root npm test script includes the skill docs regression suite", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.match(packageJson.scripts.test, /node --test scripts\/skill-docs\.test\.js/);
});

test("README advertises OpenClaw among the supported coding agents", () => {
  const readme = read("README.md");

  assert.match(
    readme,
    /Claude Code, Codex, OpenCode, OpenClaw\/ClawHub 등 각종 코딩 에이전트 지원합니다\./,
  );
});

test("hwp skill documents kordoc-based parsing and supported operations", () => {
  const skillPath = skillAbs("hwp", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/hwp/SKILL.md to exist");

  const skill = read(skillRel("hwp", "SKILL.md"));

  assert.match(skill, /^name: hwp$/m);
  assert.match(skill, /\bkordoc\b/);
  assert.doesNotMatch(skill, /@ohah\/hwpjs/);
  assert.doesNotMatch(skill, /\bhwp-mcp\b/);
  assert.match(skill, /JSON/i);
  assert.match(skill, /Markdown/i);
  assert.match(skill, /image/i);
  assert.match(skill, /(batch|배치)/i);
  assert.match(skill, /HWPX/i);
  assert.match(skill, /(역변환|되돌려)/);
  assert.match(skill, /(비교|compare)/i);
  assert.match(skill, /pdfjs-dist/);
  assert.match(skill, /(extractFormFields|양식 필드)/);
  assert.doesNotMatch(skill, /fillForm/);
  assert.doesNotMatch(skill, /kordoc fill/);
  assert.doesNotMatch(skill, /kordoc mcp/);
});

test("hwp docs match the published kordoc install and runtime contract", () => {
  const skill = read(skillRel("hwp", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "hwp.md"));
  const install = read(path.join("docs", "install.md"));
  const readme = read("README.md");
  const sources = read(path.join("docs", "sources.md"));

  assert.match(skill, /npx --yes --package kordoc --package pdfjs-dist kordoc .* -o .*\.md/);
  assert.match(skill, /markdownToHwpx/);
  assert.match(skill, /extractFormFields/);
  assert.match(skill, /npm init -y/);
  assert.match(skill, /npm install kordoc pdfjs-dist/);
  assert.doesNotMatch(skill, /^\s*npx kordoc\b/m);
  assert.doesNotMatch(skill, /export NODE_PATH/);
  assert.match(featureDoc, /npx --yes --package kordoc --package pdfjs-dist kordoc .* --format json/);
  assert.match(featureDoc, /markdownToHwpx/);
  assert.match(featureDoc, /(extractFormFields|양식 필드)/);
  assert.match(featureDoc, /npx --yes --package kordoc --package pdfjs-dist kordoc watch/);
  assert.match(featureDoc, /npm init -y/);
  assert.match(featureDoc, /npm install kordoc pdfjs-dist/);
  assert.doesNotMatch(featureDoc, /^\s*npx kordoc\b/m);
  assert.doesNotMatch(featureDoc, /export NODE_PATH/);
  assert.match(featureDoc, /npm install -g kordoc pdfjs-dist/);
  assert.doesNotMatch(featureDoc, /선택적으로 `pdfjs-dist`/);
  assert.doesNotMatch(featureDoc, /kordoc fill/);
  assert.doesNotMatch(featureDoc, /kordoc mcp/);
  assert.doesNotMatch(featureDoc, /fillForm/);
  assert.match(install, /npm install -g kordoc pdfjs-dist /);
  assert.match(install, /HWP Node API 예시는 전역 `NODE_PATH` 대신 로컬 프로젝트에 `npm install kordoc pdfjs-dist` 후 실행/);
  assert.match(install, /`kordoc` CLI를 일회성으로만 쓸 때는 `npx --yes --package kordoc --package pdfjs-dist kordoc \.\.\.` 형태를 사용한다\./);
  assert.match(readme, /\| HWP 문서 조회\/변환 \| .*양식 필드 추출.*Markdown→HWPX 역변환/);
  assert.doesNotMatch(readme, /\| HWP 문서 조회\/변환 \| .*양식 채우기/);
  assert.match(sources, /kordoc/);
  assert.match(sources, /pdfjs-dist/);
});

test("repository docs advertise the hwp skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "hwp.md");
  const featureDoc = read(path.join("docs", "features", "hwp.md"));

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/hwp.md to exist");
  assert.match(readme, /\| HWP 문서 조회\/변환 \|/);
  assert.match(readme, /\[HWP 문서 처리 가이드\]\(docs\/features\/hwp\.md\)/);
  assert.match(install, /--skill hwp/);
  assert.match(featureDoc, /\bkordoc\b/);
  assert.doesNotMatch(featureDoc, /@ohah\/hwpjs/);
  assert.doesNotMatch(featureDoc, /\bhwp-mcp\b/);
  assert.match(install, /npm install -g kordoc /);
  assert.doesNotMatch(install, /@ohah\/hwpjs/);
});

test("repository docs advertise the kakaotalk-mac skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "kakaotalk-mac.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/kakaotalk-mac.md to exist");
  assert.match(readme, /\| 카카오톡 Mac CLI \|/);
  assert.match(readme, /\[카카오톡 Mac CLI\]\(docs\/features\/kakaotalk-mac\.md\)/);
  assert.match(install, /--skill kakaotalk-mac/);
});

test("repository docs advertise the used-car-price-search skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "used-car-price-search.md");
  const skillPath = skillAbs("used-car-price-search", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/used-car-price-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/used-car-price-search/SKILL.md to exist");
  assert.match(readme, /\| 중고차 가격 조회 \|/);
  assert.match(readme, /\[중고차 가격 조회 가이드\]\(docs\/features\/used-car-price-search\.md\)/);
  assert.match(install, /--skill used-car-price-search/);
  assert.match(
    install,
    /npm install -g kordoc pdfjs-dist kbo-game kbl-results kleague-results lck-analytics toss-securities hipass-receipt k-lotto coupang-product-search used-car-price-search cheap-gas-nearby public-restroom-nearby korean-law-mcp/,
  );
});

test("repository docs advertise the public-restroom-nearby skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "public-restroom-nearby.md");
  const skillPath = skillAbs("public-restroom-nearby", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/public-restroom-nearby.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/public-restroom-nearby/SKILL.md to exist");
  assert.match(readme, /\| 근처 공중화장실 찾기 \|/);
  assert.match(readme, /\[근처 공중화장실 찾기 가이드\]\(docs\/features\/public-restroom-nearby\.md\)/);
  assert.match(install, /--skill public-restroom-nearby/);
  assert.match(install, /npm install -g .*public-restroom-nearby/);
});

test("public-restroom-nearby docs describe the maxDistanceMeters distance cap", () => {
  const featureDoc = read(path.join("docs", "features", "public-restroom-nearby.md"));
  const packageReadme = read(path.join("packages", "public-restroom-nearby", "README.md"));

  assert.match(featureDoc, /maxDistanceMeters/);
  assert.match(featureDoc, /100m/);
  assert.match(packageReadme, /maxDistanceMeters/);
  assert.match(packageReadme, /100m/);
});

test("repository docs advertise the lck-analytics skill and package", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "lck-analytics.md");
  const skillPath = skillAbs("lck-analytics", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/lck-analytics.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/lck-analytics/SKILL.md to exist");
  assert.match(readme, /\| LCK 경기 분석 \|/);
  assert.match(readme, /\[LCK 경기 분석 가이드\]\(docs\/features\/lck-analytics\.md\)/);
  assert.match(install, /--skill lck-analytics/);
  assert.match(install, /npm install -g .*lck-analytics/);
});

test("lck-analytics docs and skill credit the original author and reference repo", () => {
  const skill = read(skillRel("lck-analytics", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "lck-analytics.md"));
  const packageReadme = read(path.join("packages", "lck-analytics", "README.md"));
  const sources = read(path.join("docs", "sources.md"));

  for (const doc of [skill, featureDoc, packageReadme]) {
    assert.match(doc, /jerjangmin/);
    assert.match(doc, /https:\/\/github\.com\/jerjangmin\/share\/tree\/main\/SKILL\/lck-analytics/);
    assert.match(doc, /Riot|LoL Esports|Oracle(?:'s)? Elixir/i);
  }

  assert.match(sources, /https:\/\/github\.com\/jerjangmin\/share\/tree\/main\/SKILL\/lck-analytics/);
});

test("repository docs advertise the korean-spell-check skill and usage constraints", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-spell-check.md");
  const skillPath = skillAbs("korean-spell-check", "SKILL.md");
  const featureDoc = read(path.join("docs", "features", "korean-spell-check.md"));
  const skill = read(skillRel("korean-spell-check", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-spell-check.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-spell-check/SKILL.md to exist");
  assert.match(readme, /\| 한국어 맞춤법 검사 \|/);
  assert.match(readme, /\[한국어 맞춤법 검사 가이드\]\(docs\/features\/korean-spell-check\.md\)/);
  assert.match(install, /--skill korean-spell-check/);
  assert.match(skill, /비상업적 용도|개인이나 학생만 무료/);
  assert.match(skill, /robots\.txt/i);
  assert.match(skill, /청크|chunk/i);
  assert.match(skill, /원문.*교정안.*이유/s);
  assert.match(featureDoc, /old_speller\/results/);
  assert.match(featureDoc, /Cloudflare|403/);
  assert.match(featureDoc, /python3 scripts\/korean_spell_check\.py/);
  assert.match(sources, /https:\/\/nara-speller\.co\.kr\/speller\//);
  assert.match(sources, /https:\/\/nara-speller\.co\.kr\/old_speller\//);
  assert.match(sources, /https:\/\/nara-speller\.co\.kr\/robots\.txt/);
  assert.match(roadmap, /한국어 맞춤법 검사 스킬 출시/);
});

test("repository docs advertise the MFDS public-health skills and mandatory symptom interview", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const drugSkillPath = skillAbs("mfds-drug-safety", "SKILL.md");
  const foodSkillPath = skillAbs("mfds-food-safety", "SKILL.md");
  const drugFeaturePath = path.join(repoRoot, "docs", "features", "mfds-drug-safety.md");
  const foodFeaturePath = path.join(repoRoot, "docs", "features", "mfds-food-safety.md");

  assert.ok(fs.existsSync(drugSkillPath), "expected examples/mfds-drug-safety/SKILL.md to exist");
  assert.ok(fs.existsSync(foodSkillPath), "expected examples/mfds-food-safety/SKILL.md to exist");
  assert.ok(fs.existsSync(drugFeaturePath), "expected docs/features/mfds-drug-safety.md to exist");
  assert.ok(fs.existsSync(foodFeaturePath), "expected docs/features/mfds-food-safety.md to exist");
  assert.match(readme, /\| 의약품 안전 체크 \|/);
  assert.match(readme, /\| 식품 안전 체크 \|/);
  assert.match(readme, /\| 의약품 안전 체크 \| .* \| 불필요 \|/);
  assert.match(readme, /\| 식품 안전 체크 \| .* \| 불필요 \|/);
  assert.match(install, /--skill mfds-drug-safety/);
  assert.match(install, /--skill mfds-food-safety/);
  assert.match(sources, /15075057\/openapi\.do/);
  assert.match(sources, /15097208\/openapi\.do/);
  assert.match(sources, /15056516\/openapi\.do/);
  assert.match(sources, /15074318\/openapi\.do/);
  assert.match(sources, /foodsafetykorea\.go\.kr\/api\/openApiInfo\.do.*svc_no=I0490/);
  for (const doc of [setup, security, setupSkill]) {
    assert.match(doc, /의약품 안전 체크|식품 안전 체크/);
    assert.match(doc, /FOODSAFETYKOREA_API_KEY|DATA_GO_KR_API_KEY/);
    assert.match(doc, /사용자.*불필요|proxy 서버/u);
  }

  for (const relativePath of [
    skillRel("mfds-drug-safety", "SKILL.md"),
    skillRel("mfds-food-safety", "SKILL.md"),
    path.join("docs", "features", "mfds-drug-safety.md"),
    path.join("docs", "features", "mfds-food-safety.md")
  ]) {
    const doc = read(relativePath);

    assert.match(doc, /인터뷰|되묻/);
    assert.match(doc, /호흡곤란/);
    assert.match(doc, /직접 진단|진단\/처방|진단\)이나/);
    assert.match(doc, /119|응급실/);
  }
});
test("used-car-price-search docs document the provider survey and SK direct surface", () => {
  const skill = read(skillRel("used-car-price-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "used-car-price-search.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /SK렌터카|SK렌터카 다이렉트|타고BUY/);
    assert.match(doc, /롯데렌탈|롯데오토옥션/);
    assert.match(doc, /레드캡렌터카/);
    assert.match(doc, /MCP/i);
    assert.match(doc, /Skill/i);
    assert.match(doc, /https:\/\/www\.skdirect\.co\.kr\/tb/);
    assert.match(doc, /__NEXT_DATA__/);
    assert.match(doc, /인수가/);
    assert.match(doc, /월\s*렌트료|월\s*요금|월\s*가격/);
    assert.match(doc, /10회 이상|최소 10회/);
  }

  assert.match(featureDoc, /2026-04-02/);
  assert.match(featureDoc, /inventory 규모는 시점에 따라 변동될 수/);
  assert.doesNotMatch(featureDoc, /총 `\d+대`/);
  assert.match(sources, /https:\/\/www\.skdirect\.co\.kr\/tb/);
  assert.match(sources, /https:\/\/www\.lotteautoauction\.net\/hp\/pub\/cmm\/viewMain\.do/);
  assert.match(sources, /https:\/\/biz\.redcap\.co\.kr\/rent\//);
  assert.match(roadmap, /중고차 가격 조회 스킬 출시/);
});

test("seoul subway docs require an explicit proxy until the hosted route is live", () => {
  const readme = read("README.md");
  const setup = read(path.join("docs", "setup.md"));
  const install = read(path.join("docs", "install.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const skill = read(skillRel("seoul-subway-arrival", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "seoul-subway-arrival.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));
  const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));
  const secretsExample = read(path.join("examples", "secrets.env.example"));

  assert.match(readme, /\| 서울 지하철 도착정보 조회 \| .* \| 불필요 \|/);
  assert.match(setup, /\| 서울 지하철 도착정보 조회 \| self-host 또는 배포 확인이 끝난 `KSKILL_PROXY_BASE_URL` \|/);
  assert.match(install, /--skill seoul-subway-arrival/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /KSKILL_PROXY_BASE_URL/);
    assert.match(doc, /\/v1\/seoul-subway\/arrival/);
    assert.match(doc, /사용자가 .*OpenAPI key.*직접.*필요(가|는)? 없다|개인 API key 없이/i);
    assert.match(doc, /self-host|운영 중인 proxy|배포가 끝난 proxy/i);
    assert.doesNotMatch(doc, /SEOUL_OPEN_API_KEY/);
    assert.doesNotMatch(doc, /swopenAPI\.seoul\.go\.kr\/api\/subway\/\$\{SEOUL_OPEN_API_KEY\}/);
    assert.doesNotMatch(doc, /기본값 `https:\/\/k-skill-proxy\.nomadamas\.org`/);
    assert.doesNotMatch(doc, /없으면 hosted proxy .*기본/);
  }

  assert.match(proxyDoc, /GET \/v1\/seoul-subway\/arrival/);
  assert.match(proxyDoc, /SEOUL_OPEN_API_KEY/);
  assert.match(proxyReadme, /GET \/v1\/seoul-subway\/arrival/);
  assert.match(proxyReadme, /SEOUL_OPEN_API_KEY/);
  assert.match(security, /KSKILL_PROXY_BASE_URL/);
  assert.match(security, /배포가 끝난 proxy|self-host/i);
  assert.match(setupSkill, /서울 지하철: self-host 또는 배포 확인이 끝난 `KSKILL_PROXY_BASE_URL`/);
  assert.doesNotMatch(secretsExample, /SEOUL_OPEN_API_KEY/);
  assert.match(secretsExample, /KSKILL_PROXY_BASE_URL=https:\/\/your-proxy\.example\.com/);
  assert.doesNotMatch(secretsExample, /KSKILL_PROXY_BASE_URL=https:\/\/k-skill-proxy\.nomadamas\.org/);
});

test("repository docs advertise the korea-weather skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korea-weather.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korea-weather.md to exist");
  assert.match(readme, /\| 한국 날씨 조회 \|/);
  assert.match(readme, /\[한국 날씨 조회 가이드\]\(docs\/features\/korea-weather\.md\)/);
  assert.match(install, /--skill korea-weather/);
  assert.match(roadmap, /한국 날씨 조회 스킬 출시/);
  assert.match(sources, /기상청 단기예보 조회서비스: https:\/\/www\.data\.go\.kr\/data\/15084084\/openapi\.do/);
});

test("korea-weather docs route short-term forecast calls through the proxy without requiring a user API key", () => {
  const skillPath = skillAbs("korea-weather", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/korea-weather/SKILL.md to exist");

  const skill = read(skillRel("korea-weather", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "korea-weather.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));
  const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));

  assert.match(skill, /^name: korea-weather$/m);
  assert.match(skill, /^description: .*날씨.*기상청.*프록시.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /\/v1\/korea-weather\/forecast/);
    assert.match(doc, /기상청.*단기예보|단기예보.*기상청/);
    assert.match(doc, /사용자가 .*API key.*직접.*필요(가|는)? 없다|개인 API key 없이/i);
    assert.match(doc, /nx|ny|위도|경도/u);
    assert.match(doc, /TMP|SKY|PTY|POP/);
    assert.match(doc, /KSKILL_PROXY_BASE_URL|k-skill-proxy\.nomadamas\.org/);
    assert.doesNotMatch(doc, /KMA_OPEN_API_KEY=.*사용자/);
  }

  assert.match(proxyDoc, /GET \/v1\/korea-weather\/forecast/);
  assert.match(proxyDoc, /KMA_OPEN_API_KEY/);
  assert.match(proxyReadme, /GET \/v1\/korea-weather\/forecast/);
  assert.match(proxyReadme, /KMA_OPEN_API_KEY/);
});

test("kakaotalk-mac skill documents safe macOS kakaocli usage", () => {
  const skillPath = skillAbs("kakaotalk-mac", "SKILL.md");
  const helperPath = path.join(repoRoot, "scripts", "kakaotalk_mac.py");
  const featureDoc = read(path.join("docs", "features", "kakaotalk-mac.md"));

  assert.ok(fs.existsSync(skillPath), "expected examples/kakaotalk-mac/SKILL.md to exist");
  assert.ok(fs.existsSync(helperPath), "expected scripts/kakaotalk_mac.py to exist");

  const skill = read(skillRel("kakaotalk-mac", "SKILL.md"));

  assert.match(skill, /^name: kakaotalk-mac$/m);
  assert.match(skill, /kakaocli/);
  assert.match(skill, /macOS/i);
  assert.match(skill, /KakaoTalk/i);
  assert.match(skill, /Full Disk Access/i);
  assert.match(skill, /Accessibility/i);
  assert.match(skill, /--me/);
  assert.match(skill, /confirm before sending/i);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /python3 scripts\/kakaotalk_mac\.py auth/);
    assert.match(doc, /python3 scripts\/kakaotalk_mac\.py chats --limit 10 --json/);
    assert.match(doc, /python3 scripts\/kakaotalk_mac\.py messages --chat/);
    assert.match(doc, /python3 scripts\/kakaotalk_mac\.py search/);
    assert.match(doc, /user_id 자동 감지 실패|SHA-512|DESIGNATEDFRIENDSREVISION/i);
    assert.match(doc, /cache|캐시/);
    assert.match(doc, /read-only|읽기 전용/i);
    assert.doesNotMatch(doc, /`query`/);
  }
});

test("repository docs advertise the KTX booking skill as supported", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "ktx-booking.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/ktx-booking.md to exist");
  assert.match(readme, /\| KTX 예매 \|/);
  assert.match(readme, /\[KTX 예매 가이드\]\(docs\/features\/ktx-booking\.md\)/);
  assert.doesNotMatch(readme, /KTX 예매는 현재 작동하지 않습니다/);
  assert.doesNotMatch(readme, /KTX 예매 \| 현재 작동하지 않음/);
  assert.match(install, /--skill ktx-booking/);
});

test("ktx-booking docs document the helper-based live Korail workflow", () => {
  const skillPath = skillAbs("ktx-booking", "SKILL.md");
  const helperPath = path.join(repoRoot, "scripts", "ktx_booking.py");

  assert.ok(fs.existsSync(skillPath), "expected examples/ktx-booking/SKILL.md to exist");
  assert.ok(fs.existsSync(helperPath), "expected scripts/ktx_booking.py to exist");

  const skill = read(skillRel("ktx-booking", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "ktx-booking.md"));
  const helper = read(path.join("scripts", "ktx_booking.py"));

  assert.match(skill, /^name: ktx-booking$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /python3 scripts\/ktx_booking\.py search/);
    assert.match(doc, /python3 scripts\/ktx_booking\.py reserve/);
    assert.match(doc, /python3 scripts\/ktx_booking\.py reservations/);
    assert.match(doc, /python3 scripts\/ktx_booking\.py cancel/);
    assert.match(doc, /train_id/);
    assert.match(doc, /--train-id/);
    assert.match(doc, /--include-no-seats/);
    assert.match(doc, /--include-waiting-list/);
    assert.match(doc, /--try-waiting/);
    assert.match(doc, /credential resolution order|KSKILL_KTX_ID/);
    assert.match(doc, /anti-bot|Dynapath|x-dynapath-m-token/i);
    assert.match(doc, /결제(까지)?는 자동화하지 않는다|결제는 제외/);
    assert.doesNotMatch(doc, /예약 시 선택할 `--train-index`/);
  }

  assert.match(helper, /x-dynapath-m-token/);
  assert.match(helper, /250601002/);
  assert.match(helper, /def build_parser/);
  assert.match(helper, /train_id/);
});

test("ktx-booking helper python regression tests pass", () => {
  const result = childProcess.spawnSync(
    "python3",
    ["-m", "unittest", "discover", "-s", "scripts", "-p", "test_ktx_booking.py"],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PYTHONNOUSERSITE: "1" },
    },
  );

  assert.equal(
    result.status,
    0,
    `expected python KTX helper regression tests to pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});



test("repository docs advertise the geeknews-search skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "geeknews-search.md");
  const skillPath = skillAbs("geeknews-search", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/geeknews-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/geeknews-search/SKILL.md to exist");
  assert.match(readme, /\| 긱뉴스 조회 \|/);
  assert.match(readme, /\[긱뉴스 조회 가이드\]\(docs\/features\/geeknews-search\.md\)/);
  assert.match(install, /--skill geeknews-search/);
});

test("geeknews-search docs lock the RSS-first list-search-detail workflow", () => {
  const skill = read(skillRel("geeknews-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "geeknews-search.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /feeds\.feedburner\.com\/geeknews-feed/);
    assert.match(doc, /python3 scripts\/geeknews_search\.py list/);
    assert.match(doc, /python3 scripts\/geeknews_search\.py search/);
    assert.match(doc, /python3 scripts\/geeknews_search\.py detail/);
    assert.match(doc, /RSS-first|RSS first|RSS 피드/);
    assert.match(doc, /read-only|읽기 전용/);
  }
});

test("repository docs advertise the subway-lost-property skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "subway-lost-property.md");
  const skillPath = skillAbs("subway-lost-property", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/subway-lost-property.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/subway-lost-property/SKILL.md to exist");
  assert.match(readme, /\| 지하철 분실물 조회 \|/);
  assert.match(readme, /\[지하철 분실물 조회 가이드\]\(docs\/features\/subway-lost-property\.md\)/);
  assert.match(install, /--skill subway-lost-property/);
});

test("subway-lost-property docs lock the official LOST112 guidance flow", () => {
  const skill = read(skillRel("subway-lost-property", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "subway-lost-property.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /LOST112/);
    assert.match(doc, /seoulmetro\.co\.kr\/kr\/page\.do\?menuIdx=541/);
    assert.match(doc, /python3 scripts\/subway_lost_property\.py/);
    assert.match(doc, /SITE=V/);
    assert.match(doc, /안내형|하이브리드/);
  }
});

test("repository docs advertise the zipcode-search skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "zipcode-search.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/zipcode-search.md to exist");
  assert.match(readme, /\| 우편번호 검색 \|/);
  assert.match(readme, /\[우편번호 검색 가이드\]\(docs\/features\/zipcode-search\.md\)/);
  assert.match(install, /--skill zipcode-search/);
  assert.match(roadmap, /우편번호 검색/);
  assert.match(sources, /우체국 도로명주소 검색: https:\/\/parcel\.epost\.go\.kr\/parcel\/comm\/zipcode\/comm_newzipcd_list\.jsp/);
});

test("zipcode-search docs lock the official postcode plus English-address extraction flow", () => {
  const skillPath = skillAbs("zipcode-search", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/zipcode-search/SKILL.md to exist");

  const skill = read(skillRel("zipcode-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "zipcode-search.md"));
  const readme = read("README.md");
  const sources = read(path.join("docs", "sources.md"));

  assert.match(skill, /^name: zipcode-search$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /https:\/\/www\.epost\.kr\/search\.RetrieveIntegrationNewZipCdList\.comm/);
    assert.match(doc, /viewDetail/);
    assert.match(doc, /English\/집배코드/);
    assert.match(doc, /Rep\. of KOREA/);
    assert.match(doc, /curl --http1\.1 --tls-max 1\.2/);
    assert.match(doc, /--max-time/);
    assert.match(doc, /"--retry",\s+"3"/);
    assert.match(doc, /--retry-all-errors/);
    assert.match(doc, /"--retry-delay",\s+"1"/);
    assert.match(doc, /영문 주소|영문주소/);
    assert.match(doc, /python3 scripts\/zipcode_search\.py/);
    assert.match(doc, /\.\/scripts\/zipcode_search\.py/);
    assert.match(doc, /mktemp|임시 파일/);
    assert.doesNotMatch(doc, /urllib\.request/);
  }

  assert.match(readme, /우편번호 \+ 공식 영문주소 조회/);
  assert.match(sources, /우체국 통합 우편번호\/영문주소 검색: https:\/\/www\.epost\.kr\/search\.RetrieveIntegrationNewZipCdList\.comm/);
  assert.match(skill, /검색 결과가 없으면/i);
  assert.doesNotMatch(skill, /timeout\s*=/);
  assert.doesNotMatch(featureDoc, /timeout\s*=/);
  assert.match(featureDoc, /프로토콜\/클라이언트 제약/i);
});

test("repository docs advertise the delivery-tracking skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "delivery-tracking.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/delivery-tracking.md to exist");
  assert.match(readme, /\| 택배 배송조회 \|/);
  assert.match(readme, /\[택배 배송조회 가이드\]\(docs\/features\/delivery-tracking\.md\)/);
  assert.match(install, /--skill delivery-tracking/);
  assert.match(roadmap, /택배 배송조회 스킬 출시/);
  assert.match(sources, /CJ대한통운 배송조회: https:\/\/www\.cjlogistics\.com\/ko\/tool\/parcel\/tracking/);
  assert.match(sources, /우체국 배송조회: https:\/\/service\.epost\.go\.kr\/trace\.RetrieveRegiPrclDeliv\.postal\?sid1=/);
});

test("delivery-tracking skill documents official CJ and ePost flows with extension guidance", () => {
  const skillPath = skillAbs("delivery-tracking", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/delivery-tracking/SKILL.md to exist");

  const skill = read(skillRel("delivery-tracking", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "delivery-tracking.md"));

  assert.match(skill, /^name: delivery-tracking$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /https:\/\/www\.cjlogistics\.com\/ko\/tool\/parcel\/tracking/);
    assert.match(doc, /tracking-detail/);
    assert.match(doc, /paramInvcNo/);
    assert.match(doc, /_csrf/);
    assert.match(doc, /10자리 또는 12자리/);
    assert.match(doc, /https:\/\/service\.epost\.go\.kr\/trace\.RetrieveRegiPrclDeliv\.postal\?sid1=/);
    assert.match(doc, /trace\.RetrieveDomRigiTraceList\.comm/);
    assert.match(doc, /sid1/);
    assert.match(doc, /13자리/);
    assert.match(doc, /curl --http1\.1 --tls-max 1\.2/);
    assert.match(doc, /carrier adapter/i);
    assert.match(doc, /다른 택배사/);
  }

  assert.match(skill, /1234567890/);
  assert.match(skill, /1234567890123/);
  assert.match(skill, /python3/);
  assert.match(featureDoc, /JSON/);
  assert.match(featureDoc, /HTML/);
});

test("delivery-tracking published examples lock a shared normalized non-PII schema", () => {
  const skill = read(skillRel("delivery-tracking", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "delivery-tracking.md"));
  const expectedTopLevelEntries = {
    cj: [
      ["carrier", '"cj"'],
      ["invoice", 'payload["parcelDetailResultMap"]["paramInvcNo"]'],
      ["status_code", 'latest.get("crgSt")'],
      ["status", 'status_map.get(latest.get("crgSt"), latest.get("scanNm") or "알수없음")'],
      ["timestamp", 'latest.get("dTime")'],
      ["location", 'latest.get("regBranNm")'],
      ["event_count", "len(events)"],
      ["recent_events", "normalized_events[-min(3, len(normalized_events)):]"],
    ],
    epost: [
      ["carrier", '"epost"'],
      ["invoice", 'clean(summary.group("tracking"))'],
      ["status", 'clean(summary.group("result"))'],
      ["timestamp", 'latest_event["timestamp"] if latest_event else None'],
      ["location", 'latest_event["location"] if latest_event else None'],
      ["event_count", "len(normalized_events)"],
      ["recent_events", "normalized_events[-min(3, len(normalized_events)):]"],
    ],
  };
  const expectedRecentEventEntries = {
    cj: [
      ["timestamp", 'event.get("dTime")'],
      ["location", 'event.get("regBranNm")'],
      ["status_code", 'event.get("crgSt")'],
      ["status", 'status_map.get(event.get("crgSt"), event.get("scanNm") or "알수없음")'],
    ],
    epost: [
      ["timestamp", 'f"{day} {time_}"'],
      ["location", "clean_location(location)"],
      ["status", "clean(status)"],
    ],
  };

  assert.doesNotMatch(skill, /"message":\s*latest\.get\("crgNm"\)/);
  assert.doesNotMatch(
    featureDoc,
    /print\(json\.dumps\(payload\["parcelDetailResultMap"\]\["resultList"\]\[-1\],\s*ensure_ascii=False,\s*indent=2\)\)/,
  );

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /공통 포맷/);
    assert.match(doc, /공통 결과 스키마/);
    assert.match(doc, /최근 이벤트/);
    assert.match(doc, /`carrier`/);
    assert.match(doc, /`invoice`/);
    assert.match(doc, /`status`/);
    assert.match(doc, /`timestamp`/);
    assert.match(doc, /`location`/);
    assert.match(doc, /`event_count`/);
    assert.match(doc, /`recent_events`/);
    assert.match(doc, /최근 최대 3개 이벤트/);
    assert.doesNotMatch(doc, /최근 3~5개 이벤트/);
    assert.match(doc, /"invoice":\s*payload\["parcelDetailResultMap"\]\["paramInvcNo"\]/);
    assert.match(doc, /"status_code":\s*latest\.get\("crgSt"\)/);
    assert.match(doc, /"status":\s*status_map\.get\(latest\.get\("crgSt"\),/);
    assert.match(doc, /"timestamp":\s*latest\.get\("dTime"\)/);
    assert.match(doc, /"location":\s*latest\.get\("regBranNm"\)/);
    assert.match(doc, /"event_count":\s*len\(events\)/);
    assert.match(doc, /"recent_events":/);
    assert.match(doc, /"invoice":\s*clean\(summary\.group/);
    assert.match(doc, /"timestamp":\s*latest_event\["timestamp"\] if latest_event else None/);
    assert.match(doc, /"location":\s*latest_event\["location"\] if latest_event else None/);
    assert.match(doc, /"event_count":\s*len\(normalized_events\)/);
    assert.match(doc, /"recent_events":\s*normalized_events\[-min\(3,\s*len\(normalized_events\)\):\]/);
    assert.match(doc, /def clean_location\(raw: str\) -> str:/);
    assert.match(doc, /TEL/);
    assert.match(doc, /\\d\{2,4\}/);
    assert.match(doc, /"location":\s*clean_location\(location\)/);
    assert.doesNotMatch(doc, /"tracking_no":/);
    assert.doesNotMatch(doc, /"latest_event_date":/);
    assert.doesNotMatch(doc, /"latest_event_time":/);
    assert.doesNotMatch(doc, /"latest_event_location":/);
    assert.doesNotMatch(doc, /"delivered_to":/);
    assert.doesNotMatch(doc, /"delivery_result":/);
  }

  for (const [label, doc] of [
    ["skill doc", skill],
    ["feature doc", featureDoc],
  ]) {
    assert.deepEqual(
      extractQuotedEntries(findPrintedObjectBlock(doc, "cj"), 4),
      expectedTopLevelEntries.cj,
      `${label} CJ example must keep the exact normalized top-level mapping`,
    );
    assert.deepEqual(
      extractQuotedEntries(findPrintedObjectBlock(doc, "epost"), 4),
      expectedTopLevelEntries.epost,
      `${label} ePost example must keep the exact normalized top-level mapping`,
    );
    assert.deepEqual(
      extractQuotedEntries(
        findRecentEventsBlock(doc, "cj"),
        8,
      ),
      expectedRecentEventEntries.cj,
      `${label} CJ recent_events entries must keep the exact normalized mapping`,
    );
    assert.deepEqual(
      extractQuotedEntries(
        findRecentEventsBlock(doc, "epost"),
        8,
      ),
      expectedRecentEventEntries.epost,
      `${label} ePost recent_events entries must keep the exact normalized mapping`,
    );
  }

  assert.doesNotMatch(skill, /"message":\s*latest\.get\("crgNm"\)/);
  assert.doesNotMatch(featureDoc, /print\(\{\s*"tracking_no"/);
});

test("delivery-tracking docs publish aligned sample normalized outputs for both carriers", () => {
  const expectedSamples = readJson(
    path.join("scripts", "fixtures", "delivery-tracking-public-samples.json"),
  );
  const skill = read(skillRel("delivery-tracking", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "delivery-tracking.md"));
  const cjSkillOutput = findJsonFenceAfterLabel(skill, "CJ 공개 출력 예시");
  const cjFeatureOutput = findJsonFenceAfterLabel(featureDoc, "CJ 공개 출력 예시");
  const epostSkillOutput = findJsonFenceAfterLabel(skill, "우체국 공개 출력 예시");
  const epostFeatureOutput = findJsonFenceAfterLabel(featureDoc, "우체국 공개 출력 예시");

  for (const [docLabel, doc] of [
    ["skill doc", skill],
    ["feature doc", featureDoc],
  ]) {
    for (const [carrier, label] of [
      ["cj", "CJ 공개 출력 예시"],
      ["epost", "우체국 공개 출력 예시"],
    ]) {
      assert.equal(
        findJsonFenceTextAfterLabel(doc, label),
        JSON.stringify(expectedSamples[carrier], null, 2),
        `${docLabel} ${carrier} sample JSON block must stay byte-for-byte aligned with the checked-in public fixture`,
      );
    }
  }
  assert.deepEqual(cjSkillOutput, cjFeatureOutput, "CJ sample output must stay aligned across docs");
  assert.deepEqual(epostSkillOutput, epostFeatureOutput, "ePost sample output must stay aligned across docs");
  assert.deepEqual(cjSkillOutput, expectedSamples.cj, "CJ sample output must stay pinned to the verified public fixture");
  assert.deepEqual(epostSkillOutput, expectedSamples.epost, "ePost sample output must stay pinned to the verified public fixture");
  assertSanitizedPublicOutput(cjSkillOutput, "CJ sample output");
  assertSanitizedPublicOutput(epostSkillOutput, "ePost sample output");
});

test("delivery-tracking docs pin sample provenance to the verified smoke-test date and invoice", () => {
  const expectedProvenance = readJson(
    path.join("scripts", "fixtures", "delivery-tracking-public-provenance.json"),
  );
  const skill = read(skillRel("delivery-tracking", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "delivery-tracking.md"));

  for (const [docLabel, doc] of [
    ["skill doc", skill],
    ["feature doc", featureDoc],
  ]) {
    assertSampleProvenance(doc, "CJ 공개 출력 예시", expectedProvenance.cj, docLabel);
    assertSampleProvenance(doc, "우체국 공개 출력 예시", expectedProvenance.epost, docLabel);
  }
});

test("repository docs advertise the daiso-product-search skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "daiso-product-search.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/daiso-product-search.md to exist");
  assert.match(readme, /\| 다이소 상품 조회 \|/);
  assert.match(readme, /\[다이소 상품 조회 가이드\]\(docs\/features\/daiso-product-search\.md\)/);
  assert.match(install, /--skill daiso-product-search/);
});

test("daiso-product-search skill documents the official Daiso Mall lookup flow", () => {
  const skillPath = skillAbs("daiso-product-search", "SKILL.md");
  const featureDoc = read(path.join("docs", "features", "daiso-product-search.md"));

  assert.ok(fs.existsSync(skillPath), "expected examples/daiso-product-search/SKILL.md to exist");

  const skill = read(skillRel("daiso-product-search", "SKILL.md"));

  assert.match(skill, /^name: daiso-product-search$/m);
  assert.match(skill, /다이소몰/i);
  assert.match(skill, /매장명/);
  assert.match(skill, /상품명|검색어/);
  assert.match(skill, /https:\/\/www\.daisomall\.co\.kr\/api\/ms\/msg\/selStr/);
  assert.match(skill, /https:\/\/www\.daisomall\.co\.kr\/ssn\/search\/SearchGoods/);
  assert.match(skill, /https:\/\/www\.daisomall\.co\.kr\/api\/pd\/pdh\/selStrPkupStck/);
  assert.match(skill, /공식 표면이 매장 내 진열 위치를 주지 않으면 재고 중심/);
  assert.match(featureDoc, /SearchGoods/);
  assert.match(featureDoc, /selStrPkupStck/);
});

test("daiso-product-search package exposes reusable store, product, and stock helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "daiso-product-search", "src", "index.js"));

  assert.equal(typeof pkg.searchStores, "function");
  assert.equal(typeof pkg.searchProducts, "function");
  assert.equal(typeof pkg.getStorePickupStock, "function");
  assert.equal(typeof pkg.lookupStoreProductAvailability, "function");
});

test("daiso-product-search docs record the shipped feature and official sources", () => {
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));

  assert.match(roadmap, /다이소 상품 조회 스킬 출시/);
  assert.match(sources, /https:\/\/www\.daisomall\.co\.kr\/api\/ms\/msg\/selStr/);
  assert.match(sources, /https:\/\/www\.daisomall\.co\.kr\/ssn\/search\/SearchGoods/);
  assert.match(sources, /https:\/\/www\.daisomall\.co\.kr\/api\/pd\/pdh\/selStrPkupStck/);
});

test("repository docs advertise the market-kurly-search skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "market-kurly-search.md");
  const skillPath = skillAbs("market-kurly-search", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/market-kurly-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/market-kurly-search/SKILL.md to exist");
  assert.match(readme, /\| 마켓컬리 상품 조회 \|/);
  assert.match(readme, /\[마켓컬리 상품 조회 가이드\]\(docs\/features\/market-kurly-search\.md\)/);
  assert.match(install, /--skill market-kurly-search/);
  assert.match(install, /npm install -g .* market-kurly-search/);
  assert.match(roadmap, /마켓컬리 상품 조회 스킬 출시/);
  assert.match(sources, /https:\/\/api\.kurly\.com\/search\/v4\/sites\/market\/normal-search/);
  assert.match(sources, /https:\/\/api\.kurly\.com\/search\/v3\/sites\/market\/normal-search\/count/);
  assert.match(sources, /https:\/\/www\.kurly\.com\/goods\/5063110/);
});

test("market-kurly-search skill and docs describe the unauthenticated Kurly search and detail flow", () => {
  const skill = read(skillRel("market-kurly-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "market-kurly-search.md"));

  assert.match(skill, /^name: market-kurly-search$/m);
  assert.match(skill, /^description: .*마켓컬리.*상품.*가격.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /api\.kurly\.com\/search\/v4\/sites\/market\/normal-search/);
    assert.match(doc, /api\.kurly\.com\/search\/v3\/sites\/market\/normal-search\/count/);
    assert.match(doc, /www\.kurly\.com\/goods\/<productNo>|www\.kurly\.com\/goods\/5063110/);
    assert.match(doc, /로그인 없이|비로그인/);
    assert.match(doc, /현재 가격|할인/);
    assert.match(doc, /품절 여부|판매 상태/);
    assert.match(doc, /가격.*달라질 수|시점에 따라 달라질 수/u);
    assert.match(doc, /주문|장바구니/);
    assert.match(doc, /보수적으로|보수적/);
  }
});

test("market-kurly-search package exposes reusable search/count/detail helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "market-kurly-search", "src", "index.js"));

  assert.equal(typeof pkg.searchProducts, "function");
  assert.equal(typeof pkg.countProducts, "function");
  assert.equal(typeof pkg.getProductDetail, "function");
});

test("repository docs advertise the olive-young-search skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "olive-young-search.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/olive-young-search.md to exist");
  assert.match(readme, /\| 올리브영 검색 \|/);
  assert.match(readme, /\[올리브영 검색 가이드\]\(docs\/features\/olive-young-search\.md\)/);
  assert.match(install, /--skill olive-young-search/);
  assert.match(install, /npm install -g .* daiso/);
  assert.match(roadmap, /올리브영 검색 스킬 출시/);
  assert.match(sources, /https:\/\/github\.com\/hmmhmmhm\/daiso-mcp/);
  assert.match(sources, /https:\/\/www\.npmjs\.com\/package\/daiso/);
  assert.match(sources, /https:\/\/mcp\.aka\.page\/api\/oliveyoung\/stores/);
  assert.match(sources, /https:\/\/mcp\.aka\.page\/api\/oliveyoung\/products/);
  assert.match(sources, /https:\/\/mcp\.aka\.page\/api\/oliveyoung\/inventory/);
});

test("olive-young install docs warn about intermittent public endpoint failures and direct users to retry or clone fallback", () => {
  const install = read(path.join("docs", "install.md"));
  const quickstart = findSection(install, "### `olive-young-search` upstream CLI quickstart");

  assert.match(install, /olive-young-search/);
  assert.match(install, /5xx\/503/);
  assert.match(install, /재시도|retry/i);
  assert.match(install, /clone fallback|git clone https:\/\/github\.com\/hmmhmmhm\/daiso-mcp\.git/i);
  assertOliveYoungCloneFallbackShorthand(quickstart, "olive-young install quickstart");
  assertOliveYoungCloneFallbackCommands(quickstart, "olive-young install quickstart");
});

test("olive-young-search skill documents the upstream daiso CLI flow for stores, products, and inventory", () => {
  const skillPath = skillAbs("olive-young-search", "SKILL.md");
  const featureDoc = read(path.join("docs", "features", "olive-young-search.md"));

  assert.ok(fs.existsSync(skillPath), "expected examples/olive-young-search/SKILL.md to exist");

  const skill = read(skillRel("olive-young-search", "SKILL.md"));
  const featureTop = findSection(featureDoc, "## 가장 중요한 규칙");
  const featureFallback = findSection(featureDoc, "## 원본 저장소 clone fallback");
  const skillFallback = findSection(skill, "## Fallback: clone the original repository and run the same CLI locally");

  assert.match(skill, /^name: olive-young-search$/m);
  assert.match(skill, /^description: .*올리브영.*매장.*상품.*재고.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /hmmhmmhm\/daiso-mcp/);
    assert.match(doc, /https:\/\/github\.com\/hmmhmmhm\/daiso-mcp/);
    assert.match(doc, /npm install -g daiso|npx --yes daiso|npx daiso/);
    assert.match(doc, /git clone https:\/\/github\.com\/hmmhmmhm\/daiso-mcp\.git/);
    assert.match(doc, /npm install/);
    assert.match(doc, /npm run build/);
    assert.match(doc, /MCP 서버를 .*직접 설치.*않고.*CLI/u);
    assert.match(doc, /매장 검색/);
    assert.match(doc, /상품 검색/);
    assert.match(doc, /재고 확인/);
    assert.match(doc, /\/api\/oliveyoung\/stores/);
    assert.match(doc, /\/api\/oliveyoung\/products/);
    assert.match(doc, /\/api\/oliveyoung\/inventory/);
    assert.match(doc, /vendoring 하지 않/);
  }

  assertOliveYoungCloneFallbackShorthand(featureTop, "olive-young feature guide shorthand");

  for (const fallbackDoc of [featureFallback, skillFallback]) {
    assertOliveYoungCloneFallbackCommands(fallbackDoc, "olive-young clone fallback docs");
  }
});

test("repository docs advertise the bunjang-search skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "bunjang-search.md");
  const skillPath = skillAbs("bunjang-search", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/bunjang-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/bunjang-search/SKILL.md to exist");
  assert.match(readme, /\| 번개장터 검색 \|/);
  assert.match(readme, /\[번개장터 검색 가이드\]\(docs\/features\/bunjang-search\.md\)/);
  assert.match(install, /--skill bunjang-search/);
  assert.match(install, /npm install -g .* bunjang-cli/);
  assert.match(roadmap, /번개장터 검색 스킬 출시/);
  assert.match(sources, /https:\/\/www\.npmjs\.com\/package\/bunjang-cli/);
  assert.match(sources, /https:\/\/github\.com\/pinion05\/bunjangcli/);
});

test("bunjang-search skill documents bunjang-cli search, detail, favorite, chat, and AI export flows", () => {
  const skill = read(skillRel("bunjang-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "bunjang-search.md"));
  const install = read(path.join("docs", "install.md"));

  assert.match(skill, /^name: bunjang-search$/m);
  assert.match(skill, /^description: .*번개장터.*검색.*상세.*찜.*채팅.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /bunjang-cli/);
    assert.match(doc, /pinion05\/bunjangcli/);
    assert.match(doc, /npx --yes bunjang-cli --help/);
    assert.match(doc, /npx --yes bunjang-cli search /);
    assert.match(doc, /item get/);
    assert.match(doc, /favorite add/);
    assert.match(doc, /favorite remove/);
    assert.match(doc, /favorite list/);
    assert.match(doc, /chat list/);
    assert.match(doc, /chat start/);
    assert.match(doc, /chat send/);
    assert.match(doc, /--start-page/);
    assert.match(doc, /--pages/);
    assert.match(doc, /--max-items/);
    assert.match(doc, /--with-detail/);
    assert.match(doc, /--output/);
    assert.match(doc, /--ai/);
    assert.match(doc, /TOON|toon/i);
    assert.match(doc, /TTY|interactive/);
    assert.match(doc, /로그인.*선택적|선택적.*로그인/u);
    assert.match(
      doc,
      /검색 결과.*(제목.?가격|가격.?제목).*(1차|우선)|title.?price.*(triage|first)/i,
    );
    assert.match(
      doc,
      /(description|status|location).*(item get|--with-detail).*(전|먼저|이후)|((item get|--with-detail).*(description|status|location).*(전|먼저|이후))/i,
    );
    assert.match(doc, /노이즈|noisy|불안정|rely on/i);
  }

  assert.match(install, /### `bunjang-search` upstream CLI quickstart/);
  assert.match(install, /npx --yes bunjang-cli --help/);
  assert.match(install, /npx --yes bunjang-cli search "아이폰"/);
  assert.match(install, /npx --yes bunjang-cli --json item get/);
});

test("repository docs advertise the coupang-product-search skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "coupang-product-search.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/coupang-product-search.md to exist");
  assert.match(readme, /\| 쿠팡 상품 검색 \|/);
  assert.match(readme, /\[쿠팡 상품 검색 가이드\]\(docs\/features\/coupang-product-search\.md\)/);
  assert.match(install, /--skill coupang-product-search/);
});

test("coupang-product-search skill and docs use retention-corp coupang_partners MCP layer", () => {
  const skillPath = skillAbs("coupang-product-search", "SKILL.md");
  const wrapperPath = skillAbs("coupang-product-search", "scripts", "coupang_partners_mcp.py");
  const featureDoc = read(path.join("docs", "features", "coupang-product-search.md"));
  const sources = read(path.join("docs", "sources.md"));

  assert.ok(fs.existsSync(skillPath), "expected examples/coupang-product-search/SKILL.md to exist");
  assert.ok(fs.existsSync(wrapperPath), "expected retention-corp wrapper script to exist");

  const skill = read(skillRel("coupang-product-search", "SKILL.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /retention-corp\/coupang_partners/);
    assert.match(doc, /local:\/\/coupang-mcp/);
    assert.match(doc, /coupang_partners_mcp\.py/);
    assert.match(doc, /--repo-dir/);
    assert.match(doc, /--no-clone/);
    assert.match(doc, /--update/);
    assert.match(doc, /coupang_partners_mcp\.py\s+tools/);
    assert.match(doc, /coupang_partners_mcp\.py\s+init/);
    assert.match(doc, /search_coupang_products/);
    assert.match(doc, /로켓배송/);
    assert.match(doc, /a\.retn\.kr\/v1\/public\/assist/);
    assert.match(doc, /OPENCLAW_SHOPPING_/);
    assert.match(doc, /(파트너스|어필리에이트|affiliate)/i);
    assert.match(doc, /(hosted\s*fallback|호스티드\s*폴백|호스티드\s*fallback)/i);
    assert.doesNotMatch(doc, /yuju777-coupang-mcp\.hf\.space\/mcp/);
    assert.doesNotMatch(doc, /github\.com\/uju777\/coupang-mcp/);
  }

  assert.match(sources, /retention-corp\/coupang_partners/);
  assert.match(sources, /a\.retn\.kr\/v1\/public\/assist/);
  assert.doesNotMatch(sources, /yuju777-coupang-mcp\.hf\.space\/mcp/);
});

test("coupang-product-search docs drop non-allowlisted coupang-mcp-fallback and document openclaw-skill as the allowlisted hosted fallback client-id", () => {
  // Direct probes against https://a.retn.kr/v1/public/assist on 2026-04-21 show that
  // `X-OpenClaw-Client-Id: coupang-mcp-fallback` returns HTTP 403 ("Client is not
  // allowlisted"), while `openclaw-skill` (the upstream default that ships with
  // retention-corp/coupang_partners) returns HTTP 200. Until Retention Corp
  // re-allowlists `coupang-mcp-fallback`, k-skill docs must not recommend it and
  // must document `openclaw-skill` as the value the hosted fallback path uses.
  const skill = read(skillRel("coupang-product-search", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "coupang-product-search.md"));
  const wrapper = read(skillRel("coupang-product-search", "scripts", "coupang_partners_mcp.py"));
  const sources = read(path.join("docs", "sources.md"));

  for (const doc of [skill, featureDoc, wrapper, sources]) {
    assert.doesNotMatch(doc, /coupang-mcp-fallback/);
  }

  for (const doc of [skill, featureDoc, wrapper]) {
    assert.match(doc, /openclaw-skill/);
  }
});

test("root pack:dry-run script covers all publishable workspaces", () => {
  const packageJson = readJson("package.json");

  assert.match(packageJson.scripts["pack:dry-run"], /workspace k-lotto/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace daiso-product-search/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace market-kurly-search/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace blue-ribbon-nearby/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace kakao-bar-nearby/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace public-restroom-nearby/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace kbl-results/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace kleague-results/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace lck-analytics/);
});

test("repository docs advertise the kbl-results skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "kbl-results.md");
  const skillPath = skillAbs("kbl-results", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/kbl-results.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/kbl-results/SKILL.md to exist");
  assert.match(readme, /\| KBL 경기 결과 조회 \|/);
  assert.match(readme, /\[KBL 경기 결과 가이드\]\(docs\/features\/kbl-results\.md\)/);
  assert.match(install, /--skill kbl-results/);
  assert.match(roadmap, /KBL 경기 결과 조회 스킬 출시/);
  assert.match(sources, /KBL 일정\/결과 API: https:\/\/api\.kbl\.or\.kr\/match\/list/);
  assert.match(sources, /KBL 팀 순위 API: https:\/\/api\.kbl\.or\.kr\/league\/rank\/team/);
});

test("kbl-results skill documents the official JSON flow for date, team, and standings lookups", () => {
  const skillPath = skillAbs("kbl-results", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/kbl-results/SKILL.md to exist");

  const skill = read(skillRel("kbl-results", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "kbl-results.md"));

  assert.match(skill, /^name: kbl-results$/m);
  assert.match(skill, /^description: .*KBL.*경기 결과.*순위.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /YYYY-MM-DD/);
    assert.match(doc, /서울 SK|부산 KCC|팀 코드/);
    assert.match(doc, /https:\/\/api\.kbl\.or\.kr\/match\/list/);
    assert.match(doc, /https:\/\/api\.kbl\.or\.kr\/league\/rank\/team/);
    assert.match(doc, /공식 JSON|공식 API|공식 표면/u);
    assert.match(doc, /현재 순위|standings/i);
    assert.match(doc, /kbl-results|KBL 경기 결과/u);
  }
});

test("kbl-results package exports reusable results and standings helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "kbl-results", "src", "index.js"));

  assert.equal(typeof pkg.getMatchResults, "function");
  assert.equal(typeof pkg.getStandings, "function");
  assert.equal(typeof pkg.getKBLSummary, "function");
});

test("kbl-results package README stays aligned with the official KBL JSON lookup flow", () => {
  const packageReadme = read(path.join("packages", "kbl-results", "README.md"));

  assert.match(packageReadme, /공식 KBL JSON 엔드포인트/u);
  assert.match(packageReadme, /api\.kbl\.or\.kr\/match\/list/);
  assert.match(packageReadme, /league\/rank\/team/);
  assert.match(packageReadme, /getKBLSummary/);
  assert.match(packageReadme, /서울 SK/);
});

test("repository docs advertise the kleague-results skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "kleague-results.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/kleague-results.md to exist");
  assert.match(readme, /\| K리그 경기 결과 조회 \|/);
  assert.match(readme, /\[K리그 결과 가이드\]\(docs\/features\/kleague-results\.md\)/);
  assert.match(install, /--skill kleague-results/);
  assert.match(roadmap, /K리그 경기 결과 조회 스킬 출시/);
  assert.match(sources, /K League 일정\/결과 JSON: https:\/\/www\.kleague\.com\/getScheduleList\.do/);
  assert.match(sources, /K League 팀 순위 JSON: https:\/\/www\.kleague\.com\/record\/teamRank\.do/);
});

test("kleague-results skill documents the official JSON flow for date, team, and standings lookups", () => {
  const skillPath = skillAbs("kleague-results", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/kleague-results/SKILL.md to exist");

  const skill = read(skillRel("kleague-results", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "kleague-results.md"));

  assert.match(skill, /^name: kleague-results$/m);
  assert.match(skill, /^description: .*케이리그.*경기 결과.*순위.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /YYYY-MM-DD/);
    assert.match(doc, /K리그1|K리그2/);
    assert.match(doc, /FC서울|서울 이랜드|팀 코드/);
    assert.match(doc, /https:\/\/www\.kleague\.com\/getScheduleList\.do/);
    assert.match(doc, /https:\/\/www\.kleague\.com\/record\/teamRank\.do/);
    assert.match(doc, /공식 JSON|공식 API|공식 표면/u);
    assert.match(doc, /현재 순위|standings/i);
    assert.match(doc, /kleague-results|K리그 결과 조회/u);
  }
});

test("kleague-results package exports reusable results and standings helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "kleague-results", "src", "index.js"));

  assert.equal(typeof pkg.getMatchResults, "function");
  assert.equal(typeof pkg.getStandings, "function");
  assert.equal(typeof pkg.getKLeagueSummary, "function");
});

test("kleague-results package README stays aligned with the official K League JSON lookup flow", () => {
  const packageReadme = read(path.join("packages", "kleague-results", "README.md"));

  assert.match(packageReadme, /공식 K리그 JSON 엔드포인트/u);
  assert.match(packageReadme, /getScheduleList\.do/);
  assert.match(packageReadme, /teamRank\.do/);
  assert.match(packageReadme, /getKLeagueSummary/);
  assert.match(packageReadme, /FC서울/);
});

test("repository docs advertise the blue-ribbon-nearby skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "blue-ribbon-nearby.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/blue-ribbon-nearby.md to exist");
  assert.match(readme, /\| ~~근처 블루리본 맛집~~ ⚠️ 지원 중단 \|/);
  assert.match(readme, /\[근처 블루리본 맛집 가이드\]\(docs\/features\/blue-ribbon-nearby\.md\)/);
  assert.match(readme, /블루리본 측이 `www\.bluer\.co\.kr` 에 자동화 접근 전면 차단/);
  assert.match(install, /--skill blue-ribbon-nearby/);
  assert.match(roadmap, /근처 블루리본 맛집 스킬 출시/);
  assert.match(sources, /블루리본 지역 검색: https:\/\/www\.bluer\.co\.kr\/search\/zone/);
  assert.match(sources, /블루리본 주변 맛집 JSON: https:\/\/www\.bluer\.co\.kr\/restaurants\/map/);
});

test("blue-ribbon-nearby skill documents mandatory location prompting and official Blue Ribbon nearby search flow", () => {
  const skillPath = skillAbs("blue-ribbon-nearby", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/blue-ribbon-nearby/SKILL.md to exist");

  const skill = read(skillRel("blue-ribbon-nearby", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "blue-ribbon-nearby.md"));

  assert.match(skill, /^name: blue-ribbon-nearby$/m);
  assert.match(skill, /^description: .*근처 맛집.*블루리본.*$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /반드시.*현재 위치/u);
    assert.match(doc, /맛집.*기본적으로.*blue-ribbon-nearby|맛집.*기본적으로.*블루리본/u);
    assert.match(doc, /https:\/\/www\.bluer\.co\.kr\/search\/zone/);
    assert.match(doc, /https:\/\/www\.bluer\.co\.kr\/restaurants\/map/);
    assert.match(doc, /zone2Lat/);
    assert.match(doc, /zone2Lng/);
    assert.match(doc, /isAround=true/);
    assert.match(doc, /ribbon=true/);
    assert.match(doc, /위도|경도|동네|역명/u);
    assert.match(doc, /blue-ribbon-nearby|근처 블루리본 맛집/u);
  }
});

test("blue-ribbon-nearby package README stays aligned with the location-first and official-surface guidance", () => {
  const packageReadme = read(path.join("packages", "blue-ribbon-nearby", "README.md"));

  assert.match(packageReadme, /먼저 현재 위치를 묻/u);
  assert.match(packageReadme, /코엑스.*삼성동\/대치동/u);
  assert.match(packageReadme, /https:\/\/www\.bluer\.co\.kr\/search\/zone/);
  assert.match(packageReadme, /https:\/\/www\.bluer\.co\.kr\/restaurants\/map/);
  assert.match(packageReadme, /searchNearbyByLocationQuery/);
});



test("repository docs advertise the kakao-bar-nearby skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "kakao-bar-nearby.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/kakao-bar-nearby.md to exist");
  assert.match(readme, /\| 근처 술집 조회 \|/);
  assert.match(readme, /\[근처 술집 조회 가이드\]\(docs\/features\/kakao-bar-nearby\.md\)/);
  assert.match(install, /--skill kakao-bar-nearby/);
  assert.match(roadmap, /근처 술집 조회 스킬 출시/);
  assert.match(sources, /카카오맵 모바일 검색: https:\/\/m\.map\.kakao\.com\/actions\/searchView/);
  assert.match(sources, /카카오맵 장소 패널 JSON: https:\/\/place-api\.map\.kakao\.com\/places\/panel3\//);
});

test("kakao-bar-nearby skill documents location-first Kakao Map search with open-now/menu/seating hints", () => {
  const skillPath = skillAbs("kakao-bar-nearby", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/kakao-bar-nearby/SKILL.md to exist");

  const skill = read(skillRel("kakao-bar-nearby", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "kakao-bar-nearby.md"));

  assert.match(skill, /^name: kakao-bar-nearby$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /현재 위치/);
    assert.match(doc, /서울역|강남|사당|논현/);
    assert.match(doc, /https:\/\/m\.map\.kakao\.com\/actions\/searchView/);
    assert.match(doc, /https:\/\/place-api\.map\.kakao\.com\/places\/panel3\//);
    assert.match(doc, /영업 중|영업전|영업 상태/);
    assert.match(doc, /메뉴/);
    assert.match(doc, /단체석|좌석 옵션|인원 수용/);
    assert.match(doc, /전화번호/);
    assert.match(doc, /kakao-bar-nearby|근처 술집 조회/u);
  }
});

test("kakao-bar-nearby package README stays aligned with the Kakao Map live lookup flow", () => {
  const packageReadme = read(path.join("packages", "kakao-bar-nearby", "README.md"));

  assert.match(packageReadme, /현재 위치를 먼저 물어본다/u);
  assert.match(packageReadme, /서울역 술집/);
  assert.match(packageReadme, /https:\/\/m\.map\.kakao\.com\/actions\/searchView/);
  assert.match(packageReadme, /https:\/\/place-api\.map\.kakao\.com\/places\/panel3\//);
  assert.match(packageReadme, /searchNearbyBarsByLocationQuery/);
});

test("kakao-bar-nearby feature doc keeps the verified 2026-03-29 sadang smoke snapshot current", () => {
  const featureDoc = read(path.join("docs", "features", "kakao-bar-nearby.md"));
  const smoke = findJsonFenceAfterLabel(featureDoc, "## 검증된 live smoke 예시");

  assertKakaoBarNearbySadangSmokeSnapshot(smoke, "feature doc smoke snapshot");
});

test("kakao-bar-nearby package README live smoke snapshot matches the verified 2026-03-29 sadang output", () => {
  const packageReadme = read(path.join("packages", "kakao-bar-nearby", "README.md"));
  const smoke = findJsonFenceAfterLabel(packageReadme, "## Live smoke snapshot");

  assertKakaoBarNearbySadangSmokeSnapshot(smoke, "package README smoke snapshot");
});

test("repository docs advertise the fine-dust-location skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const secretsExample = read(path.join("examples", "secrets.env.example"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "fine-dust-location.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/fine-dust-location.md to exist");
  assert.match(readme, /\| 사용자 위치 미세먼지 조회 \|/);
  assert.match(readme, /\[사용자 위치 미세먼지 조회 가이드\]\(docs\/features\/fine-dust-location\.md\)/);
  assert.match(install, /--skill fine-dust-location/);
  assert.match(roadmap, /사용자 위치 미세먼지 조회 스킬 출시/);
  assert.match(sources, /에어코리아 대기오염정보: https:\/\/www\.data\.go\.kr\/data\/15073861\/openapi\.do/);
  assert.match(sources, /에어코리아 측정소정보: https:\/\/www\.data\.go\.kr\/data\/15073877\/openapi\.do/);
  assert.match(setup, /AIR_KOREA_OPEN_API_KEY/);
  assert.match(security, /AIR_KOREA_OPEN_API_KEY/);
  assert.match(secretsExample, /^AIR_KOREA_OPEN_API_KEY=replace-me$/m);
});

test("fine-dust-location skill documents the official two-api flow and fallback handling", () => {
  const skillPath = skillAbs("fine-dust-location", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/fine-dust-location/SKILL.md to exist");

  const skill = read(skillRel("fine-dust-location", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "fine-dust-location.md"));

  assert.match(skill, /^name: fine-dust-location$/m);
  assert.match(skill, /^description: .*미세먼지.*초미세먼지.*위치.*$/m);
  assert.match(skill, /k-skill-proxy\.nomadamas\.org\/v1\/fine-dust\/report/);
  assert.match(skill, /행정구역 이름/u);
  assert.match(skill, /강남구/);
  assert.match(skill, /python3 scripts\/fine_dust\.py/);
  assert.match(skill, /docs\/features\/fine-dust-location\.md/);
  assert.match(skill, /docs\/features\/k-skill-proxy\.md/);
  assert.match(skill, /PM10/);
  assert.match(skill, /PM2\.5|PM25/);
  assert.match(skill, /통합대기등급/);

  for (const doc of [featureDoc]) {
    assert.match(doc, /AIR_KOREA_OPEN_API_KEY/);
    assert.match(doc, /B552584\/MsrstnInfoInqireSvc\/getMsrstnList/);
    assert.match(doc, /B552584\/ArpltnInforInqireSvc\/getMsrstnAcctoRltmMesureDnsty/);
    assert.match(doc, /getCtprvnRltmMesureDnsty/);
    assert.match(doc, /PM10/);
    assert.match(doc, /PM2\.5|PM25/);
    assert.match(doc, /행정구역|지역명/);
    assert.match(doc, /fallback|폴백|대체 흐름/i);
    assert.match(doc, /후보 측정소|candidate_stations/);
    assert.match(doc, /조회 시각|조회 시점/);
    assert.match(doc, /python3 scripts\/fine_dust\.py/);
  }
});

test("fine-dust helper python regression tests pass", () => {
  const result = childProcess.spawnSync(
    "python3",
    ["-m", "unittest", "discover", "-s", "scripts", "-p", "test_fine_dust.py"],
    { cwd: repoRoot, encoding: "utf8" },
  );

  assert.equal(
    result.status,
    0,
    `expected python fine-dust helper regression tests to pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});

test("repository docs advertise the toss-securities skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "toss-securities.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/toss-securities.md to exist");
  assert.match(readme, /\| 토스증권 조회 \|/);
  assert.match(readme, /\[토스증권 조회 가이드\]\(docs\/features\/toss-securities\.md\)/);
  assert.match(install, /--skill toss-securities/);
  assert.match(roadmap, /토스증권 조회 스킬 출시/);
  assert.match(sources, /tossinvest-cli: https:\/\/github\.com\/JungHoonGhae\/tossinvest-cli/);
});

test("repository docs advertise the hipass-receipt skill across the documented surfaces", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const setup = read(path.join("docs", "setup.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "hipass-receipt.md");
  const skillPath = skillAbs("hipass-receipt", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/hipass-receipt.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/hipass-receipt/SKILL.md to exist");
  assert.match(readme, /\| 하이패스 영수증 발급 \|/);
  assert.match(readme, /\[하이패스 영수증 발급 가이드\]\(docs\/features\/hipass-receipt\.md\)/);
  assert.match(install, /--skill hipass-receipt/);
  assert.match(setup, /하이패스 영수증 발급 \| 사용자 시크릿 불필요 \(로그인된 브라우저 세션 필요\)/);
  assert.match(roadmap, /하이패스 영수증 발급 스킬 출시/);
  assert.match(sources, /https:\/\/www\.hipass\.co\.kr\/main\.do/);
  assert.match(sources, /https:\/\/www\.hipass\.co\.kr\/html\/guide\/siteguide_6\.jsp/);
});

test("toss-securities skill documents the tossctl install, auth, and read-only workflow", () => {
  const skillPath = skillAbs("toss-securities", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/toss-securities/SKILL.md to exist");

  const skill = read(skillRel("toss-securities", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "toss-securities.md"));

  assert.match(skill, /^name: toss-securities$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /tossctl/);
    assert.match(doc, /JungHoonGhae\/tossinvest-cli/);
    assert.match(doc, /auth login/);
    assert.match(doc, /account summary/);
    assert.match(doc, /portfolio positions/);
    assert.match(doc, /quote get/);
    assert.match(doc, /watchlist list/);
    assert.match(doc, /read-only|조회 전용/u);
    assert.doesNotMatch(doc, /order place/);
  }
});

test("hipass-receipt skill documents the logged-in browser session contract", () => {
  const skillPath = skillAbs("hipass-receipt", "SKILL.md");
  const packageReadmePath = path.join(repoRoot, "packages", "hipass-receipt", "README.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/hipass-receipt/SKILL.md to exist");
  assert.ok(fs.existsSync(packageReadmePath), "expected packages/hipass-receipt/README.md to exist");

  const skill = read(skillRel("hipass-receipt", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "hipass-receipt.md"));
  const packageReadme = read(path.join("packages", "hipass-receipt", "README.md"));

  assert.match(skill, /^name: hipass-receipt$/m);
  assert.match(skill, /로그인은 반드시 사용자가 직접 해야 한다/);
  assert.match(skill, /Playwright persistent context|user-data-dir/);
  assert.match(skill, /세션이 만료되면 즉시 중단하고 다시 로그인/);
  assert.match(featureDoc, /20분/);
  assert.match(featureDoc, /영수증선택출력|영수증전체출력/);
  assert.match(featureDoc, /로그인된 브라우저 세션에서만 동작/);
  assert.match(featureDoc, /playwright-core/);
  assert.match(skill, /--encrypted-card-number/);
  assert.match(packageReadme, /buildUsageHistoryQuery/);
  assert.match(packageReadme, /parseUsageHistoryList/);
  assert.match(packageReadme, /inspectHipassPage/);
  assert.match(packageReadme, /playwright-core/);
});

test("toss-securities package exposes safe read-only tossctl helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "toss-securities", "src", "index.js"));

  assert.equal(typeof pkg.buildReadOnlyCommand, "function");
  assert.equal(typeof pkg.runReadOnlyCommand, "function");
  assert.equal(typeof pkg.getAccountSummary, "function");
  assert.equal(typeof pkg.getPortfolioPositions, "function");
  assert.equal(typeof pkg.getQuote, "function");
  assert.equal(typeof pkg.getQuoteBatch, "function");
  assert.equal(typeof pkg.listWatchlist, "function");
});

test("hipass-receipt package exposes fixture-friendly query, parse, and session helpers", () => {
  const pkg = require(path.join(repoRoot, "packages", "hipass-receipt", "src", "index.js"));

  assert.equal(pkg.HIPASS_ENDPOINTS.loginPage, "https://www.hipass.co.kr/comm/lginpg.do");
  assert.equal(typeof pkg.buildUsageHistoryQuery, "function");
  assert.equal(typeof pkg.parseUsageHistoryList, "function");
  assert.equal(typeof pkg.inspectHipassPage, "function");
  assert.equal(typeof pkg.buildReceiptRequest, "function");
});

test("toss-securities package README stays aligned with the read-only tossctl wrapper contract", () => {
  const packageReadme = read(path.join("packages", "toss-securities", "README.md"));

  assert.match(packageReadme, /read-only tossctl wrapper/i);
  assert.match(packageReadme, /brew tap JungHoonGhae\/tossinvest-cli/);
  assert.match(packageReadme, /account summary/);
  assert.match(packageReadme, /quote get/);
  assert.match(packageReadme, /order place/);
  assert.match(packageReadme, /지원하지 않음|not supported/u);
});

test("hipass-receipt package README and npm metadata stay aligned with the helper contract", () => {
  const packageReadme = read(path.join("packages", "hipass-receipt", "README.md"));
  const packageJson = readJson(path.join("packages", "hipass-receipt", "package.json"));

  assert.equal(packageJson.name, "hipass-receipt");
  assert.match(packageJson.description, /Hi-Pass/);
  assert.ok(packageJson.files.includes("test/fixtures"));
  assert.match(packageReadme, /logged-in browser session/i);
  assert.match(packageReadme, /Playwright/);
  assert.equal(typeof packageJson.dependencies?.["playwright-core"], "string");
  assert.match(packageReadme, /playwright-core/);
  assert.match(packageReadme, /buildReceiptRequest/);
  assert.match(packageReadme, /test\/fixtures\/usage-history-list\.html/);
});

test("hipass-receipt pack dry-run ships fixture-demo assets for the published README workflow", () => {
  const packResult = JSON.parse(
    childProcess.execFileSync("npm", ["pack", "--workspace", "hipass-receipt", "--json", "--dry-run"], {
      cwd: repoRoot,
      encoding: "utf8"
    }),
  );

  const files = packResult[0]?.files?.map((entry) => entry.path) || [];
  assert.ok(files.includes("test/fixtures/usage-history-list.html"));
  assert.ok(files.includes("test/fixtures/login-page.html"));
  assert.ok(files.includes("README.md"));
});

test("pack:dry-run includes the toss-securities workspace", () => {
  const packageJson = JSON.parse(read("package.json"));

  assert.match(packageJson.scripts["pack:dry-run"], /workspace toss-securities/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace hipass-receipt/);
  assert.match(packageJson.scripts["pack:dry-run"], /workspace used-car-price-search/);
});

test("package-lock captures the toss-securities workspace metadata for npm ci", () => {
  const packageLock = readJson("package-lock.json");

  assert.deepEqual(packageLock.packages[""].workspaces, ["packages/*"]);
  assert.deepEqual(packageLock.packages["node_modules/toss-securities"], {
    resolved: "packages/toss-securities",
    link: true,
  });
  assert.equal(packageLock.packages["packages/toss-securities"].version, "0.2.0");
  assert.equal(packageLock.packages["packages/toss-securities"].license, "MIT");
  assert.equal(packageLock.packages["packages/toss-securities"].engines.node, ">=18");
});

test("repository docs advertise the korean-law-search skill with mode-specific korean-law-mcp setup guidance", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "korean-law-search.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-law-search.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-law-search.md to exist");
  assert.match(readme, /\| 한국 법령 검색 \|/);
  assert.match(readme, /\[한국 법령 검색 가이드\]\(docs\/features\/korean-law-search\.md\)/);
  assert.match(readme, /\| 한국 법령 검색 \| .* \| 불필요 \|/);
  assert.match(install, /--skill korean-law-search/);
  assert.match(install, /로컬 CLI\/MCP 경로는 `LAW_OC`/);
  assert.match(install, /remote endpoint는 `LAW_OC` 없이 `url`만/);
  assert.match(setup, /한국 법령 검색의 로컬 CLI\/MCP 경로용 `LAW_OC`/);
  assert.match(setup, /remote MCP endpoint는 사용자 `LAW_OC` 없이 `url`만으로 연결/);
  assert.match(featureDoc, /로컬 CLI 또는 로컬 MCP server 경로는 `LAW_OC`/);
  assert.match(featureDoc, /remote MCP endpoint는 사용자 `LAW_OC` 없이 `url`만으로 연결/);
  assert.match(setupSkill, /로컬 한국 법령 검색: `LAW_OC` \+ `korean-law-mcp`/);
  assert.match(setupSkill, /remote endpoint: 사용자 `LAW_OC` 없이 `url`만 등록/);

  for (const doc of [setup, security, setupSkill]) {
    assert.match(doc, /LAW_OC/);
    assert.match(doc, /korean-law-mcp/);
  }

  assert.match(sources, /korean-law-mcp: https:\/\/github\.com\/chrisryugj\/korean-law-mcp/);
  assert.match(sources, /beopmang: https:\/\/api\.beopmang\.org/);
  assert.match(roadmap, /한국 법령 검색 스킬 출시/);
});

test("korean-law-search skill keeps korean-law-mcp-first guidance while documenting the approved Beopmang fallback", () => {
  const skillPath = skillAbs("korean-law-search", "SKILL.md");
  const featureDoc = read(path.join("docs", "features", "korean-law-search.md"));
  const examplesSecrets = read(path.join("examples", "secrets.env.example"));
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(skillPath), "expected examples/korean-law-search/SKILL.md to exist");

  const skill = read(skillRel("korean-law-search", "SKILL.md"));
  const doneSectionMatch = skill.match(/## Done when([\s\S]*?)## Notes/);

  assert.match(skill, /^name: korean-law-search$/m);
  assert.ok(doneSectionMatch, "expected korean-law-search skill to include a Done when section");

  const doneSection = doneSectionMatch[1];

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /korean-law-mcp.*먼저|먼저.*korean-law-mcp|항상 `korean-law-mcp`를 먼저 사용/u);
    assert.match(doc, /npm install -g korean-law-mcp/);
    assert.match(doc, /로컬 CLI 또는 로컬 MCP server 경로는 `LAW_OC`/);
    assert.match(doc, /remote MCP endpoint는 사용자 `LAW_OC` 없이 `url`만으로 연결/);
    assert.match(doc, /open\.law\.go\.kr/);
    assert.match(doc, /search_law/);
    assert.match(doc, /get_law_text/);
    assert.match(doc, /search_precedents/);
    assert.match(doc, /search_interpretations/);
    assert.match(doc, /search_ordinance/);
    assert.match(doc, /https:\/\/korean-law-mcp\.fly\.dev\/mcp/);
    assert.match(doc, /법망|Beopmang/i);
    assert.match(doc, /https:\/\/api\.beopmang\.org/);
    assert.match(doc, /fallback/i);
    assert.match(doc, /MCP/i);
    assert.match(doc, /CLI/i);
    assert.doesNotMatch(doc, /packages\/korean-law-search/);
    assert.doesNotMatch(doc, /python-packages\/korean-law-search/);
  }

  assert.match(doneSection, /search_interpretations/);
  assert.match(doneSection, /search_ordinance/);
  assert.match(doneSection, /법망|Beopmang/i);
  assert.match(doneSection, /fallback/i);

  assert.doesNotMatch(
    featureDoc,
    /[ \t]+$/m,
    "expected docs/features/korean-law-search.md to avoid trailing whitespace so git diff --check stays clean",
  );

  assert.match(examplesSecrets, /^LAW_OC=replace-me$/m);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("korean-law")),
    "expected no repo workspace to be added for korean-law-search",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "korean-law-search")), false);
});

test("repository docs advertise the joseon-sillok-search skill and helper", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "joseon-sillok-search.md");
  const featureDoc = read(path.join("docs", "features", "joseon-sillok-search.md"));
  const skillPath = skillAbs("joseon-sillok-search", "SKILL.md");
  const skill = read(skillRel("joseon-sillok-search", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/joseon-sillok-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/joseon-sillok-search/SKILL.md to exist");
  assert.match(readme, /\| 조선왕조실록 검색 \|/);
  assert.match(readme, /\[조선왕조실록 검색 가이드\]\(docs\/features\/joseon-sillok-search\.md\)/);
  assert.match(install, /--skill joseon-sillok-search/);
  assert.match(install, /python3 scripts\/sillok_search\.py --query "훈민정음" --king 세종 --year 1443/);
  assert.match(skill, /sillok\.history\.go\.kr/);
  assert.match(skill, /--king/);
  assert.match(skill, /--year/);
  assert.match(featureDoc, /python3 scripts\/sillok_search\.py --query "훈민정음"/);
  assert.match(featureDoc, /1443/);
  assert.match(featureDoc, /kda_12512030_002/);
  assert.match(sources, /https:\/\/sillok\.history\.go\.kr/);
  assert.match(sources, /https:\/\/sillok\.history\.go\.kr\/search\/searchResultList\.do/);
  assert.match(roadmap, /조선왕조실록 검색 스킬 출시/);
});

test("joseon-sillok-search install payload includes the documented helper command", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "joseon-sillok-"));
  const installedSkillPath = path.join(tempRoot, "joseon-sillok-search");
  const bundledHelperPath = path.join(installedSkillPath, "scripts", "sillok_search.py");

  try {
    fs.cpSync(skillAbs("joseon-sillok-search"), installedSkillPath, { recursive: true });

    assert.ok(fs.existsSync(bundledHelperPath), "expected joseon-sillok-search/scripts/sillok_search.py to exist");

    const helpText = childProcess.execFileSync("python3", ["scripts/sillok_search.py", "--help"], {
      cwd: installedSkillPath,
      encoding: "utf8",
    });

    assert.match(helpText, /Search Joseon Sillok records from sillok\.history\.go\.kr/);
    assert.match(helpText, /--query/);
    assert.match(helpText, /--king/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("repository docs advertise the korean-patent-search skill and official KIPRIS Plus API setup", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const examplesSecrets = read(path.join("examples", "secrets.env.example"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-patent-search.md");
  const featureDoc = read(path.join("docs", "features", "korean-patent-search.md"));
  const skillPath = skillAbs("korean-patent-search", "SKILL.md");
  const skill = read(skillRel("korean-patent-search", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-patent-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-patent-search/SKILL.md to exist");

  assert.match(readme, /\| 한국 특허 정보 검색 \|/);
  assert.match(readme, /\[한국 특허 정보 검색 가이드\]\(docs\/features\/korean-patent-search\.md\)/);
  assert.match(install, /--skill korean-patent-search/);
  assert.match(install, /KIPRIS_PLUS_API_KEY/);
  assert.match(install, /python3 scripts\/patent_search\.py --query "배터리"/);
  assert.match(setup, /한국 특허 정보 검색의 KIPRIS Plus 경로용 `KIPRIS_PLUS_API_KEY`/);
  assert.match(security, /KIPRIS_PLUS_API_KEY/);
  assert.match(setupSkill, /한국 특허 정보 검색: `KIPRIS_PLUS_API_KEY`/);
  assert.match(examplesSecrets, /^KIPRIS_PLUS_API_KEY=replace-me$/m);
  assert.match(skill, /^name: korean-patent-search$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /KIPRIS Plus/i);
    assert.match(doc, /getWordSearch/);
    assert.match(doc, /getBibliographyDetailInfoSearch/);
    assert.match(doc, /ServiceKey/);
    assert.match(doc, /python3 scripts\/patent_search\.py/);
    assert.match(doc, /Done when/i);
    assert.doesNotMatch(doc, /packages\/korean-patent-search/);
    assert.doesNotMatch(doc, /python-packages\/korean-patent-search/);
  }

  assert.match(sources, /https:\/\/plus\.kipris\.or\.kr\/portal\/data\/service\/List\.do\?subTab=SC001&entYn=N&menuNo=200100/);
  assert.match(sources, /https:\/\/www\.data\.go\.kr\/data\/15058788\/openapi\.do/);
  assert.match(roadmap, /한국 특허 정보 검색 스킬 출시/);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("korean-patent-search")),
    "expected no repo workspace to be added for korean-patent-search",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "korean-patent-search")), false);
});

test("korean-patent-search install payload includes the documented helper command", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "korean-patent-search-"));
  const installedSkillPath = path.join(tempRoot, "korean-patent-search");
  const bundledHelperPath = path.join(installedSkillPath, "scripts", "patent_search.py");

  try {
    fs.cpSync(skillAbs("korean-patent-search"), installedSkillPath, { recursive: true });

    assert.ok(fs.existsSync(bundledHelperPath), "expected korean-patent-search/scripts/patent_search.py to exist");

    const helpText = childProcess.execFileSync("python3", ["scripts/patent_search.py", "--help"], {
      cwd: installedSkillPath,
      encoding: "utf8",
    });

    assert.match(helpText, /Search Korean patent information via the official KIPRIS Plus Open API/);
    assert.match(helpText, /--query/);
    assert.match(helpText, /--application-number/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("repository docs advertise the real-estate-search skill and proxy-based approach", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "real-estate-search.md");
  const featureDoc = read(path.join("docs", "features", "real-estate-search.md"));
  const skillPath = skillAbs("real-estate-search", "SKILL.md");
  const skill = read(skillRel("real-estate-search", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/real-estate-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/real-estate-search/SKILL.md to exist");

  assert.match(readme, /\| 한국 부동산 실거래가 조회 \|/);
  assert.match(readme, /\[한국 부동산 실거래가 조회 가이드\]\(docs\/features\/real-estate-search\.md\)/);
  assert.match(install, /--skill real-estate-search/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /https:\/\/github\.com\/tae0y\/real-estate-mcp\/tree\/main/);
    assert.match(doc, /k-skill-proxy\.nomadamas\.org/);
    assert.match(doc, /\/v1\/real-estate\//);
    assert.match(doc, /apartment\/trade|apartment\/rent/);
    assert.match(doc, /region-code/);
    assert.doesNotMatch(doc, /packages\/real-estate-search/);
    assert.doesNotMatch(doc, /python-packages\/real-estate-search/);
  }

  for (const doc of [install]) {
    assert.match(doc, /https:\/\/github\.com\/tae0y\/real-estate-mcp\/tree\/main/);
    assert.match(doc, /k-skill-proxy\.nomadamas\.org|hosted proxy/);
  }

  for (const doc of [setup, security, setupSkill]) {
    assert.match(doc, /DATA_GO_KR_API_KEY/);
  }

  assert.match(sources, /real-estate-mcp: https:\/\/github\.com\/tae0y\/real-estate-mcp\/tree\/main/);
  assert.match(roadmap, /한국 부동산 실거래가 조회 스킬 출시/);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("real-estate-search")),
    "expected no repo workspace to be added for real-estate-search",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "real-estate-search")), false);
});

test("repository docs advertise the korean-scholarship-search skill and official-source workflow", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-scholarship-search.md");
  const featureDoc = read(path.join("docs", "features", "korean-scholarship-search.md"));
  const skillPath = skillAbs("korean-scholarship-search", "SKILL.md");
  const skill = read(skillRel("korean-scholarship-search", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const helperPath = skillAbs("korean-scholarship-search", "scripts", "scholarship_filter.py");
  const plannerPath = skillAbs("korean-scholarship-search", "scripts", "university_search_plan.py");
  const searchCluesPath = skillAbs("korean-scholarship-search", "references", "search-clues.md");
  const reportFormatPath = skillAbs("korean-scholarship-search", "references", "report-format.md");
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-scholarship-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-scholarship-search/SKILL.md to exist");
  assert.ok(fs.existsSync(helperPath), "expected korean-scholarship-search/scripts/scholarship_filter.py to exist");
  assert.ok(fs.existsSync(plannerPath), "expected korean-scholarship-search/scripts/university_search_plan.py to exist");
  assert.ok(fs.existsSync(searchCluesPath), "expected korean-scholarship-search/references/search-clues.md to exist");
  assert.ok(fs.existsSync(reportFormatPath), "expected korean-scholarship-search/references/report-format.md to exist");

  assert.match(readme, /\| 장학금 검색 및 조회 \|/);
  assert.match(readme, /\[장학금 검색 및 조회 가이드\]\(docs\/features\/korean-scholarship-search\.md\)/);
  assert.match(install, /--skill korean-scholarship-search/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /장학금 검색 및 조회/);
    assert.match(doc, /kosaf\.go\.kr/);
    assert.match(doc, /\*\.ac\.kr/);
    assert.match(doc, /전국 대학교|전국 대학/);
    assert.match(doc, /공식 공고 우선/);
    assert.match(doc, /학자금 지원구간/);
    assert.match(doc, /scholarship_filter\.py/);
    assert.match(doc, /university_search_plan\.py/);
    assert.match(doc, /학과/);
    assert.match(doc, /외부 장학 추천|등록금 감면|생활비 지원/);
  }

  assert.match(sources, /한국장학재단 학자금 지원구간 산정절차/);
  assert.match(sources, /한국장학재단 푸른등대 기부장학금/);
  assert.match(sources, /삼성꿈장학재단/);
  assert.match(roadmap, /장학금 검색 및 조회 스킬 출시/);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("korean-scholarship-search")),
    "expected no repo workspace to be added for korean-scholarship-search",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "korean-scholarship-search")), false);
});

test("korean-scholarship-search helper filters normalized records, renders reports, and returns eligibility verdicts", () => {
  const helperPath = skillAbs("korean-scholarship-search", "scripts", "scholarship_filter.py");
  const plannerPath = skillAbs("korean-scholarship-search", "scripts", "university_search_plan.py");
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "k-skill-scholarship-"));

  try {
    const inputPath = path.join(tempRoot, "scholarships.json");
    fs.writeFileSync(
      inputPath,
      JSON.stringify(
        [
          {
            name: "테스트재단 생활비 장학금",
            organization: { name: "테스트재단", type: "foundation" },
            source_url: "https://foundation.example.com/notice/1",
            apply_url: "https://foundation.example.com/apply/1",
            amount: { text: "학기당 250만 원", per_semester_krw: 2500000, category: "living" },
            eligibility: {
              student_levels: ["undergraduate"],
              school_kinds: ["university"],
              school_names: ["서울대학교", "연세대학교"],
              department_names: ["컴퓨터공학부"],
              grade_years: [2, 3, 4],
              gpa_min: 3.2,
              income_band_min: 0,
              income_band_max: 6,
            },
            deadline: { start: "2026-04-01", end: "2026-04-16" },
          },
          {
            name: "교내 성적우수 장학금",
            organization: { name: "샘플대학교", type: "school" },
            source_url: "https://sample.ac.kr/notice/2",
            apply_url: "https://sample.ac.kr/apply/2",
            amount: { text: "등록금 전액", category: "tuition" },
            eligibility: {
              student_levels: ["undergraduate"],
              school_kinds: ["university"],
              school_names: ["샘플대학교"],
              grade_years: [1],
              gpa_min: 4.0,
              income_band_min: 0,
              income_band_max: 10,
            },
            deadline: { start: "2026-05-01", end: "2026-05-20" },
          },
        ],
        null,
        2,
      ),
      "utf8",
    );

    const helpText = childProcess.execFileSync("python3", [helperPath, "--help"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    assert.match(helpText, /Filter normalized Korean scholarship records/);
    assert.match(helpText, /\bfilter\b/);
    assert.match(helpText, /\beligibility\b/);
    assert.match(helpText, /\breport\b/);

    const plannerHelpText = childProcess.execFileSync("python3", [plannerPath, "--help"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    assert.match(plannerHelpText, /nationwide/i);
    assert.match(plannerHelpText, /school-name/);

    const filtered = JSON.parse(
      childProcess.execFileSync(
        "python3",
        [
          helperPath,
          "filter",
          "--input",
          inputPath,
          "--org-type",
          "foundation",
          "--student-level",
          "undergraduate",
          "--department-name",
          "컴퓨터공학부",
          "--income-band",
          "4",
          "--min-amount",
          "2000000",
          "--today",
          "2026-04-14",
          "--deadline-within-days",
          "7",
        ],
        { cwd: repoRoot, encoding: "utf8" },
      ),
    );

    assert.equal(filtered.total, 1);
    assert.equal(filtered.items[0].name, "테스트재단 생활비 장학금");
    assert.equal(filtered.items[0]._match.amount_krw, 2500000);
    assert.equal(filtered.items[0]._match.deadline.status, "open");
    assert.equal(filtered.items[0]._match.deadline.days_until_end, 2);

    const report = childProcess.execFileSync(
      "python3",
      [
        helperPath,
        "report",
        "--input",
        inputPath,
        "--today",
        "2026-04-14",
        "--only-open-now",
      ],
      { cwd: repoRoot, encoding: "utf8" },
    );

    assert.match(report, /# 장학금 검색 및 조회 리포트/);
    assert.match(report, /## 지금 지원 가능/);
    assert.match(report, /테스트재단 생활비 장학금/);
    assert.match(report, /D-2/);

    const plannerPayload = JSON.parse(
      childProcess.execFileSync(
        "python3",
        [
          plannerPath,
          "--school-name",
          "부산대학교",
          "--department",
          "컴퓨터공학과",
          "--year",
          "2026",
        ],
        { cwd: repoRoot, encoding: "utf8" },
      ),
    );
    assert.equal(plannerPayload.scope, "school");
    assert.equal(plannerPayload.school_name, "부산대학교");
    assert.match(plannerPayload.search_queries.join("\n"), /컴퓨터공학과/);

    const nationwidePayload = JSON.parse(
      childProcess.execFileSync(
        "python3",
        [plannerPath, "--nationwide", "--year", "2026"],
        { cwd: repoRoot, encoding: "utf8" },
      ),
    );
    assert.equal(nationwidePayload.scope, "nationwide-universities");
    assert.match(nationwidePayload.search_queries.join("\n"), /site:\*\.ac\.kr 2026 장학 공고/);

    const eligibility = JSON.parse(
      childProcess.execFileSync(
        "python3",
        [
          helperPath,
          "eligibility",
          "--input",
          inputPath,
          "--school-name",
          "서울대학교",
          "--student-level",
          "undergraduate",
          "--grade-year",
          "2",
          "--gpa",
          "3.5",
          "--income-band",
          "4",
        ],
        { cwd: repoRoot, encoding: "utf8" },
      ),
    );

    assert.equal(eligibility.total, 2);
    assert.equal(eligibility.results[0].status, "eligible");
    assert.equal(eligibility.results[1].status, "not_eligible");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("real-estate-search skill uses proxy endpoints not MCP self-host", () => {
  const featureDoc = read(path.join("docs", "features", "real-estate-search.md"));
  const skill = read(skillRel("real-estate-search", "SKILL.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /k-skill-proxy\.nomadamas\.org\/v1\/real-estate/);
    assert.match(doc, /curl/);
    assert.doesNotMatch(doc, /uv run/);
    assert.doesNotMatch(doc, /codex mcp add/);
    assert.doesNotMatch(doc, /Cloudflare Tunnel/i);
    assert.doesNotMatch(doc, /launchd/i);
    assert.doesNotMatch(doc, /docker compose/i);
  }
});

test("repository docs advertise the korean-stock-search skill and proxy-backed KRX approach", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-stock-search.md");
  const featureDoc = read(path.join("docs", "features", "korean-stock-search.md"));
  const skillPath = skillAbs("korean-stock-search", "SKILL.md");
  const skill = read(skillRel("korean-stock-search", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-stock-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-stock-search/SKILL.md to exist");

  assert.match(readme, /\| 한국 주식 정보 조회 \|/);
  assert.match(readme, /\[한국 주식 정보 조회 가이드\]\(docs\/features\/korean-stock-search\.md\)/);
  assert.match(install, /--skill korean-stock-search/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /https:\/\/github\.com\/jjlabsio\/korea-stock-mcp/);
    assert.match(doc, /k-skill-proxy\.nomadamas\.org/);
    assert.match(doc, /\/v1\/korean-stock\/search/);
    assert.match(doc, /\/v1\/korean-stock\/base-info/);
    assert.match(doc, /\/v1\/korean-stock\/trade-info/);
    assert.match(doc, /KRX_API_KEY/);
    assert.match(doc, /사용자.*KRX_API_KEY.*(불필요|준비할 필요가 없)/u);
    assert.doesNotMatch(doc, /packages\/korean-stock-search/);
    assert.doesNotMatch(doc, /python-packages\/korean-stock-search/);
  }

  for (const doc of [setup, security, setupSkill]) {
    assert.match(doc, /KRX_API_KEY/);
  }

  for (const doc of [proxyReadme, proxyDoc]) {
    assert.match(doc, /\/v1\/korean-stock\/search/);
    assert.match(doc, /\/v1\/korean-stock\/base-info/);
    assert.match(doc, /\/v1\/korean-stock\/trade-info/);
  }

  assert.match(sources, /korea-stock-mcp: https:\/\/github\.com\/jjlabsio\/korea-stock-mcp/);
  assert.match(roadmap, /한국 주식 정보 조회 스킬 출시/);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("korean-stock-search")),
    "expected no repo workspace to be added for korean-stock-search",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "korean-stock-search")), false);
});

test("korean-stock-search skill stays proxy-first and does not require local MCP install", () => {
  const featureDoc = read(path.join("docs", "features", "korean-stock-search.md"));
  const skill = read(skillRel("korean-stock-search", "SKILL.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /k-skill-proxy\.nomadamas\.org\/v1\/korean-stock/);
    assert.match(doc, /curl/);
    assert.match(doc, /proxy.*서버.*KRX_API_KEY|KRX_API_KEY.*proxy.*서버/u);
    assert.doesNotMatch(doc, /npx\s+(?:-y|--yes)\s+korea-stock-mcp/);
    assert.doesNotMatch(doc, /codex mcp add/);
    assert.doesNotMatch(doc, /claude_desktop_config\.json/);
    assert.doesNotMatch(doc, /DART_API_KEY/);
  }
});

test("repository docs advertise the shipped korean-spell-check helper assets", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-spell-check.md");
  const helperPath = path.join(repoRoot, "scripts", "korean_spell_check.py");

  assert.equal(fs.existsSync(featureDocPath), true);
  assert.equal(fs.existsSync(helperPath), true);
  assert.match(readme, /\[한국어 맞춤법 검사 가이드\]\(docs\/features\/korean-spell-check\.md\)/);
  assert.match(install, /python3 scripts\/korean_spell_check\.py/);
});

test("repository docs advertise the korean-character-count skill and deterministic counting contract", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-character-count.md");
  const featureDoc = read(path.join("docs", "features", "korean-character-count.md"));
  const skillPath = skillAbs("korean-character-count", "SKILL.md");
  const skill = read(skillRel("korean-character-count", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const packageJson = readJson("package.json");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-character-count.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-character-count/SKILL.md to exist");

  assert.match(readme, /\| 한국어 글자 수 세기 \|/);
  assert.match(readme, /\[한국어 글자 수 세기 가이드\]\(docs\/features\/korean-character-count\.md\)/);
  assert.match(install, /--skill korean-character-count/);
  assert.match(
    install,
    /--skill k-schoollunch-menu \\\n  --skill korean-character-count/,
    "docs/install.md selective-install block should keep k-schoollunch-menu and korean-character-count in the same continued shell command",
  );
  assert.match(install, /node scripts\/korean_character_count\.js --text "가나다"/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /grapheme|extended grapheme/i);
    assert.match(doc, /UTF-8/);
    assert.match(doc, /NEIS/i);
    assert.match(doc, /CRLF|U\+2028|U\+2029/);
    assert.match(doc, /node scripts\/korean_character_count\.js/);
    assert.doesNotMatch(doc, /packages\/korean-character-count/);
    assert.doesNotMatch(doc, /python-packages\/korean-character-count/);
  }

  assert.match(sources, /https:\/\/www\.unicode\.org\/reports\/tr29\//);
  assert.match(sources, /https:\/\/encoding\.spec\.whatwg\.org\//);
  assert.match(sources, /https:\/\/nodejs\.org\/api\/buffer\.html/);
  assert.match(roadmap, /한국어 글자 수 세기 스킬 출시/);
  assert.ok(
    !packageJson.workspaces.some((workspace) => workspace.includes("korean-character-count")),
    "expected no repo workspace to be added for korean-character-count",
  );
  assert.equal(fs.existsSync(path.join(repoRoot, "packages", "korean-character-count")), false);
});

test("korean-character-count feature doc NEIS example matches live helper output", () => {
  const featureDoc = read(path.join("docs", "features", "korean-character-count.md"));
  const helperOutput = childProcess.execFileSync(
    "node",
    [
      "scripts/korean_character_count.js",
      "--text",
      "첫 줄\n둘째 줄🙂",
      "--profile",
      "neis",
      "--format",
      "text",
    ],
    { cwd: repoRoot, encoding: "utf8" },
  );
  const bytesMatch = helperOutput.match(/^bytes:\s+(\d+)$/m);

  assert.ok(bytesMatch, `expected helper text output to include a bytes line, got: ${helperOutput}`);
  assert.equal(bytesMatch[1], "23");
  assert.match(featureDoc, new RegExp(String.raw`bytes:\s+${bytesMatch[1]}`));
  assert.match(featureDoc, /bytes=23/);
});

test("korean-character-count install payload includes the documented helper command", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "korean-character-count-"));
  const installedSkillPath = path.join(tempRoot, "korean-character-count");
  const bundledHelperPath = path.join(installedSkillPath, "scripts", "korean_character_count.js");

  try {
    fs.cpSync(skillAbs("korean-character-count"), installedSkillPath, { recursive: true });

    assert.ok(
      fs.existsSync(bundledHelperPath),
      "expected korean-character-count/scripts/korean_character_count.js to exist",
    );

    const helpText = childProcess.execFileSync("node", ["scripts/korean_character_count.js", "--help"], {
      cwd: installedSkillPath,
      encoding: "utf8",
    });

    assert.match(helpText, /--profile/);
    assert.match(helpText, /default/);
    assert.match(helpText, /neis/i);
    assert.match(helpText, /--stdin/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("repository docs advertise the cheap-gas-nearby skill and Opinet key requirements", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const examplesSecrets = read(path.join("examples", "secrets.env.example"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "cheap-gas-nearby.md");
  const skillPath = skillAbs("cheap-gas-nearby", "SKILL.md");

  assert.equal(fs.existsSync(featureDocPath), true);
  assert.equal(fs.existsSync(skillPath), true);
  assert.match(readme, /\| 근처 가장 싼 주유소 찾기 \|/);
  assert.match(readme, /\[근처 가장 싼 주유소 찾기 가이드\]\(docs\/features\/cheap-gas-nearby\.md\)/);
  assert.match(install, /--skill cheap-gas-nearby/);

  for (const doc of [setup, security, setupSkill]) {
    assert.match(doc, /주유소 가격|OPINET_API_KEY/);
    assert.match(doc, /hosted proxy|proxy.*경유/);
  }

  assert.doesNotMatch(examplesSecrets, /^OPINET_API_KEY=replace-me$/m);
  assert.match(sources, /https:\/\/www\.opinet\.co\.kr\/user\/custapi\/openApiInfo\.do/);
  assert.match(sources, /https:\/\/www\.opinet\.co\.kr\/api\/aroundAll\.do/);
  assert.match(sources, /https:\/\/www\.opinet\.co\.kr\/api\/detailById\.do/);
  assert.match(roadmap, /근처 가장 싼 주유소 찾기 스킬 출시/);
});

test("cheap-gas-nearby skill docs require location-first prompts and official Opinet surfaces", () => {
  const skill = read(skillRel("cheap-gas-nearby", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "cheap-gas-nearby.md"));

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /현재 위치를 알려주세요/);
    assert.match(doc, /OPINET_API_KEY/);
    assert.match(doc, /aroundAll\.do/);
    assert.match(doc, /detailById\.do/);
    assert.match(doc, /areaCode\.do/);
    assert.match(doc, /휘발유|경유/);
    assert.match(doc, /KATEC/);
    assert.match(doc, /카카오맵|Kakao Map/);
  }
});

test("repository docs advertise the han-river-water-level skill and rollout-pending proxy workflow", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const setup = read(path.join("docs", "setup.md"));
  const security = read(path.join("docs", "security-and-secrets.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));
  const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "han-river-water-level.md");
  const featureDoc = read(path.join("docs", "features", "han-river-water-level.md"));
  const skillPath = skillAbs("han-river-water-level", "SKILL.md");
  const skill = read(skillRel("han-river-water-level", "SKILL.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/han-river-water-level.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/han-river-water-level/SKILL.md to exist");

  assert.match(readme, /\| 한강 수위 정보 조회 \|/);
  assert.match(readme, /\[한강 수위 정보 가이드\]\(docs\/features\/han-river-water-level\.md\)/);
  assert.match(install, /--skill han-river-water-level/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /\/v1\/han-river\/water-level/);
    assert.match(doc, /stationName|station_code|stationCode/);
    assert.match(doc, /수위|유량/);
    assert.match(doc, /candidate_stations|ambiguous_station/);
    assert.match(doc, /KSKILL_PROXY_BASE_URL/);
  }

  assert.match(featureDoc, /HRFCO_OPEN_API_KEY/);

  assert.match(skill, /기본적으로 `https:\/\/k-skill-proxy\.nomadamas\.org\/v1\/han-river\/water-level`/);
  assert.doesNotMatch(featureDoc, /기본 hosted 조회:/);

  for (const doc of [proxyDoc, proxyReadme]) {
    assert.match(doc, /\/v1\/han-river\/water-level/);
    assert.match(doc, /HRFCO_OPEN_API_KEY/);
    assert.match(doc, /waterlevel\/info\.json/);
    assert.match(doc, /waterlevel\/list\/10M/);
  }

  assert.match(setup, /한강 수위 정보 조회 \| 사용자 시크릿 불필요/);
  assert.match(setup, /한강 수위.*기본 hosted p/i);
  assert.match(security, /KSKILL_PROXY_BASE_URL.*서울 지하철.*route가 실제 배포된 proxy URL/);
  assert.match(sources, /hrfco\.go\.kr\/web\/openapiPage\/reference\.do/);
  assert.match(sources, /api\.hrfco\.go\.kr/);
  assert.match(roadmap, /한강 수위 정보 조회 스킬 출시/);
});


test("repository docs advertise the MFDS drug and food safety skills", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const drugFeatureDocPath = path.join(repoRoot, "docs", "features", "mfds-drug-safety.md");
  const foodFeatureDocPath = path.join(repoRoot, "docs", "features", "mfds-food-safety.md");
  const drugSkillPath = skillAbs("mfds-drug-safety", "SKILL.md");
  const foodSkillPath = skillAbs("mfds-food-safety", "SKILL.md");

  assert.equal(fs.existsSync(drugFeatureDocPath), true);
  assert.equal(fs.existsSync(foodFeatureDocPath), true);
  assert.equal(fs.existsSync(drugSkillPath), true);
  assert.equal(fs.existsSync(foodSkillPath), true);
  assert.match(readme, /\| 의약품 안전 체크 \|/);
  assert.match(readme, /\| 식품 안전 체크 \|/);
  assert.match(readme, /\[의약품 안전 체크 가이드\]\(docs\/features\/mfds-drug-safety\.md\)/);
  assert.match(readme, /\[식품 안전 체크 가이드\]\(docs\/features\/mfds-food-safety\.md\)/);
  assert.match(install, /--skill mfds-drug-safety/);
  assert.match(install, /--skill mfds-food-safety/);
  assert.match(sources, /15075057\/openapi\.do/);
  assert.match(sources, /15097208\/openapi\.do/);
  assert.match(sources, /15056516\/openapi\.do/);
  assert.match(sources, /foodsafetykorea\.go\.kr\/api\/openApiInfo\.do/);
});

test("MFDS public-health skill docs require interview-first safety flow and official endpoints", () => {
  const drugSkill = read(skillRel("mfds-drug-safety", "SKILL.md"));
  const foodSkill = read(skillRel("mfds-food-safety", "SKILL.md"));
  const drugFeatureDoc = read(path.join("docs", "features", "mfds-drug-safety.md"));
  const foodFeatureDoc = read(path.join("docs", "features", "mfds-food-safety.md"));
  const sources = read(path.join("docs", "sources.md"));
  const proxyReadme = read(path.join("packages", "k-skill-proxy", "README.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));

  for (const doc of [drugSkill, drugFeatureDoc]) {
    assert.match(doc, /증상.*바로 단정하지 말고.*먼저 되묻/);
    assert.match(doc, /호흡곤란|의식저하|심한 발진/);
    assert.match(doc, /DrbEasyDrugInfoService\/getDrbEasyDrugList/);
    assert.match(doc, /SafeStadDrugService\/getSafeStadDrugInq/);
    assert.match(doc, /KSKILL_PROXY_BASE_URL|k-skill-proxy\.nomadamas\.org/);
    assert.match(doc, /사용자.*시크릿 없음|사용자 API key 없이/u);
    assert.match(doc, /DATA_GO_KR_API_KEY.*프록시 운영 서버/u);
    assert.match(doc, /\/v1\/mfds\/drug-safety\/lookup/);
    assert.match(doc, /python3 scripts\/mfds_drug_safety\.py/);
  }

  for (const doc of [foodSkill, foodFeatureDoc]) {
    assert.match(doc, /증상.*바로 단정하지 말고.*먼저 되묻/);
    assert.match(doc, /혈변|탈수|호흡곤란/);
    assert.match(doc, /PrsecImproptFoodInfoService03\/getPrsecImproptFoodList01/);
    assert.match(doc, /I0490/);
    assert.match(doc, /KSKILL_PROXY_BASE_URL|k-skill-proxy\.nomadamas\.org/);
    assert.match(doc, /사용자.*시크릿 없음|사용자 API key 없이/u);
    assert.match(doc, /DATA_GO_KR_API_KEY.*프록시 운영 서버/u);
    assert.match(doc, /FOODSAFETYKOREA_API_KEY/);
    assert.match(doc, /\/v1\/mfds\/food-safety\/search/);
    assert.match(doc, /python3 scripts\/mfds_food_safety\.py/);
    assert.match(doc, /https:\/\/openapi\.foodsafetykorea\.go\.kr\/api\/sample\/I0490\/json\/1\/5/);
    assert.doesNotMatch(doc, /http:\/\/openapi\.foodsafetykorea\.go\.kr/);
  }

  assert.match(sources, /https:\/\/openapi\.foodsafetykorea\.go\.kr\/api\/sample\/I0490\/json\/1\/5/);
  assert.doesNotMatch(sources, /http:\/\/openapi\.foodsafetykorea\.go\.kr/);
  for (const doc of [proxyReadme, proxyDoc]) {
    assert.match(doc, /\/v1\/mfds\/drug-safety\/lookup/);
    assert.match(doc, /\/v1\/mfds\/food-safety\/search/);
    assert.match(doc, /FOODSAFETYKOREA_API_KEY/);
  }
});

test("docs/setup.md and k-skill-setup document hosted household waste proxy flow", () => {
  const setup = read(path.join("docs", "setup.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  
  assert.match(
    setup,
    /한국 주식 정보 조회[\s\S]*생활쓰레기 배출정보 조회[\s\S]*학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 기본 hosted proxy를 쓰므로/,
    "setup.md intro should list household waste, school lunch, and MFDS skills among hosted-proxy features with no user-side key",
  );
  assert.match(setup, /DATA_GO_KR_API_KEY.*서버에 설정/);
  assert.match(
    setup,
    /미세먼지, 한강 수위, 주유소 가격[\s\S]*생활쓰레기 배출정보 조회[\s\S]*학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 `KSKILL_PROXY_BASE_URL` 을 비워 두면 기본 hosted path\(`k-skill-proxy\.nomadamas\.org`\)/,
    "setup.md should list fine dust, Han River, gas, household waste, school lunch, and MFDS skills when KSKILL_PROXY_BASE_URL is unset",
  );
  assert.match(
    setupSkill,
    /미세먼지, 한강 수위, 주유소 가격[\s\S]*생활쓰레기 배출정보 조회[\s\S]*학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 `KSKILL_PROXY_BASE_URL`/,
    "k-skill-setup SKILL should mirror setup.md hosted-proxy unset-base-URL guidance including MFDS skills",
  );

  assert.match(setup, /\| 생활쓰레기 배출정보 조회 \|/);
  assert.match(setup, /DATA_GO_KR_API_KEY/);
  assert.match(setup, /pageNo=1.*numOfRows=100|numOfRows=100.*pageNo=1/);
  assert.match(setup, /\[생활쓰레기 배출정보 조회 가이드\]\(features\/household-waste-info\.md\)/);

  assert.match(setupSkill, /\/v1\/household-waste\/info/);
  assert.match(setupSkill, /DATA_GO_KR_API_KEY/);
  assert.match(setupSkill, /생활쓰레기 배출정보 조회: 사용자 시크릿 불필요/);
});

test("docs/setup.md and k-skill-setup document hosted school lunch proxy flow", () => {
  const setup = read(path.join("docs", "setup.md"));
  const setupSkill = read(skillRel("k-skill-setup", "SKILL.md"));
  const examplesSecrets = read(path.join("examples", "secrets.env.example"));
  assert.match(setup, /학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 기본 hosted proxy/);
  assert.match(setup, /KEDU_INFO_KEY.*서버에 설정/);
  assert.match(
    setup,
    /미세먼지, 한강 수위, 주유소 가격[\s\S]*생활쓰레기 배출정보 조회[\s\S]*학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 `KSKILL_PROXY_BASE_URL` 을 비워 두면 기본 hosted path\(`k-skill-proxy\.nomadamas\.org`\)/,
    "setup.md should list fine dust, Han River, gas, household waste, school lunch, and MFDS skills when KSKILL_PROXY_BASE_URL is unset",
  );
  assert.match(
    setupSkill,
    /미세먼지, 한강 수위, 주유소 가격[\s\S]*생활쓰레기 배출정보 조회[\s\S]*학교 급식 식단 조회[\s\S]*의약품 안전 체크[\s\S]*식품 안전 체크는 `KSKILL_PROXY_BASE_URL`/,
    "k-skill-setup SKILL should mirror setup.md hosted-proxy unset-base-URL guidance including MFDS skills",
  );

  assert.match(setup, /\| 학교 급식 식단 조회 \|/);
  assert.match(setup, /KEDU_INFO_KEY/);
  assert.match(setup, /\[학교 급식 식단 조회 가이드\]\(features\/k-schoollunch-menu\.md\)/);

  assert.match(setupSkill, /\/v1\/neis\/school-search/);
  assert.match(setupSkill, /\/v1\/neis\/school-meal/);
  assert.match(setupSkill, /KEDU_INFO_KEY/);
  assert.match(setupSkill, /학교 급식 식단 조회: 사용자 시크릿 불필요/);

  assert.doesNotMatch(
    examplesSecrets,
    /^KEDU_INFO_KEY=/m,
    "client secrets example must not encourage KEDU_INFO_KEY (proxy server only)",
  );
});

test("repository docs advertise the hola-poke-yeoksam skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "hola-poke-yeoksam.md");
  const skillPath = skillAbs("hola-poke-yeoksam", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/hola-poke-yeoksam.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/hola-poke-yeoksam/SKILL.md to exist");

  const featureDoc = read(path.join("docs", "features", "hola-poke-yeoksam.md"));
  const skill = read(skillRel("hola-poke-yeoksam", "SKILL.md"));

  assert.match(readme, /\| 올라포케 역삼 포케 \|/);
  assert.match(readme, /\[올라포케 역삼 포케 가이드\]\(docs\/features\/hola-poke-yeoksam\.md\)/);
  assert.match(install, /--skill hola-poke-yeoksam/);
  assert.match(sources, /mnspkm\/hola-poke-yeoksam-skill/);
  assert.match(roadmap, /올라포케 역삼 포케 스킬 출시/);
});

test("hola-poke-yeoksam docs pin the verified remote MCP contract snapshot and phone-only event flow", () => {
  const fixture = readJson(path.join("scripts", "fixtures", "hola-poke-yeoksam-contract-smoke.json"));
  const skill = read(skillRel("hola-poke-yeoksam", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "hola-poke-yeoksam.md"));
  const snapshotLabels = [
    ["initialize 결과", "initialize", "initialize snapshot"],
    ["tools/list 결과", "tools_list", "tools/list snapshot"],
    ["get_menu 구조 예시", "get_menu", "get_menu snapshot"],
    ["get_shop_info 구조 예시", "get_shop_info", "get_shop_info snapshot"],
    ["enter_event(phone='010-12') 예시", "enter_event_invalid_phone", "invalid-phone snapshot"],
    ["enter_event 성공 응답 필수 필드", "enter_event_success_contract", "success-contract snapshot"],
  ];

  assert.match(skill, /^name: hola-poke-yeoksam$/m);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /올라포케 역삼점/);
    assert.match(doc, /get_menu/);
    assert.match(doc, /get_shop_info/);
    assert.match(doc, /enter_event/);
    assert.match(doc, /이름(?:·|\/)?이메일.*받지 않/);
    assert.match(doc, /already_entered_today/);
    assert.match(doc, /message.*글자 그대로/);
    assert.match(doc, /주문\/결제\/배달앱 자동화는 하지 않/);
    assert.match(doc, /성공 경로는.*(?:fixture|스냅샷|recorded)/i);
    assert.match(doc, /라이브 스모크.*invalid-phone|invalid-phone.*라이브 스모크/i);
    assert.match(doc, /01012345678|010-1234-5678/);
    assert.match(doc, /hola-poke-yeoksam-skill\.onrender\.com\/mcp/);

    for (const [label, key, message] of snapshotLabels) {
      assert.equal(
        findJsonFenceTextAfterLabel(doc, label),
        JSON.stringify(fixture[key], null, 2),
        `${message} must stay byte-aligned with the checked-in fixture`,
      );
    }
  }

  assert.deepEqual(
    fixture.tools_list.tools.map((tool) => tool.name),
    ["get_menu", "get_shop_info", "enter_event"],
    "tools/list fixture must pin the expected remote tool roster",
  );
  assert.equal(fixture.get_shop_info.group_order_url, "");
  assert.match(fixture.get_shop_info.group_order_note, /단체주문|네이버페이/);
  assert.deepEqual(fixture.enter_event_success_contract.required_fields, ["message", "code", "next_action"]);
  assert.equal(fixture.enter_event_invalid_phone.error, "phone_format");
  assert.match(fixture.enter_event_invalid_phone.message, /01012345678|010-1234-5678/);
});

test("repository docs advertise the library-book-search skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const proxyDoc = read(path.join("docs", "features", "k-skill-proxy.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "library-book-search.md");
  const skillPath = skillAbs("library-book-search", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/library-book-search.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/library-book-search/SKILL.md to exist");

  const featureDoc = read(path.join("docs", "features", "library-book-search.md"));
  const skill = read(skillRel("library-book-search", "SKILL.md"));

  assert.match(skill, /^name: library-book-search$/m);
  assert.match(readme, /\| 도서관 도서 조회 \|/);
  assert.match(readme, /\[도서관 도서 조회 가이드\]\(docs\/features\/library-book-search\.md\)/);
  assert.match(install, /--skill library-book-search/);
  assert.match(install, /DATA4LIBRARY_AUTH_KEY/);
  assert.match(sources, /data4library\.kr\/apiUtilization/);
  assert.match(proxyDoc, /\/v1\/data4library\/book-search/);
  assert.match(proxyDoc, /DATA4LIBRARY_AUTH_KEY/);

  for (const doc of [skill, featureDoc]) {
    assert.match(doc, /도서관 정보나루/);
    assert.match(doc, /\/v1\/data4library\/book-search/);
    assert.match(doc, /\/v1\/data4library\/book-detail/);
    assert.match(doc, /\/v1\/data4library\/book-exists/);
    assert.match(doc, /\/v1\/data4library\/libraries-by-book/);
    assert.match(doc, /DATA4LIBRARY_AUTH_KEY.*프록시 서버/s);
    assert.match(doc, /사용자.*시크릿.*없/);
  }
});

test("repository docs advertise the korean-privacy-terms thin-wrapper skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-privacy-terms.md");
  const skillPath = skillAbs("korean-privacy-terms", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-privacy-terms.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-privacy-terms/SKILL.md to exist");
  assert.match(readme, /\| 한국 개인정보처리방침·이용약관 자동 생성 \|/);
  assert.match(
    readme,
    /\[한국 개인정보처리방침·이용약관 자동 생성 가이드\]\(docs\/features\/korean-privacy-terms\.md\)/,
  );
  assert.match(install, /--skill korean-privacy-terms/);
  assert.match(roadmap, /한국 개인정보처리방침.이용약관 스킬 출시/);
  assert.match(sources, /https:\/\/github\.com\/kimlawtech\/korean-privacy-terms/);
  assert.match(sources, /Apache-2\.0/);
});

test("korean-privacy-terms skill is a thin wrapper that cites upstream and enforces a legal disclaimer", () => {
  const skillPath = skillAbs("korean-privacy-terms", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/korean-privacy-terms/SKILL.md to exist");

  const skill = read(skillRel("korean-privacy-terms", "SKILL.md"));

  assert.match(skill, /^name: korean-privacy-terms$/m);
  assert.match(skill, /^license: Apache-2\.0$/m);
  assert.match(skill, /^description: .*개인정보처리방침.*이용약관.*$/m);
  assert.match(
    skill,
    /\[?kimlawtech\/korean-privacy-terms\]?.*https:\/\/github\.com\/kimlawtech\/korean-privacy-terms/,
  );
  assert.match(skill, /Apache-2\.0/);
  assert.match(skill, /참고용 초안/);
  assert.match(skill, /법률 자문/);
  assert.match(skill, /변호사 검토/);
  assert.match(skill, /2026\.9\.11/);
  assert.match(skill, /되묻/);
  assert.match(skill, /개인정보처리방침/);
  assert.match(skill, /이용약관/);
  assert.match(skill, /쿠키 배너/);
  assert.match(skill, /~\/\.claude\/skills\/korean-privacy-terms/);
  assert.match(skill, /~\/\.agents\/skills\/korean-privacy-terms/);
  assert.match(skill, /scripts\/install\.sh/);
  assert.match(skill, /scripts\/upstream\.pin/);
  assert.match(skill, /DISCLAIMER\.md/);
  assert.match(skill, /## Notes/);
  assert.doesNotMatch(skill, /AskUserQuestion/);
});

test("korean-privacy-terms preserves upstream NOTICE and DISCLAIMER for Apache-2.0 compliance", () => {
  const noticePath = skillAbs("korean-privacy-terms", "NOTICE");
  const disclaimerPath = skillAbs("korean-privacy-terms", "DISCLAIMER.md");

  assert.ok(fs.existsSync(noticePath), "expected korean-privacy-terms/NOTICE to exist");
  assert.ok(fs.existsSync(disclaimerPath), "expected korean-privacy-terms/DISCLAIMER.md to exist");

  const notice = fs.readFileSync(noticePath, "utf8");
  const disclaimer = fs.readFileSync(disclaimerPath, "utf8");

  assert.match(notice, /korean-privacy-terms/);
  assert.match(notice, /Copyright 2026 kimlawtech/);
  assert.match(notice, /Apache License, Version 2\.0/);
  assert.match(notice, /kimlawtech/i);

  assert.match(disclaimer, /한국어/);
  assert.match(disclaimer, /English/);
  assert.match(disclaimer, /참고용 초안/);
  assert.match(disclaimer, /reference drafts/i);
  assert.match(disclaimer, /legal advice/i);
  assert.match(disclaimer, /개인정보보호법/);
});

test("korean-privacy-terms ships an install.sh wrapper and a pinned upstream SHA", () => {
  const pinPath = skillAbs("korean-privacy-terms", "scripts", "upstream.pin");
  const installPath = skillAbs("korean-privacy-terms", "scripts", "install.sh");

  assert.ok(fs.existsSync(pinPath), "expected korean-privacy-terms/scripts/upstream.pin to exist");
  assert.ok(fs.existsSync(installPath), "expected korean-privacy-terms/scripts/install.sh to exist");

  const pin = fs.readFileSync(pinPath, "utf8").trim();

  assert.match(pin, /^[0-9a-f]{40}$/, "upstream.pin must contain a single 40-char git SHA");
  assert.notStrictEqual(
    pin,
    "0".repeat(40),
    "upstream.pin must not be a placeholder all-zero SHA",
  );
  assert.notStrictEqual(
    pin,
    "f".repeat(40),
    "upstream.pin must not be a placeholder all-f SHA",
  );

  const install = fs.readFileSync(installPath, "utf8");

  assert.match(install, /^#!\/(?:usr\/bin\/env bash|bin\/bash)/m, "install.sh must start with a bash shebang");
  assert.match(install, /set -euo pipefail/, "install.sh must opt into strict bash mode");
  assert.match(install, /~\/\.claude\/skills\/korean-privacy-terms/);
  assert.match(install, /~\/\.agents\/skills\/korean-privacy-terms/);
  assert.match(
    install,
    /https:\/\/github\.com\/kimlawtech\/korean-privacy-terms\.git/,
    "install.sh must reference the full upstream clone URL",
  );
  assert.match(
    install,
    /git clone --filter=blob:none/,
    "install.sh must perform a blobless git clone of the upstream repo",
  );
  assert.match(install, /upstream\.pin/);

  const stat = fs.statSync(installPath);

  assert.ok(
    (stat.mode & 0o111) !== 0,
    "install.sh must have the executable bit set on at least one of user/group/other",
  );
});

test("korean-privacy-terms bundles the Apache-2.0 LICENSE per §4(a) redistribution requirement", () => {
  const licensePath = skillAbs("korean-privacy-terms", "LICENSE.upstream");

  assert.ok(
    fs.existsSync(licensePath),
    "expected korean-privacy-terms/LICENSE.upstream to exist (Apache-2.0 §4(a) requires redistributors to give recipients a copy of this License)",
  );

  const license = fs.readFileSync(licensePath, "utf8");

  assert.match(license, /Apache License/);
  assert.match(license, /Version 2\.0, January 2004/);
  assert.match(license, /http:\/\/www\.apache\.org\/licenses\/LICENSE-2\.0/);
  assert.match(license, /TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION/);
  assert.match(license, /Redistribution\. You may reproduce and distribute/);
  assert.match(license, /END OF TERMS AND CONDITIONS/);
  assert.match(license, /APPENDIX: How to apply the Apache License/);
  assert.match(license, /Copyright 2026 kimlawtech/);

  const skill = read(skillRel("korean-privacy-terms", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "korean-privacy-terms.md"));

  assert.match(
    skill,
    /LICENSE\.upstream/,
    "SKILL.md Notes section must link to LICENSE.upstream so §4(a) is satisfied even before install.sh runs",
  );
  assert.match(
    featureDoc,
    /LICENSE\.upstream/,
    "docs/features/korean-privacy-terms.md must reference LICENSE.upstream",
  );
});

test("korean-privacy-terms feature doc documents the thin-wrapper install flow and legal disclaimer", () => {
  const featureDoc = read(path.join("docs", "features", "korean-privacy-terms.md"));

  assert.match(featureDoc, /kimlawtech\/korean-privacy-terms/);
  assert.match(featureDoc, /Apache-2\.0/);
  assert.match(featureDoc, /~\/\.claude\/skills\/korean-privacy-terms/);
  assert.match(featureDoc, /~\/\.agents\/skills\/korean-privacy-terms/);
  assert.match(featureDoc, /scripts\/install\.sh/);
  assert.match(featureDoc, /scripts\/upstream\.pin/);
  assert.match(featureDoc, /참고용 초안/);
  assert.match(featureDoc, /법률 자문/);
  assert.match(featureDoc, /변호사 검토/);
  assert.match(featureDoc, /2026\.9\.11/);
  assert.match(featureDoc, /Next\.js/);
});

test("repository docs advertise the korean-jangbu-for thin-wrapper skill", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "korean-jangbu-for.md");
  const skillPath = skillAbs("korean-jangbu-for", "SKILL.md");

  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/korean-jangbu-for.md to exist");
  assert.ok(fs.existsSync(skillPath), "expected examples/korean-jangbu-for/SKILL.md to exist");
  assert.match(readme, /\| 한국 사업자 장부 자동화 \|/);
  assert.match(readme, /\[한국 사업자 장부 자동화 가이드\]\(docs\/features\/korean-jangbu-for\.md\)/);
  assert.match(install, /--skill korean-jangbu-for/);
  assert.match(sources, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for/);
  assert.match(sources, /Apache-2\.0/);
  assert.match(sources, /kimlawtech/);
  assert.match(sources, /SpeciAI/);
});

test("korean-jangbu-for skill cites upstream author and enforces accounting/tax disclaimers", () => {
  const skillPath = skillAbs("korean-jangbu-for", "SKILL.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/korean-jangbu-for/SKILL.md to exist");

  const skill = read(skillRel("korean-jangbu-for", "SKILL.md"));

  assert.match(skill, /^name: korean-jangbu-for$/m);
  assert.match(skill, /^license: Apache-2\.0$/m);
  assert.match(skill, /^description: .*장부.*사업자.*$/m);
  assert.match(skill, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for/);
  assert.match(skill, /@kimlawtech/);
  assert.match(skill, /SpeciAI/);
  assert.match(skill, /Apache-2\.0/);
  assert.match(skill, /참고용 초안/);
  assert.match(skill, /공식 회계감사/);
  assert.match(skill, /세무신고/);
  assert.match(skill, /세무사 검토/);
  assert.match(skill, /공인회계사/);
  assert.match(skill, /CODEF/);
  assert.match(skill, /BYOK/);
  assert.match(skill, /~\/\.claude\/skills\/korean-jangbu-for/);
  assert.match(skill, /~\/\.agents\/skills\/korean-jangbu-for/);
  assert.match(skill, /scripts\/install\.sh/);
  assert.match(skill, /scripts\/upstream\.pin/);
  assert.match(skill, /DISCLAIMER\.md/);
  assert.match(skill, /LICENSE\.upstream/);
  assert.doesNotMatch(skill, /AskUserQuestion/);
});

test("korean-jangbu-for preserves upstream attribution, disclaimer, and Apache license", () => {
  const noticePath = skillAbs("korean-jangbu-for", "NOTICE");
  const disclaimerPath = skillAbs("korean-jangbu-for", "DISCLAIMER.md");
  const licensePath = skillAbs("korean-jangbu-for", "LICENSE.upstream");

  assert.ok(fs.existsSync(noticePath), "expected korean-jangbu-for/NOTICE to exist");
  assert.ok(fs.existsSync(disclaimerPath), "expected korean-jangbu-for/DISCLAIMER.md to exist");
  assert.ok(fs.existsSync(licensePath), "expected korean-jangbu-for/LICENSE.upstream to exist");

  const notice = read(skillRel("korean-jangbu-for", "NOTICE"));
  const disclaimer = read(skillRel("korean-jangbu-for", "DISCLAIMER.md"));
  const license = read(skillRel("korean-jangbu-for", "LICENSE.upstream"));

  assert.match(notice, /korean-jangbu-for/);
  assert.match(notice, /Copyright 2026 kimlawtech/);
  assert.match(notice, /SpeciAI/);
  assert.match(notice, /@kimlawtech/);
  assert.match(notice, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for/);

  assert.match(disclaimer, /참고용 초안/);
  assert.match(disclaimer, /공식 회계감사/);
  assert.match(disclaimer, /세무신고/);
  assert.match(disclaimer, /세무사 검토 필수/);
  assert.match(disclaimer, /공인회계사 감사 필수/);
  assert.match(disclaimer, /법적 효력/);

  assert.match(license, /Apache License/);
  assert.match(license, /Version 2\.0, January 2004/);
  assert.match(license, /END OF TERMS AND CONDITIONS/);
  assert.match(license, /Copyright 2026 kimlawtech \(SpeciAI\)/);
});

test("korean-jangbu-for ships an install.sh wrapper and a pinned upstream SHA", () => {
  const pinPath = skillAbs("korean-jangbu-for", "scripts", "upstream.pin");
  const installPath = skillAbs("korean-jangbu-for", "scripts", "install.sh");

  assert.ok(fs.existsSync(pinPath), "expected korean-jangbu-for/scripts/upstream.pin to exist");
  assert.ok(fs.existsSync(installPath), "expected korean-jangbu-for/scripts/install.sh to exist");

  const pin = read(skillRel("korean-jangbu-for", "scripts", "upstream.pin")).trim();

  assert.match(pin, /^[0-9a-f]{40}$/, "upstream.pin must contain a single 40-char git SHA");
  assert.notStrictEqual(pin, "0".repeat(40), "upstream.pin must not be a placeholder all-zero SHA");

  const install = read(skillRel("korean-jangbu-for", "scripts", "install.sh"));

  assert.match(install, /^#!\/(?:usr\/bin\/env bash|bin\/bash)/m);
  assert.match(install, /set -euo pipefail/);
  assert.match(install, /~\/\.claude\/skills\/korean-jangbu-for/);
  assert.match(install, /~\/\.agents\/skills\/korean-jangbu-for/);
  assert.match(install, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for\.git/);
  assert.match(install, /git clone --filter=blob:none/);
  assert.match(install, /upstream\.pin/);
  assert.match(install, /verify\.sh/);
  assert.match(install, /Re-run this wrapper installer after upstream runtime install/);

  const stat = fs.statSync(installPath);
  assert.ok((stat.mode & 0o111) !== 0, "install.sh must be executable");
});

test("korean-jangbu-for installer registers upstream subskills for Claude and agents", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "korean-jangbu-for-install-"));
  const homeDir = path.join(tmpDir, "home");
  const upstreamDir = path.join(tmpDir, "upstream");
  const installPath = skillAbs("korean-jangbu-for", "scripts", "install.sh");
  const upstreamSubskills = [
    "jangbu-connect",
    "jangbu-dash",
    "jangbu-import",
    "jangbu-jongso",
    "jangbu-tag",
    "jangbu-tax",
  ];

  fs.mkdirSync(path.join(upstreamDir, "skills"), { recursive: true });
  fs.mkdirSync(homeDir, { recursive: true });

  for (const skillName of ["korean-jangbu-for", ...upstreamSubskills]) {
    const skillDir = path.join(upstreamDir, "skills", skillName);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      `---\nname: ${skillName}\n---\n\n# ${skillName}\n`,
    );
  }

  fs.mkdirSync(path.join(upstreamDir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(upstreamDir, "scripts", "verify.sh"), "#!/usr/bin/env bash\nexit 0\n");

  childProcess.execFileSync("git", ["init"], { cwd: upstreamDir, stdio: "ignore" });
  childProcess.execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["config", "user.name", "Test"], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["add", "."], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["commit", "-m", "seed upstream skills"], { cwd: upstreamDir, stdio: "ignore" });
  const upstreamSha = childProcess.execFileSync("git", ["rev-parse", "HEAD"], { cwd: upstreamDir, encoding: "utf8" }).trim();

  fs.mkdirSync(path.join(homeDir, ".claude", "skills"), { recursive: true });
  fs.symlinkSync(
    path.join(upstreamDir, "skills", "korean-jangbu-for"),
    path.join(homeDir, ".claude", "skills", "korean-jangbu-for"),
  );

  childProcess.execFileSync("bash", [installPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      HOME: homeDir,
      KOREAN_JANGBU_FOR_UPSTREAM_REPO: upstreamDir,
      KOREAN_JANGBU_FOR_UPSTREAM_SHA: upstreamSha,
    },
    stdio: "pipe",
  });

  for (const root of [".claude", ".agents"]) {
    const skillRoot = path.join(homeDir, root, "skills");

    assert.ok(
      fs.existsSync(path.join(skillRoot, "korean-jangbu-for", "upstream", "skills", "jangbu-connect", "SKILL.md")),
      `${root} should keep the pinned upstream checkout nested under the wrapper`,
    );
    assert.match(
      fs.readFileSync(path.join(skillRoot, "korean-jangbu-for", "SKILL.md"), "utf8"),
      /@kimlawtech/,
      `${root} should keep the korean-jangbu-for wrapper policy at the top level`,
    );
    assert.ok(
      !fs.lstatSync(path.join(skillRoot, "korean-jangbu-for")).isSymbolicLink(),
      `${root} should replace conflicting upstream korean-jangbu-for symlinks with a wrapper directory`,
    );

    for (const requiredPath of [
      "scripts/install.sh",
      "scripts/upstream.pin",
      "LICENSE.upstream",
      "DISCLAIMER.md",
      "NOTICE",
    ]) {
      assert.ok(
        fs.existsSync(path.join(skillRoot, "korean-jangbu-for", requiredPath)),
        `${root} should install wrapper support payload ${requiredPath}`,
      );
    }

    for (const skillName of upstreamSubskills) {
      const installedSubskillPath = path.join(skillRoot, skillName, "SKILL.md");
      assert.ok(
        fs.existsSync(installedSubskillPath),
        `${root} should register upstream subskill ${skillName} as a top-level discoverable skill`,
      );

      const installedSubskill = fs.readFileSync(installedSubskillPath, "utf8");
      assert.match(installedSubskill, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for/);
      assert.match(installedSubskill, /@kimlawtech/);
      assert.match(installedSubskill, /SpeciAI/);
      assert.match(installedSubskill, /Apache-2\.0/);
      assert.match(installedSubskill, /참고용 초안/);
      assert.match(installedSubskill, /공식 회계감사/);
      assert.match(installedSubskill, /세무신고/);
    }
  }

  for (const installedRoot of [".claude", ".agents"]) {
    childProcess.execFileSync("bash", [path.join(homeDir, installedRoot, "skills", "korean-jangbu-for", "scripts", "install.sh")], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: homeDir,
        KOREAN_JANGBU_FOR_UPSTREAM_REPO: upstreamDir,
        KOREAN_JANGBU_FOR_UPSTREAM_SHA: upstreamSha,
      },
      stdio: "pipe",
    });
  }
});

test("korean-jangbu-for installer preflights promoted subskill collisions before home writes", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "korean-jangbu-for-collision-"));
  const homeDir = path.join(tmpDir, "home");
  const upstreamDir = path.join(tmpDir, "upstream");
  const installPath = skillAbs("korean-jangbu-for", "scripts", "install.sh");
  const upstreamSubskills = [
    "jangbu-connect",
    "jangbu-dash",
    "jangbu-import",
    "jangbu-jongso",
    "jangbu-tag",
    "jangbu-tax",
  ];

  for (const skillName of upstreamSubskills) {
    fs.mkdirSync(path.join(upstreamDir, "skills", skillName), { recursive: true });
    fs.writeFileSync(
      path.join(upstreamDir, "skills", skillName, "SKILL.md"),
      `---\nname: ${skillName}\n---\n\n# ${skillName}\n`,
    );
  }

  fs.mkdirSync(path.join(upstreamDir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(upstreamDir, "scripts", "verify.sh"), "#!/usr/bin/env bash\nexit 0\n");

  childProcess.execFileSync("git", ["init"], { cwd: upstreamDir, stdio: "ignore" });
  childProcess.execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["config", "user.name", "Test"], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["add", "."], { cwd: upstreamDir });
  childProcess.execFileSync("git", ["commit", "-m", "seed upstream skills"], { cwd: upstreamDir, stdio: "ignore" });
  const upstreamSha = childProcess.execFileSync("git", ["rev-parse", "HEAD"], { cwd: upstreamDir, encoding: "utf8" }).trim();

  const unrelatedSkillDir = path.join(homeDir, ".agents", "skills", "jangbu-tax");
  fs.mkdirSync(unrelatedSkillDir, { recursive: true });
  fs.writeFileSync(
    path.join(unrelatedSkillDir, "SKILL.md"),
    "---\nname: jangbu-tax\n---\n\n# user-authored jangbu-tax\n",
  );

  assert.throws(
    () =>
      childProcess.execFileSync("bash", [installPath], {
        cwd: repoRoot,
        env: {
          ...process.env,
          HOME: homeDir,
          KOREAN_JANGBU_FOR_UPSTREAM_REPO: upstreamDir,
          KOREAN_JANGBU_FOR_UPSTREAM_SHA: upstreamSha,
        },
        stdio: "pipe",
      }),
    /refusing to overwrite unrelated skill/,
  );

  assert.match(
    fs.readFileSync(path.join(unrelatedSkillDir, "SKILL.md"), "utf8"),
    /user-authored jangbu-tax/,
    "unrelated existing subskill should be preserved after installer refusal",
  );

  for (const root of [".claude", ".agents"]) {
    const skillRoot = path.join(homeDir, root, "skills");
    assert.ok(
      !fs.existsSync(path.join(skillRoot, "korean-jangbu-for")),
      `${root} should not create the wrapper directory after a promoted-subskill preflight failure`,
    );

    for (const skillName of upstreamSubskills.filter((name) => name !== "jangbu-tax")) {
      assert.ok(
        !fs.existsSync(path.join(skillRoot, skillName)),
        `${root} should not create promoted subskill ${skillName} after a promoted-subskill preflight failure`,
      );
    }
  }
});

test("korean-jangbu-for feature doc documents source-first use and mandatory attribution", () => {
  const featureDoc = read(path.join("docs", "features", "korean-jangbu-for.md"));

  assert.match(featureDoc, /kimlawtech\/korean-jangbu-for/);
  assert.match(featureDoc, /https:\/\/github\.com\/kimlawtech\/korean-jangbu-for/);
  assert.match(featureDoc, /@kimlawtech/);
  assert.match(featureDoc, /SpeciAI/);
  assert.match(featureDoc, /Apache-2\.0/);
  assert.match(featureDoc, /~\/\.claude\/skills\/korean-jangbu-for/);
  assert.match(featureDoc, /~\/\.agents\/skills\/korean-jangbu-for/);
  assert.match(featureDoc, /scripts\/install\.sh/);
  assert.match(featureDoc, /scripts\/upstream\.pin/);
  assert.match(featureDoc, /CODEF/);
  assert.match(featureDoc, /BYOK/);
  assert.match(featureDoc, /세무사 검토/);
  assert.match(featureDoc, /공인회계사/);
});

test("corporate-registration-consulting skill covers court registry workflow, tax pitfalls, and rhwp automation", () => {
  const skillPath = skillAbs("corporate-registration-consulting", "SKILL.md");
  const featureDocPath = path.join(repoRoot, "docs", "features", "corporate-registration-consulting.md");

  assert.ok(fs.existsSync(skillPath), "expected examples/corporate-registration-consulting/SKILL.md to exist");
  assert.ok(fs.existsSync(featureDocPath), "expected corporate-registration-consulting feature doc to exist");
  const articlesTemplatePath = path.join(
    "corporate-registration-consulting",
    "templates",
    "standard-articles-of-incorporation.md",
  );
  const documentPackTemplatePath = path.join(
    "corporate-registration-consulting",
    "templates",
    "incorporation-document-pack.md",
  );

  assert.ok(
    fs.existsSync(path.join(repoRoot, articlesTemplatePath)),
    "expected a standard articles template artifact",
  );
  assert.ok(
    fs.existsSync(path.join(repoRoot, documentPackTemplatePath)),
    "expected an incorporation document pack template artifact",
  );

  const articlesTemplate = read(articlesTemplatePath);
  const documentPackTemplate = read(documentPackTemplatePath);
  const skill = read(skillRel("corporate-registration-consulting", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "corporate-registration-consulting.md"));
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));

  assert.match(skill, /^---\nname: corporate-registration-consulting\n/);
  assert.match(skill, /참고용/);
  assert.match(skill, /법률 자문/);
  assert.match(skill, /변호사|법무사|세무사/);
  assert.match(skill, /상호/);
  assert.match(skill, /정관/);
  assert.match(skill, /잔고증명|주금납입/);
  assert.match(skill, /취임승낙서/);
  assert.match(skill, /조사보고서/);
  assert.match(skill, /등록면허세/);
  assert.match(skill, /과밀억제권역/);
  assert.match(skill, /지방세법 제28조/);
  assert.match(skill, /소프트웨어/);
  assert.match(skill, /주민등록번호/);
  assert.match(skill, /마스킹/);
  assert.match(skill, /에이전트는[\s\S]*로그인[\s\S]*전자서명[\s\S]*세금 납부[\s\S]*등기 제출[\s\S]*수행하지 않는다/);
  assert.match(skill, /사용자 사칭[\s\S]*수행하지 않는다/);
  assert.match(skill, /최종 법률 판단[\s\S]*수행하지 않는다/);
  assert.match(skill, /최종 세무 판단[\s\S]*수행하지 않는다/);
  assert.match(skill, /모집설립/);
  assert.match(skill, /현물출자/);
  assert.match(skill, /변태설립사항/);
  assert.match(skill, /자본금 10억/);
  assert.match(skill, /주식회사 외/);
  assert.match(skill, /지점/);
  assert.match(skill, /외국인/);
  assert.match(skill, /인허가 업종/);
  assert.match(skill, /rhwp-edit/);
  assert.match(skill, /k-skill-rhwp/);
  assert.match(skill, /replace-all.*본문/);
  assert.match(skill, /set-cell-text/);
  assert.match(skill, /표.*셀/);
  assert.match(skill, /mktemp -d/);
  assert.match(skill, /chmod 700/);
  assert.match(skill, /레포.*밖|레포.*외부|저장소.*밖|저장소.*외부/);
  assert.doesNotMatch(skill, /\.\/out\/court-form-filled\.hwp/);
  assert.match(skill, /법인명/);
  assert.match(skill, /이사/);
  assert.match(skill, /주소/);
  assert.match(skill, /쉬운 말/);
  assert.match(skill, /사용자 결정/);
  assert.match(articlesTemplate, /\{\{COMPANY_NAME\}\}/);
  assert.match(articlesTemplate, /발기인/);
  assert.match(articlesTemplate, /1주의 금액/);
  assert.match(articlesTemplate, /3명 이상.*이사회/);
  assert.match(articlesTemplate, /2명.*이사회가 없는/);
  assert.match(articlesTemplate, /이사회 결의라는 표현은 쓰지 않는다/);
  assert.match(articlesTemplate, /1명.*그 이사가 회사를 대표/);
  assert.match(articlesTemplate, /관할 등기소|전문가/);
  assert.match(documentPackTemplate, /취임승낙서/);
  assert.match(documentPackTemplate, /인감신고서/);
  assert.match(documentPackTemplate, /등록면허세/);
  assert.match(documentPackTemplate, /개인정보|민감정보/);
  assert.match(documentPackTemplate, /레포.*커밋/);
  assert.match(documentPackTemplate, /\{\{INSPECTION_CONCLUSION_AFTER_USER_OR_EXPERT_REVIEW\}\}/);
  assert.doesNotMatch(documentPackTemplate, /중대한 흠이 없음을 보고합니다/);

  assert.match(featureDoc, /법인등기 신청 컨설팅/);
  assert.match(featureDoc, /표준 정관/);
  assert.match(featureDoc, /등록면허세/);
  assert.match(featureDoc, /과밀억제권역/);
  assert.match(featureDoc, /조세특례제한법 제6조/);
  assert.match(featureDoc, /지방세법 제28조/);
  assert.match(featureDoc, /에이전트는[\s\S]*로그인[\s\S]*전자서명[\s\S]*세금 납부[\s\S]*등기 제출[\s\S]*지원하지 않는다|에이전트는[\s\S]*로그인[\s\S]*전자서명[\s\S]*세금 납부[\s\S]*등기 제출[\s\S]*수행하지 않는다/);
  assert.match(featureDoc, /사용자 사칭[\s\S]*(지원하지 않는다|수행하지 않는다|사용자가 직접 또는 전문가)/);
  assert.match(featureDoc, /최종 법률 판단[\s\S]*(지원하지 않는다|수행하지 않는다|사용자가 직접 또는 전문가)/);
  assert.match(featureDoc, /최종 세무 판단[\s\S]*(지원하지 않는다|수행하지 않는다|사용자가 직접 또는 전문가)/);
  assert.match(featureDoc, /개인정보|민감정보/);
  assert.match(featureDoc, /모집설립/);
  assert.match(featureDoc, /현물출자/);
  assert.match(featureDoc, /변태설립사항/);
  assert.match(featureDoc, /자본금 10억/);
  assert.match(featureDoc, /주식회사 외/);
  assert.match(featureDoc, /지점/);
  assert.match(featureDoc, /외국인/);
  assert.match(featureDoc, /인허가 업종/);
  assert.match(featureDoc, /replace-all.*본문/);
  assert.match(featureDoc, /set-cell-text/);
  assert.match(featureDoc, /표.*셀/);
  assert.match(featureDoc, /사용자\/전문가가.*신고.*납부|사용자.*신고.*납부/);
  assert.match(featureDoc, /사용자\/전문가가.*제출|사용자.*제출/);
  assert.match(featureDoc, /인터넷등기소|온라인법인설립시스템/);
  assert.match(featureDoc, /참고용/);

  assert.match(readme, /\| 법인등기 신청 컨설팅 \|/);
  assert.match(readme, /docs\/features\/corporate-registration-consulting\.md/);
  assert.match(install, /--skill corporate-registration-consulting/);
  assert.match(sources, /corporate-registration-consulting/);
  assert.match(sources, /startbiz\.go\.kr/);
  assert.match(sources, /law\.go\.kr/);
});


test("iros-registry-automation skill documents safe IROS registry certificate automation and upstream credit", () => {
  const skillPath = skillAbs("iros-registry-automation", "SKILL.md");
  const featureDocPath = path.join(repoRoot, "docs", "features", "iros-registry-automation.md");
  const upstreamPinPath = skillAbs("iros-registry-automation", "scripts", "upstream.pin");

  assert.ok(fs.existsSync(skillPath), "expected examples/iros-registry-automation/SKILL.md to exist");
  assert.ok(fs.existsSync(featureDocPath), "expected iros-registry-automation feature doc to exist");
  assert.ok(fs.existsSync(upstreamPinPath), "expected iros-registry-automation/scripts/upstream.pin to exist");

  const skill = read(skillRel("iros-registry-automation", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "iros-registry-automation.md"));
  const upstreamPin = read(skillRel("iros-registry-automation", "scripts", "upstream.pin")).trim();
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const sources = read(path.join("docs", "sources.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));

  assert.match(upstreamPin, /^[0-9a-f]{40}$/, "upstream pin should be a reviewed 40-character Git SHA");

  assert.match(skill, /^---\nname: iros-registry-automation\n/);
  assert.match(skill, /등기부등본|등기사항증명서/);
  assert.match(skill, /법인/);
  assert.match(skill, /부동산/);
  assert.match(skill, /인터넷등기소|IROS/);
  assert.match(skill, /TouchEn nxKey/);
  assert.match(skill, /Playwright|Chromium/);
  assert.match(skill, /로그인[\s\S]*수동|사용자.*직접.*로그인/);
  assert.match(skill, /결제[\s\S]*수동|사용자.*직접.*결제/);
  assert.match(skill, /카드|공동인증서|간편인증/);
  assert.match(skill, /페이지당\s*10건|10건/);
  assert.match(skill, /장바구니/);
  assert.match(skill, /열람/);
  assert.match(skill, /저장|다운로드/);
  assert.match(skill, /법인등록번호/);
  assert.match(skill, /상호명/);
  assert.match(skill, /주소/);
  assert.match(skill, /개인정보|민감정보/);
  assert.match(skill, /법률 자문|참고용/);
  assert.match(skill, /challengekim/);
  assert.match(skill, /https:\/\/github\.com\/challengekim\/iros-registry-automation/);
  assert.match(skill, /MIT/);
  assert.match(skill, /원 저작자|원저작자|upstream|참고 구현/);
  assert.match(skill, new RegExp(`git checkout ${upstreamPin}`), "skill install flow should check out the pinned upstream SHA");
  assert.match(skill, /scripts\/upstream\.pin/, "skill should document where the reviewed upstream pin lives");
  assert.match(skill, /pin update|핀 업데이트|업스트림 핀|review/i, "skill should require review before updating the pin");
  assert.match(skill, /\$workdir\/corp-input\.json/, "skill should put real corporate inputs under the private workdir");
  assert.match(
    skill,
    /\$workdir\/companies-input\.json[\s\S]*(iros_download\.py|결제 후|열람|저장)/,
    "skill should prepare the company-name list required by iros_download.py before the download flow after payment",
  );
  assert.match(
    skill,
    /"excel_path":\s*str\(workdir \/ "customer-list\.xlsx"\)/,
    "skill should redirect upstream customer Excel input to the private workdir",
  );
  assert.match(skill, /\$workdir\/downloads/, "skill should point save_dir/download output at the private workdir");
  assert.match(skill, /config\.json[\s\S]*save_dir[\s\S]*\$workdir/, "skill should wire config.json save_dir to the private workdir");
  assert.match(skill, /upstream repo `data\/`|upstream `data\/`|data\/.*실제/, "skill should warn not to use upstream data/ for real inputs");

  for (const doc of [featureDoc, sources]) {
    assert.match(doc, /challengekim/);
    assert.match(doc, /https:\/\/github\.com\/challengekim\/iros-registry-automation/);
    assert.match(doc, /인터넷등기소|IROS|iros\.go\.kr/);
  }

  assert.match(featureDoc, new RegExp(`git checkout ${upstreamPin}`), "feature doc install flow should check out the pinned upstream SHA");
  assert.match(featureDoc, /scripts\/upstream\.pin/, "feature doc should document where the reviewed upstream pin lives");
  assert.match(featureDoc, /pin update|핀 업데이트|업스트림 핀|review/i, "feature doc should require review before updating the pin");
  assert.match(featureDoc, /로그인[\s\S]*수동|사용자.*직접.*로그인/);
  assert.match(featureDoc, /결제[\s\S]*수동|사용자.*직접.*결제/);
  assert.match(featureDoc, /법인[\s\S]*장바구니[\s\S]*열람[\s\S]*저장/);
  assert.match(featureDoc, /부동산[\s\S]*장바구니[\s\S]*수동/);
  assert.match(featureDoc, /TouchEn nxKey/);
  assert.match(featureDoc, /페이지당\s*10건|10건/);
  assert.match(featureDoc, /i?ros_cart_by_corpnum\.py|법인등록번호 기반/);
  assert.match(featureDoc, /i?ros_cart_realty\.py|부동산 장바구니/);
  assert.match(featureDoc, /저장소 밖|레포 밖|커밋하지/);
  assert.match(featureDoc, /\$workdir\/corp-input\.json/, "feature doc should put real corporate inputs under the private workdir");
  assert.match(
    featureDoc,
    /\$workdir\/companies-input\.json[\s\S]*(iros_download\.py|결제 후|열람|저장)/,
    "feature doc should prepare the company-name list required by iros_download.py before the download flow after payment",
  );
  assert.match(
    featureDoc,
    /"excel_path":\s*str\(workdir \/ "customer-list\.xlsx"\)/,
    "feature doc should redirect upstream customer Excel input to the private workdir",
  );
  assert.match(featureDoc, /\$workdir\/downloads/, "feature doc should point save_dir/download output at the private workdir");
  assert.match(featureDoc, /config\.json[\s\S]*save_dir[\s\S]*\$workdir/, "feature doc should wire config.json save_dir to the private workdir");
  assert.match(featureDoc, /upstream repo `data\/`|upstream `data\/`|data\/.*실제/, "feature doc should warn not to use upstream data/ for real inputs");
  assert.doesNotMatch(featureDoc, /결제.*자동화.*지원/);

  assert.match(readme, /\| 등기부등본 자동화 \| `iros-registry-automation` \|/);
  assert.match(readme, /docs\/features\/iros-registry-automation\.md/);
  assert.match(install, /--skill iros-registry-automation/);
  assert.match(roadmap, /등기부등본 자동화 스킬 출시/);
});

test("rhwp-edit skill pins the k-skill-rhwp CLI as the editing engine and disclaims kordoc/rhwp-advanced routing", () => {
  const skill = read(skillRel("rhwp-edit", "SKILL.md"));

  assert.match(skill, /^---\nname: rhwp-edit\n/);
  assert.match(skill, /k-skill-rhwp/);
  assert.match(skill, /@rhwp\/core/);
  assert.match(skill, /hwp\/SKILL\.md/);
  assert.match(skill, /rhwp-advanced\/SKILL\.md/);
  assert.match(skill, /insert-text/);
  assert.match(skill, /delete-text/);
  assert.match(skill, /replace-all/);
  assert.match(skill, /create-table/);
  assert.match(skill, /set-cell-text/);
  assert.match(skill, /create-blank/);
  assert.match(skill, /#196/);
  assert.match(skill, /본문 문단만/, "SKILL.md must document body-only scope for search/replace-all");
  assert.match(skill, /set-cell-text/, "SKILL.md must reference set-cell-text for cell content workflow");
  assert.match(skill, /non-overlapping|개행|문단 경계/, "SKILL.md must document replace-all edge cases");
  assert.match(
    skill,
    /UTF-?16|U\+0130|İ|case[ -]?fold/i,
    "SKILL.md must disclose the case-insensitive UTF-16 length-drift guard (Unicode follow-up)"
  );
});

test("rhwp-advanced skill pins the upstream rhwp Rust CLI debug/dump/convert surface", () => {
  const skill = read(skillRel("rhwp-advanced", "SKILL.md"));

  assert.match(skill, /^---\nname: rhwp-advanced\n/);
  assert.match(skill, /cargo install rhwp/);
  assert.match(skill, /export-svg/);
  assert.match(skill, /--debug-overlay/);
  assert.match(skill, /\brhwp dump\b/);
  assert.match(skill, /dump-pages/);
  assert.match(skill, /ir-diff/);
  assert.match(skill, /thumbnail/);
  assert.match(skill, /\brhwp convert\b/);
  assert.match(skill, /편집 서브커맨드[가는]? (없다|부재|제공하지 않는다|않는다)/);
  assert.match(skill, /rhwp-edit/);
});

test("rhwp feature docs, README, install, roadmap, and sources are wired for the new skills", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const roadmap = read(path.join("docs", "roadmap.md"));
  const sources = read(path.join("docs", "sources.md"));
  const editDoc = read(path.join("docs", "features", "rhwp-edit.md"));
  const advancedDoc = read(path.join("docs", "features", "rhwp-advanced.md"));

  assert.match(readme, /\| HWP 문서 편집 \|/);
  assert.match(readme, /\| HWP 레이아웃·IR 디버깅 \|/);
  assert.match(readme, /\[HWP 문서 편집\]\(docs\/features\/rhwp-edit\.md\)/);
  assert.match(readme, /\[HWP 레이아웃·IR 디버깅\]\(docs\/features\/rhwp-advanced\.md\)/);

  assert.match(install, /--skill rhwp-edit/);
  assert.match(install, /--skill rhwp-advanced/);

  assert.match(roadmap, /rhwp-edit/);
  assert.match(roadmap, /rhwp-advanced/);
  assert.match(roadmap, /#155/);

  assert.match(sources, /edwardkim\/rhwp/);
  assert.match(sources, /@rhwp\/core/);
  assert.match(sources, /issues\/196/);

  assert.match(editDoc, /k-skill-rhwp/);
  assert.match(editDoc, /insert-text/);
  assert.match(editDoc, /create-table/);
  assert.match(editDoc, /#196/);
  assert.match(
    editDoc,
    /본문\S* 문단만|본문 \(body\) 문단만|body paragraphs only/,
    "rhwp-edit feature doc must disclose search/replace-all body-only scope"
  );
  assert.match(
    editDoc,
    /UTF-?16|U\+0130|İ|case[ -]?fold/i,
    "rhwp-edit feature doc must disclose the case-insensitive UTF-16 length-drift guard (Unicode follow-up)"
  );

  assert.match(advancedDoc, /cargo install rhwp/);
  assert.match(advancedDoc, /export-svg/);
  assert.match(advancedDoc, /ir-diff/);
  assert.match(advancedDoc, /편집/);
});

test("k-skill-rhwp package ships CLI bin, WASM-init shim, and minor semver changeset", () => {
  const packagePath = path.join(repoRoot, "packages", "k-skill-rhwp", "package.json");
  assert.ok(fs.existsSync(packagePath), "expected packages/k-skill-rhwp/package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  assert.equal(pkg.name, "k-skill-rhwp");
  assert.ok(pkg.bin && pkg.bin["k-skill-rhwp"] === "bin/k-skill-rhwp.js", "expected bin mapping");
  assert.ok(pkg.dependencies && pkg.dependencies["@rhwp/core"], "expected @rhwp/core dependency");
  assert.ok(pkg.engines && /\^|>=\s*1[89]/.test(pkg.engines.node || ""), "expected Node 18+");
  assert.ok(
    fs.existsSync(path.join(repoRoot, "packages", "k-skill-rhwp", "src", "wasm-init.js")),
    "expected src/wasm-init.js"
  );
  assert.ok(
    fs.existsSync(path.join(repoRoot, "packages", "k-skill-rhwp", "bin", "k-skill-rhwp.js")),
    "expected bin/k-skill-rhwp.js"
  );

});

const README_SKILL_NAME_COLUMN_MAPPING = [
  ["SRT 예매", "srt-booking"],
  ["KTX 예매", "ktx-booking"],
  ["카카오톡 Mac CLI", "kakaotalk-mac"],
  ["서울 지하철 도착정보 조회", "seoul-subway-arrival"],
  ["지하철 분실물 조회", "subway-lost-property"],
  ["긱뉴스 조회", "geeknews-search"],
  ["한국 날씨 조회", "korea-weather"],
  ["사용자 위치 미세먼지 조회", "fine-dust-location"],
  ["한강 수위 정보 조회", "han-river-water-level"],
  ["한국 법령 검색", "korean-law-search"],
  ["법인등기 신청 컨설팅", "corporate-registration-consulting"],
  ["한국 개인정보처리방침·이용약관 자동 생성", "korean-privacy-terms"],
  ["한국 부동산 실거래가 조회", "real-estate-search"],
  ["LH 청약 공고문 조회", "lh-notice-search"],
  ["장학금 검색 및 조회", "korean-scholarship-search"],
  ["생활쓰레기 배출정보 조회", "household-waste-info"],
  ["학교 급식 식단 조회", "k-schoollunch-menu"],
  ["도서관 도서 조회", "library-book-search"],
  ["의약품 안전 체크", "mfds-drug-safety"],
  ["식품 안전 체크", "mfds-food-safety"],
  ["한국 주식 정보 조회", "korean-stock-search"],
  ["금감원 DART 전자공시 조회", "k-dart"],
  ["조선왕조실록 검색", "joseon-sillok-search"],
  ["한국 특허 정보 검색", "korean-patent-search"],
  ["근처 가장 싼 주유소 찾기", "cheap-gas-nearby"],
  ["근처 공중화장실 찾기", "public-restroom-nearby"],
  ["근처 공영주차장 찾기", "parking-lot-search"],
  ["KBO 경기 결과 조회", "kbo-results"],
  ["KBL 경기 결과 조회", "kbl-results"],
  ["K리그 경기 결과 조회", "kleague-results"],
  ["LCK 경기 분석", "lck-analytics"],
  ["토스증권 조회", "toss-securities"],
  ["하이패스 영수증 발급", "hipass-receipt"],
  ["캐치테이블 예약 스나이핑", "catchtable-sniper"],
  ["로또 당첨 확인", "lotto-results"],
  ["HWP 문서 조회/변환", "hwp"],
  ["HWP 문서 편집", "rhwp-edit"],
  ["HWP 레이아웃·IR 디버깅", "rhwp-advanced"],
  ["근처 술집 조회", "kakao-bar-nearby"],
  ["우편번호 검색", "zipcode-search"],
  ["다이소 상품 조회", "daiso-product-search"],
  ["마켓컬리 상품 조회", "market-kurly-search"],
  ["올리브영 검색", "olive-young-search"],
  ["올라포케 역삼 포케", "hola-poke-yeoksam"],
  ["택배 배송조회", "delivery-tracking"],
  ["쿠팡 상품 검색", "coupang-product-search"],
  ["번개장터 검색", "bunjang-search"],
  ["중고차 가격 조회", "used-car-price-search"],
  ["한국어 맞춤법 검사", "korean-spell-check"],
  ["네이버 블로그 리서치", "naver-blog-research"],
  ["네이버 쇼핑 가격비교", "naver-shopping-search"],
  ["네이버 뉴스 검색", "naver-news-search"],
  ["한국어 글자 수 세기", "korean-character-count"],
  ["한국어 유행어 글쓰기", "korean-slang-writing"],
  ["K-스킬 클리너", "k-skill-cleaner"],
];

test("README skill table header advertises the new 스킬 이름 column (issue #165)", () => {
  const readme = read("README.md");

  assert.match(
    readme,
    /\| 할 수 있는 일 \| 스킬 이름 \| 설명 \| 사용자 로그인 \| 문서 \|\n\| --- \| --- \| --- \| --- \| --- \|/,
    "expected the 어떤 걸 할 수 있나 table header to include 스킬 이름 between 할 수 있는 일 and 설명 with a 5-column separator",
  );
});

test("README skill table includes inline-code skill names for every documented row (issue #165)", () => {
  const readme = read("README.md");

  assert.ok(
    README_SKILL_NAME_COLUMN_MAPPING.some(([, skillName]) => skillName === "k-skill-cleaner"),
    "expected k-skill-cleaner to be covered by the central README skill-name mapping fixture",
  );

  for (const [label, skillName] of README_SKILL_NAME_COLUMN_MAPPING) {
    const escapedLabel = escapeRegex(label);
    const escapedName = escapeRegex(skillName);

    assert.match(
      readme,
      new RegExp(`\\| ${escapedLabel} \\| \`${escapedName}\` \\|`),
      `expected README row "${label}" to surface skill name \`${skillName}\` as the second column`,
    );
  }
});

test("README skill table strikes through the deprecated blue-ribbon-nearby skill name (issue #165)", () => {
  const readme = read("README.md");

  assert.match(
    readme,
    /\| ~~근처 블루리본 맛집~~ ⚠️ 지원 중단 \| ~~`blue-ribbon-nearby`~~ \|/,
    "expected the deprecated blue-ribbon-nearby row to keep the strikethrough on its skill-name cell as well",
  );
});

test("README skill table skill-name column entries match real on-disk skill directories (issue #165)", () => {
  const allEntries = [
    ...README_SKILL_NAME_COLUMN_MAPPING.map(([, skillName]) => skillName),
    "blue-ribbon-nearby",
  ];

  for (const skillName of allEntries) {
    const skillFile = skillAbs(skillName, "SKILL.md");

    assert.ok(
      fs.existsSync(skillFile),
      `expected ${skillName}/SKILL.md to exist on disk so the README table never advertises a non-existent skill identifier`,
    );

    const frontmatterMatch = read(skillRel(skillName, "SKILL.md")).match(/^name:\s*(\S+)\s*$/m);

    assert.ok(frontmatterMatch, `expected ${skillName}/SKILL.md to declare a name in frontmatter`);
    assert.equal(
      frontmatterMatch[1].replace(/^"|"$/g, ""),
      skillName,
      `expected ${skillName}/SKILL.md frontmatter name to match the directory name (validate-skills.sh invariant)`,
    );
  }
});

test("repository docs advertise the k-skill-cleaner skill and agent usage sources", () => {
  const readme = read("README.md");
  const install = read(path.join("docs", "install.md"));
  const featureDocPath = path.join(repoRoot, "docs", "features", "k-skill-cleaner.md");
  const skillPath = skillAbs("k-skill-cleaner", "SKILL.md");
  const skillLocalHelperPath = skillAbs("k-skill-cleaner", "scripts", "k_skill_cleaner.py");

  assert.ok(fs.existsSync(skillPath), "expected skills/k-skill-cleaner/SKILL.md to exist");
  assert.ok(fs.existsSync(skillLocalHelperPath), "expected k-skill-cleaner/scripts/k_skill_cleaner.py to be included in standalone skill installs");
  assert.ok(fs.existsSync(featureDocPath), "expected docs/features/k-skill-cleaner.md to exist");

  const skill = read(skillRel("k-skill-cleaner", "SKILL.md"));
  const featureDoc = read(path.join("docs", "features", "k-skill-cleaner.md"));

  assert.match(skill, /^name: k-skill-cleaner$/m);
  assert.match(skill, /Claude Code/);
  assert.match(skill, /Codex/);
  assert.match(skill, /OpenCode/);
  assert.match(skill, /OpenClaw\/ClawHub/);
  assert.match(skill, /Hermes Agent/);
  assert.match(skill, /python3 scripts\/k_skill_cleaner\.py/);
  assert.match(skill, /--days 90/);
  assert.match(featureDoc, /k-skill-cleaner\/scripts\/k_skill_cleaner\.py/);
  assert.match(featureDoc, /--days 90/);
  assert.match(featureDoc, /인터뷰/);
  assert.match(featureDoc, /트리거 횟수/);
  assert.match(readme, /\| K-스킬 클리너 \| `k-skill-cleaner` \|/);
  assert.match(readme, /\[K-스킬 클리너 가이드\]\(docs\/features\/k-skill-cleaner\.md\)/);
  assert.match(install, /--skill k-skill-cleaner/);
});
