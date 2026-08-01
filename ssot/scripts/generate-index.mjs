import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ssotRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryNames = ["skills", "packages", "apis", "crawlers", "datasets", "products", "legacy"];
const outputPath = path.join(ssotRoot, "INDEX.md");
const checkOnly = process.argv.includes("--check");

const escapeCell = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
const displayPath = (item) => {
  const value = escapeCell(item.canonicalPath);
  if (item.tracking === "git") return `[\`${value}\`](../${value})`;
  return `\`${value}\``;
};

const registries = [];
for (const name of registryNames) {
  const registry = JSON.parse(await readFile(path.join(ssotRoot, "registry", `${name}.json`), "utf8"));
  registries.push({ name, items: [...registry.items].sort((a, b) => a.id.localeCompare(b.id)) });
}

const total = registries.reduce((sum, registry) => sum + registry.items.length, 0);
const lines = [
  "<!-- GENERATED FILE: run `npm run ssot:generate`; do not edit by hand. -->",
  "# K-Parent SSOT index",
  "",
  `This index contains **${total} artifacts** from the machine-readable registries in [\`ssot/registry/\`](registry/).`,
  "Maturity, verification, and deployment are independent status axes.",
  "",
  "| Registry | Artifacts |",
  "| --- | ---: |",
  ...registries.map(({ name, items }) => `| [${name}](registry/${name}.json) | ${items.length} |`),
  "",
];

for (const { name, items } of registries) {
  lines.push(
    `## ${name}`,
    "",
    "| ID | Name | Maturity | Verification | Deployment | Canonical path |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  for (const item of items) {
    lines.push(
      `| \`${escapeCell(item.id)}\` | ${escapeCell(item.name)} | \`${item.maturity}\` | \`${item.verification}\` | \`${item.deployment}\` | ${displayPath(item)} |`,
    );
  }
  lines.push("");
}

const next = `${lines.join("\n").trimEnd()}\n`;

if (checkOnly) {
  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch {
    console.error("ssot/INDEX.md is missing; run `npm run ssot:generate`.");
    process.exit(1);
  }

  if (current !== next) {
    console.error("ssot/INDEX.md is stale; run `npm run ssot:generate`.");
    process.exit(1);
  }
  console.log("SSOT generated index is current.");
} else {
  await writeFile(outputPath, next);
  console.log(`Generated ${path.relative(process.cwd(), outputPath)}.`);
}
