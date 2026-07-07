#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const DEFAULT_QUEUE_FILE = "tmp/data_portal_k_parent_api_specs.json";
const DEFAULT_REASON = "k-parent-agent 스킬 만들기";
const DEFAULT_CHROME_ROOT = path.join(os.homedir(), "Library/Application Support/Google/Chrome");
const DEFAULT_CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const RESULT_FILE = "tmp/data_portal_headless_apply_results.json";

const CACHE_DIR_NAMES = new Set([
  "Cache",
  "Code Cache",
  "Crashpad",
  "DawnCache",
  "GPUCache",
  "GrShaderCache",
  "ShaderCache",
  "Safe Browsing",
  "BrowserMetrics",
  "component_crx_cache",
  "optimization_guide_prediction_model_downloads",
]);

const LOCK_FILE_NAMES = new Set([
  "SingletonCookie",
  "SingletonLock",
  "SingletonSocket",
]);

function parseArgs(argv) {
  const args = {
    chromeRoot: DEFAULT_CHROME_ROOT,
    executablePath: fs.existsSync(DEFAULT_CHROME_EXECUTABLE) ? DEFAULT_CHROME_EXECUTABLE : undefined,
    headless: true,
    limit: 1,
    loginTimeoutMs: 300000,
    pauseOnLogin: false,
    queueFile: DEFAULT_QUEUE_FILE,
    reason: DEFAULT_REASON,
    submit: false,
    timeoutMs: 20000,
    useLiveProfile: false,
    userDataDir: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index];
    if (arg === "--chrome-root") args.chromeRoot = next();
    else if (arg === "--executable-path") args.executablePath = next();
    else if (arg === "--headed") args.headless = false;
    else if (arg === "--headless") args.headless = true;
    else if (arg === "--ids") args.ids = next().split(",").map((id) => id.trim()).filter(Boolean);
    else if (arg === "--limit") args.limit = Number(next());
    else if (arg === "--login-timeout-ms") args.loginTimeoutMs = Number(next());
    else if (arg === "--pause-on-login") args.pauseOnLogin = true;
    else if (arg === "--profile-directory") args.profileDirectory = next();
    else if (arg === "--profile-name") args.profileName = next();
    else if (arg === "--queue-file") args.queueFile = next();
    else if (arg === "--reason") args.reason = next();
    else if (arg === "--submit") args.submit = true;
    else if (arg === "--timeout-ms") args.timeoutMs = Number(next());
    else if (arg === "--use-live-profile") args.useLiveProfile = true;
    else if (arg === "--user-data-dir") args.userDataDir = next();
    else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) {
    throw new Error("--limit must be a positive number.");
  }
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/data_portal_apply_headless.mjs --profile-name "내 Chrome" --limit 1
  node scripts/data_portal_apply_headless.mjs --profile-directory "Profile 1" --ids 15125097 --submit

Options:
  --profile-name <name>          Chrome profile display name substring.
  --profile-directory <dir>      Chrome profile directory, e.g. "Default" or "Profile 1".
  --submit                       Actually press data.go.kr 활용신청. Omitted means probe only.
  --ids <id,id>                  Restrict to API ids.
  --limit <n>                    Maximum APIs to process. Default: 1.
  --pause-on-login               In headed mode, wait for you to log in before processing targets.
  --login-timeout-ms <ms>        Login wait timeout for --pause-on-login. Default: 300000.
  --headed                       Show the cloned browser while debugging.
  --user-data-dir <dir>          Reuse a persistent automation profile. Created from the source profile if missing.
  --use-live-profile             Use the real profile directory directly. Usually unsafe while Chrome is open.
