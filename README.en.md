# OfferAgent Interview Evaluation Assistant

Language: [中文](README.md) | English

Repository: [https://github.com/MathsionYang/offerAgent](https://github.com/MathsionYang/offerAgent)

Live demo: [https://mathsionyang.github.io/offerAgent/](https://mathsionyang.github.io/offerAgent/)

## Screenshots

<img src="img/06.png" alt="OfferAgent screenshot 06" width="900" />

<img src="img/07.png" alt="OfferAgent screenshot 07" width="900" />

<img src="img/08.png" alt="OfferAgent screenshot 08" width="900" />

<img src="img/09.png" alt="OfferAgent screenshot 09" width="900" />

<img src="img/010.png" alt="OfferAgent screenshot 010" width="900" />

<img src="img/011.png" alt="OfferAgent screenshot 011" width="900" />

<img src="img/012.png" alt="OfferAgent screenshot 012" width="900" />

OfferAgent is a static Web MVP for interview preparation and recruiting decision support. It does not replace human hiring decisions. It turns “target role + candidate resume + job description + interview context” into traceable candidate reports, interviewer reports, offer simulations, virtual panel summaries, and an evidence graph.

The current version supports four target roles: Product Manager, Developer, Technical Support, and Sales.

## One-Line Positioning

OfferAgent helps candidates and interviewers connect role requirements with project evidence, identify risk gaps, generate follow-up questions, simulate offer paths, audit a virtual interview panel, and export structured PDF reports.

## Current Experience

1. Every page visit starts with two inline-SVG Candidate and Interviewer cards. The workspace remains hidden until a role is selected.
2. The fixed header keeps Candidate / Interviewer and Workbench / Graph switching available after entry.
3. The main flow prioritizes role, stage, resume, JD, offer constraints, and interviewer lenses; model and proxy configuration is collapsed under Advanced.
4. Clicking Generate Report immediately switches to the Graph view while the report is generated.
5. Candidate mode hides human feedback and only exposes the candidate report export.
6. Interviewer mode shows human feedback and only exposes the interviewer report export.
7. Graph nodes can jump back to the corresponding report section.
8. The Graph view streams the virtual interview panel discussion as compact chat bubbles and keeps the moderator summary at the end.
9. The same input can reuse a cached base report to reduce repeated-generation drift.

## Core Capabilities

### 1. Project Match Gate

The system first checks whether resume projects support the JD’s core responsibilities before generating final report sections.

Current logic includes:

1. Extracting role responsibilities and capability requirements from the JD.
2. Finding project-experience anchors in the resume.
3. Labeling evidence as Level 1 / Level 2 / Level 3 credibility.
4. Producing match, conditional proceed, evidence-missing, or mismatch results.
5. Requiring additional project evidence when conclusions are unsupported.
6. Generating anti-overpackaging follow-up questions when a resume looks highly matched on the surface.

### 2. Candidate Report

The candidate report is designed for job seekers. It is not a resume beautifier. It helps candidates prepare project stories, metric definitions, contribution boundaries, failure retrospectives, and role-fit narratives.

It includes:

1. Candidate preparation priorities.
2. Resume-JD mismatch points.
3. Candidate follow-up question bank.
4. JD hidden-pain decoding.
5. Risks and pending validations.
6. Offer sandbox simulation.
7. Evidence chain and evidence gaps.

### 3. Interviewer Report

The interviewer report is designed for HR, business interviewers, technical interviewers, and hiring leads. Its goal is to improve follow-up question quality and explainability.

It includes:

1. Role hiring analysis.
2. Initial resume review.
3. Interviewer question library.
4. Interviewer handling recommendations.
5. Interviewer lens library.
6. Virtual interview panel summary.
7. Risks and pending validations.
8. Human feedback records.
9. FeedbackDistillation results.

### 4. Virtual Interview Panel

OfferAgent references MiroFish’s workflow of seed material, graph memory, persona generation, multi-round simulation, and report synthesis. The current implementation is a lightweight frontend version.

It includes:

1. `VirtualPanel`: generates virtual interviewer personas from the role, JD, resume, and selected skills.
2. `PanelDiscussionRound`: records lightweight discussion turns around evidence, risk, and offer readiness.
3. `ModeratorSummary`: summarizes consensus, disagreement, lead persona, and final recommendation.
4. `agent_persona` graph nodes: audit virtual interviewer contributions.
5. `reads_memory / discusses / challenges` graph edges: show which evidence each persona read, discussed, or challenged.
6. The Virtual Interview Panel view streams these turns as chat bubbles and keeps the full discussion history after generation.

This is not a full large-scale multi-agent simulation engine. It is a lightweight version suited to the current static Web MVP.

### 5. Consistency Mode

To make same-input reports more stable, the current version includes a consistency layer:

1. Input fingerprinting through `input_fingerprint`.
2. Structured JSON intermediate layer through `structured_evaluation`.
3. Local base-report cache reuse for identical inputs.
4. Live model calls use `temperature: 0` and include a `seed`.
5. API keys and human feedback are not stored in the base-report cache.

### 6. Interviewer Lens Library

The current version includes five SkillDefinition examples:

1. Virtual HR Interviewer.
2. Virtual Business Owner.
3. Virtual Project / PMO Interviewer.
4. Virtual Negotiation Advisor.
5. Executive Pressure Officer.

These lenses affect follow-up questions, risk judgments, virtual panel personas, and Skill contribution records in the EvidenceGraph. They will later evolve into a selectable, composable, versioned Skill Registry.

### 7. EvidenceGraph

EvidenceGraph connects JD requirements, resume evidence, questions, risks, feedback, offer signals, skills, and virtual interviewer personas into a minimal relationship graph.

Current support:

1. Node details.
2. Type filters, keyword search, risk-level / evidence-level / source filters, and a high-risk decision view.
3. Evidence-gap prompts.
4. Edge confidence / weight / source fields.
5. Node-to-report-section jump.
6. Skill output auditability.
7. Virtual interview panel auditability.

### 8. OfferSimulationRun

OfferSimulationRun has moved from a report section into a backfillable structured state.

Current support:

1. Base / Optimistic / Conservative scenario comparison.
2. Lifecycle state.
3. Run history and version metadata.
4. Backfill hints for next-round question generation, risk judgment, and negotiation strategy.

### 9. Human Feedback Loop

In Interviewer mode, human feedback can be written into the report. Feedback is connected to FeedbackDistillation rules:

1. Escalate questions.
2. Downgrade questions.
3. Delete questions.
4. Keep questions.
5. Track feedback impact on risks, offer decisions, and Skill update suggestions.
6. Feedback history for the same input fingerprint is saved locally and restored after refresh or cache reuse.

## Implemented

1. Static Web MVP.
2. Mock Demo and temporary OpenAI-compatible model configuration.
3. RoleProfiles for Product Manager, Developer, Technical Support, and Sales.
4. Candidate / Interviewer segmented mode switch.
5. Workbench / Graph dual view.
6. Chinese / English UI, sample data, reports, and PDF output.
7. Chunked streaming report output.
8. Candidate and interviewer report split.
9. Two-module PDF export.
10. EvidenceGraph display, type filters, keyword search, advanced decision filters, match counts, gap detection, and report-section jump.
11. VirtualPanel, PanelDiscussionRound, ModeratorSummary, and chat-style panel streaming with round, role, and evidence-node filters.
12. Consistency mode with input fingerprinting, structured intermediate state, and local cache reuse.
13. Structured Offer sandbox state.
14. FeedbackDistillation visualization and local feedback history.
15. GitHub Pages deployment.
16. Cloudflare Worker proxy example.
17. Static smoke test script.
18. Input readiness feedback for resume / JD length, limited context, and interviewer-role selection.
19. Unified language projection: user input remains verbatim while the interface, reports, graph, virtual panel, scorecards, summaries, and exports follow the active language. Mock runs build language artifacts locally, while live-model runs translate on demand and cache the result.
20. Per-visit persona selection through two illustrated role cards; the selected workspace appears only after entry, identity is not persisted, and model configuration stays collapsed under Advanced by default.

## Current Limits

1. No user account, team workspace, or cloud report persistence yet.
2. No real-sample evaluation dataset yet. This is intentionally deferred for now.
3. No ATS / HRIS integration yet.
4. Skill Registry is still an example-driven frontend structure, not a complete plugin or marketplace system.
5. EvidenceGraph is a minimal usable graph, not a full knowledge-graph database.
6. The virtual interview panel is a lightweight rule-driven layer, not a full multi-agent simulation engine.
7. Frontend modularization phase 15 is complete. `apps/web/src/report-content-helpers.js` now owns candidate and interviewer report content helpers, `apps/web/src/report-export-template.js` owns the static report HTML and PDF summary-card template, and `apps/web/src/localization-mappers.js` owns report translations and enum localization. `apps/web/app.js` is currently 2,191 lines, `apps/web/src` contains 20 JavaScript modules, and the entry point primarily retains page orchestration, event binding, state flow, model prompts, and Mock report generation.

## Language Projection

1. All user input remains verbatim, including the resume, JD, company context, target level, offer constraints, and quoted source excerpts.
2. Interface copy, generated report content, EvidenceGraph nodes, the virtual panel, scorecards, summaries, and PDF exports are projected into the active language.
3. Mock mode builds Chinese and English artifacts in the browser. Live-model mode calls the model only when the target-language artifact is first needed, then reuses the cached result.
4. Language artifacts use `language-artifact.v3`. Older schemas and artifacts missing newly translatable fields are invalidated and rebuilt automatically.
5. A language-switch token prevents stale asynchronous work from overwriting the current language when the user switches languages during generation.

## Local Usage

Windows users can double-click the following file in the repository root:

```text
start_offeragent.bat
```

It runs `python scripts\local_proxy.py --key-file 1.md`, waits for the local service, and opens the page in Google Chrome. Keep the command window open and press `Ctrl+C` to stop the service.

Open the static page directly:

```text
apps/web/index.html
```

Or run a static server:

```bash
python -m http.server 5173 -d apps/web
```

Then visit:

```text
http://localhost:5173
```

## Verification

```bash
node --check apps/web/src/domain-data.js
node --check apps/web/src/run-cache.js
node --check apps/web/src/i18n.js
node --check apps/web/src/localization-mappers.js
node --check apps/web/src/virtual-panel.js
node --check apps/web/src/evidence-graph.js
node --check apps/web/src/graph-view.js
node --check apps/web/src/skill-registry.js
node --check apps/web/src/panel-view.js
node --check apps/web/src/report-builders.js
node --check apps/web/src/report-content-helpers.js
node --check apps/web/src/report-export-template.js
node --check apps/web/src/reports-view.js
node --check apps/web/src/model-client.js
node --check apps/web/src/pdf-export.js
node --check apps/web/src/feedback-engine.js
node --check apps/web/src/assessment-rules.js
node --check apps/web/src/evaluation-engine.js
node --check apps/web/app.js
node scripts/virtual_panel_test.js
node scripts/panel_view_test.js
node scripts/report_builders_test.js
node scripts/report_content_helpers_test.js
node scripts/report_export_template_test.js
node scripts/localization_mappers_test.js
node scripts/i18n_test.js
node scripts/localized_run_view_test.js
node scripts/evidence_graph_test.js
node scripts/graph_view_test.js
node scripts/input_readiness_test.js
node scripts/skill_registry_test.js
node scripts/reports_view_test.js
node scripts/model_client_test.js
node scripts/pdf_export_test.js
node scripts/feedback_engine_test.js
node scripts/assessment_rules_test.js
node scripts/evaluation_engine_test.js
node scripts/browser_e2e_test.js
python scripts/smoke_test.py
git diff --check
```

## Privacy

Mock Demo does not call external models. In live-model mode, the API key is only used temporarily in the current browser page and is not written to the repository or the consistency cache. Translation is requested only when a target-language artifact is missing; generated language artifacts may be cached with the base run, but API keys and human feedback are not stored in that base-report cache. Interviewer feedback history is saved separately in localStorage by input fingerprint so the same browser can restore recent feedback. Avoid entering real sensitive resume data on public or untrusted devices.
