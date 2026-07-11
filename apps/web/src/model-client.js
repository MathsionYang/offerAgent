// OpenAI-compatible chat-completions client with streaming support.
(function initOfferAgentModelClient(global) {
  "use strict";

  const LANGUAGE_ARTIFACT_SCHEMA_VERSION = "language-artifact.v3";

  function createModelClient(dependencies = {}) {
    const providerDefaults = dependencies.providerDefaults || {};
    const fetchImpl = dependencies.fetchImpl || global.fetch?.bind(global);
    const AbortControllerImpl = dependencies.AbortControllerImpl || global.AbortController;
    const TextDecoderImpl = dependencies.TextDecoderImpl || global.TextDecoder;
    const setTimeoutImpl = dependencies.setTimeoutImpl || global.setTimeout?.bind(global);
    const clearTimeoutImpl = dependencies.clearTimeoutImpl || global.clearTimeout?.bind(global);
    const now = dependencies.now || (() => global.performance?.now?.() ?? Date.now());
    const buildSystemPrompt = dependencies.buildSystemPrompt || (() => "");
    const buildLlmUserPrompt = dependencies.buildLlmUserPrompt || (() => "");
    const streamMarkdownByBlocks = dependencies.streamMarkdownByBlocks
      || (async (content, onDelta) => onDelta(content));
    const cleanReportMarkdown = dependencies.cleanReportMarkdown
      || ((content) => String(content || ""));
    const timeoutMs = dependencies.timeoutMs || 90000;

    async function generateWithLLM(input, onDelta = () => {}) {
      const endpoint = resolveChatCompletionsEndpoint(input);
      const body = {
        model: input.model,
        messages: [
          { role: "system", content: buildSystemPrompt(input.language) },
          {
            role: "user",
            content: buildLlmUserPrompt(input),
          },
        ],
        temperature: 0,
        seed: 20260709,
        stream: true,
      };

      if (typeof fetchImpl !== "function") {
        throw new Error("Fetch API is unavailable.");
      }
      if (typeof AbortControllerImpl !== "function") {
        throw new Error("AbortController API is unavailable.");
      }

      const controller = new AbortControllerImpl();
      const timeoutId = setTimeoutImpl?.(() => controller.abort(), timeoutMs);
      let response;

      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        if (timeoutId !== undefined) clearTimeoutImpl?.(timeoutId);
      }

      if (!response.ok) {
        const text = await safeReadResponseText(response);
        throw new Error(formatHttpGenerationError(response, text));
      }

      const contentType = response.headers.get("content-type") || "";
      if (response.body && !contentType.includes("application/json")) {
        const streamed = await readStreamResponse(response, onDelta);
        if (streamed.trim()) return streamed;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("模型返回为空或格式不兼容。");
      }
      await streamMarkdownByBlocks(content, onDelta, 120);
      return cleanReportMarkdown(content);
    }

    async function translateGeneratedArtifacts(input) {
      const endpoint = resolveChatCompletionsEndpoint(input);
      const sourceLanguage = normalizeLanguage(input.sourceLanguage);
      const targetLanguage = normalizeLanguage(input.targetLanguage);
      const textById = validateLocalizationTextMap(input.textById);
      const requestPayload = {
        schema_version: LANGUAGE_ARTIFACT_SCHEMA_VERSION,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        report_markdown: String(input.reportMarkdown || ""),
        text_by_id: textById,
      };
      const body = {
        model: input.model,
        temperature: 0,
        stream: false,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildLocalizationSystemPrompt(targetLanguage),
          },
          {
            role: "user",
            content: JSON.stringify(requestPayload),
          },
        ],
      };

      if (typeof fetchImpl !== "function") {
        throw new Error("Fetch API is unavailable.");
      }
      if (typeof AbortControllerImpl !== "function") {
        throw new Error("AbortController API is unavailable.");
      }

      const controller = new AbortControllerImpl();
      const timeoutId = setTimeoutImpl?.(() => controller.abort(), timeoutMs);
      let response;

      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        if (timeoutId !== undefined) clearTimeoutImpl?.(timeoutId);
      }

      if (!response.ok) {
        const text = await safeReadResponseText(response);
        throw new Error(formatHttpGenerationError(response, text));
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Localization response is empty or incompatible.");
      }

      return parseLanguageArtifactPayload(content, textById);
    }

    async function testModelConnection(input) {
      const startedAt = now();
      const endpoint = resolveChatCompletionsEndpoint(input);
      if (typeof fetchImpl !== "function") {
        throw new Error("Fetch API is unavailable.");
      }
      if (typeof AbortControllerImpl !== "function") {
        throw new Error("AbortController API is unavailable.");
      }
      const controller = new AbortControllerImpl();
      const timeoutId = setTimeoutImpl?.(() => controller.abort(), Math.min(timeoutMs, 15000));
      let response;
      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${input.apiKey}`,
          },
          body: JSON.stringify({
            model: input.model,
            messages: [
              { role: "user", content: "Reply with OK." },
            ],
            temperature: 0,
            max_tokens: 8,
            stream: false,
          }),
          signal: controller.signal,
        });
      } finally {
        if (timeoutId !== undefined) clearTimeoutImpl?.(timeoutId);
      }
      if (!response.ok) {
        const text = await safeReadResponseText(response);
        throw new Error(formatHttpGenerationError(response, text));
      }
      let content = "";
      try {
        const data = await response.json();
        content = data?.choices?.[0]?.message?.content || "";
      } catch {
        content = "";
      }
      return {
        ok: true,
        endpoint,
        latency_ms: Math.max(0, Math.round(now() - startedAt)),
        sample: content.trim().slice(0, 40),
      };
    }

    function normalizeLanguage(language) {
      return language === "en" ? "en" : "zh";
    }

    function validateLocalizationTextMap(textById) {
      if (!textById || typeof textById !== "object" || Array.isArray(textById)) {
        throw new Error("Localization text_by_id must be an object.");
      }
      const normalized = {};
      Object.entries(textById).forEach(([stableId, value]) => {
        if (typeof value !== "string") {
          throw new Error(`Localization value for ${stableId} must be a string.`);
        }
        normalized[stableId] = value;
      });
      return normalized;
    }

    function buildLocalizationSystemPrompt(targetLanguage) {
      const languageName = targetLanguage === "en" ? "English" : "Simplified Chinese";
      return [
        `Translate all system-generated content into ${languageName}.`,
        "Return one JSON object only, with schema_version, source, report_markdown, and text_by_id.",
        "Preserve every stable ID exactly. Do not add, rename, or remove stable IDs.",
        "Preserve markdown structure, numbers, URLs, identifiers, model names, and product names.",
        "Keep quoted resume, JD, company-context, target-level, and offer-constraint excerpts in their original language.",
        "Human feedback values and free-text notes are user-authored source material and must remain verbatim.",
        `Set schema_version to ${LANGUAGE_ARTIFACT_SCHEMA_VERSION} and source to translated.`,
      ].join("\n");
    }

    function parseLanguageArtifactPayload(content, requestedTextById) {
      let payload;
      try {
        payload = JSON.parse(stripJsonFence(String(content || "")));
      } catch {
        throw new Error("Localization response is not valid JSON.");
      }

      if (
        !payload
        || typeof payload !== "object"
        || Array.isArray(payload)
        || payload.schema_version !== LANGUAGE_ARTIFACT_SCHEMA_VERSION
        || typeof payload.report_markdown !== "string"
        || !payload.text_by_id
        || typeof payload.text_by_id !== "object"
        || Array.isArray(payload.text_by_id)
      ) {
        throw new Error("Localization response has an invalid artifact shape.");
      }

      const allowedIds = new Set(Object.keys(requestedTextById));
      const normalizedTextById = {};
      Object.entries(payload.text_by_id).forEach(([stableId, value]) => {
        if (!allowedIds.has(stableId)) {
          throw new Error(`Localization response contains unknown stable ID: ${stableId}`);
        }
        if (typeof value !== "string") {
          throw new Error(`Localization value for ${stableId} must be a string.`);
        }
        normalizedTextById[stableId] = value;
      });

      return {
        schema_version: LANGUAGE_ARTIFACT_SCHEMA_VERSION,
        source: "translated",
        report_markdown: payload.report_markdown,
        text_by_id: normalizedTextById,
      };
    }

    function stripJsonFence(content) {
      return content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    async function safeReadResponseText(response) {
      try {
        return await response.text();
      } catch {
        return "";
      }
    }

    function formatHttpGenerationError(response, bodyText = "") {
      const excerpt = bodyText.replace(/\s+/g, " ").trim().slice(0, 260);
      const statusText = response.statusText ? ` ${response.statusText}` : "";
      return `HTTP ${response.status}${statusText}${excerpt ? `: ${excerpt}` : ""}`;
    }

    async function readStreamResponse(response, onDelta) {
      const reader = response.body.getReader();
      const decoder = new TextDecoderImpl("utf-8");
      let buffer = "";
      let content = "";
      let lastRenderAt = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (!trimmed.startsWith("data:")) {
            content += trimmed;
            continue;
          }

          const payload = trimmed.replace(/^data:\s*/, "");
          if (payload === "[DONE]") continue;

          const delta = extractDeltaFromStreamPayload(payload);
          if (!delta) continue;

          content += delta;
          const currentTime = now();
          if (currentTime - lastRenderAt > 70) {
            onDelta(content);
            lastRenderAt = currentTime;
          }
        }
      }

      if (buffer.trim()) {
        const payload = buffer.trim().replace(/^data:\s*/, "");
        const delta = extractDeltaFromStreamPayload(payload);
        if (delta) content += delta;
      }

      onDelta(content);
      return content;
    }

    function extractDeltaFromStreamPayload(payload) {
      try {
        const data = JSON.parse(payload);
        return data?.choices?.[0]?.delta?.content
          || data?.choices?.[0]?.message?.content
          || "";
      } catch {
        return "";
      }
    }

    function resolveBaseUrl(input) {
      if (input.baseUrl) return input.baseUrl;
      return providerDefaults[input.provider]?.baseUrl
        || providerDefaults.openai?.baseUrl
        || "";
    }

    function resolveChatCompletionsEndpoint(input) {
      const baseUrl = resolveBaseUrl(input).trim().replace(/\/+$/, "");
      return /\/chat\/completions$/i.test(baseUrl)
        ? baseUrl
        : `${baseUrl}/chat/completions`;
    }

    return {
      generateWithLLM,
      translateGeneratedArtifacts,
      testModelConnection,
      formatHttpGenerationError,
      readStreamResponse,
      extractDeltaFromStreamPayload,
      resolveChatCompletionsEndpoint,
    };
  }

  global.OfferAgentModelClient = {
    createModelClient,
  };
})(typeof window !== "undefined" ? window : globalThis);
