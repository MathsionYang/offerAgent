# Low-Risk UX Enhancements Design

## Goal

Improve first-use clarity and evidence-graph navigation without changing report generation, model prompts, structured evaluation data, cache fingerprints, PDF export, or feedback behavior.

## Scope

This batch contains two independent enhancements:

1. Input readiness feedback for resume, JD, and selected interviewer roles.
2. Keyword search combined with the existing evidence-graph type filters.

Report outline navigation, feedback persistence, committee filtering, and Offer scenario comparison remain outside this batch because they touch broader state or rendering flows.

## Input Readiness

### User behavior

- The page shows a compact readiness strip above the generate action.
- Resume and JD items show character counts.
- Empty required inputs are marked missing.
- Non-empty inputs below 80 characters are marked as limited context, but generation remains available.
- Inputs with at least 80 characters are marked ready.
- The interviewer-role item shows the number of selected roles and warns when none are selected.
- Filling the sample, clearing the page, typing, changing roles, or changing language refreshes the strip immediately.

### Technical design

- Add `apps/web/src/input-readiness.js`.
- Expose a pure `evaluateInputReadiness` function for tests.
- Expose a small renderer that receives the target element and escaped labels.
- Keep the existing generation validation in `app.js`; the new module is advisory and does not alter request payloads.
- Load the module before `app.js`.

## Evidence Graph Search

### User behavior

- Add a search field beside the existing graph type filters.
- Search matches node label, summary, localized type label, and raw node type.
- Keyword search and type filters apply together.
- Display `matched / total` counts.
- Display a clear empty-result message when no nodes match.
- Clearing the search restores the currently selected type filter.

### Technical design

- Keep search state inside the graph-view instance.
- Add a pure node-matching helper for unit tests.
- Store searchable node text in data attributes during rendering.
- Replace the current type-only DOM filter with one combined filter application.
- Do not change evidence-graph schemas or graph construction.

## Localization

- All new visible copy has Chinese and English variants.
- Existing language switching re-renders readiness text and the evidence graph.
- Search uses normalized case-insensitive matching for both languages.

## Testing

- Add unit tests for empty, limited, and ready input states.
- Add graph-view tests for keyword matching, type matching, and combined matching.
- Extend static smoke checks to verify the new module, DOM target, and graph search controls.
- Run every existing JavaScript module test and the Python smoke suite.

## Non-Goals

- No local draft persistence.
- No change to the generate button enabled state.
- No arbitrary scoring or AI confidence calculation.
- No report Markdown, PDF, prompt, schema, or cache changes.

