# Unified Language Projection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every system-generated output follow the current UI language while preserving all user-entered text and assessment decisions.

**Architecture:** Add a pure language-projection module that overlays localized artifacts onto a canonical run. Mock artifacts are generated locally; real-model artifacts are translated once through the model client and cached by language. Every view and export receives a projected run and the current display language.

**Tech Stack:** Vanilla JavaScript, browser Fetch API, localStorage run cache, Node.js assertion tests, Python smoke checks, in-app browser regression.

---

### Task 1: Canonical language artifact and projection module

**Files:**
- Create: `apps/web/src/localized-run-view.js`
- Create: `scripts/localized_run_view_test.js`
- Modify: `apps/web/index.html`

- [ ] **Step 1: Write the failing projection tests**

```js
const sourceRun = {
  input_snapshot: {
    resume: "中文简历原文",
    job_description: "中文 JD 原文",
    company_context: "中文公司背景",
    target_level: "P6 产品经理",
    offer_constraints: "预算 40K",
  },
  interview_questions: [{ id: "q_1", question: "请解释指标口径" }],
  evidence_graph: {
    nodes: [{
      id: "risk_1",
      type: "risk",
      label: "指标风险",
      summary: "需要验证真实贡献",
      metadata: { source_excerpt: "中文 JD 原文" },
    }],
    edges: [],
  },
};

const artifact = {
  schema_version: "language-artifact.v1",
  source: "translated",
  report_markdown: "# Candidate Report",
  text_by_id: {
    "question:q_1": "Explain the metric definition",
    "graph:risk_1:label": "Metric risk",
    "graph:risk_1:summary": "Validate real contribution",
  },
};

const merged = mergeLocalizedArtifacts(sourceRun, "en", artifact);
const projected = projectRunForLanguage(merged, "en");

assert.equal(projected.input_snapshot.resume, "中文简历原文");
assert.equal(projected.input_snapshot.job_description, "中文 JD 原文");
assert.equal(projected.interview_questions[0].question, "Explain the metric definition");
assert.equal(projected.evidence_graph.nodes[0].label, "Metric risk");
assert.equal(projected.evidence_graph.nodes[0].metadata.source_excerpt, "中文 JD 原文");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/localized_run_view_test.js`

Expected: FAIL because `localized-run-view.js` does not exist.

- [ ] **Step 3: Implement the projection API**

