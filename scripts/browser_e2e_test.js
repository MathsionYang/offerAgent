const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.join(ROOT, "apps", "web");

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
    throw new Error("Chrome or Edge was not found. Set CHROME_BIN or EDGE_BIN to run browser E2E tests.");
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

async function main() {
  const { server, origin } = await startStaticServer();
  const debugPort = await getFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "offeragent-browser-e2e-"));
  const browserPath = findBrowserExecutable();
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
    await waitForExpression(
      client,
      "document.readyState === 'complete' && Boolean(document.querySelector('#mockBtn'))",
    );

    const languageState = await evaluate(client, `(() => {
      const wrapper = document.querySelector('.language-switch');
      const select = document.querySelector('#language');
      return {
        documentLang: document.documentElement.lang,
        hidden: Boolean(wrapper?.hidden),
        display: wrapper ? getComputedStyle(wrapper).display : '',
        selectValue: select?.value || '',
        hasEnglishOption: Boolean(select?.querySelector('option[value="en"]')),
      };
    })()`);
    assert.equal(languageState.documentLang, "zh-CN");
    assert.equal(languageState.hidden, true);
    assert.equal(languageState.display, "none");
    assert.equal(languageState.selectValue, "zh");
    assert.equal(languageState.hasEnglishOption, true);

    const onboardingState = await evaluate(client, `(() => {
      const gate = document.querySelector('#personaGate');
      const config = document.querySelector('#configView');
      const results = document.querySelector('#resultsView');
      const sidebar = document.querySelector('#sidebar');
      const advanced = document.querySelector('#advancedModelSettings');
      const header = document.querySelector('.header');
      return {
        gateVisible: Boolean(gate) && !gate.hidden && getComputedStyle(gate).display !== 'none',
        configHidden: Boolean(config?.hidden),
        workspaceSurfacesHidden: [config, results, sidebar].every(
          (element) => element && getComputedStyle(element).display === 'none',
        ),
        headerHidden: Boolean(header) && getComputedStyle(header).display === 'none',
        optionCount: document.querySelectorAll('[data-persona-choice]').length,
        artworkCount: document.querySelectorAll('.persona-illustration svg').length,
        candidateChoice: Boolean(document.querySelector('[data-persona-choice="candidate"]')),
        interviewerChoice: Boolean(document.querySelector('[data-persona-choice="interviewer"]')),
        advancedClosed: Boolean(advanced) && !advanced.open,
      };
    })()`);
    assert.equal(onboardingState.gateVisible, true);
    assert.equal(onboardingState.configHidden, true);
    assert.equal(onboardingState.workspaceSurfacesHidden, true);
    assert.equal(onboardingState.headerHidden, true);
    assert.equal(onboardingState.optionCount, 2);
    assert.equal(onboardingState.artworkCount, 2);
    assert.equal(onboardingState.candidateChoice, true);
    assert.equal(onboardingState.interviewerChoice, true);
    assert.equal(onboardingState.advancedClosed, true);

    await evaluate(client, `document.querySelector('[data-persona-choice="candidate"]').click(); true;`);
    await waitForExpression(
      client,
      "!document.querySelector('#configView')?.hidden && document.body.dataset.pageMode === 'candidate' && getComputedStyle(document.querySelector('.header')).display !== 'none'",
    );
    const candidateFlowState = await evaluate(client, `(() => ({
      identityStored: localStorage.getItem('offeragent_audience_preference_v1') !== null,
      title: document.querySelector('#config-card-title')?.textContent || '',
      generateLabel: document.querySelector('#generateBtn')?.textContent || '',
      advancedClosed: !document.querySelector('#advancedModelSettings')?.open,
    }))()`);
    assert.equal(candidateFlowState.identityStored, false);
    assert.match(candidateFlowState.title, /面试目标/);
    assert.match(candidateFlowState.generateLabel, /我的面试准备/);
    assert.equal(candidateFlowState.advancedClosed, true);

    await client.send("Page.reload", { ignoreCache: true });
    await waitForExpression(
      client,
      "document.readyState === 'complete' && !document.querySelector('#personaGate')?.hidden && document.querySelector('#configView')?.hidden",
    );
    const reopenedAudienceState = await evaluate(client, `(() => ({
      gateVisible: !document.querySelector('#personaGate')?.hidden,
      configHidden: Boolean(document.querySelector('#configView')?.hidden),
      workspaceSurfacesHidden: ['#configView', '#resultsView', '#sidebar'].every(
        (selector) => getComputedStyle(document.querySelector(selector)).display === 'none'
      ),
      headerHidden: getComputedStyle(document.querySelector('.header')).display === 'none',
      pageMode: document.body.dataset.pageMode || '',
    }))()`);
    assert.equal(reopenedAudienceState.gateVisible, true);
    assert.equal(reopenedAudienceState.configHidden, true);
    assert.equal(reopenedAudienceState.workspaceSurfacesHidden, true);
    assert.equal(reopenedAudienceState.headerHidden, true);
    assert.equal(reopenedAudienceState.pageMode, "candidate");

    await evaluate(client, `document.querySelector('[data-persona-choice="candidate"]').click(); true;`);
    await waitForExpression(
      client,
      "!document.querySelector('#configView')?.hidden && document.body.dataset.pageMode === 'candidate'",
    );

    await evaluate(client, `document.querySelector('#mockBtn').click(); true;`);
    await waitForExpression(
      client,
      "document.querySelector('#resume')?.value.length > 20 && document.querySelector('#jobDescription')?.value.length > 20",
    );
    await evaluate(client, `document.querySelector('#generateBtn').click(); true;`);
    await waitForExpression(
      client,
      "document.querySelector('#report')?.innerText.length > 200 && document.querySelectorAll('.graph-node').length > 3",
      15000,
    );

    const generatedState = await evaluate(client, `(() => ({
      reportChars: document.querySelector('#report')?.innerText.length || 0,
      graphNodes: document.querySelectorAll('.graph-node').length,
      resultView: document.body.dataset.resultView || '',
      bodyGraphView: document.body.classList.contains('view-graph'),
      graphButtonSelected: document.querySelector('[data-workspace-view="graph"]')?.getAttribute('aria-selected') || '',
    }))()`);
    assert.ok(generatedState.reportChars > 200);
    assert.ok(generatedState.graphNodes > 3);
    assert.equal(generatedState.bodyGraphView, true);
    assert.equal(generatedState.graphButtonSelected, "true");

    const graphSearchState = await evaluate(client, `(() => {
      const input = document.querySelector('.graph-search-input');
      const nodes = Array.from(document.querySelectorAll('.graph-node'));
      input.value = '__offeragent_no_match__';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const hiddenNodes = nodes.filter((node) => node.classList.contains('graph-node-hidden')).length;
      const emptyEl = document.querySelector('.graph-filter-empty');
      return {
        hasInput: Boolean(input),
        totalNodes: nodes.length,
        hiddenNodes,
        emptyVisible: emptyEl ? !emptyEl.hidden : false,
      };
    })()`);
    assert.equal(graphSearchState.hasInput, true);
    assert.ok(graphSearchState.totalNodes > 3);
    assert.equal(graphSearchState.hiddenNodes, graphSearchState.totalNodes);
    assert.equal(graphSearchState.emptyVisible, true);

    const graphAdvancedFilterState = await evaluate(client, `(() => {
      const search = document.querySelector('.graph-search-input');
      const evidenceLevel = document.querySelector('[data-graph-advanced-filter="evidenceLevel"]');
      const source = document.querySelector('[data-graph-advanced-filter="source"]');
      const highRisk = document.querySelector('[data-graph-decision-view="high_risk"]');
      const nodes = Array.from(document.querySelectorAll('.graph-node'));
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      evidenceLevel.value = '3';
      evidenceLevel.dispatchEvent(new Event('change', { bubbles: true }));
      const levelThreeVisible = nodes.filter((node) => !node.classList.contains('graph-node-hidden')).length;
      evidenceLevel.value = 'all';
      evidenceLevel.dispatchEvent(new Event('change', { bubbles: true }));
      source.value = 'virtual_panel';
      source.dispatchEvent(new Event('change', { bubbles: true }));
      const panelSourceVisible = nodes.filter((node) => !node.classList.contains('graph-node-hidden')).length;
      source.value = 'all';
      source.dispatchEvent(new Event('change', { bubbles: true }));
      highRisk.click();
      const highRiskVisible = nodes.filter((node) => !node.classList.contains('graph-node-hidden')).length;
      highRisk.click();
      return {
        hasEvidenceLevel: Boolean(evidenceLevel),
        hasSource: Boolean(source),
        hasHighRisk: Boolean(highRisk),
        levelThreeVisible,
        panelSourceVisible,
        highRiskVisible,
      };
    })()`);
    assert.equal(graphAdvancedFilterState.hasEvidenceLevel, true);
    assert.equal(graphAdvancedFilterState.hasSource, true);
    assert.equal(graphAdvancedFilterState.hasHighRisk, true);
    assert.ok(graphAdvancedFilterState.levelThreeVisible > 0);
    assert.ok(graphAdvancedFilterState.panelSourceVisible > 0);
    assert.ok(graphAdvancedFilterState.highRiskVisible > 0);

    await waitForExpression(client, "document.querySelectorAll('.chat-bubble').length >= 2", 8000);
    const panelFilterState = await evaluate(client, `(() => {
      const agent = document.querySelector('[data-panel-filter="agent"]');
      const evidence = document.querySelector('[data-panel-filter="evidence"]');
      const bubbles = Array.from(document.querySelectorAll('.chat-bubble'));
      const agentValue = Array.from(agent?.options || []).find((option) => option.value !== 'all')?.value || 'all';
      const evidenceValue = Array.from(evidence?.options || []).find((option) => option.value !== 'all')?.value || 'all';
      agent.value = agentValue;
      agent.dispatchEvent(new Event('change', { bubbles: true }));
      const agentVisible = bubbles.filter((bubble) => !bubble.hidden).length;
      agent.value = 'all';
      agent.dispatchEvent(new Event('change', { bubbles: true }));
      evidence.value = evidenceValue;
      evidence.dispatchEvent(new Event('change', { bubbles: true }));
      const evidenceVisible = bubbles.filter((bubble) => !bubble.hidden).length;
      evidence.value = 'all';
      evidence.dispatchEvent(new Event('change', { bubbles: true }));
      return {
        hasAgent: Boolean(agent),
        hasEvidence: Boolean(evidence),
        total: bubbles.length,
        agentVisible,
        evidenceVisible,
      };
    })()`);
    assert.equal(panelFilterState.hasAgent, true);
    assert.equal(panelFilterState.hasEvidence, true);
    assert.ok(panelFilterState.total >= 2);
    assert.ok(panelFilterState.agentVisible > 0);
    assert.ok(panelFilterState.evidenceVisible > 0);

    const audienceState = await evaluate(client, `(() => {
      const feedback = document.querySelector('.feedback-panel');
      document.querySelector('[data-audience-mode="candidate"]').click();
      const candidateDisplay = getComputedStyle(feedback).display;
      document.querySelector('[data-audience-mode="interviewer"]').click();
      const interviewerDisplay = getComputedStyle(feedback).display;
      return {
        candidateHidden: candidateDisplay === 'none',
        interviewerVisible: interviewerDisplay !== 'none',
        identityStored: localStorage.getItem('offeragent_audience_preference_v1') !== null,
        title: document.querySelector('#config-card-title')?.textContent || '',
        generateLabel: document.querySelector('#generateBtn')?.textContent || '',
      };
    })()`);
    assert.equal(audienceState.candidateHidden, true);
    assert.equal(audienceState.interviewerVisible, true);
    assert.equal(audienceState.identityStored, false);
    assert.match(audienceState.title, /评估目标/);
    assert.match(audienceState.generateLabel, /候选人评估/);

    const feedbackHistoryState = await evaluate(client, `(() => {
      document.querySelector('#feedbackAgreement').value = '部分同意';
      document.querySelector('#feedbackQuestionUse').value = '采用';
      document.querySelector('#feedbackDisagreementReason').value = '证据不足';
      document.querySelector('#feedbackEvidenceSufficiency').value = '部分充分';
      document.querySelector('#feedbackRiskValidation').value = '仍待验证';
      document.querySelector('#feedbackNotes').value = 'browser e2e feedback history';
      document.querySelector('#appendFeedbackBtn').click();
      return true;
    })()`);
    assert.equal(feedbackHistoryState, true);
    await waitForExpression(
      client,
      "Object.keys(localStorage).some((key) => key.startsWith('offeragent_feedback_history_v1:'))",
      8000,
    );
    const storedFeedbackState = await evaluate(client, `(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith('offeragent_feedback_history_v1:'));
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      return {
        exists: Boolean(key),
        count: history.length,
        notes: history[0]?.notes || '',
        hasApiKey: JSON.stringify(history).includes('secret-key'),
      };
    })()`);
    assert.equal(storedFeedbackState.exists, true);
    assert.ok(storedFeedbackState.count >= 1);
    assert.equal(storedFeedbackState.notes, "browser e2e feedback history");
    assert.equal(storedFeedbackState.hasApiKey, false);

    const screenshot = await client.send("Page.captureScreenshot", { format: "png" });
    assert.ok((screenshot.data || "").length > 1000, "browser screenshot should not be blank");
    console.log("browser E2E tests passed");
  } finally {
    client?.close();
    await wait(120);
    try {
      browser.kill();
    } catch (_) {
      // Ignore cleanup errors.
    }
    await waitForProcessExit(browser);
    server.close();
    removeDirectoryWithRetry(userDataDir);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
