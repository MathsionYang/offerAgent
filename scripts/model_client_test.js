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
