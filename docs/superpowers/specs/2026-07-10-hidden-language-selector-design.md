# Hidden Language Selector Design

## Goal

Hide the Chinese / English selector from users and always initialize the application in Chinese, while preserving the existing English projection, translation artifact, caching, report, graph, panel, scorecard, and export capabilities.

## Behavior

1. The `.language-switch` element remains in the DOM but uses the HTML `hidden` attribute.
2. Application initialization explicitly sets the language selector value and `currentLanguage` to `zh`.
3. The English option and the existing `applyLanguage()` flow remain available for future re-enablement or programmatic use.
4. User input preservation and `language-artifact.v3` behavior remain unchanged.

## Implementation

1. Add `hidden` to the language selector label in `apps/web/index.html`.
2. Force the selector value to `zh` before initializing `currentLanguage` in `apps/web/app.js`.
3. Bump the `app.js` cache-busting version in `apps/web/index.html`.

## Tests

1. Add a smoke-test assertion that the language selector uses the HTML `hidden` attribute.
2. Assert that initialization explicitly fixes `currentLanguage` to `zh`.
3. Assert that the English option and language projection functions remain present.
4. Run all JavaScript tests, the Python smoke test, syntax checks, and `git diff --check`.

## Non-Goals

- Removing English translations or language artifacts.
- Deleting the selector or the English option.
- Changing report, graph, panel, scorecard, or export localization behavior.
