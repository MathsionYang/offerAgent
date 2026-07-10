const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const modulePath = path.resolve(__dirname, "../apps/web/src/pdf-export.js");
assert.ok(fs.existsSync(modulePath), "pdf-export.js should exist");

require(modulePath);

const {
  createPdfExport,
} = globalThis.OfferAgentPdfExport || {};

assert.equal(typeof createPdfExport, "function");

function createDownloadDocument() {
  const appended = [];
  const clicked = [];
  const removed = [];
  return {
    appended,
    clicked,
    removed,
    body: {
      appendChild(node) {
        appended.push(node);
      },
    },
    createElement(tagName) {
      assert.equal(tagName, "a");
      return {
        href: "",
        download: "",
        click() {
          clicked.push(this.download);
        },
        remove() {
          removed.push(this.download);
        },
      };
    },
  };
}

const objectUrls = [];
const revokedUrls = [];
const documentStub = createDownloadDocument();
const urlApi = {
  createObjectURL(blob) {
    objectUrls.push(blob);
    return `blob:test-${objectUrls.length}`;
  },
  revokeObjectURL(url) {
    revokedUrls.push(url);
  },
};

const pdfExport = createPdfExport({
  document: documentStub,
  window: {},
  URL: urlApi,
});

assert.equal(pdfExport.escapeXml(`<style>&"</style>`), "&lt;style&gt;&amp;\"&lt;/style&gt;");
assert.deepEqual(
  Array.from(pdfExport.dataUrlToBytes("data:image/jpeg;base64,AQID")),
  [1, 2, 3],
);

(async () => {
  const pdfBlob = pdfExport.createPdfBlobFromJpegs([
    {
      bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
      width: 10,
      height: 20,
    },
  ]);
  assert.equal(pdfBlob.type, "application/pdf");
  const header = Buffer.from(await pdfBlob.arrayBuffer()).subarray(0, 8).toString("latin1");
  assert.equal(header, "%PDF-1.4");

  pdfExport.downloadFile("report.md", "# Report", "text/markdown");
  assert.equal(documentStub.appended.length, 1);
  assert.deepEqual(documentStub.clicked, ["report.md"]);
  assert.deepEqual(documentStub.removed, ["report.md"]);
  assert.deepEqual(revokedUrls, ["blob:test-1"]);
  assert.equal(objectUrls[0].type, "text/markdown");

  const statuses = [];
  const printWrites = [];
  let printCalls = 0;
  const printDocument = {
    open() {},
    write(value) {
      printWrites.push(value);
    },
    close() {},
  };
  const fallbackExport = createPdfExport({
    document: {
      body: {
        appendChild() {
          throw new Error("iframe renderer unavailable");
        },
      },
      createElement(tagName) {
        assert.equal(tagName, "iframe");
        return {
          setAttribute() {},
          style: {},
          remove() {},
        };
      },
    },
    window: {
      open() {
        return {
          document: printDocument,
          print() {
            printCalls += 1;
          },
        };
      },
    },
    setStatus(message, isError = false) {
      statuses.push({ message, isError });
    },
    getText() {
      return {
        statusPdf: "Preparing PDF",
        statusPdfFallback: "Using print fallback",
        statusPopupBlocked: "Popup blocked",
        statusPrintWindow: "Print window opened",
        statusDownloaded: (filename) => `Downloaded ${filename}`,
      };
    },
    reportToStaticHtmlDocument() {
      return "<html><head></head><body><main>Report</main></body></html>";
    },
    logError() {},
  });

  await fallbackExport.downloadPdfReport({}, "candidate", "candidate.pdf");
  assert.deepEqual(statuses, [
    { message: "Preparing PDF", isError: false },
    { message: "Using print fallback", isError: true },
    { message: "Print window opened", isError: false },
  ]);
  assert.equal(printWrites.length, 1);
  assert.ok(printWrites[0].includes("candidate.pdf"));
  assert.ok(printWrites[0].includes("window.print()"));
  assert.equal(printCalls, 0, "print is scheduled by the generated window script");

  console.log("pdf-export tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
