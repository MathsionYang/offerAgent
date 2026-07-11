const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/model-client.js");
assert.ok(fs.existsSync(modulePath), "model-client.js should exist");

require(modulePath);

const {
  createModelClient,
} = globalThis.OfferAgentModelClient || {};

assert.equal(typeof createModelClient, "function");

const providerDefaults = {
  openai: { baseUrl: "https://api.openai.com/v1" },
  custom: { baseUrl: "" },
};

let capturedRequest = null;
const streamedBlocks = [];
const client = createModelClient({
  providerDefaults,
  fetchImpl: async (endpoint, request) => {
    capturedRequest = { endpoint, request };
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: {
        get: () => "application/json",
      },
      body: null,
      json: async () => ({
        choices: [
          {
            message: {
              content: "  generated report  ",
            },
          },
        ],
      }),
    };
  },
  buildSystemPrompt: (language) => `system:${language}`,
  buildLlmUserPrompt: (input) => `user:${input.model}`,
  streamMarkdownByBlocks: async (content, onDelta, delayMs) => {
    streamedBlocks.push({ content, delayMs });
    onDelta(content);
  },
  cleanReportMarkdown: (content) => content.trim(),
});

assert.equal(
  client.resolveChatCompletionsEndpoint({
    provider: "openai",
    baseUrl: "",
  }),
  "https://api.openai.com/v1/chat/completions",
);
assert.equal(
  client.resolveChatCompletionsEndpoint({
    provider: "custom",
    baseUrl: "http://127.0.0.1:8787/chat/completions/",
  }),
  "http://127.0.0.1:8787/chat/completions",
);
assert.equal(
  client.extractDeltaFromStreamPayload(
    JSON.stringify({ choices: [{ delta: { content: "A" } }] }),
  ),
  "A",
);
assert.equal(
  client.extractDeltaFromStreamPayload(
    JSON.stringify({ choices: [{ message: { content: "B" } }] }),
  ),
  "B",
);
assert.equal(client.extractDeltaFromStreamPayload("not-json"), "");

