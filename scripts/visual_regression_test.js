const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.join(ROOT, "apps", "web");
const BASELINE_DIR = path.join(ROOT, "artifacts", "visual-regression", "baseline");
const CURRENT_DIR = path.join(ROOT, "artifacts", "visual-regression", "current");

const SCENARIOS = [
  {
    name: "01-onboarding-desktop",
    viewport: { width: 1440, height: 1000, mobile: false },
    prepare: async () => {},
    ready: "Boolean(document.querySelector('#personaGate')) && !document.querySelector('#personaGate')?.hidden",
  },
  {
    name: "02-workbench-candidate-desktop",
    viewport: { width: 1440, height: 1000, mobile: false },
    prepare: async (client) => {
      await click(client, "[data-persona-choice='candidate']");
      await waitForExpression(client, "!document.querySelector('#configView')?.hidden");
      await click(client, "#mockBtn");
    },
    ready: "document.querySelector('#resume')?.value.length > 20 && document.querySelector('#jobDescription')?.value.length > 20",
  },
  {
    name: "03-graph-desktop",
    viewport: { width: 1440, height: 1100, mobile: false },
    prepare: async (client) => {
      await click(client, "[data-persona-choice='candidate']");
      await waitForExpression(client, "!document.querySelector('#configView')?.hidden");
      await click(client, "#mockBtn");
      await click(client, "#generateBtn");
      await waitForExpression(client, "document.querySelectorAll('.graph-node').length > 3", 15000);
      await click(client, "[data-result-view='graph']");
    },
    ready: "document.body.classList.contains('view-graph') && document.querySelectorAll('.graph-node').length > 3",
  },
  {
    name: "04-panel-desktop",
    viewport: { width: 1440, height: 1100, mobile: false },
    prepare: async (client) => {
      await click(client, "[data-persona-choice='interviewer']");
      await waitForExpression(client, "!document.querySelector('#configView')?.hidden");
      await click(client, "#mockBtn");
      await click(client, "#generateBtn");
      await waitForExpression(client, "document.querySelectorAll('.graph-node').length > 3", 15000);
      await click(client, "[data-result-view='panel']");
      await waitForExpression(client, "document.querySelectorAll('.chat-bubble').length >= 2", 15000);
    },
    ready: "document.body.dataset.resultView === 'panel' && document.querySelectorAll('.chat-bubble').length >= 2",
  },
  {
    name: "05-summary-desktop",
    viewport: { width: 1440, height: 1100, mobile: false },
    prepare: async (client) => {
      await click(client, "[data-persona-choice='interviewer']");
      await waitForExpression(client, "!document.querySelector('#configView')?.hidden");
      await click(client, "#mockBtn");
      await click(client, "#generateBtn");
      await waitForExpression(client, "document.querySelector('#decisionSummary')?.innerText.length > 80", 15000);
      await click(client, "[data-result-view='summary']");
    },
    ready: "document.body.dataset.resultView === 'summary' && document.querySelector('#decisionSummary')?.innerText.length > 80",
  },
  {
    name: "06-graph-mobile",
    viewport: { width: 390, height: 1100, mobile: true },
    prepare: async (client) => {
      await click(client, "[data-persona-choice='candidate']");
      await waitForExpression(client, "!document.querySelector('#configView')?.hidden");
      await click(client, "#mockBtn");
      await click(client, "#generateBtn");
      await waitForExpression(client, "document.querySelectorAll('.graph-node').length > 3", 15000);
      await click(client, "[data-result-view='graph']");
    },
    ready: "document.querySelectorAll('.graph-node').length > 3 && document.querySelector('.graph-search-input')",
  },
];

function findBrowserExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    process.env.EDGE_BIN,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ].filter(Boolean);
  const browserPath = candidates.find((item) => fs.existsSync(item));
  if (!browserPath) {
    throw new Error("Chrome or Edge was not found. Set CHROME_BIN or EDGE_BIN to run visual regression.");
  }
  return browserPath;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml; charset=utf-8",
  }[ext] || "application/octet-stream";
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const relativePath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = path.resolve(WEB_ROOT, `.${relativePath}`);
    if (!filePath.startsWith(WEB_ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": "no-store",
      });
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        origin: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForProcessExit(process, timeoutMs = 5000) {
  if (!process || process.exitCode !== null) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, timeoutMs);
    process.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function removeDirectoryWithRetry(directory) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 120,
      });
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 120);
    }
  }
}

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status} from ${url}`);
    } catch (error) {
      lastError = error;
    }
    await wait(120);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    if (typeof WebSocket !== "function") {
      throw new Error("This Node.js runtime does not expose a global WebSocket client.");
    }
    this.ws = new WebSocket(this.wsUrl);
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) {
        pending.reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
      } else {
        pending.resolve(message.result || {});
      }
    });
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch (_) {
      // Ignore cleanup errors from already-closed browser targets.
    }
  }
}

async function createPage(debugPort, url) {
  let target;
  const encodedUrl = encodeURIComponent(url);
  for (const method of ["PUT", "GET"]) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?${encodedUrl}`, { method });
    if (response.ok) {
      target = await response.json();
      break;
    }
  }
  if (!target?.webSocketDebuggerUrl) {
    const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json/list`);
    target = targets.find((item) => item.type === "page");
  }
  if (!target?.webSocketDebuggerUrl) throw new Error("Could not create a browser page target.");

  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.connect();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-reduced-motion", value: "reduce" },
      { name: "prefers-color-scheme", value: "light" },
    ],
  });
  await client.send("Page.navigate", { url });
  return client;
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result?.value;
}

async function waitForExpression(client, expression, timeoutMs = 10000) {
  const started = Date.now();
  let lastValue = null;
  while (Date.now() - started < timeoutMs) {
    lastValue = await evaluate(client, `Boolean(${expression})`);
    if (lastValue) return;
    await wait(120);
  }
  throw new Error(`Timed out waiting for expression: ${expression}; last=${lastValue}`);
}

async function click(client, selector) {
  const clicked = await evaluate(client, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.click();
    return true;
  })()`);
  assert.equal(clicked, true, `Expected ${selector} to exist and be clickable`);
}

async function setViewport(client, viewport) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: Boolean(viewport.mobile),
  });
}

async function stabilizePage(client) {
  await evaluate(client, `(() => {
    let style = document.querySelector('#visual-regression-freeze');
    if (!style) {
      style = document.createElement('style');
      style.id = 'visual-regression-freeze';
      style.textContent = [
        '*, *::before, *::after {',
        '  animation-duration: 0s !important;',
        '  animation-delay: 0s !important;',
        '  transition-duration: 0s !important;',
        '  transition-delay: 0s !important;',
        '  caret-color: transparent !important;',
        '}',
        'html { scroll-behavior: auto !important; }',
      ].join('\\n');
      document.head.appendChild(style);
    }
    window.scrollTo(0, 0);
    return true;
  })()`);
  await wait(200);
}

async function captureScenario(browserPath, debugPort, origin, scenario) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "offeragent-visual-"));
  const browser = spawn(browserPath, [
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "about:blank",
  ], { stdio: "ignore" });

  let client;
  try {
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    client = await createPage(debugPort, `${origin}/`);
    await setViewport(client, scenario.viewport);
    await waitForExpression(client, "document.readyState === 'complete' && Boolean(document.querySelector('#mockBtn'))");
    await stabilizePage(client);
    await scenario.prepare(client);
    await waitForExpression(client, scenario.ready, 15000);
    await stabilizePage(client);
    const screenshot = await client.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      fromSurface: true,
    });
    const image = Buffer.from(screenshot.data || "", "base64");
    assert.ok(image.length > 1000, `${scenario.name} screenshot should not be blank`);
    return image;
  } finally {
    client?.close();
    await wait(120);
    try {
      browser.kill();
    } catch (_) {
      // Ignore cleanup errors.
    }
    await waitForProcessExit(browser);
    removeDirectoryWithRetry(userDataDir);
  }
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function writeReport(results) {
  const reportPath = path.join(CURRENT_DIR, "visual-regression-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
}

async function main() {
  fs.mkdirSync(CURRENT_DIR, { recursive: true });
  const { server, origin } = await startStaticServer();
  const browserPath = findBrowserExecutable();
  const results = [];

  try {
    for (const scenario of SCENARIOS) {
      const debugPort = await getFreePort();
      const image = await captureScenario(browserPath, debugPort, origin, scenario);
      const currentPath = path.join(CURRENT_DIR, `${scenario.name}.png`);
      fs.writeFileSync(currentPath, image);

      const baselinePath = path.join(BASELINE_DIR, `${scenario.name}.png`);
      const currentHash = hashBuffer(image);
      const hasBaseline = fs.existsSync(baselinePath);
      const baselineHash = hasBaseline ? hashBuffer(fs.readFileSync(baselinePath)) : "";
      const matched = !hasBaseline || currentHash === baselineHash;

      results.push({
        name: scenario.name,
        current: path.relative(ROOT, currentPath).replace(/\\/g, "/"),
        baseline: hasBaseline ? path.relative(ROOT, baselinePath).replace(/\\/g, "/") : null,
        current_hash: currentHash,
        baseline_hash: baselineHash || null,
        matched,
      });
    }
  } finally {
    server.close();
  }

  writeReport(results);
  const mismatches = results.filter((item) => !item.matched);
  if (mismatches.length) {
    console.error(JSON.stringify({ mismatches }, null, 2));
    throw new Error(`${mismatches.length} visual regression screenshot(s) differ from baseline.`);
  }

  const baselineCount = results.filter((item) => item.baseline).length;
  console.log(`visual regression screenshots captured: ${results.length}; baselines compared: ${baselineCount}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
