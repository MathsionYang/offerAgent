# Interview Assistant

Language: [中文](README.md) | English

Interview Assistant is an early Web MVP designed as an “Offer Sandbox + Interviewer Lens Library”. The current version focuses on one minimal closed loop:

After users enter a candidate resume, job description, and optional context, the system first checks whether the candidate's project experience supports the core responsibilities in the JD. It then generates candidate preparation reports, interviewer follow-up reports, evidence chains, risk points, and downloadable PDF reports.

Demo:

```text
https://mathsionyang.github.io/offerAgent/
```

The current Web version supports Chinese / English switching. The page UI, anonymized samples, Mock Demo reports, real-model prompt instructions, report preview, Candidate PDF, Interviewer PDF, and Offer Simulation PDF all follow the language selector in the upper-right corner.

This project is not a commercial recruiting system and does not replace human hiring decisions. It is an interview preparation and follow-up-question assistant that helps candidates and interviewers align faster on role requirements, project evidence, risk gaps, and next-round validation questions.

## One-Line Positioning

Turn “resume + JD” into a follow-up-ready, reviewable, downloadable interview preparation report, and generate a question library for interviewers and candidates.

## Current Core Flow

### 1. Input Materials

Entry files:

```text
apps/web/index.html
apps/web/app.js
apps/web/styles.css
```

Users enter:

1. Candidate resume.
2. Job description.
3. Company / interview context.
4. Candidate stage, such as screening, business first round, final business round, or pre-offer.
5. Target level.
6. Offer / negotiation constraints.
7. Interviewer perspectives, such as HR, business owner, project / PMO, negotiation advisor, and executive pressure officer.

The current page supports two modes:

1. Mock Demo: Generates a local mock report without calling a real model.
2. Real Model: Uses a temporary API Key and Base URL entered by the user to call an OpenAI-compatible interface.

The current page supports two languages:

1. Chinese: The default language, keeping the original Chinese UI, samples, mock reports, and PDF output.
2. English: After switching, the UI, samples, mock reports, real-model output requirements, PDF titles, and PDF content use English.

### 2. Project Match Gate

The system does not immediately produce a “hire / reject” conclusion. It first performs project-match gating.

Current gating logic includes:

1. Extracting core responsibilities and capability requirements from the JD.
2. Finding corresponding project evidence in the resume.
3. Labeling each evidence item with Level 1 / Level 2 / Level 3 credibility.
4. Comparing role responsibilities against project experience to decide whether the candidate's projects can support the JD.
5. Producing one of three gate results: Matched, Conditional Proceed (Transfer Fit), or Not Matched / Do Not Proceed.
6. Marking validation gaps or mismatch points when project evidence is insufficient.
7. Generating anti-overpackaging follow-up questions when the resume appears highly matched on the surface.

The current implementation still relies on rules, keywords, and model generation rather than a strict structured scoring engine, but it already productizes evidence-based conclusions, evidence credibility grading, conditional proceed, and capability-transfer talk tracks in the frontend.

### 3. Candidate Report

The candidate report is designed for job seekers and focuses on interview preparation.

It currently includes:

1. Executive conclusion.
2. Role hiring analysis.
3. Resume-JD mismatch points.
4. Resume improvement suggestions and preparation priorities.
5. Recommended questions to prepare.
6. Project match gate.
7. Role match.
8. JD hidden-pain decoding.
9. Risks and pending validations.
10. Offer sandbox simulation.
11. Must-ask follow-up questions.
12. Dynamic calibration instructions.
13. Evidence chain.

The candidate report is not intended to beautify a resume. It reminds candidates to strengthen project stories, metric definitions, personal contribution boundaries, failure retrospectives, and role-fit narratives.

### 4. Interviewer Report

The interviewer report is designed for HR, business interviewers, and technical interviewers. It focuses on sharper follow-up-question design.

It currently includes:

1. Executive conclusion.
2. Initial resume review.
3. Resume-JD mismatch points.
4. Interviewer handling recommendations.
5. Optional interviewer follow-up questions.
6. Project match gate.
7. Role match.
8. Risks and pending validations.
9. Interviewer question library.
10. Interviewer lens library.
11. Evidence chain.
12. Offer sandbox simulation.
13. Dynamic calibration instructions.

The “initial resume review” provides a brief judgment first. For example:

If a candidate only lists technical terms such as MATLAB, GIS, and Java without a complete engineering project loop, the system flags that as single-point learning rather than direct evidence for system design, product planning, or project delivery responsibilities in the JD.

### 5. Interviewer Lens Library

The current built-in interviewer lenses include:

