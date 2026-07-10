// Browser-side PDF rendering, binary assembly, downloads, and print fallback.
(function initOfferAgentPdfExport(global) {
  "use strict";

  function createPdfExport(dependencies = {}) {
    const root = typeof globalThis !== "undefined" ? globalThis : global;
    const documentRef = dependencies.document || root.document;
    const windowRef = dependencies.window || root.window || root;
    const urlApi = dependencies.URL || root.URL;
    const BlobCtor = dependencies.Blob || root.Blob;
    const ImageCtor = dependencies.Image || root.Image;
    const XMLSerializerCtor = dependencies.XMLSerializer || root.XMLSerializer;
    const TextEncoderCtor = dependencies.TextEncoder || root.TextEncoder;
    const atobFn = dependencies.atob || root.atob;
    const requestFrame = dependencies.requestAnimationFrame
      || root.requestAnimationFrame
      || ((callback) => setTimeout(callback, 0));
    const setStatus = dependencies.setStatus || (() => {});
    const getText = dependencies.getText || (() => ({}));
    const reportToStaticHtmlDocument = dependencies.reportToStaticHtmlDocument || (() => "");
    const logError = dependencies.logError || ((error) => console.error(error));

    function downloadFile(filename, content, type) {
      const blob = new BlobCtor([content], { type });
      downloadBlob(filename, blob);
    }

    async function downloadPdfReport(run, audience, filename) {
      setStatus(getText().statusPdf);
      try {
        const html = reportToStaticHtmlDocument(run, audience);
        const pdfBlob = await renderHtmlDocumentToPdfBlob(html);
        downloadBlob(filename, pdfBlob);
        setStatus(getText().statusDownloaded(filename));
      } catch (error) {
        logError(error);
        setStatus(getText().statusPdfFallback, true);
        openPdfPrintWindow(reportToStaticHtmlDocument(run, audience), filename);
      }
    }

    // Render the static report in an isolated iframe before slicing it into A4 pages.
    async function renderHtmlDocumentToPdfBlob(html) {
      const iframe = documentRef.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.left = "-10000px";
      iframe.style.top = "0";
      iframe.style.width = "920px";
      iframe.style.height = "1200px";
      iframe.style.border = "0";
      iframe.srcdoc = html;
      documentRef.body.appendChild(iframe);

      try {
        await waitForIframeLoad(iframe);
        const doc = iframe.contentDocument;
        const page = doc?.querySelector(".page");
        const styleText = Array.from(doc?.querySelectorAll("style") || [])
          .map((style) => style.textContent || "")
          .join("\n");
        if (!doc || !page) throw new Error("PDF render source is unavailable.");

        await waitForLayout();
        const widthPx = Math.ceil(page.getBoundingClientRect().width || 920);
        const pageHeightPx = Math.round(widthPx * 297 / 210);
        const totalHeightPx = Math.ceil(page.scrollHeight);
        const pageCount = Math.max(1, Math.ceil(totalHeightPx / pageHeightPx));
        const serializedPage = new XMLSerializerCtor().serializeToString(page.cloneNode(true));
        const images = [];

        for (let index = 0; index < pageCount; index += 1) {
          const offset = index * pageHeightPx;
          const height = Math.min(pageHeightPx, totalHeightPx - offset);
          images.push(await renderSvgPageToJpeg({
            serializedPage,
            styleText,
            widthPx,
            pageHeightPx,
            contentHeightPx: Math.max(height, 1),
            offset,
          }));
        }

        return createPdfBlobFromJpegs(images);
      } finally {
        iframe.remove();
      }
    }

    function waitForIframeLoad(iframe) {
      return new Promise((resolve, reject) => {
        const timeout = windowRef.setTimeout(
          () => reject(new Error("PDF render iframe timed out.")),
          8000,
        );
        iframe.addEventListener("load", () => {
          windowRef.clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }

    function waitForLayout() {
      return new Promise((resolve) => {
        requestFrame(() => requestFrame(resolve));
      });
    }

    // Convert one vertically translated report slice into a JPEG page.
    async function renderSvgPageToJpeg({
      serializedPage,
      styleText,
      widthPx,
      pageHeightPx,
      contentHeightPx,
      offset,
    }) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${pageHeightPx}" viewBox="0 0 ${widthPx} ${pageHeightPx}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${widthPx}px;height:${pageHeightPx}px;overflow:hidden;background:#ffffff;">
            <style>${escapeXml(styleText)}
              html, body { margin: 0 !important; background: #ffffff !important; }
              .page { width: ${widthPx}px !important; max-width: ${widthPx}px !important; margin: 0 !important; }
            </style>
            <div style="width:${widthPx}px;min-height:${contentHeightPx}px;transform:translateY(-${offset}px);transform-origin:top left;">
              ${serializedPage}
            </div>
          </div>
        </foreignObject>
      </svg>`;
      const svgBlob = new BlobCtor([svg], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = urlApi.createObjectURL(svgBlob);
      const image = new ImageCtor();
      image.decoding = "async";
      image.src = svgUrl;

      try {
        if (image.decode) {
          await image.decode();
        } else {
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
          });
        }

        const canvas = documentRef.createElement("canvas");
        canvas.width = widthPx;
        canvas.height = pageHeightPx;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        return {
          bytes: dataUrlToBytes(dataUrl),
          width: canvas.width,
          height: canvas.height,
        };
      } finally {
        urlApi.revokeObjectURL(svgUrl);
      }
    }

    // Build a minimal PDF object graph with one full-page JPEG per page.
    function createPdfBlobFromJpegs(images) {
      const encoder = new TextEncoderCtor();
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const objects = [];
      objects[1] = { text: "<< /Type /Catalog /Pages 2 0 R >>" };
      objects[2] = { text: "" };
      const pageObjectNumbers = [];
      let nextObjectNumber = 3;

      images.forEach((image, index) => {
        const imageObjectNumber = nextObjectNumber;
        objects[nextObjectNumber] = {
          dict: `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>`,
          stream: image.bytes,
        };
        nextObjectNumber += 1;

        const content = encoder.encode(`q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im${index + 1} Do Q`);
        const contentObjectNumber = nextObjectNumber;
        objects[nextObjectNumber] = {
          dict: `<< /Length ${content.length} >>`,
          stream: content,
        };
        nextObjectNumber += 1;

        const pageObjectNumber = nextObjectNumber;
        pageObjectNumbers.push(pageObjectNumber);
        objects[nextObjectNumber] = {
          text: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im${index + 1} ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
        };
        nextObjectNumber += 1;
      });

      objects[2] = {
        text: `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`,
      };

      const chunks = [];
      const offsets = [0];
      let byteLength = 0;
      const pushAscii = (text) => {
        const bytes = encoder.encode(text);
        chunks.push(bytes);
        byteLength += bytes.length;
      };
      const pushBytes = (bytes) => {
        chunks.push(bytes);
        byteLength += bytes.length;
      };

      pushAscii("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
      for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
        const object = objects[objectNumber];
        offsets[objectNumber] = byteLength;
        pushAscii(`${objectNumber} 0 obj\n`);
        if (object.stream) {
          pushAscii(`${object.dict}\nstream\n`);
          pushBytes(object.stream);
          pushAscii("\nendstream\nendobj\n");
        } else {
          pushAscii(`${object.text}\nendobj\n`);
        }
      }

      const xrefOffset = byteLength;
      pushAscii(`xref\n0 ${objects.length}\n`);
      pushAscii("0000000000 65535 f \n");
      for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
        pushAscii(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`);
      }
      pushAscii(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

      return new BlobCtor(chunks, { type: "application/pdf" });
    }

    function dataUrlToBytes(dataUrl) {
      const base64 = dataUrl.split(",")[1] || "";
      const binary = atobFn(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return bytes;
    }

    function escapeXml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
    }

    function downloadBlob(filename, blob) {
      const url = urlApi.createObjectURL(blob);
      const link = documentRef.createElement("a");
      link.href = url;
      link.download = filename;
      documentRef.body.appendChild(link);
      link.click();
      link.remove();
      urlApi.revokeObjectURL(url);
    }

    // Keep printing as a last-resort path for browsers that reject SVG rendering.
    function openPdfPrintWindow(html, filename) {
      const pdfHtml = html.replace(
        "</head>",
        `<script>window.__offerAgentPdfName = ${JSON.stringify(filename)};</script></head>`,
      );
      const printWindow = windowRef.open("", "_blank", "width=1180,height=900");
      if (!printWindow) {
        setStatus(getText().statusPopupBlocked, true);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(
        pdfHtml.replace(
          "</body>",
          `<script>
            window.addEventListener("load", () => {
              document.title = (window.__offerAgentPdfName || ${JSON.stringify(filename)}).replace(/\\.pdf$/i, "");
              setTimeout(() => window.print(), 400);
            });
          </script></body>`,
        ),
      );
      printWindow.document.close();
      setStatus(getText().statusPrintWindow);
    }

    return {
      downloadFile,
      downloadPdfReport,
      renderHtmlDocumentToPdfBlob,
      waitForIframeLoad,
      waitForLayout,
      renderSvgPageToJpeg,
      createPdfBlobFromJpegs,
      dataUrlToBytes,
      escapeXml,
      downloadBlob,
      openPdfPrintWindow,
    };
  }

  global.OfferAgentPdfExport = {
    createPdfExport,
  };
})(typeof window !== "undefined" ? window : globalThis);
