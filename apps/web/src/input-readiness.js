// Input completeness feedback for the workbench without changing generation behavior.
(function initOfferAgentInputReadiness(global) {
  "use strict";

  const MIN_CONTEXT_CHARS = 80;

  function getInputReadinessLabels(language = "zh") {
    if (language === "en") {
      return {
        title: "Input readiness",
        readySummary: "Core inputs are ready.",
        reviewSummary: "You can generate now, but review the marked inputs.",
        resume: "Resume",
        jobDescription: "Job description",
        selectedSkills: "Interviewer roles",
        missing: "Missing",
        limited: (count) => `${count} chars, limited context`,
        ready: (count) => `${count} chars`,
        rolesMissing: "None selected; defaults will be used",
        rolesReady: (count) => `${count} selected`,
        qualityTitle: "Input quality precheck",
        qualityScore: (score) => `${score}/100`,
        qualityGood: "Enough signal for a useful report.",
        qualityReview: "Report can run, but the marked gaps may weaken conclusions.",
        metrics: "Quantified results",
        ownership: "Ownership boundary",
        retrospective: "Failure / retrospective",
        jdResponsibilities: "JD responsibilities",
        context: "Context and offer constraints",
        present: "Present",
        weak: "Weak",
        absent: "Missing",
      };
    }
    return {
      title: "输入就绪度",
      readySummary: "核心输入已就绪。",
      reviewSummary: "可以生成，建议先补充标记项。",
      resume: "候选人简历",
      jobDescription: "岗位 JD",
      selectedSkills: "面试官角色",
      missing: "未填写",
      limited: (count) => `${count} 字，内容较少`,
      ready: (count) => `${count} 字`,
      rolesMissing: "未选择，将使用默认角色",
      rolesReady: (count) => `已选 ${count} 个`,
      qualityTitle: "输入质量预检",
      qualityScore: (score) => `${score}/100`,
      qualityGood: "信号足够，报告可用性较高。",
      qualityReview: "可以生成，但标记缺口会削弱结论可信度。",
      metrics: "量化结果",
      ownership: "个人贡献边界",
      retrospective: "失败 / 复盘",
      jdResponsibilities: "JD 职责完整度",
      context: "上下文与 Offer 约束",
      present: "已体现",
      weak: "偏弱",
      absent: "缺失",
    };
  }

  function evaluateInputReadiness(input = {}) {
    const resume = buildTextItem(input.resume);
    const jobDescription = buildTextItem(input.jobDescription);
    const selectedSkills = Array.isArray(input.selectedSkills) ? input.selectedSkills.filter(Boolean) : [];
    const quality = evaluateInputQuality(input);
    const skillItem = {
      status: selectedSkills.length ? "ready" : "missing",
      count: selectedSkills.length,
    };
    const items = {
      resume,
      jobDescription,
      selectedSkills: skillItem,
    };
    return {
      ready: Object.values(items).every((item) => item.status === "ready"),
      items,
      quality,
      language: input.language === "en" ? "en" : "zh",
    };
  }

  function evaluateInputQuality(input = {}) {
    const resume = String(input.resume || "");
    const jd = String(input.jobDescription || "");
    const context = `${input.companyContext || ""}\n${input.offerConstraints || ""}`;
    const checks = [
      buildQualityCheck("metrics", hasMetricSignal(resume), resume.length > 160),
      buildQualityCheck("ownership", hasOwnershipSignal(resume), /负责|主导|own|led|owner|独立|推动|designed|implemented/i.test(resume)),
      buildQualityCheck("retrospective", hasRetrospectiveSignal(resume), /项目|project|上线|launch|交付|delivery|incident|故障|延期/i.test(resume)),
      buildQualityCheck("jdResponsibilities", countResponsibilityLines(jd) >= 3, jd.length > 160),
      buildQualityCheck("context", context.trim().length >= 30, context.trim().length > 0),
    ];
    const score = Math.round(checks.reduce((sum, item) => sum + item.points, 0));
    return {
      score,
      status: score >= 75 ? "ready" : score >= 45 ? "limited" : "missing",
      checks,
    };
  }

  function buildQualityCheck(id, present, weak = false) {
    const status = present ? "ready" : weak ? "limited" : "missing";
    return {
      id,
      status,
      points: present ? 20 : weak ? 10 : 0,
    };
  }

  function hasMetricSignal(text) {
    return /(\d+(\.\d+)?\s*(%|w|万|k|K|ms|s|秒|分钟|小时|天|周|月|年|人|次|单|元|美元|￥|\$))|ARR|MRR|GMV|ROI|QPS|P95|P99|SLA|MTTR|转化率|留存|收入|成本|响应时长|延迟/i.test(text);
  }

  function hasOwnershipSignal(text) {
    return /主导|负责|独立|owner|owned|led|lead|designed|implemented|推动|拍板|决策|个人贡献|我在|my role|I led/i.test(text);
  }

  function hasRetrospectiveSignal(text) {
    return /复盘|失败|延期|故障|事故|投诉|冲突|取舍|根因|回滚|rollback|incident|postmortem|retrospective|tradeoff|lesson/i.test(text);
  }

  function countResponsibilityLines(text) {
    return String(text || "")
      .split(/\n|；|;/)
      .filter((line) => /负责|要求|熟悉|具备|能力|经验|own|lead|required|responsible|experience/i.test(line))
      .length;
  }

  function buildTextItem(value) {
    const count = String(value || "").trim().length;
    return {
      count,
      status: count === 0 ? "missing" : count < MIN_CONTEXT_CHARS ? "limited" : "ready",
    };
  }

  function renderInputReadiness(target, state, escapeHtml = defaultEscapeHtml) {
    if (!target || !state) return;
    const labels = getInputReadinessLabels(state.language);
    const items = [
      renderItem(labels.resume, state.items.resume, labels, escapeHtml),
      renderItem(labels.jobDescription, state.items.jobDescription, labels, escapeHtml),
      renderItem(labels.selectedSkills, state.items.selectedSkills, labels, escapeHtml, true),
    ].join("");
    target.innerHTML = `<div class="input-readiness-head">
        <strong>${escapeHtml(labels.title)}</strong>
        <span class="${state.ready ? "tone-good" : "tone-warn"}">${escapeHtml(state.ready ? labels.readySummary : labels.reviewSummary)}</span>
      </div>
      <div class="input-readiness-items">${items}</div>
      ${renderQualityPrecheck(state.quality, labels, escapeHtml)}`;
  }

  function renderQualityPrecheck(quality, labels, escapeHtml) {
    if (!quality) return "";
    const checkLabels = {
      metrics: labels.metrics,
      ownership: labels.ownership,
      retrospective: labels.retrospective,
      jdResponsibilities: labels.jdResponsibilities,
      context: labels.context,
    };
    const statusLabels = {
      ready: labels.present,
      limited: labels.weak,
      missing: labels.absent,
    };
    return `<div class="input-quality-card status-${escapeHtml(quality.status)}">
      <div class="input-readiness-head">
        <strong>${escapeHtml(labels.qualityTitle)}</strong>
        <span class="${quality.status === "ready" ? "tone-good" : "tone-warn"}">${escapeHtml(labels.qualityScore(quality.score))} · ${escapeHtml(quality.status === "ready" ? labels.qualityGood : labels.qualityReview)}</span>
      </div>
      <div class="input-quality-items">
        ${quality.checks.map((item) => `<span class="quality-chip status-${escapeHtml(item.status)}">${escapeHtml(checkLabels[item.id] || item.id)}：${escapeHtml(statusLabels[item.status] || item.status)}</span>`).join("")}
      </div>
    </div>`;
  }

  function renderItem(label, item, labels, escapeHtml, isRole = false) {
    const detail = isRole
      ? (item.count ? labels.rolesReady(item.count) : labels.rolesMissing)
      : item.status === "missing"
        ? labels.missing
        : item.status === "limited"
          ? labels.limited(item.count)
          : labels.ready(item.count);
    return `<div class="input-readiness-item status-${escapeHtml(item.status)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(detail)}</strong>
    </div>`;
  }

  function defaultEscapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  global.OfferAgentInputReadiness = {
    MIN_CONTEXT_CHARS,
    getInputReadinessLabels,
    evaluateInputReadiness,
    evaluateInputQuality,
    renderInputReadiness,
  };
})(typeof window !== "undefined" ? window : globalThis);