1. Virtual HR Interviewer: focuses on motivation, stability, clarity, and offer risks.
2. Virtual Business Owner: focuses on business understanding, requirement judgment, metric awareness, and result attribution.
3. Virtual Project / PMO Interviewer: focuses on goal breakdown, milestones, resource coordination, risk control, and retrospectives.
4. Virtual Negotiation Advisor: focuses on salary expectations, competing offers, joining probability, and negotiation strategy.
5. Executive Pressure Officer: focuses on strategic trade-offs, budget cuts, resource constraints, ROI, and judgment under extreme pressure.

The Web Mock logic always includes the “Executive Pressure Officer” to test budget cuts, resource reprioritization, ROI trade-offs, and strategic judgment.

### 6. Report Download

The current version supports downloading:

1. Candidate PDF report.
2. Interviewer PDF report.
3. Offer Simulation PDF report.
4. Modular PDF exports for Candidate, Interviewer, and Offer Simulation reports.

PDF reports are generated and downloaded directly in the browser without relying on a print dialog. The report style references `interview-report.html` and has been redesigned as a light consulting-report style:

1. Light background.
2. White report cards.
3. Clear section headings.
4. Light tables.
5. Color states for risk, pending validation, and match status.

The current Web page has also been redesigned in a light theme, covering input forms, configuration panels, Offer Sandbox, interviewer lens library, report preview, and PDF export windows. The report preview is organized into three modules: Candidate Report, Interviewer Report, and Offer Simulation Report.

### 7. Human Feedback

The current page supports adding human feedback after report generation, including:

1. Whether the interviewer agrees with the judgment.
2. Whether the questions are effective.
3. Notes.

Human feedback is appended to the current report, but there is not yet a persistent database or long-term iterative question library.

## Completed

### Web MVP

1. Built a pure static Web page.
2. Supports local Mock Demo.
3. Supports resume, JD, company context, candidate stage, target level, and offer-constraint inputs.
4. Supports interviewer lens selection.
5. Supports segmented report generation.
6. Supports candidate and interviewer report splitting.
7. Supports PDF report export.
8. Supports Candidate, Interviewer, and Offer Simulation PDF exports.
9. Supports writing human feedback into the current report.
10. Supports Chinese / English switching.
11. Supports GitHub Pages deployment.

Segmented report streaming simulates the experience of real model output, while modular PDF export supports separate delivery of candidate-facing and interviewer-facing reports.

### Report Capabilities

1. Project match gate.
2. Role match analysis.
3. Resume-JD mismatch points.
4. Candidate preparation priorities.
5. Interviewer question library.
6. Interviewer lens library.
7. High-match anti-overpackaging questions.
8. Initial resume review.
9. Failure-case and risk prompts.
10. Evidence chain output.
11. Evidence-based conclusions.
12. Evidence credibility grading display.
13. Conditional Proceed (Transfer Fit) and capability-transfer talk track.
14. Candidate negotiation leverage identification.
15. JD hidden-pain decoding.
16. Dynamic calibration instructions.
17. Fixed executive pressure test.

### Prompt Enhancements

`prompts/product-manager-interview-prep.md` has been enhanced with:

1. Structured plain-text output to reduce Markdown rendering conflicts.
2. Evidence credibility grading: Level 1 / Level 2 / Level 3 evidence.
3. Conditional Proceed (Transfer Fit).
4. Capability-transfer talk track.
5. Stronger project delay / production incident / failure-retrospective follow-up questions.
6. Candidate negotiation leverage identification.
7. Executive Pressure Officer.
8. Dynamic calibration instructions.
9. JD hidden-pain decoding.

### Deployment And Proxy

1. GitHub Pages workflow is provided.
2. Cloudflare Worker proxy example is provided.
3. Local proxy script instructions are provided.
4. Smoke test script is provided.

## Not Yet Completed

### Product Features

1. No user login or account system yet.
2. No team collaboration, workspace, or history yet.
3. No cloud report storage yet.
4. No role template library yet.
5. No company template library yet.
6. No linked multi-round interview records yet.
7. No true post-interview feedback learning loop yet.
8. No batch resume evaluation yet.
9. No structured scoring dashboard yet.
10. No permission management yet.

### Model And Algorithm

1. Current Mock logic is still rule- and template-heavy and does not equal real model performance.
2. Real-model output depends on prompt stability and has not yet gone through systematic evaluation.
3. Evidence credibility grading, conditional proceed, negotiation leverage, and JD hidden-pain decoding have been productized in the Web Mock report but still require real-model evaluation.
4. Persistent and editable standardized Evidence Schema is missing.
5. Configurable role capability matrix is missing.

### Engineering Implementation

1. The current Web version is a pure static implementation, and most code is concentrated in `apps/web/app.js`; it should be split into modules later.
2. No frontend build system yet.
3. No unit tests yet.
4. No end-to-end UI tests yet.
5. No error logging or observability yet.
6. No unified configuration center yet.
7. No formal backend service yet.

