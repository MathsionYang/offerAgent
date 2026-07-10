// Static HTML report document and PDF summary card builders.
(function initOfferAgentReportExportTemplate(global) {
  "use strict";

  function createReportExportTemplate(dependencies = {}) {
    const {
      i18n = { zh: { pdfTitles: { full: ["Report", "Report"] } } },
      getRunLanguage = () => "zh",
      buildAudienceMarkdown = () => "",
      markdownToHtml = (value) => value || "",
      escapeHtml = (value) => String(value ?? ""),
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
      buildRequirementEvidenceRows = () => [],
      buildGateAssessment = () => ({ result: "", enterSandbox: false }),
      buildInterviewerRecommendation = () => ({ level: "" }),
      buildOfferLeverage = () => ({ rating: "" }),
      extractSection = () => "",
      translateGateResult = (value) => value || "",
      translateCapability = (value) => value || "",
    } = dependencies;

    function reportToStaticHtmlDocument(run, audience = "full", options = {}) {
      const markdown = buildAudienceMarkdown(run, audience);
      const language = getRunLanguage(run);
      const text = i18n[language] || i18n.zh;
      const createdAt = new Date(run.created_at).toLocaleString(language === "en" ? "en-US" : "zh-CN");
      const [reportTitle, reportEyebrow] = text.pdfTitles[audience] || text.pdfTitles.full;
      const printFilename = options.printFilename || `${reportTitle}.pdf`;
      const autoPrintScript = options.autoPrint
        ? `<script>
          window.addEventListener("load", () => {
            document.title = ${JSON.stringify(printFilename.replace(/\.pdf$/i, ""))};
            window.setTimeout(() => window.print(), 400);
          });
        </script>`
        : "";
      const pdfSummaryCards = buildPdfSummaryCards(run, audience);
      return `<!doctype html>
    <html lang="${language === "en" ? "en" : "zh-CN"}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${reportTitle}</title>
        <style>
          :root {
            color-scheme: dark;
            --bg: #0b0f19;
            --panel: rgba(23, 32, 53, 0.65);
            --panel-border: rgba(255, 255, 255, 0.08);
            --ink: #e2e8f0;
            --muted: #94a3b8;
            --brand: #00f2fe;
            --brand-glow: rgba(0, 242, 254, 0.15);
            --brand-grad: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
            --accent: #ff9f43;
            --accent-soft: rgba(255, 159, 67, 0.1);
            --good-bg: rgba(16, 185, 129, 0.15);
            --good-color: #10b981;
            --warn-bg: rgba(245, 158, 11, 0.15);
            --warn-color: #f59e0b;
            --risk-bg: rgba(239, 68, 68, 0.15);
            --risk-color: #ef4444;
          }

          * {
            box-sizing: border-box;
          }

          body {
            background-color: var(--bg);
            background-image:
              radial-gradient(circle at 80% 20%, rgba(79, 172, 254, 0.15), transparent 40rem),
              radial-gradient(circle at 10% 80%, rgba(255, 159, 67, 0.08), transparent 35rem),
              linear-gradient(rgba(255, 255, 255, 0.005) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.005) 1px, transparent 1px);
            background-size: 100% 100%, 100% 100%, 30px 30px, 30px 30px;
            color: var(--ink);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
            line-height: 1.8;
            margin: 0;
          }

          .page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 24px 60px;
          }

          .cover {
            position: relative;
            border: 1px solid var(--panel-border);
            border-radius: 24px;
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            margin-bottom: 24px;
            padding: 40px;
            overflow: hidden;
          }

          .cover::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: var(--brand-grad);
          }

          .eyebrow {
            color: var(--brand);
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin: 0 0 12px;
            display: inline-block;
            background: rgba(0, 242, 254, 0.1);
            padding: 4px 12px;
            border-radius: 30px;
            border: 1px solid rgba(0, 242, 254, 0.2);
          }

          h1 {
            color: #ffffff;
            font-size: 38px;
            font-weight: 800;
            line-height: 1.22;
            margin: 0;
            letter-spacing: 1px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
          }

          .meta {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin-top: 30px;
          }

          .meta div {
            border: 1px solid var(--panel-border);
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.02);
            padding: 16px 20px;
            transition: all 0.3s ease;
          }

          .meta div:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(0, 242, 254, 0.3);
            transform: translateY(-2px);
          }

          .meta span {
            display: block;
            color: var(--muted);
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .meta strong {
            display: block;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
          }

          .report-body {
            border: 1px solid var(--panel-border);
            border-radius: 24px;
            background: var(--panel);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
          }

          h2 {
            display: none;
          }

          h3 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 45px 0 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
          }

          h3::before {
            content: "";
            display: inline-block;
            width: 6px;
            height: 22px;
            background: var(--brand-grad);
            margin-right: 12px;
            border-radius: 4px;
            box-shadow: 0 0 10px var(--brand);
          }

          h4 {
            border-left: 0;
            background: linear-gradient(90deg, rgba(79, 172, 254, 0.15), transparent);
            border-radius: 8px;
            color: var(--brand);
            font-size: 15px;
            font-weight: 600;
            margin: 20px 0 12px;
            padding: 10px 16px;
            border: 1px solid rgba(79, 172, 254, 0.2);
          }

          p,
          li {
            color: #cbd5e1;
            font-size: 14px;
          }

          p {
            margin: 10px 0 16px;
          }

          ul {
            margin: 10px 0 16px 20px;
            padding: 0;
          }

          li {
            margin-bottom: 6px;
          }

          .table-wrap {
            overflow-x: auto;
            border: 1px solid var(--panel-border);
            border-radius: 16px;
            margin: 18px 0 30px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            background: rgba(15, 23, 42, 0.4);
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
            text-align: left;
          }

          thead {
            background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
          }

          th,
          td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding: 16px 20px;
            text-align: left;
            vertical-align: top;
          }

          th {
            color: #ffffff;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          tbody tr:nth-child(even) {
            background: rgba(255, 255, 255, 0.01);
          }

          tbody tr:hover {
            background: rgba(0, 242, 254, 0.04) !important;
          }

          td:first-child {
            color: #ffffff;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.01);
          }

          .tone-good,
          .tone-warn,
          .tone-risk {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
            line-height: 1.4;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }

          td.tone-good,
          td.tone-warn,
          td.tone-risk {
            display: table-cell;
            border-radius: 0;
            box-shadow: none;
          }

          .tone-good {
            background-color: var(--good-bg) !important;
            color: var(--good-color) !important;
            border-left: 4px solid var(--good-color);
          }

          .tone-warn {
            background-color: var(--warn-bg) !important;
            color: var(--warn-color) !important;
            border-left: 4px solid var(--warn-color);
          }

          .tone-risk {
            background-color: var(--risk-bg) !important;
            color: var(--risk-color) !important;
            border-left: 4px solid var(--risk-color);
          }

          .table-wrap::-webkit-scrollbar {
            height: 8px;
          }

          .table-wrap::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
          }

          .table-wrap::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }

          .table-wrap::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 242, 254, 0.3);
          }

          :root {
            color-scheme: light;
            --bg: #f3f6fa;
            --panel: #ffffff;
            --panel-border: #d8e0ea;
            --ink: #1e293b;
            --muted: #64748b;
            --brand: #2a8fb1;
            --brand-glow: rgba(42, 143, 177, 0.12);
            --brand-grad: linear-gradient(135deg, #2a8fb1 0%, #0f6f8f 100%);
            --accent: #b7791f;
            --accent-soft: #fff7e6;
            --good-bg: #eaf8f0;
            --good-color: #166534;
            --warn-bg: #fff7e6;
            --warn-color: #92400e;
            --risk-bg: #fff1f2;
            --risk-color: #b42318;
          }

          body {
            background: #f3f6fa;
            color: var(--ink);
          }

          .page {
            max-width: 1100px;
            padding: 28px 20px 44px;
          }

          .cover {
            border-color: var(--panel-border);
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
            padding: 28px 30px;
          }

          .cover::before {
            height: 5px;
          }

          .eyebrow {
            border-color: #d7edf5;
            border-radius: 999px;
            background: #eef9fc;
            color: var(--brand);
          }

          h1 {
            color: #0f172a;
            font-size: 31px;
            letter-spacing: 0;
            text-shadow: none;
          }

          .meta {
            gap: 12px;
            margin-top: 22px;
          }

          .meta div {
            border-color: #d8e0ea;
            border-radius: 8px;
            background: #f8fafc;
            padding: 12px 14px;
          }

          .meta div:hover {
            background: #f8fafc;
            border-color: #d8e0ea;
            transform: none;
          }

          .meta strong {
            color: #0f172a;
          }

          .report-body {
            border-color: var(--panel-border);
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
            padding: 30px;
          }

          h3 {
            border-bottom-color: #dbe4ef;
            color: #0f172a;
            font-size: 19px;
            margin: 30px 0 14px;
            padding-bottom: 9px;
          }

          h3::before {
            width: 4px;
            height: 18px;
            background: var(--brand-grad);
            box-shadow: none;
          }

          h4 {
            border-color: #d7edf5;
            background: #eef9fc;
            color: #0f6f8f;
          }

          p,
          li {
            color: #334155;
          }

          .table-wrap {
            border-color: #d8e0ea;
            border-radius: 8px;
            background: #ffffff;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          }

          table {
            border-collapse: collapse;
            background: #ffffff;
            color: #1e293b;
          }

          thead {
            background: #eaf2f7;
            color: #0f172a;
          }

          th,
          td {
            border-bottom-color: #e5edf5;
            padding: 11px 13px;
          }

          th {
            color: #0f172a;
            letter-spacing: 0;
            text-transform: none;
          }

          tbody tr:nth-child(even) {
            background: #f8fafc;
          }

          tbody tr:hover {
            background: #eef8fb !important;
          }

          td:first-child {
            background: transparent;
            color: #0f172a;
          }

          .tone-good,
          .tone-warn,
          .tone-risk {
            box-shadow: none;
          }

          :root {
            --report-brand-h: 255;
            --report-brand: oklch(48% 0.14 var(--report-brand-h));
            --report-brand-strong: oklch(36% 0.16 var(--report-brand-h));
            --report-brand-subtle: oklch(93% 0.025 var(--report-brand-h));
            --report-accent: oklch(65% 0.18 75);
            --report-surface: #ffffff;
            --report-bg: oklch(95.5% 0.01 var(--report-brand-h));
            --report-border: oklch(87% 0.015 var(--report-brand-h));
            --report-text: oklch(16% 0.012 var(--report-brand-h));
            --report-secondary: oklch(38% 0.018 var(--report-brand-h));
            --report-muted: oklch(55% 0.015 var(--report-brand-h));
            --report-good: oklch(52% 0.15 160);
            --report-warn: oklch(55% 0.17 80);
            --report-risk: oklch(48% 0.18 28);
          }

          body {
            display: flex;
            align-items: flex-start;
            justify-content: center;
            background:
              radial-gradient(ellipse 80% 50% at 85% 10%, oklch(48% 0.14 var(--report-brand-h) / 0.035), transparent 50rem),
              radial-gradient(ellipse 60% 40% at 15% 90%, oklch(65% 0.18 75 / 0.025), transparent 45rem),
              var(--report-bg);
            color: var(--report-text);
            font-size: 15px;
            line-height: 1.7;
            min-height: 100vh;
            padding: 32px 20px;
          }

          .page {
            display: flex;
            flex-direction: column;
            gap: 24px;
            max-width: 1280px;
            width: 100%;
            padding: 0;
          }

          .cover {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--report-border);
            border-radius: 20px;
            background: var(--report-surface);
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04);
            padding: 40px 40px 32px;
          }

          .cover::before {
            content: "";
            position: absolute;
            inset: 0 0 auto;
            height: 4px;
            background: linear-gradient(90deg, var(--report-brand), oklch(52% 0.16 calc(var(--report-brand-h) + 20)), var(--report-accent));
            border-radius: 20px 20px 0 0;
          }

          .cover::after {
            content: "";
            position: absolute;
            top: -80px;
            right: -80px;
            width: 200px;
            height: 200px;
            border-radius: 999px;
            background: radial-gradient(circle, oklch(48% 0.14 var(--report-brand-h) / 0.12), transparent 70%);
            pointer-events: none;
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: 1px solid oklch(48% 0.14 var(--report-brand-h) / 0.12);
            border-radius: 999px;
            background: var(--report-brand-subtle);
            color: var(--report-brand);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin: 0 0 16px;
            padding: 4px 12px;
            text-transform: uppercase;
          }

          .eyebrow::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 999px;
            background: var(--report-brand);
            box-shadow: 0 0 8px oklch(48% 0.14 var(--report-brand-h) / 0.12);
          }

          h1 {
            color: var(--report-text);
            font-size: clamp(28px, 3.5vw, 36px);
            font-weight: 760;
            letter-spacing: -0.02em;
            line-height: 1.15;
            margin: 0;
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 24px;
            border-top: 1px solid var(--report-border);
            margin-top: 20px;
            padding-top: 20px;
          }

          .meta div {
            border: 0;
            border-radius: 0;
            background: transparent;
            padding: 0;
          }

          .meta span {
            display: inline;
            color: var(--report-muted);
            font-size: 13px;
            margin-right: 8px;
          }

          .meta strong {
            display: inline;
            color: var(--report-text);
            font-size: 13px;
            font-weight: 700;
          }

          .report-body {
            counter-reset: report-section;
            border: 1px solid var(--report-border);
            border-radius: 20px;
            background: var(--report-surface);
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03);
            padding: 40px 40px 48px;
          }

          h3 {
            counter-increment: report-section;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 0;
            color: var(--report-text);
            font-size: 22px;
            font-weight: 720;
            letter-spacing: -0.01em;
            line-height: 1.3;
            margin: 32px 0 12px;
            padding: 0;
          }

          h3::before {
            content: counter(report-section);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: var(--report-brand);
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
          }

          h4 {
            display: inline-flex;
            border: 1px solid var(--report-border);
            border-radius: 999px;
            background: var(--report-brand-subtle);
            color: var(--report-brand-strong);
            font-size: 13px;
            font-weight: 650;
            margin: 18px 0 10px;
            padding: 5px 12px;
          }

          p,
          li {
            color: var(--report-secondary);
            font-size: 14px;
            line-height: 1.72;
          }

          .table-wrap {
            overflow-x: auto;
            border: 1px solid var(--report-border);
            border-radius: 14px;
            background: var(--report-surface);
            box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03);
            margin: 10px 0 22px;
          }

          table {
            min-width: 640px;
            border-collapse: separate;
            border-spacing: 0;
            background: var(--report-surface);
            color: var(--report-text);
            font-size: 13px;
          }

          thead {
            background: transparent;
          }

          th {
            border-bottom: 1.5px solid var(--report-border);
            background: oklch(97% 0.012 var(--report-brand-h));
            color: var(--report-secondary);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          th,
          td {
            border-bottom: 1px solid var(--report-border);
            padding: 12px 16px;
          }

          td {
            color: var(--report-text);
            line-height: 1.65;
          }

          tbody tr:last-child td {
            border-bottom: 0;
          }

          tbody tr:nth-child(even) {
            background: oklch(48% 0.14 var(--report-brand-h) / 0.015);
          }

          td:first-child {
            background: oklch(97% 0.012 var(--report-brand-h));
            color: var(--report-text);
            font-weight: 650;
          }

          .tone-good {
            background-color: oklch(52% 0.15 160 / 0.09) !important;
            color: var(--report-good) !important;
            border-left: 3px solid var(--report-good);
          }

          .tone-warn {
            background-color: oklch(55% 0.17 80 / 0.09) !important;
            color: var(--report-warn) !important;
            border-left: 3px solid var(--report-warn);
          }

          .tone-risk {
            background-color: oklch(48% 0.18 28 / 0.09) !important;
            color: var(--report-risk) !important;
            border-left: 3px solid var(--report-risk);
          }

          /* Reference-style PDF skin, inspired by 1.html multi-role report. */
          :root {
            --pdf-bg: #f0f2f5;
            --pdf-surface: #ffffff;
            --pdf-surface-hover: #f7f8fa;
            --pdf-border: #e4e6ed;
            --pdf-border-light: #f0f1f4;
            --pdf-text: #1a1d26;
            --pdf-secondary: #5a6170;
            --pdf-tertiary: #9198a6;
            --pdf-accent: #4f6ef7;
            --pdf-accent-light: #eef1fe;
            --pdf-accent-dark: #3b56d6;
            --pdf-green: #22c55e;
            --pdf-green-light: #ecfdf5;
            --pdf-green-dark: #16a34a;
            --pdf-amber: #f59e0b;
            --pdf-amber-light: #fffbeb;
            --pdf-amber-dark: #d97706;
            --pdf-red: #ef4444;
            --pdf-red-light: #fef2f2;
            --pdf-red-dark: #dc2626;
            --pdf-purple: #8b5cf6;
            --pdf-purple-light: #f5f3ff;
            --pdf-teal: #14b8a6;
            --pdf-teal-light: #f0fdfa;
            --pdf-radius-sm: 8px;
            --pdf-radius-md: 12px;
            --pdf-radius-lg: 16px;
            --pdf-shadow-sm: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06);
            --pdf-shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
            color-scheme: light;
          }

          body {
            align-items: flex-start;
            background: var(--pdf-bg) !important;
            color: var(--pdf-text);
            font-family: Inter, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            font-size: 15px;
            line-height: 1.6;
            padding: 32px 24px 80px;
          }

          .page {
            display: block;
            max-width: 1100px;
            padding: 0;
          }

          .cover {
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            margin-bottom: 18px;
            padding: 0;
          }

          .cover::before,
          .cover::after {
            display: none;
          }

          .cover-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }

          .cover-title-group {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .report-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: var(--pdf-radius-sm);
            background: linear-gradient(135deg, var(--pdf-accent), var(--pdf-purple));
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
          }

          .eyebrow {
            border: 0;
            background: var(--pdf-accent-light);
            color: var(--pdf-accent);
            font-size: 11px;
            letter-spacing: 0.04em;
            margin: 0 0 4px;
            padding: 3px 10px;
          }

          .eyebrow::before {
            display: none;
          }

          h1 {
            color: var(--pdf-text);
            font-size: 24px;
            font-weight: 760;
            letter-spacing: -0.02em;
            line-height: 1.18;
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 8px 16px;
            border: 0;
            margin: 0;
            padding: 0;
          }

          .meta div {
            border: 0;
            border-radius: 0;
            background: transparent;
            padding: 0;
          }

          .meta span {
            color: var(--pdf-tertiary);
            font-size: 12px;
            margin-right: 5px;
          }

          .meta strong {
            color: var(--pdf-secondary);
            font-size: 12px;
            font-weight: 600;
          }

          .quick-stats {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin: 0 0 20px;
          }

          .quick-stat-card {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            border: 1px solid var(--pdf-border-light);
            border-radius: var(--pdf-radius-sm);
            background: var(--pdf-surface);
            box-shadow: var(--pdf-shadow-sm);
            min-height: 76px;
            padding: 13px 14px;
          }

          .quick-stat-card.tone-good-card {
            border-color: rgba(34, 197, 94, 0.24);
            background: linear-gradient(180deg, #ffffff 0%, var(--pdf-green-light) 100%);
          }

          .quick-stat-card.tone-warn-card {
            border-color: rgba(245, 158, 11, 0.28);
            background: linear-gradient(180deg, #ffffff 0%, var(--pdf-amber-light) 100%);
          }

          .quick-stat-card.tone-risk-card {
            border-color: rgba(239, 68, 68, 0.24);
            background: linear-gradient(180deg, #ffffff 0%, var(--pdf-red-light) 100%);
          }

          .quick-stat-card.tone-info-card {
            border-color: rgba(79, 110, 247, 0.22);
            background: linear-gradient(180deg, #ffffff 0%, var(--pdf-accent-light) 100%);
          }

          .quick-stat-card .qs-icon {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 26px;
            height: 26px;
            border-radius: 8px;
            background: var(--pdf-accent-light);
            color: var(--pdf-accent-dark);
            font-size: 12px;
            font-weight: 780;
            line-height: 1;
            margin-top: 2px;
          }

          .quick-stat-card .qs-num {
            color: var(--pdf-text);
            font-size: 13px;
            font-weight: 740;
            line-height: 1.35;
            margin-bottom: 3px;
          }

          .quick-stat-card .qs-label {
            color: var(--pdf-tertiary);
            font-size: 10px;
            font-weight: 650;
            letter-spacing: 0.02em;
          }

          .report-body {
            border: 0;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            padding: 0;
          }

          .report-body > h3,
          .report-body > h4,
          .report-body > p,
          .report-body > ul,
          .report-body > ol,
          .report-body > .table-wrap {
            border: 1px solid var(--pdf-border-light);
            border-radius: var(--pdf-radius-md);
            background: var(--pdf-surface);
            box-shadow: var(--pdf-shadow-sm);
          }

          h3 {
            break-after: avoid;
            margin: 20px 0 0;
            padding: 18px 24px 14px;
            border-bottom: 1px solid var(--pdf-border-light) !important;
            border-radius: var(--pdf-radius-md) var(--pdf-radius-md) 0 0 !important;
            color: var(--pdf-text);
            font-size: 15px;
            font-weight: 700;
            gap: 10px;
          }

          h3::before {
            content: "";
            width: 32px;
            height: 32px;
            border-radius: var(--pdf-radius-sm);
            background: var(--pdf-accent-light);
            color: var(--pdf-accent);
            box-shadow: none;
          }

          h3:nth-of-type(5n+1)::before { background: var(--pdf-amber-light); }
          h3:nth-of-type(5n+2)::before { background: var(--pdf-accent-light); }
          h3:nth-of-type(5n+3)::before { background: var(--pdf-purple-light); }
          h3:nth-of-type(5n+4)::before { background: var(--pdf-teal-light); }
          h3:nth-of-type(5n)::before { background: var(--pdf-red-light); }

          h4 {
            display: block;
            margin: 12px 0 0;
            padding: 14px 20px;
            border-color: var(--pdf-border-light);
            border-radius: var(--pdf-radius-md) var(--pdf-radius-md) 0 0;
            background: var(--pdf-surface);
            color: var(--pdf-secondary);
            font-size: 13px;
            font-weight: 700;
          }

          p,
          li {
            color: var(--pdf-secondary);
            font-size: 13px;
          }

          .report-body > p,
          .report-body > ul,
          .report-body > ol {
            margin: 0 0 12px;
            padding: 14px 20px 16px;
          }

          .report-body > h3 + .table-wrap,
          .report-body > h3 + p,
          .report-body > h3 + ul,
          .report-body > h3 + ol,
          .report-body > h4 + .table-wrap {
            border-top: 0;
            border-radius: 0 0 var(--pdf-radius-md) var(--pdf-radius-md);
            margin-top: 0;
          }

          .table-wrap {
            border-color: var(--pdf-border-light);
            border-radius: var(--pdf-radius-md);
            background: var(--pdf-surface);
            box-shadow: var(--pdf-shadow-sm);
            margin: 0 0 14px;
          }

          table {
            min-width: 0;
            width: 100%;
            border-collapse: collapse;
            color: var(--pdf-text);
            font-size: 12px;
          }

          th,
          td {
            border-bottom: 1px solid var(--pdf-border-light);
            padding: 10px 12px;
            vertical-align: top;
          }

          th {
            background: #fafbfc;
            color: var(--pdf-tertiary);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.02em;
            text-transform: none;
          }

          td {
            color: var(--pdf-secondary);
          }

          td:first-child {
            background: var(--pdf-surface-hover);
            color: var(--pdf-text);
            font-weight: 650;
          }

          tbody tr:nth-child(even) {
            background: transparent;
          }

          .tone-good {
            background: var(--pdf-green-light) !important;
            color: var(--pdf-green-dark) !important;
            border-left: 3px solid var(--pdf-green);
          }

          .tone-warn {
            background: var(--pdf-amber-light) !important;
            color: var(--pdf-amber-dark) !important;
            border-left: 3px solid var(--pdf-amber);
          }

          .tone-risk {
            background: var(--pdf-red-light) !important;
            color: var(--pdf-red-dark) !important;
            border-left: 3px solid var(--pdf-red);
          }

          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }

            body {
              background: #ffffff;
              color: #000000;
            }

            :root {
              color-scheme: light;
            }

            .page {
              max-width: none;
              padding: 0;
            }

            .cover,
            .report-body {
              border: 0;
              border-radius: 0;
              box-shadow: none;
              background: transparent;
              padding: 0;
            }

            .cover {
              break-after: avoid;
            }

            .quick-stat-card,
            .report-body > h3,
            .report-body > h4,
            .report-body > p,
            .report-body > ul,
            .report-body > ol,
            .report-body > .table-wrap {
              box-shadow: none;
            }

            h3,
            h4,
            tr {
              break-inside: avoid;
            }

            th {
              background: #f1f5f9 !important;
              color: #000000 !important;
            }

            .table-wrap {
              break-inside: avoid;
              border: 1px solid #cbd5e1;
              overflow: visible;
            }
          }
        </style>
        ${autoPrintScript}
      </head>
      <body>
        <main class="page">
          <section class="cover">
            <div class="cover-inner">
              <div>
                <div class="cover-title-group">
                  <div class="report-logo">OA</div>
                  <div>
                    <p class="eyebrow">${reportEyebrow}</p>
                    <h1>${reportTitle}</h1>
                  </div>
                </div>
              </div>
              <div class="meta">
                <div>
                  <span>${language === "en" ? "Generated At" : "生成时间"}</span>
                  <strong>${escapeHtml(createdAt)}</strong>
                </div>
                <div>
                  <span>${language === "en" ? "Model Mode" : "模型模式"}</span>
                  <strong>${escapeHtml(run.mode === "llm" ? (language === "en" ? "Live Model" : "真实模型") : "Mock Demo")}</strong>
                </div>
                <div>
                  <span>${language === "en" ? "Model Name" : "模型名称"}</span>
                  <strong>${escapeHtml(run.model || (language === "en" ? "Not provided" : "未填写"))}</strong>
                </div>
              </div>
            </div>
            <div class="quick-stats">
              ${pdfSummaryCards.map((card) => `<div class="quick-stat-card ${escapeHtml(card.tone || "")}">
                <div class="qs-icon">${escapeHtml(card.icon)}</div>
                <div><div class="qs-num">${escapeHtml(card.value)}</div><div class="qs-label">${escapeHtml(card.label)}</div></div>
              </div>`).join("")}
            </div>
          </section>
          <section class="report-body">
            ${markdownToHtml(markdown)}
          </section>
        </main>
      </body>
    </html>`;
    }

    function buildPdfSummaryCards(run, audience = "full") {
      const snapshot = run.input_snapshot || {};
      const language = getRunLanguage(run);
      const report = run.report || "";
      const rows = buildRequirementEvidenceRows(snapshot);
      const gate = buildGateAssessment(snapshot, rows);
      const recommendation = buildInterviewerRecommendation(gate);
      const offerLeverage = buildOfferLeverage(snapshot);
      const missingRows = rows.filter((row) => row.isMissing);
      const matchedRows = rows.filter((row) => !row.isMissing);
      const topRisk = missingRows[0]?.capability || (language === "en" ? "Verify real contribution" : "验证真实贡献");
      const topStrength = matchedRows[0]?.capability || (language === "en" ? "Evidence gap" : "证据待补齐");
      const mustAsk = audience === "interviewer"
        ? (language === "en" ? "Project loop / failure review / trade-off" : "项目闭环 / 失败复盘 / 资源取舍")
        : audience === "offer"
          ? (language === "en" ? "Level / compensation / start date" : "职级 / 薪资 / 到岗")
          : (language === "en" ? "Project story / metric definition / pressure question" : "项目故事 / 指标口径 / 压力题");
      const nextFocus = audience === "interviewer"
        ? (gate.enterSandbox ? (language === "en" ? "Pass confirmed and pending items" : "传递已验证与待验证项") : (language === "en" ? "Request project evidence first" : "先补项目证据"))
        : audience === "offer"
          ? offerLeverage.rating
          : (language === "en" ? "Upgrade the highest-risk evidence tonight" : "今晚补强最高风险证据");
      const extractedRecommendation = extractSection(report, "面试官一分钟速览") || extractSection(report, "项目匹配闸口");
      const recommendationText = audience === "candidate"
        ? (language === "en" ? translateGateResult(gate.result) : gate.result)
        : audience === "offer"
          ? (gate.enterSandbox ? (language === "en" ? "Ready for simulation" : "可沙盘验证") : (language === "en" ? "Pause progression" : "暂缓推进"))
          : recommendation.level;
      const labels = language === "en"
        ? {
            gate: "Gate Result",
            sandbox: "Simulation Status",
            recommendation: "Recommendation",
            risk: "Core Risk",
            question: "Must-Ask",
            next: "Next Focus",
            icons: { gate: "G", sandbox: "S", recommendation: "R", risk: "!", question: "Q", next: "N" },
          }
        : {
            gate: "闸口结论",
            sandbox: "沙盘状态",
            recommendation: "推荐等级",
            risk: "核心风险",
            question: "必问问题",
            next: "下一轮重点",
            icons: { gate: "闸", sandbox: "盘", recommendation: "荐", risk: "险", question: "问", next: audience === "candidate" ? "行" : "传" },
          };

      return [
        {
          icon: audience === "candidate" ? labels.icons.gate : audience === "offer" ? labels.icons.sandbox : labels.icons.recommendation,
          label: audience === "candidate" ? labels.gate : audience === "offer" ? labels.sandbox : labels.recommendation,
          value: clip(recommendationText || extractedRecommendation || (language === "en" ? "Pending validation" : "待验证")),
          tone: gate.enterSandbox ? "tone-good-card" : "tone-risk-card",
        },
        {
          icon: labels.icons.risk,
          label: labels.risk,
          value: clip(language === "en" ? translateCapability(topRisk) : topRisk),
          tone: "tone-risk-card",
        },
        {
          icon: labels.icons.question,
          label: labels.question,
          value: clip(mustAsk),
          tone: "tone-warn-card",
        },
        {
          icon: labels.icons.next,
          label: labels.next,
          value: clip(nextFocus || topStrength),
          tone: "tone-info-card",
        },
      ];
    }

    return {
      reportToStaticHtmlDocument,
      buildPdfSummaryCards,
    };
  }

  global.OfferAgentReportExportTemplate = {
    createReportExportTemplate,
  };
})(typeof window !== "undefined" ? window : globalThis);
