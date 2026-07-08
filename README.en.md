# OfferAgent Interviewer Evaluation

Language: [中文](README.md) | English

Repository: [https://github.com/MathsionYang/offerAgent](https://github.com/MathsionYang/offerAgent)

Live demo: [https://mathsionyang.github.io/offerAgent/](https://mathsionyang.github.io/offerAgent/)

OfferAgent is a static Web MVP for interview preparation and recruiting decision support. It does not replace human hiring decisions. It turns “target role + candidate resume + job description + interview context” into traceable candidate reports, interviewer reports, offer simulations, and an evidence graph.

The current version supports four target roles: Product Manager, Developer, Technical Support, and Sales.

## One-Line Positioning

OfferAgent helps candidates and interviewers connect role requirements with project evidence, identify risk gaps, generate follow-up questions, simulate offer paths, and export structured PDF reports.

## Current Experience

The Web app is a compact workspace:

1. A fixed top bar contains Candidate / Interviewer, Workbench / Graph, and CN / EN language controls.
2. The Workbench view is used for model configuration, resume input, JD input, offer constraints, and interviewer lenses.
3. Clicking Generate Report immediately switches to the Graph view while the report is being generated.
4. Candidate mode hides human feedback and only exposes the candidate report export.
5. Interviewer mode shows human feedback and only exposes the interviewer report export.
6. Graph nodes can jump back to the corresponding report section, turning the graph into a decision navigation tool.

## Core Capabilities

### 1. Project Match Gate

The system first checks whether resume projects support the JD’s core responsibilities before generating final report sections.

Current logic includes:

1. Extracting role responsibilities and capability requirements from the JD.
2. Finding project-experience anchors in the resume.
3. Labeling evidence as Level 1 / Level 2 / Level 3 credibility.
4. Producing match, conditional proceed, or evidence-missing / mismatch results.
5. Requiring additional project evidence when conclusions are unsupported.
6. Generating anti-overpackaging follow-up questions when a resume looks highly matched on the surface.

### 2. Candidate Report

The candidate report is designed for job seekers. It is not a resume beautifier; it helps candidates prepare project stories, metric definitions, personal contribution boundaries, failure retrospectives, and role-fit narratives.

It includes:

1. Candidate preparation priorities.
2. Resume-JD mismatch points.
3. Candidate follow-up question bank.
4. JD hidden-pain decoding.
5. Risks and pending validations.
6. Offer sandbox simulation.
7. Evidence chain and evidence gaps.

### 3. Interviewer Report

The interviewer report is designed for HR, business interviewers, and technical interviewers. Its goal is to improve follow-up question quality.

It includes:

1. Role hiring analysis.
2. Initial resume review.
3. Interviewer question library.
4. Interviewer handling recommendations.
5. Interviewer lens library.
6. Risks and pending validations.
7. Human feedback records.
8. FeedbackDistillation results.

### 4. Interviewer Lens Library

The current version includes five SkillDefinition examples:

1. Virtual HR Interviewer.
2. Virtual Business Owner.
3. Virtual Project / PMO Interviewer.
4. Virtual Negotiation Advisor.
5. Executive Pressure Officer.

These lenses affect follow-up questions, risk judgments, and Skill contribution records in the EvidenceGraph. They will later evolve into a selectable, composable, versioned Skill Registry.

### 5. EvidenceGraph

EvidenceGraph connects JD requirements, resume evidence, questions, risks, feedback, and offer signals into a minimal relationship graph.

Current support:

1. Node details.
2. Graph filtering.
3. Evidence-gap prompts.
4. Edge confidence / weight / source fields.
5. Node-to-report-section jump.
6. Skill output auditability.

### 6. OfferSimulationRun

OfferSimulationRun has moved from a report section into a backfillable structured state.

Current support:

1. Base / Optimistic / Conservative scenario comparison.
2. Lifecycle state.
3. Run history and version metadata.
4. Backfill hints for next-round question generation, risk judgment, and negotiation strategy.

### 7. Human Feedback Loop

In Interviewer mode, human feedback can be written into the report. Feedback is connected to FeedbackDistillation rules:

1. Escalate questions.
2. Downgrade questions.
3. Delete questions.
4. Keep questions.
5. Track feedback impact on risks, offer decisions, and Skill update suggestions.

## Implemented

1. Static Web MVP.
2. Mock Demo and temporary OpenAI-compatible model configuration.
3. RoleProfiles for Product Manager, Developer, Technical Support, and Sales.
4. Candidate / Interviewer segmented mode switch.
5. Workbench / Graph dual view.
6. Chinese / English UI, sample data, reports, and PDF output.
7. Chunked streaming report output.
8. Candidate and interviewer report split.
9. Two-module PDF export: Candidate mode exports the candidate report; Interviewer mode exports the interviewer report.
10. EvidenceGraph display, filtering, gap detection, and report-section jump.
11. Structured Offer sandbox state.
12. FeedbackDistillation visualization.
13. GitHub Pages deployment.
14. Cloudflare Worker proxy example.
15. Static smoke test script.

## Current Limits

1. No user account, team workspace, or cloud report persistence yet.
2. No real-sample evaluation dataset yet; this is intentionally deferred for now.
3. No ATS / HRIS integration yet.
4. Skill Registry is still an example-driven frontend structure, not a complete plugin or marketplace system.
5. EvidenceGraph is a minimal usable graph, not a full knowledge-graph database.
6. Most logic is still centralized in `apps/web/app.js`; modularization is a future priority.

## Local Usage

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
node --check apps/web/app.js
python scripts/smoke_test.py
git diff --check
```

## Privacy

Mock Demo does not call external models. In real-model mode, the API key is only used temporarily in the current browser page and is not written to the repository. Avoid entering real sensitive resume data on public or untrusted devices.
