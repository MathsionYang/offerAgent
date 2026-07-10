# Unified Language Projection Design

## Goal

Make language switching update every system-generated output surface while preserving all user-entered text exactly as entered.

The affected output surfaces are:

- Live candidate, interviewer, and Offer reports.
- Evidence graph.
- Virtual interview panel.
- Decision summary.
- Interviewer scorecard.
- PDF content, title, metadata, and filename.

## Product Invariants

1. Resume, JD, company context, Offer constraints, target-level text, API configuration, and other user-entered values are never translated or overwritten.
2. Switching language does not regenerate the assessment, change evidence classification, change decisions, or change the input fingerprint.
3. Source excerpts quoted inside reports and graph details remain in their original language.
4. System labels, analysis, recommendations, questions, risk descriptions, panel statements, feedback summaries, and export chrome follow the currently selected language.
5. Switching back to a previously used language reuses cached localized artifacts.

## Architecture

### Canonical run

`currentRun` remains the canonical assessment state. Existing structured fields and `input_snapshot` remain the source of truth.

The canonical run gains:

```js
localized_artifacts: {
  zh: {
    schema_version: "language-artifact.v1",
    source: "generated" | "translated" | "projected",
    report_markdown: "...",
    text_by_id: {
      "question:q_1": "...",
      "risk:risk_1": "...",
      "panel:round_1:agent_hr": "...",
      "moderator:final_recommendation": "..."
    }
  },
  en: { ... }
}
```

The artifact cache contains only system-generated text. It must not contain API keys or translated copies of raw user input fields.

### Language projection module

Add `apps/web/src/localized-run-view.js`.

It exposes:

- `projectRunForLanguage(run, language)`
- `collectTranslatableArtifacts(run)`
- `mergeLocalizedArtifacts(run, language, artifact)`
- `isSourceExcerptField(fieldName)`
- `resolveLocalizedText(run, language, stableId, fallback)`

`projectRunForLanguage` returns a display-only clone. It localizes enums and replaces system-generated text using stable IDs while leaving source evidence fields unchanged.

All output modules receive the projected run rather than mutating or directly rendering the canonical run.

## Translation Strategy

### Mock and deterministic output

Mock runs use existing Chinese and English builders. The application builds and caches the target-language report locally without an external request.

Structured enums and known template text are localized through the existing localization mappers.

### Real-model output

When a target-language artifact is missing:

1. Collect only system-generated text into a stable-ID JSON payload.
2. Send one non-streaming localization request through the existing model client.
3. Instruct the model to:
   - Return JSON only.
   - Preserve every stable ID.
   - Preserve numbers, URLs, identifiers, markdown structure, and product names.
   - Never translate quoted resume, JD, company-context, target-level, or Offer-constraint excerpts.
4. Validate the response shape.
5. Merge valid translated entries into `localized_artifacts[targetLanguage]`.
6. Persist the run cache.

If translation fails, static UI and deterministic enum localization still switch. The report keeps its source-language artifact and the status area shows a localization failure message. No canonical assessment data is changed.

## Language Switch Flow

`applyLanguage` becomes asynchronous.

1. Set `currentLanguage` and immediately update static UI controls.
2. If there is no current run, finish normally.
3. Disable the language selector and show a localization progress status.
4. Resolve or create the target-language artifact.
5. Build a projected run for the selected language.
6. Re-render:
   - Report preview.
   - Decision summary.
   - Scorecard.
   - Evidence graph.
   - Virtual panel.
7. Re-enable the language selector.

A monotonically increasing request token prevents a slower earlier translation from overwriting a newer language selection.

## Module Changes

### Report builders

- Select builders from the current display language, not `input_snapshot.language`.
- Use the localized report artifact for extracted generated sections.
- Continue using raw input snapshot fields for quoted evidence.

### Evidence graph

- Localize node labels and summaries through projected node IDs.
- Preserve `source_excerpt`, resume evidence, JD evidence, and other user-source metadata.
- Reapply active search and filters after language switching.

### Virtual panel

- Localize role names, focus, stance, stage, impact, claims, and moderator summaries.
- Preserve trace IDs and evidence references.

### Decision summary and scorecard

- Localize generated questions, recommendations, feedback summaries, and status text.
- Preserve resume and JD evidence excerpts.

### PDF export

- Export the projected run for `currentLanguage`.
- Use current-language titles, metadata labels, date locale, and filenames.
- Do not use `input_snapshot.language` as the export language.

### Cache

- Input fingerprint remains unchanged.
- `localized_artifacts` may be persisted with the run.
- Runtime credentials remain excluded.

## Error Handling

- Invalid localization JSON is rejected without partially mutating the run.
- Missing translated IDs fall back to the original system text and are reported as incomplete localization.
- Source excerpts are checked before merge so translated payloads cannot overwrite them.
- Language selection is re-enabled in `finally`.

## Testing

### Unit tests

- Projection preserves every user-input field byte-for-byte.
- Projection localizes system enums and stable-ID text.
- Missing artifacts fall back safely.
- Artifact merge rejects source-input fields and unknown shapes.
- Report builders follow display language rather than generation language.
- Graph nodes preserve source excerpts while localizing generated summaries.
- Panel messages and scorecard questions use localized artifact values.
- PDF template uses current display language.
- Translation payload excludes user-input fields.
- Repeated language switches reuse cached artifacts.

### Browser regression

Test both directions:

- Generate Chinese, switch to English, switch back to Chinese.
- Generate English, switch to Chinese, switch back to English.

For each direction verify:

- Input fields are unchanged.
- Report, graph, panel, summary, scorecard, and export controls switch language.
- Graph search still works after re-render.
- No mixed-language system headings remain.
- No console errors or horizontal overflow occur.

## Non-Goals

- Translating user-entered content.
- Re-evaluating the candidate when language changes.
- Changing the assessment schema or decision rules.
- Translating API errors returned directly by third-party providers beyond the existing error wrapper.