async function main() {
  const streamedUpdates = [];
  const encoder = new TextEncoder();
  const chunks = [
    encoder.encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n'),
    encoder.encode('data: {"choices":[{"delta":{"content":" world"}}]}\n\ndata: [DONE]\n'),
  ];
  let chunkIndex = 0;
  const streamResponse = {
    body: {
      getReader: () => ({
        read: async () => (
          chunkIndex < chunks.length
            ? { done: false, value: chunks[chunkIndex++] }
            : { done: true, value: undefined }
        ),
      }),
    },
  };
  const streamClient = createModelClient({
    providerDefaults,
    now: (() => {
      let value = 0;
      return () => {
        value += 100;
        return value;
      };
    })(),
  });
  assert.equal(
    await streamClient.readStreamResponse(
      streamResponse,
      (content) => streamedUpdates.push(content),
    ),
    "Hello world",
  );
  assert.equal(streamedUpdates.at(-1), "Hello world");

  const deltas = [];
  const generated = await client.generateWithLLM({
    provider: "openai",
    model: "gpt-test",
    apiKey: "secret-key",
    baseUrl: "",
    language: "en",
  }, (content) => deltas.push(content));

  assert.equal(generated, "generated report");
  assert.equal(capturedRequest.endpoint, "https://api.openai.com/v1/chat/completions");
  assert.equal(capturedRequest.request.method, "POST");
  assert.equal(capturedRequest.request.headers.Authorization, "Bearer secret-key");
  assert.deepEqual(JSON.parse(capturedRequest.request.body), {
    model: "gpt-test",
    messages: [
      { role: "system", content: "system:en" },
      { role: "user", content: "user:gpt-test" },
    ],
    temperature: 0,
    seed: 20260709,
    stream: true,
  });
  assert.deepEqual(streamedBlocks, [
    { content: "  generated report  ", delayMs: 120 },
  ]);
  assert.deepEqual(deltas, ["  generated report  "]);

  let localizationRequest = null;
  let localizationPayload = {
    schema_version: "language-artifact.v3",
    source: "translated",
    report_markdown: "# Candidate Report",
    text_by_id: {
      "question:q_1": "Explain the metric definition",
    },
  };
  const localizationClient = createModelClient({
    providerDefaults,
    fetchImpl: async (endpoint, request) => {
      localizationRequest = { endpoint, request };
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: {
          get: () => "application/json",
        },
        body: null,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify(localizationPayload),
              },
            },
          ],
        }),
      };
    },
  });

  assert.equal(typeof localizationClient.translateGeneratedArtifacts, "function");
  const localizedArtifact = await localizationClient.translateGeneratedArtifacts({
    provider: "custom",
    model: "localization-model",
    apiKey: "localization-key",
    baseUrl: "https://example.test/v1",
    sourceLanguage: "zh",
    targetLanguage: "en",
    reportMarkdown: "# 候选人报告",
    textById: {
      "question:q_1": "请解释指标口径",
    },
  });

  assert.deepEqual(localizedArtifact, localizationPayload);
  assert.equal(
    localizationRequest.endpoint,
    "https://example.test/v1/chat/completions",
  );
  assert.equal(
    localizationRequest.request.headers.Authorization,
    "Bearer localization-key",
  );
  const localizationBody = JSON.parse(localizationRequest.request.body);
  assert.equal(localizationBody.model, "localization-model");
  assert.equal(localizationBody.temperature, 0);
  assert.equal(localizationBody.stream, false);
  assert.deepEqual(localizationBody.response_format, { type: "json_object" });
  assert.match(localizationBody.messages[0].content, /English/);
  assert.match(localizationBody.messages[0].content, /stable ID/);
  assert.match(localizationBody.messages[0].content, /human feedback/i);
  assert.match(localizationBody.messages[0].content, /must remain verbatim/i);
  assert.deepEqual(JSON.parse(localizationBody.messages[1].content), {
    schema_version: "language-artifact.v3",
    source_language: "zh",
    target_language: "en",
    report_markdown: "# 候选人报告",
    text_by_id: {
      "question:q_1": "请解释指标口径",
    },
  });

  let testConnectionRequest = null;
  const testConnectionClient = createModelClient({
    providerDefaults,
    fetchImpl: async (endpoint, request) => {
      testConnectionRequest = { endpoint, request };
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => "application/json" },
        json: async () => ({ choices: [{ message: { content: "OK" } }] }),
      };
    },
    now: (() => {
      let value = 1000;
      return () => {
        value += 25;
        return value;
      };
    })(),
  });
  const connectionResult = await testConnectionClient.testModelConnection({
    provider: "openai",
    model: "gpt-test",
    apiKey: "test-key",
    baseUrl: "",
  });
  assert.equal(connectionResult.ok, true);
  assert.equal(connectionResult.endpoint, "https://api.openai.com/v1/chat/completions");
  assert.equal(connectionResult.sample, "OK");
  assert.equal(testConnectionRequest.request.headers.Authorization, "Bearer test-key");
  const testConnectionBody = JSON.parse(testConnectionRequest.request.body);
  assert.equal(testConnectionBody.stream, false);
  assert.equal(testConnectionBody.max_tokens, 8);

  localizationPayload = {
    schema_version: "language-artifact.v3",
    source: "translated",
    report_markdown: "# Candidate Report",
    text_by_id: {
      "question:q_1": "Explain the metric definition",
      "input:resume": "Translated source text must be rejected",
    },
  };
  await assert.rejects(
    () => localizationClient.translateGeneratedArtifacts({
      provider: "custom",
      model: "localization-model",
      apiKey: "localization-key",
      baseUrl: "https://example.test/v1",
      sourceLanguage: "zh",
      targetLanguage: "en",
      reportMarkdown: "# 候选人报告",
      textById: {
        "question:q_1": "请解释指标口径",
      },
    }),
    /unknown stable ID/i,
  );

  assert.equal(
    client.formatHttpGenerationError(
      { status: 502, statusText: "Bad Gateway" },
      " upstream unavailable ",
    ),
    "HTTP 502 Bad Gateway: upstream unavailable",
  );

  console.log("model-client tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
