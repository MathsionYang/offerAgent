// Input fingerprinting and run-cache helpers kept separate from UI orchestration.
(function initOfferAgentRunCache(global) {
  "use strict";

  const {
    CONSISTENCY_SCHEMA_VERSION,
    RUN_CACHE_PREFIX,
    RUN_CACHE_LIMIT,
    providerDefaults,
    defaultRoleId,
  } = global.OfferAgentData;

  function buildCanonicalInputForFingerprint(input) {
    return {
      schema_version: CONSISTENCY_SCHEMA_VERSION,
      provider: input.provider || "mock",
      model: normalizeFingerprintText(input.model || providerDefaults[input.provider]?.model || ""),
      base_url: normalizeBaseUrlForFingerprint(input.baseUrl || providerDefaults[input.provider]?.baseUrl || ""),
      target_role: input.targetRole || defaultRoleId,
      resume: normalizeFingerprintText(input.resume),
      job_description: normalizeFingerprintText(input.jobDescription),
      company_context: normalizeFingerprintText(input.companyContext),
      candidate_stage: normalizeFingerprintText(input.candidateStage),
      target_level: normalizeFingerprintText(input.targetLevel),
      offer_constraints: normalizeFingerprintText(input.offerConstraints),
      selected_skills: [...(input.selectedSkills || [])].sort(),
      language: input.language || "zh",
      mode: input.useRealModel ? "llm" : "mock",
    };
  }
  
  async function buildInputFingerprint(input) {
    const canonical = stableStringify(buildCanonicalInputForFingerprint(input));
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(canonical);
      const digest = await window.crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    let hash = 0;
    for (let index = 0; index < canonical.length; index += 1) {
      hash = Math.imul(31, hash) + canonical.charCodeAt(index) | 0;
    }
    return `fallback_${Math.abs(hash).toString(16)}`;
  }
  
  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value ?? "");
  }
  
  function normalizeFingerprintText(value) {
    return String(value || "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
  
  function normalizeBaseUrlForFingerprint(value) {
    return normalizeFingerprintText(value).replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
  }
  
  function restoreCachedRun(inputFingerprint) {
    try {
      const raw = localStorage.getItem(`${RUN_CACHE_PREFIX}${inputFingerprint}`);
      if (!raw) return null;
      const run = JSON.parse(raw);
      if (run?.input_fingerprint !== inputFingerprint) return null;
      if (run?.schema_version !== CONSISTENCY_SCHEMA_VERSION) return null;
      return stripRuntimeOnlyCacheFields(run);
    } catch {
      return null;
    }
  }
  
  function persistRunCache(run) {
    if (!run?.input_fingerprint) return;
    try {
      const cacheRun = stripRuntimeOnlyCacheFields({
        ...run,
        cache_status: "stored",
        cached_at: new Date().toISOString(),
      });
      localStorage.setItem(`${RUN_CACHE_PREFIX}${run.input_fingerprint}`, JSON.stringify(cacheRun));
      pruneRunCache();
    } catch {
      // Ignore storage quota and private-mode failures; report generation should still work.
    }
  }
  
  function stripRuntimeOnlyCacheFields(run) {
    const {
      human_feedback,
      feedback_session_history,
      restored_at,
      apiKey,
      ...safeRun
    } = run || {};
    return safeRun;
  }
  
  function pruneRunCache() {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(RUN_CACHE_PREFIX));
    if (keys.length <= RUN_CACHE_LIMIT) return;
    const ordered = keys
      .map((key) => {
        try {
          const run = JSON.parse(localStorage.getItem(key) || "{}");
          return { key, at: run.cached_at || run.created_at || "" };
        } catch {
          return { key, at: "" };
        }
      })
      .sort((a, b) => String(b.at).localeCompare(String(a.at)));
    ordered.slice(RUN_CACHE_LIMIT).forEach((item) => localStorage.removeItem(item.key));
  }

  global.OfferAgentCache = Object.freeze({
    buildCanonicalInputForFingerprint,
    buildInputFingerprint,
    stableStringify,
    normalizeFingerprintText,
    normalizeBaseUrlForFingerprint,
    restoreCachedRun,
    persistRunCache,
    stripRuntimeOnlyCacheFields,
  });
})(window);
