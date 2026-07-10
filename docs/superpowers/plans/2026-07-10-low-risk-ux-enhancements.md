# Low-Risk UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add input readiness feedback and combined evidence-graph keyword filtering without changing report generation behavior.

**Architecture:** A new input-readiness module owns pure readiness evaluation and compact DOM rendering. The existing graph-view module gains pure matching logic and keeps combined filter state inside each view instance.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js assertion tests, Python smoke checks.

---

### Task 1: Input readiness module

**Files:**
- Create: `apps/web/src/input-readiness.js`
- Create: `scripts/input_readiness_test.js`
- Modify: `apps/web/index.html`
- Modify: `apps/web/app.js`
- Modify: `apps/web/styles.css`

- [ ] Write tests covering missing, limited, and ready inputs plus role counts.
- [ ] Run `node scripts/input_readiness_test.js` and verify failure because the module does not exist.
- [ ] Implement the pure readiness evaluator and renderer.
- [ ] Add the readiness target to the generate section and load the module before `app.js`.
- [ ] Bind resume, JD, role, sample, clear, and language changes to refresh readiness.
- [ ] Run `node scripts/input_readiness_test.js` and verify it passes.

### Task 2: Evidence graph search

**Files:**
- Modify: `apps/web/src/graph-view.js`
- Modify: `scripts/graph_view_test.js`
- Modify: `apps/web/styles.css`

- [ ] Add failing tests for keyword-only, type-only, and combined node matching.
- [ ] Run `node scripts/graph_view_test.js` and verify failure because matching APIs are missing.
- [ ] Add localized search controls and result-count copy.
- [ ] Implement combined search and type filtering without changing graph data.
- [ ] Add no-result and responsive search styles.
- [ ] Run `node scripts/graph_view_test.js` and verify it passes.

### Task 3: Regression coverage and documentation

**Files:**
- Modify: `scripts/smoke_test.py`
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/gap-analysis.md`
- Modify: `开发路线.md`

- [ ] Add static checks for the input-readiness module and graph search.
- [ ] Document the two delivered enhancements and update the remaining gaps.
- [ ] Run `python scripts/smoke_test.py`.
- [ ] Review `git diff` and confirm unrelated working-tree changes remain untouched.