## Areas To Improve

### 1. Structured Data Layer

The key report information should be persisted as structured objects:

1. JobProfile: structured role information.
2. CandidateProfile: structured candidate information.
3. EvidenceItem: evidence item.
4. RequirementMatch: role-requirement match result.
5. InterviewQuestion: interview question.
6. InterviewerLens: interviewer perspective.
7. FeedbackItem: human feedback.

This would enable sorting, filtering, scoring, retrospectives, and multi-round iteration.

### 2. Productized Evidence Credibility

The current version has basic evidence display. It should be enhanced into an editable and traceable evidence system:

1. Display the level of each evidence item.
2. Display evidence sources for each conclusion.
3. Automatically move low-credibility evidence into pending validation.
4. Allow interviewers to manually adjust evidence levels.
5. Allow interviewers to mark evidence as confirmed or disproven after interviews.

### 3. Stronger Project Match Gate

The current version already displays three gate results. It should continue to strengthen:

1. Matched.
2. Conditional Proceed (Transfer Fit).
3. Not Matched / Do Not Proceed.
4. Clear trigger reasons.
5. Clear next-round validation questions.
6. Candidate opening talk track for capability transfer.

### 4. Stronger Interviewer Lens Library

The current version always includes Executive Pressure Officer. Later, interviewer lenses should be dynamically generated:

1. Automatically select interviewer combinations based on the role.
2. Always include Executive Pressure Officer.
3. Support extended roles such as technical architect, customer-solution owner, and data owner.
4. For each lens, output focus capability, evidence anchor, deep-dive question, good-answer standard, and risk signal.

### 5. Stronger Failure Retrospective And Anti-Overpackaging Questions

The current version already requires project delay / production incident questions. It should expand into more incident types:

1. Project delay.
2. Production incident.
3. Customer complaint.
4. Resource conflict.
5. Missed metric target.
6. Requirement priority conflict.

Each question should require the candidate to reconstruct the timeline: discovery, containment, root cause, impact, remediation, and mechanism changes.

### 6. Stronger Offer Sandbox

Candidate negotiation leverage identification has been added. It should continue to expand:

1. Candidate negotiation leverage identification.
2. Competing-offer risk.
3. Joining probability judgment.
4. Salary budget constraints.
5. Team urgency.
6. Alternative candidate situation.
7. Next-round progression strategy.

### 7. Post-Interview Dynamic Calibration

The report already outputs dynamic calibration instructions. A real loop should be built:

1. Record questions that were actually asked.
2. Mark which questions were effective.
3. Mark which judgments were confirmed or disproven.
4. Add effective questions back into the role question library.
5. Feed failed judgments back into prompts or role templates.

### 8. Deployment And Security Enhancements

Not included for now.

This part will be planned separately when the project moves toward online use, multi-user scenarios, or production mini-program model calls.

## Local Run

### Mock Demo

```powershell
cd D:\OfferAgent\apps\web
python -m http.server 5173
```

Open:

```text
http://127.0.0.1:5173/
```

### Local Real-Model Proxy

Prepare a local key file first:

```text
1.md
```

Format:

```text
KEY:your model key
URL:your OpenAI-compatible base URL
```

Start the proxy:

```powershell
cd D:\OfferAgent
python scripts\local_proxy.py --key-file 1.md
```

Page configuration:

```text
Provider: OpenAI-Compatible Proxy / Custom Endpoint
Model: qwen-plus or another compatible model
Base URL: http://127.0.0.1:8787
```

## Tests

Static feature check:

```powershell
python scripts\smoke_test.py
```

Real model API test:

```powershell
python scripts\smoke_test.py --with-llm 1.md --model qwen-plus
```

## Directory Structure

```text
apps/web                 Web MVP
apps/douyin-miniapp      Reserved Douyin mini-program directory, currently unfinished
docs                     Deployment and usage documentation
douyin-assets            Douyin release assets and copy
examples                 Anonymized samples
prompts                  Prompt drafts and generation constraints
schemas                  Structured schemas
scripts                  Local proxy and smoke-test scripts
serverless               Cloudflare Worker proxy example
.github/workflows        GitHub Pages deployment workflow
```

## Privacy And Security

Current first-version principles:

1. No login required.
2. Resumes are not saved by default.
3. JDs are not saved by default.
4. API Keys are not saved by default.
5. Reports are not saved by default.
6. Inputs stored in page memory are lost after refresh or close.

Important reminders:

1. `1.md` is the local model key configuration file and has been added to `.gitignore`.
2. Do not commit real keys to GitHub.
3. Do not show `1.md` in recordings, screenshots, or livestreams.
4. Rotate the key immediately if it appears in a public screen or file.
5. Mini-program or online production environments must call models through a backend proxy and must not place keys in the frontend.
