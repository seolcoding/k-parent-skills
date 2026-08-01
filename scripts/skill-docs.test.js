const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.join(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function directories(relativePath, predicate = () => true) {
  return fs
    .readdirSync(path.join(repoRoot, relativePath), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && predicate(entry.name))
    .map((entry) => entry.name)
    .sort();
}

test("repository is scoped to K-Parent products", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "examples")), false);

  const packageNames = directories("packages");
  const unexpected = packageNames.filter((name) => !name.startsWith("k-parent-"));
  assert.deepEqual(unexpected, []);

  const skillNames = directories("skills");
  assert.ok(skillNames.length >= 18);
  assert.ok(skillNames.every((name) => name.startsWith("k-parent-")));
});

test("README and feature docs cover every product skill", () => {
  const readme = read("README.md");
  const skillNames = directories("skills", (name) => name.startsWith("k-parent-"));

  for (const skillName of skillNames) {
    assert.match(readme, new RegExp(`\\b${skillName}\\b`), `${skillName} missing from README`);
    if (skillName === "k-parent-setup") continue;
    assert.ok(
      fs.existsSync(path.join(repoRoot, "docs", "features", `${skillName}.md`)),
      `docs/features/${skillName}.md is missing`,
    );
  }

  assert.doesNotMatch(readme, /<owner\/repo>/);
  assert.doesNotMatch(readme, /examples\//);
  assert.match(readme, /seolcoding\/k-parent-skills/);
});

test("skill and package registries match current canonical directories", () => {
  const registeredSkills = readJson("ssot/registry/skills.json").items.map((item) => item.name).sort();
  const diskSkills = directories("skills", (name) => name.startsWith("k-parent-"));
  assert.deepEqual(registeredSkills, diskSkills);

  const registeredPackages = readJson("ssot/registry/packages.json").items.map((item) => item.name).sort();
  const diskPackages = directories("packages", (name) => name.startsWith("k-parent-"));
  assert.deepEqual(registeredPackages, diskPackages);
});

test("root package scripts enforce the SSOT and parent-only gates", () => {
  const pkg = readJson("package.json");
  assert.equal(pkg.name, "k-parent-skills");
  assert.match(pkg.scripts.ci, /npm run ssot:check/);
  assert.match(pkg.scripts.test, /scripts\/skill-docs\.test\.js/);
  assert.match(pkg.scripts.test, /npm run test --workspaces/);
  assert.match(pkg.scripts["pack:dry-run"], /--workspaces/);
  assert.doesNotMatch(JSON.stringify(pkg.scripts), /examples\//);
});

test("security docs define parent credentials without secret values", () => {
  const setup = read("docs/setup.md");
  const security = read("docs/security-and-secrets.md");
  const envExample = read(".env.example");

  for (const key of [
    "KEDU_INFO_KEY",
    "SCHOOLINFO_API_KEY",
    "CHILDSCHOOLINFO_API_KEY",
    "KSKILL_DATAGOKR_KEY",
    "KSKILL_TOURAPI_KEY",
    "KSKILL_YOUTUBE_KEY",
  ]) {
    assert.match(`${setup}\n${security}\n${envExample}`, new RegExp(`\\b${key}\\b`));
  }

  assert.doesNotMatch(`${setup}\n${security}`, /KSKILL_SRT_ID|KSKILL_KTX_ID|LAW_OC/);
  assert.match(security, /0600/);
  assert.match(security, /private family conversations|가족 대화/);
});

test("generated SSOT index is declared non-authoritative", () => {
  const index = read("ssot/INDEX.md");
  const ssotReadme = read("ssot/README.md");
  assert.match(index, /GENERATED FILE/);
  assert.match(ssotReadme, /must not be edited by hand/);
  assert.match(ssotReadme, /raw personal conversations/);
});
