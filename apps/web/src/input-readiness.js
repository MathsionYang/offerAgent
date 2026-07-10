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
    };
  }

  function evaluateInputReadiness(input = {}) {
    const resume = buildTextItem(input.resume);
    const jobDescription = buildTextItem(input.jobDescription);
    const selectedSkills = Array.isArray(input.selectedSkills) ? input.selectedSkills.filter(Boolean) : [];
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
      language: input.language === "en" ? "en" : "zh",
    };
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
      <div class="input-readiness-items">${items}</div>`;
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
    renderInputReadiness,
  };
})(typeof window !== "undefined" ? window : globalThis);