`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listProfiles(chromeRoot) {
  return fs.readdirSync(chromeRoot)
    .map((directory) => {
      const preferencesPath = path.join(chromeRoot, directory, "Preferences");
      if (!fs.existsSync(preferencesPath)) return null;
      try {
        const preferences = readJson(preferencesPath);
        return {
          directory,
          name: preferences.profile?.name || directory,
          email: preferences.account_info?.[0]?.email || null,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function chooseProfile(args) {
  const profiles = listProfiles(args.chromeRoot);
  if (!profiles.length) {
    throw new Error(`No Chrome profiles found under ${args.chromeRoot}`);
  }
  if (args.profileDirectory) {
    const profile = profiles.find((item) => item.directory === args.profileDirectory);
    if (!profile) throw new Error(`Chrome profile directory not found: ${args.profileDirectory}`);
    return profile;
  }
  if (args.profileName) {
    const profile = profiles.find((item) => item.name.includes(args.profileName));
    if (!profile) throw new Error(`Chrome profile name not found: ${args.profileName}`);
    return profile;
  }
  if (profiles.length === 1) return profiles[0];
  throw new Error(`Choose a Chrome profile with --profile-name or --profile-directory. Found: ${
    profiles.map((item) => `${item.directory} (${item.name})`).join(", ")
  }`);
}

function shouldCopy(source) {
  const basename = path.basename(source);
  if (LOCK_FILE_NAMES.has(basename)) return false;
  if (CACHE_DIR_NAMES.has(basename)) return false;
  return true;
}

function copyProfileRoot(chromeRoot, profileDirectory) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "k-parent-data-go-kr-chrome-"));
  copyProfileRootInto(chromeRoot, profileDirectory, tmpRoot);
  return tmpRoot;
}

function copyProfileRootInto(chromeRoot, profileDirectory, targetRoot) {
  fs.mkdirSync(targetRoot, { recursive: true });
  const localState = path.join(chromeRoot, "Local State");
  if (fs.existsSync(localState)) {
    fs.copyFileSync(localState, path.join(targetRoot, "Local State"));
  }
  fs.cpSync(
    path.join(chromeRoot, profileDirectory),
    path.join(targetRoot, profileDirectory),
    {
      recursive: true,
      filter: shouldCopy,
    },
  );
}

function getTargets(args) {
  const matrix = readJson(args.queueFile);
  let items = (matrix.items || [])
    .filter((item) => item.action === "review_then_apply" || ["apply_next", "review_next"].includes(item.bucket))
    .filter((item) => item.applyButtonPresent !== false);

  if (args.ids?.length) {
    const wanted = new Set(args.ids.map(String));
    items = items.filter((item) => wanted.has(String(item.id)));
  }

  return items.slice(0, args.limit);
}

function formUrl(id) {
  return `https://www.data.go.kr/tcs/dss/redirectDevAcountRequestForm.do?publicDataPk=${encodeURIComponent(id)}&isBusinessApply=undefined`;
}

async function textIncludes(page, patterns) {
  const text = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  return patterns.some((pattern) => pattern.test(text));
}