```js
(function initOfferAgentLocalizedRunView(global) {
  "use strict";

  const ARTIFACT_SCHEMA_VERSION = "language-artifact.v1";
  const SOURCE_FIELDS = new Set([
    "resume",
    "job_description",
    "company_context",
    "target_level",
    "offer_constraints",
    "resume_evidence",
    "resumeEvidence",
    "jd_evidence",
    "jdEvidence",
    "source_excerpt",
  ]);

  function resolveLocalizedText(run, language, id, fallback = "") {
    return run?.localized_artifacts?.[language]?.text_by_id?.[id] ?? fallback;
  }

  function mergeLocalizedArtifacts(run, language, artifact) {
    if (!artifact || artifact.schema_version !== ARTIFACT_SCHEMA_VERSION) {
      throw new Error("Invalid language artifact.");
    }
    const next = structuredClone(run);
    next.localized_artifacts = {
      ...(next.localized_artifacts || {}),
      [language === "en" ? "en" : "zh"]: structuredClone(artifact),
    };
    return next;
  }

  function projectRunForLanguage(run, language) {
    const target = language === "en" ? "en" : "zh";
    const next = structuredClone(run);
    const text = (id, fallback) => resolveLocalizedText(run, target, id, fallback);
    next.display_language = target;
    next.display_report = run?.localized_artifacts?.[target]?.report_markdown || run?.report || "";
    next.interview_questions = (next.interview_questions || []).map((item) => ({
      ...item,
      question: text(`question:${item.id}`, item.question),
    }));
    next.evidence_graph = {
      ...(next.evidence_graph || {}),
      nodes: (next.evidence_graph?.nodes || []).map((node) => ({
        ...node,
        label: text(`graph:${node.id}:label`, node.label),
        summary: text(`graph:${node.id}:summary`, node.summary),
      })),
    };
    return next;
  }

  global.OfferAgentLocalizedRunView = {
    ARTIFACT_SCHEMA_VERSION,
    SOURCE_FIELDS,
    mergeLocalizedArtifacts,
    projectRunForLanguage,
    resolveLocalizedText,
  };
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Load the module before view modules and `app.js`**

```html
<script src="./src/localized-run-view.js?v=web-20260710-1"></script>
```

- [ ] **Step 5: Run the projection test**

Run: `node scripts/localized_run_view_test.js`

Expected: `localized-run-view tests passed`

### Task 2: Translation payload and model-client localization request

**Files:**
- Modify: `apps/web/src/localized-run-view.js`
- Modify: `apps/web/src/model-client.js`
- Modify: `scripts/localized_run_view_test.js`
- Modify: `scripts/model_client_test.js`

- [ ] **Step 1: Add failing tests for safe artifact collection**

```js
const collected = collectTranslatableArtifacts(sourceRun);
assert.equal(collected["question:q_1"], "请解释指标口径");
assert.equal(collected["graph:risk_1:summary"], "需要验证真实贡献");
assert.equal(Object.values(collected).includes("中文简历原文"), false);
assert.equal(Object.values(collected).includes("中文 JD 原文"), false);
```

- [ ] **Step 2: Add a failing model-client test**

```js
const result = await client.translateGeneratedArtifacts({
  targetLanguage: "en",
  sourceLanguage: "zh",
  textById: { "question:q_1": "请解释指标口径" },
  provider: "custom",
  apiKey: "test-key",
  baseUrl: "https://example.test",
  model: "test-model",
});
assert.deepEqual(result.text_by_id, {
  "question:q_1": "Explain the metric definition",
});
```

- [ ] **Step 3: Run both tests and verify RED**

Run:

```text
node scripts/localized_run_view_test.js
node scripts/model_client_test.js
```

Expected: FAIL because collection and translation APIs do not exist.

- [ ] **Step 4: Implement safe artifact collection**

Collect stable IDs for:

```js
{
  [`question:${question.id}`]: question.question,
  [`graph:${node.id}:label`]: node.label,
  [`graph:${node.id}:summary`]: node.summary,
  [`panel:${round.id}:${turn.agent_id}:${index}`]: turn.claim,
  "moderator:final_recommendation": moderator.final_recommendation,
  "moderator:consensus": moderator.consensus,
  [`offer:${scenario.id}:recommendation`]: scenario.recommendation,
  [`feedback:${action.id}:summary`]: action.summary,
}
```

Skip empty values and any field listed in `SOURCE_FIELDS`.

- [ ] **Step 5: Implement `translateGeneratedArtifacts`**

Use the existing chat-completions endpoint resolver and Fetch dependency:

```js
async function translateGeneratedArtifacts(input) {
  const response = await fetch(resolveChatCompletionsEndpoint(resolveBaseUrl(input)), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildLocalizationSystemPrompt(input.targetLanguage),
        },
        {
          role: "user",
          content: JSON.stringify({ text_by_id: input.textById }),
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(await formatHttpGenerationError(response));
  const payload = await response.json();
  return parseLanguageArtifactPayload(payload, input.targetLanguage);
}
```

- [ ] **Step 6: Run both tests**

Expected: both tests pass.

### Task 3: Display-language report and PDF generation

**Files:**
- Modify: `apps/web/src/report-builders.js`
- Modify: `apps/web/src/report-export-template.js`
- Modify: `apps/web/src/pdf-export.js`
- Modify: `scripts/report_builders_test.js`
- Modify: `scripts/report_export_template_test.js`

- [ ] **Step 1: Add a failing report-language test**

```js
language = "en";
const markdown = builders.buildAudienceMarkdown({
  input_snapshot: { language: "zh", resume: "中文简历原文" },
  display_report: "# Candidate Report\n\n## Role Match\nEnglish analysis",
  report: "# 候选人报告",
}, "candidate");
assert.match(markdown, /Candidate Interview Preparation Report/);
assert.doesNotMatch(markdown, /候选人面试准备报告/);
```

- [ ] **Step 2: Add a failing PDF-language test**

```js
language = "en";
const html = template.reportToStaticHtmlDocument(run, "candidate");
assert.match(html, /<html lang="en">/);
assert.match(html, /Generated At/);
assert.doesNotMatch(html, /生成时间/);
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```text
node scripts/report_builders_test.js
node scripts/report_export_template_test.js
```

- [ ] **Step 4: Make builders use current display language**

```js
function buildAudienceMarkdown(run, audience) {
  return resolveLanguage() === "en"
    ? buildAudienceMarkdownEn(run, audience)
    : buildAudienceMarkdownZh(run, audience);
}
```

Use:

```js
const report = run.display_report || run.report || "";
```

- [ ] **Step 5: Make export use injected display language**

Add `getLanguage` to `createReportExportTemplate` and replace:

```js
const language = getRunLanguage(run);
```

with:

```js
const language = getLanguage() === "en" ? "en" : "zh";
```

- [ ] **Step 6: Run report and export tests**

Expected: both tests pass.

### Task 4: Project graph, panel, summary, and scorecard

**Files:**
- Modify: `apps/web/src/localized-run-view.js`
- Modify: `apps/web/src/graph-view.js`
- Modify: `apps/web/src/panel-view.js`
- Modify: `apps/web/src/reports-view.js`
- Modify: `scripts/localized_run_view_test.js`
- Modify: `scripts/graph_view_test.js`
- Modify: `scripts/panel_view_test.js`
- Modify: `scripts/reports_view_test.js`

- [ ] **Step 1: Add failing projection assertions**

```js
assert.equal(projected.panel_discussion_rounds[0].turns[0].claim, "Validate the metric");
assert.equal(projected.moderator_summary.final_recommendation, "Proceed conditionally");
assert.equal(projected.offer_simulation_run.scenarios[0].recommendation, "Validate constraints");
assert.equal(projected.feedback_distillation.actions[0].summary, "Promote this question");
```

- [ ] **Step 2: Add view tests proving projected text is rendered**

Each view test supplies a projected run and asserts the localized generated field appears while raw evidence remains unchanged.

- [ ] **Step 3: Run tests and verify RED**

Run:

```text
node scripts/localized_run_view_test.js
node scripts/graph_view_test.js
node scripts/panel_view_test.js
node scripts/reports_view_test.js
```

- [ ] **Step 4: Extend projection mappings**

Map stable IDs for panel turns, moderator fields, Offer scenario text, feedback summaries, and scorecard questions. Preserve all source-excerpt fields.

- [ ] **Step 5: Render only projected runs**

Keep view modules simple: they receive already-projected data and continue localizing enum codes through existing mapper functions.

- [ ] **Step 6: Run all four tests**

Expected: all pass.

### Task 5: Async language switching and artifact caching

**Files:**
- Modify: `apps/web/app.js`
- Modify: `apps/web/src/i18n.js`
- Modify: `apps/web/src/run-cache.js`
- Modify: `scripts/smoke_test.py`

- [ ] **Step 1: Add failing static and cache checks**

Require:

```text
ensureLocalizedArtifact
projectRunForLanguage
languageSwitchToken
statusLocalizing
statusLocalizationFailed
localized_artifacts
```

- [ ] **Step 2: Implement display-run helpers**

```js
let languageSwitchToken = 0;

function getDisplayRun(run = currentRun) {
  return run ? projectRunForLanguage(run, currentLanguage) : null;
}

async function ensureLocalizedArtifact(run, targetLanguage) {
  if (run.localized_artifacts?.[targetLanguage]) return run;
  if (run.mode === "mock") return buildMockLanguageArtifact(run, targetLanguage);
  const textById = collectTranslatableArtifacts(run);
  const artifact = await translateGeneratedArtifacts({
    ...collectModelRuntimeConfig(),
    sourceLanguage: run.input_snapshot?.language || "zh",
    targetLanguage,
    textById,
  });
  return mergeLocalizedArtifacts(run, targetLanguage, artifact);
}
```

- [ ] **Step 3: Make `applyLanguage` asynchronous**

```js
async function applyLanguage(language) {
  const token = ++languageSwitchToken;
  currentLanguage = language === "en" ? "en" : "zh";
  applyStaticLanguageCopy();
  if (!currentRun) return;

  languageEl.disabled = true;
  setStatus(getText().statusLocalizing);
  try {
    currentRun = await ensureLocalizedArtifact(currentRun, currentLanguage);
    if (token !== languageSwitchToken) return;
    persistRunCache(currentRun);
    renderAllOutputSurfaces(getDisplayRun());
  } catch (error) {
    if (token === languageSwitchToken) {
      renderAllOutputSurfaces(getDisplayRun());
      setStatus(getText().statusLocalizationFailed, true);
    }
  } finally {
    if (token === languageSwitchToken) languageEl.disabled = false;
  }
}
```

- [ ] **Step 4: Use projected runs everywhere**

Replace direct output rendering calls with:

```js
const displayRun = getDisplayRun();
renderReport(buildPreviewMarkdown(displayRun));
renderDecisionSummaryCard(displayRun);
renderInterviewerScorecard(displayRun);
renderEvidenceGraph(displayRun);
renderVirtualPanelChat(displayRun);
```

Exports call `getDisplayRun()` and use `currentLanguage` filenames.

- [ ] **Step 5: Run smoke and module tests**

Run: `python scripts/smoke_test.py`

Expected: all static checks and module tests pass.

### Task 6: Browser regression and documentation

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/gap-analysis.md`
- Modify: `开发路线.md`

- [ ] **Step 1: Update documentation**

Document:

- User inputs stay in the original language.
- All generated outputs follow current language.
- Real-model localization is requested once and cached.
- PDF follows current UI language.

- [ ] **Step 2: Run final verification**

Run:

```text
python scripts/smoke_test.py
git diff --check
node --check apps/web/app.js
node --check apps/web/src/localized-run-view.js
node --check apps/web/src/model-client.js
```

- [ ] **Step 3: Run browser scenarios**

Verify:

1. Chinese Mock report → English → Chinese.
2. English Mock report → Chinese → English.
3. Every input field value remains identical.
4. Report, graph, panel, summary, scorecard, and export labels switch.
5. Graph search still works.
6. No browser console errors or horizontal overflow.

- [ ] **Step 4: Commit and push**

```text
git add <only feature files>
git commit -m "feat: localize generated outputs on language switch"
git push origin master
```
