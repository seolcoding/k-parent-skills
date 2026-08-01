import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ssotRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(ssotRoot, "..");
const registryNames = [
  "skills",
  "packages",
  "apis",
  "crawlers",
  "datasets",
  "products",
  "legacy",
];

const requiredFields = [
  "id",
  "name",
  "kind",
  "maturity",
  "verification",
  "deployment",
  "availability",
  "canonicalPath",
  "tracking",
  "lastVerified",
  "sensitivity",
];

const enums = {
  kind: new Set(["skill", "package", "api", "crawler", "dataset", "product", "tool", "archive", "research"]),
  maturity: new Set(["concept", "research", "prototype", "implemented", "operational", "archived", "historical"]),
  verification: new Set(["undocumented", "documented", "fixture-tested", "offline-tested", "live-probed", "production-verified"]),
  deployment: new Set(["not-applicable", "repo-only", "local-only", "not-deployed", "deployment-unverified", "deployed", "archived"]),
  availability: new Set(["current", "archived", "historical-evidence", "remote-pointer"]),
  tracking: new Set(["git", "ignored", "external", "git-history"]),
  sensitivity: new Set(["public", "synthetic", "internal", "personal-pointer", "restricted"]),
};

const referenceArrays = ["backingPackages", "products", "crawlers", "apis", "skills", "datasets", "dependsOn", "related"];
const referenceScalars = ["duplicateOf", "supersedes", "report"];
const idPattern = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const registries = [];

for (const registryName of registryNames) {
  const registryPath = path.join(ssotRoot, "registry", `${registryName}.json`);
  let parsed;

  try {
    parsed = JSON.parse(await readFile(registryPath, "utf8"));
  } catch (error) {
    errors.push(`${registryName}: cannot parse registry: ${error.message}`);
    continue;
  }

  if (parsed.schemaVersion !== 1) {
    errors.push(`${registryName}: schemaVersion must be 1`);
  }
  if (parsed.registry !== registryName) {
    errors.push(`${registryName}: registry field must match the filename`);
  }
  if (!Array.isArray(parsed.items)) {
    errors.push(`${registryName}: items must be an array`);
    continue;
  }

  registries.push({ name: registryName, items: parsed.items });
}

const allItems = registries.flatMap(({ items }) => items);
const ids = new Set();

for (const { name: registryName, items } of registries) {
  for (const [index, item] of items.entries()) {
    const label = item?.id ?? `${registryName}[${index}]`;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${label}: item must be an object`);
      continue;
    }

    for (const field of requiredFields) {
      if (!(field in item) || item[field] === "") {
        errors.push(`${label}: missing required field ${field}`);
      }
    }

    if (typeof item.id !== "string" || !idPattern.test(item.id)) {
      errors.push(`${label}: invalid id`);
    } else {
      if (!item.id.startsWith(`${registryName}.`)) {
        errors.push(`${label}: id must start with ${registryName}.`);
      }
      if (ids.has(item.id)) {
        errors.push(`${label}: duplicate id`);
      }
      ids.add(item.id);
    }

    for (const [field, allowed] of Object.entries(enums)) {
      if (!allowed.has(item[field])) {
        errors.push(`${label}: invalid ${field} value ${JSON.stringify(item[field])}`);
      }
    }

    if (typeof item.lastVerified !== "string" || !datePattern.test(item.lastVerified) || Number.isNaN(Date.parse(`${item.lastVerified}T00:00:00Z`))) {
      errors.push(`${label}: lastVerified must be a valid YYYY-MM-DD date`);
    }

    if (item.deployment === "deployed" && !item.productionEvidence) {
      errors.push(`${label}: deployed items require productionEvidence`);
    }

    if (item.tracking === "git") {
      if (path.isAbsolute(item.canonicalPath)) {
        errors.push(`${label}: git-tracked canonicalPath must be repository-relative`);
      } else {
        try {
          await access(path.join(repoRoot, item.canonicalPath));
        } catch {
          errors.push(`${label}: git-tracked canonicalPath does not exist: ${item.canonicalPath}`);
        }
      }
    }

    if (item.tracking === "external" && !path.isAbsolute(item.canonicalPath) && !/^https:\/\//.test(item.canonicalPath)) {
      errors.push(`${label}: external canonicalPath must be absolute or HTTPS`);
    }

    for (const field of referenceArrays) {
      if (field in item && (!Array.isArray(item[field]) || item[field].some((value) => typeof value !== "string"))) {
        errors.push(`${label}: ${field} must be an array of IDs`);
      }
    }
    for (const field of referenceScalars) {
      if (field in item && typeof item[field] !== "string") {
        errors.push(`${label}: ${field} must be an ID string`);
      }
    }
  }
}

for (const item of allItems) {
  for (const field of referenceArrays) {
    if (!Array.isArray(item[field])) continue;
    for (const referencedId of item[field]) {
      if (!ids.has(referencedId)) {
        errors.push(`${item.id}: ${field} references unknown ID ${referencedId}`);
      }
    }
  }
  for (const field of referenceScalars) {
    if (typeof item[field] === "string" && !ids.has(item[field])) {
      errors.push(`${item.id}: ${field} references unknown ID ${item[field]}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`SSOT validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`SSOT validation passed: ${allItems.length} artifacts across ${registries.length} registries.`);