async function probeLogin(page) {
  await page.goto("https://www.data.go.kr/iim/main/selectMyPage.do", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  const url = page.url();
  const body = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const title = await page.title().catch(() => "");
  return {
    url,
    loggedIn: !/에러/u.test(title) && /로그아웃/u.test(body) && !/login|sign/i.test(url),
    title,
  };
}

async function waitForManualLogin(page, args) {
  await page.goto("https://www.data.go.kr/uim/login/loginView.do", { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
  await page.waitForFunction(
    () => document.body?.innerText?.includes("로그아웃"),
    null,
    { timeout: args.loginTimeoutMs },
  );
}

async function applyTarget(page, target, args) {
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    const message = dialog.message();
    dialogs.push({ type: dialog.type(), message });
    await dialog.accept();
  });

  const result = {
    id: String(target.id),
    title: target.title,
    url: target.url,
    formUrl: formUrl(target.id),
    submitted: false,
    status: "unknown",
    dialogs,
  };

  await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  result.detailUrl = page.url();

  const applyLink = page.locator('a[onclick*="fn_goOpenAPIRequestForm"]').first();
  if (await applyLink.count()) {
    const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
    await applyLink.click({ timeout: args.timeoutMs });
    const popup = await popupPromise;
    if (popup) {
      page = popup;
      page.on("dialog", async (dialog) => {
        const message = dialog.message();
        dialogs.push({ type: dialog.type(), message });
        await dialog.accept();
      });
      await page.waitForLoadState("domcontentloaded", { timeout: args.timeoutMs }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    } else if (dialogs.some((dialog) => /로그인이 필요/u.test(dialog.message))) {
      result.status = "login_required";
      return result;
    } else {
      await page.goto(result.formUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    }
  } else {
    await page.goto(result.formUrl, { waitUntil: "domcontentloaded", timeout: args.timeoutMs });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  }

  result.loadedUrl = page.url();
  result.pageTitle = await page.title().catch(() => "");

  if (dialogs.some((dialog) => /로그인이 필요/u.test(dialog.message)) || await textIncludes(page, [/로그인\s*해주세요|로그인\s*후|로그인이 필요/u])) {
    result.status = "login_required";
    return result;
  }

  if (dialogs.some((dialog) => /이미 신청/u.test(dialog.message))) {
    result.status = "already_applied";
    return result;
  }

  const reason = page.locator("#prcusePurps");
  const hasReason = await reason.count();
  if (!hasReason) {
    const body = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
    result.status = /이미 신청/u.test(body) ? "already_applied" : "form_not_found";
    result.bodySample = body.replace(/\s+/gu, " ").slice(0, 300);
    return result;
  }

  await reason.click({ timeout: args.timeoutMs });
  await reason.fill("");
  await reason.type(args.reason, { delay: 5 });

  const agreement = page.locator("#useScopeAgreAt");
  if (await agreement.count()) {
    await agreement.check({ force: true, timeout: args.timeoutMs });
  }

  if (!args.submit) {
    result.status = "ready_to_submit";
    return result;
  }

  const submitButton = page.locator('button[onclick="fn_save()"], button:has-text("활용신청")').last();
  await submitButton.click({ timeout: args.timeoutMs });
  result.submitted = true;
  await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  if (dialogs.some((dialog) => /이미 신청/u.test(dialog.message))) {
    result.status = "already_applied";
  } else if (dialogs.some((dialog) => /신청|완료|등록/u.test(dialog.message))) {
    result.status = "submitted_or_confirmed";
  } else if (/selectAcountList|DevAcount/u.test(page.url())) {
    result.status = "submitted_or_confirmed";
  } else {
    result.status = "submitted_needs_review";
  }
  result.afterUrl = page.url();
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const profile = chooseProfile(args);
  let copiedProfile = false;
  let userDataDir = args.chromeRoot;
  if (args.userDataDir) {
    userDataDir = path.resolve(args.userDataDir);
    if (!fs.existsSync(path.join(userDataDir, profile.directory, "Preferences"))) {
      copyProfileRootInto(args.chromeRoot, profile.directory, userDataDir);
      copiedProfile = true;
    }
  } else if (!args.useLiveProfile) {
    userDataDir = copyProfileRoot(args.chromeRoot, profile.directory);
    copiedProfile = true;
  }
  const targets = getTargets(args);
  if (!targets.length) {
    throw new Error("No matching apply targets found.");
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    args: [`--profile-directory=${profile.directory}`],
    executablePath: args.executablePath,
    headless: args.headless,
    viewport: { width: 1440, height: 1000 },
  });

  const page = context.pages()[0] || await context.newPage();
  const startedAt = new Date().toISOString();
  const output = {
    startedAt,
    profile: { directory: profile.directory, name: profile.name, email: profile.email },
    copiedProfile,
    userDataDir,
    submit: args.submit,
    login: null,
    results: [],
  };

  try {
    output.login = await probeLogin(page);
    if (!output.login.loggedIn && args.pauseOnLogin) {
      await waitForManualLogin(page, args);
      output.login = await probeLogin(page);
    }
    for (const target of targets) {
      output.results.push(await applyTarget(page, target, args));
    }
  } finally {
    output.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(RESULT_FILE), { recursive: true });
    fs.writeFileSync(RESULT_FILE, JSON.stringify(output, null, 2));
    await context.close();
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
