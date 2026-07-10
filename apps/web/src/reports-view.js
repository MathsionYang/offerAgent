// Report rendering, progress, summaries, scorecards, and markdown conversion.
(function initOfferAgentReportsView(global) {
  "use strict";

  function createReportsView(dependencies = {}) {
    const {
      reportEl = null,
      reportProgressEl = null,
      decisionSummaryEl = null,
      interviewerScorecardEl = null,
      interviewerScorecardStatusEl = null,
      getCurrentRun = () => null,
      getLanguage = () => "zh",
      getText = () => ({}),
      getReportStages = () => [],
      getPageMode = () => "candidate",
      renderEvidenceGraph = () => {},
      escapeHtml = (value) => String(value ?? ""),
      clip = (value, length = 80) => String(value ?? "").slice(0, length),
      riskToneClass = () => "",
      offerScenarioToneClass = () => "",
      getEvidenceGraphLabels = () => ({}),
      localizeOfferScenarioName = (value) => value ?? "",
      localizeFeedbackActionType = (value) => value ?? "",
      localizeFeedbackTarget = (value) => value ?? "",
      localizeSkillId = (value) => value ?? "",
      localizeFeedbackStatus = (value) => value ?? "",
      buildCandidateThreeSecondSummary = () => "",
      buildCandidateAdvantageCards = () => "",
      buildInterviewerOneMinuteDecisionBrief = () => "",
      buildInterviewerQuickBrief = () => "",
      translateGateResult = (value) => value || "",
      translateOfferRating = (value) => value || "",
      translateCapability = (value) => value || "",
      translateEvidenceLevel = (value) => value || "",
      translateMatchStatus = (row) => row?.match_status || row?.matchStatus || "",
      openTraceDetailPanel = () => {},
      renderTraceDetailRows = (rows) => rows.map(([key, value]) => `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join(""),
    } = dependencies;
    const resolveCurrentRun = () => getCurrentRun?.() || null;
    const resolveLanguage = () => getLanguage?.() === "en" ? "en" : "zh";

    function cleanReportMarkdown(markdown) {
      return markdown
        .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
        .replace(/`([^`\n]+)`/g, "$1")
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[a-zA-Z]*\n?|```/g, ""))
        .replace(/^\s{0,3}>\s?/gm, "")
        .replace(/^\s*[-*_]{3,}\s*$/gm, "")
        .replace(/\*\*/g, "")
        .replace(/__([^_\n]+)__/g, "$1")
        .replace(/~~([^~\n]+)~~/g, "$1");
    }
    
    function renderDecisionSummaryCard(run) {
      if (!decisionSummaryEl) return;
      const cards = buildDecisionSummaryCards(run);
      if (!cards.length) {
        decisionSummaryEl.className = "decision-summary empty";
        decisionSummaryEl.innerHTML = `<p>${escapeHtml(resolveLanguage() === "en" ? "Generate a report to see the decision summary." : "生成报告后展示关键决策摘要。")}</p>`;
        return;
      }
    
      decisionSummaryEl.className = "decision-summary";
      decisionSummaryEl.innerHTML = `${renderDecisionSummaryCards(cards)}
        ${renderDecisionOfferRunSection(run)}
        ${renderRoleDecisionSummarySections(run)}`;
    }
    
    function renderDecisionSummaryCards(cards) {
      return `<section class="decision-summary-grid">
        ${cards.map((card) => `<article class="summary-card ${escapeHtml(card.tone || "neutral")}">
          <span>${escapeHtml(card.label)}</span>
          <strong class="${escapeHtml(riskToneClass(card.value))}">${escapeHtml(card.value)}</strong>
          <small class="${escapeHtml(riskToneClass(card.detail))}">${escapeHtml(card.detail)}</small>
        </article>`).join("")}
      </section>`;
    }
    
    function renderDecisionOfferRunSection(run) {
      const labels = getEvidenceGraphLabels();
      return renderOfferRunPanel(run?.offer_simulation_run || null, labels);
    }
    
    function renderRoleDecisionSummarySections(run) {
      if (getPageMode() === "interviewer") {
        return `${renderInterviewerOneMinuteDecisionSection(run)}
          ${renderInterviewerQuickBriefSection(run)}`;
      }
      return `${renderCandidateQuickDecisionSection(run)}
        ${renderCandidateAdvantagesSection(run)}`;
    }
    
    function renderCandidateQuickDecisionSection(run) {
      const snapshot = run?.input_snapshot || {};
      const title = resolveLanguage() === "en" ? "Three-second conclusion" : "三秒结论";
      const table = buildCandidateThreeSecondSummary(snapshot);
      return `<section class="decision-summary-section">
        <h4>${escapeHtml(title)}</h4>
        ${markdownToHtml(table)}
      </section>`;
    }
    
    function renderCandidateAdvantagesSection(run) {
      const snapshot = run?.input_snapshot || {};
      const title = resolveLanguage() === "en" ? "Differentiated advantages" : "差异化优势";
      const table = buildCandidateAdvantageCards(snapshot);
      return `<section class="decision-summary-section">
        <h4>${escapeHtml(title)}</h4>
        ${markdownToHtml(table)}
      </section>`;
    }
    
    function renderInterviewerOneMinuteDecisionSection(run) {
      const snapshot = run?.input_snapshot || {};
      const title = resolveLanguage() === "en" ? "One-minute decision brief" : "一分钟决策结论";
      return `<section class="decision-summary-section">
        <h4>${escapeHtml(title)}</h4>
        ${markdownToHtml(buildInterviewerOneMinuteDecisionBrief(snapshot))}
      </section>`;
    }
    
    function renderInterviewerQuickBriefSection(run) {
      const snapshot = run?.input_snapshot || {};
      const title = resolveLanguage() === "en" ? "Interviewer one-minute scan" : "面试官一分钟速览";
      return `<section class="decision-summary-section">
        <h4>${escapeHtml(title)}</h4>
        ${markdownToHtml(buildInterviewerQuickBrief(snapshot))}
      </section>`;
    }
    
    function buildDecisionSummaryCards(run) {
      if (!run) return [];
      const summary = run.evaluation_summary || {};
      const requirements = run.requirement_matches || [];
      const questions = run.top_follow_up_questions || run.interview_questions || [];
      const gaps = requirements.filter((row) => row.is_missing || row.evidence_level >= 3).length;
      const feedbackActions = run.feedback_distillation?.actions?.length || 0;
      const offerState = run.offer_simulation_run?.lifecycle_state || run.offer_sandbox?.readiness || "";
      const labels = resolveLanguage() === "en"
        ? {
            decision: "Decision",
            evidence: "Evidence",
            followup: "Follow-ups",
            offer: "Offer State",
            feedback: "Feedback",
            matched: "matched",
            gaps: "gaps",
            actions: "actions",
          }
        : {
            decision: "决策建议",
            evidence: "证据覆盖",
            followup: "重点追问",
            offer: "Offer 状态",
            feedback: "反馈影响",
            matched: "已匹配",
            gaps: "缺口",
            actions: "动作",
          };
    
      return [
        {
          label: labels.decision,
          value: resolveLanguage() === "en" ? translateGateResult(summary.gate_result) : summary.gate_result || "待判断",
          detail: summary.enter_sandbox
            ? (resolveLanguage() === "en" ? "Can continue with validation." : "可进入下一轮验证。")
            : (resolveLanguage() === "en" ? "Need stronger evidence first." : "建议先补齐关键证据。"),
          tone: summary.enter_sandbox ? "good" : "warn",
        },
        {
          label: labels.evidence,
          value: `${summary.matched_count || 0}/${summary.total_requirements || requirements.length || 0}`,
          detail: `${summary.strong_evidence_count || 0} ${labels.matched} · ${gaps || summary.weak_or_missing_evidence_count || 0} ${labels.gaps}`,
          tone: gaps ? "warn" : "good",
        },
        {
          label: labels.followup,
          value: String(questions.length || 0),
          detail: clip((questions[0]?.question || questions[0]?.capability || summary.next_validation_focus?.[0] || (resolveLanguage() === "en" ? "No priority question yet." : "暂无优先追问。"))),
          tone: questions.length ? "info" : "neutral",
        },
        {
          label: labels.offer,
          value: resolveLanguage() === "en" ? translateOfferRating(summary.offer_leverage_rating || offerState) : (summary.offer_leverage_rating || offerState || "待验证"),
          detail: clip(summary.offer_leverage_summary || run.offer_simulation_run?.current_output?.recommendation || ""),
          tone: "info",
        },
        {
          label: labels.feedback,
          value: `${feedbackActions} ${labels.actions}`,
          detail: summary.feedback_status?.agreement || (resolveLanguage() === "en" ? "No human feedback yet." : "暂未写入人工反馈。"),
          tone: feedbackActions ? "good" : "neutral",
        },
      ];
    }
    
    function renderInterviewerScorecard(run) {
      if (!interviewerScorecardEl) return;
      const rows = buildInterviewerScorecardRows(run);
      if (interviewerScorecardStatusEl) {
        interviewerScorecardStatusEl.textContent = rows.length
          ? (resolveLanguage() === "en" ? `${rows.length} items` : `${rows.length} 项`)
          : (resolveLanguage() === "en" ? "Pending" : "待生成");
      }
      if (!rows.length) {
        interviewerScorecardEl.className = "interviewer-scorecard empty";
        interviewerScorecardEl.innerHTML = `<p>${escapeHtml(resolveLanguage() === "en" ? "Generate a report to show scoring items." : "生成报告后展示结构化评分项。")}</p>`;
        return;
      }
    
      interviewerScorecardEl.className = "interviewer-scorecard";
      interviewerScorecardEl.innerHTML = rows.map((row) => `<article class="scorecard-row status-${escapeHtml(row.asked_status)} scorecard-tone-${escapeHtml(row.row_tone)}" data-scorecard-id="${escapeHtml(row.id)}">
        <div class="sr-header">
          <strong class="sr-title">${escapeHtml(row.capability)}</strong>
          <span class="sr-status">
            <span class="sr-pill ${escapeHtml(row.match_tone)}">${escapeHtml(row.match_status)}</span>
            <span class="sr-pill ${escapeHtml(row.evidence_tone)}">${escapeHtml(row.evidence_level_label)}</span>
          </span>
        </div>
        <p class="sr-question">${escapeHtml(row.recommended_question)}</p>
        <button class="sr-tag sr-detail-trigger" type="button" data-scorecard-id="${escapeHtml(row.id)}">${escapeHtml(row.asked_status_label)} · ${escapeHtml(row.feedback_action)}</button>
      </article>`).join("");
      bindScorecardDetailButtons(rows);
    }
    
    function buildInterviewerScorecardRows(run) {
      if (!run) return [];
      const requirements = run.requirement_matches || [];
      const questionsByCapability = new Map((run.interview_questions || []).map((question) => [question.capability, question]));
      const actionsByTarget = new Map((run.feedback_distillation?.actions || []).map((action) => [action.target_id, action]));
      return requirements.slice(0, 6).map((item, index) => {
        const question = questionsByCapability.get(item.capability) || {};
        const action = actionsByTarget.get(question.id) || actionsByTarget.get(item.id) || {};
        const askedStatus = question.asked_status || "pending";
        return {
          id: item.id || `score_${index + 1}`,
          capability: resolveLanguage() === "en" ? translateCapability(item.capability) : item.capability,
          evidence_level_label: resolveLanguage() === "en" ? translateEvidenceLevel(item.evidence_level) : item.evidence_level_label,
          match_status: resolveLanguage() === "en" ? translateMatchStatus(item) : item.match_status,
          recommended_question: question.question || item.verification_question || "",
          resume_evidence: item.resume_evidence || item.resumeEvidence || "",
          jd_evidence: item.jd_evidence || item.jdEvidence || "",
          verification_question: item.verification_question || question.question || "",
          evidence_level: item.evidence_level,
          is_missing: Boolean(item.is_missing),
          asked_status: askedStatus,
          asked_status_label: resolveLanguage() === "en"
            ? (askedStatus === "reviewed" ? "Reviewed by feedback" : "Pending interview")
            : (askedStatus === "reviewed" ? "反馈已复核" : "待面试验证"),
          feedback_action: action.type || (resolveLanguage() === "en" ? "keep" : "保留"),
          feedback_summary: action.summary || action.reason || "",
          match_tone: scorecardMatchTone(item),
          evidence_tone: scorecardEvidenceTone(item.evidence_level, item.is_missing),
          row_tone: scorecardRowTone(item),
        };
      });
    }
    
    function bindScorecardDetailButtons(rows) {
      if (!interviewerScorecardEl) return;
      const rowMap = new Map(rows.map((row) => [row.id, row]));
      interviewerScorecardEl.querySelectorAll(".sr-detail-trigger").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          const row = rowMap.get(button.dataset.scorecardId);
          if (row) openScorecardEvidenceDetail(row);
        });
      });
    }
    
    function openScorecardEvidenceDetail(row) {
      const labels = resolveLanguage() === "en"
        ? {
            meta: "Scorecard evidence",
            evidence: "Evidence",
            jd: "JD requirement",
            resume: "Resume evidence",
            question: "Follow-up question",
            status: "Validation status",
            action: "Feedback action",
            summary: "Feedback note",
          }
        : {
            meta: "评分表证据",
            evidence: "证据",
            jd: "JD 要求",
            resume: "简历证据",
            question: "追问问题",
            status: "验证状态",
            action: "反馈动作",
            summary: "反馈说明",
          };
      openTraceDetailPanel({
        meta: labels.meta,
        title: row.capability,
        body: `<div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(labels.evidence)}</div>
            ${renderTraceDetailRows([
              [resolveLanguage() === "en" ? "Match" : "匹配状态", row.match_status],
              [resolveLanguage() === "en" ? "Evidence level" : "证据等级", row.evidence_level_label],
              [labels.status, row.asked_status_label],
              [labels.action, row.feedback_action],
            ])}
          </div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(labels.jd)}</div>
            <p>${escapeHtml(row.jd_evidence || (resolveLanguage() === "en" ? "No JD evidence captured." : "暂无 JD 证据。"))}</p>
          </div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(labels.resume)}</div>
            <p>${escapeHtml(row.resume_evidence || (resolveLanguage() === "en" ? "No resume evidence captured." : "暂无简历证据。"))}</p>
          </div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(labels.question)}</div>
            <p>${escapeHtml(row.recommended_question || row.verification_question || (resolveLanguage() === "en" ? "No follow-up question generated." : "暂无追问问题。"))}</p>
          </div>
          ${row.feedback_summary ? `<div class="trace-detail-section"><div class="trace-detail-section-title">${escapeHtml(labels.summary)}</div><p>${escapeHtml(row.feedback_summary)}</p></div>` : ""}`,
      });
    }
    
    function scorecardEvidenceTone(level, isMissing = false) {
      if (isMissing || level >= 3) return "tone-risk";
      if (level === 2) return "tone-warn";
      return "tone-good";
    }
    
    function scorecardMatchTone(item) {
      const text = `${item.match_status || ""} ${item.matchStatus || ""}`;
      if (item.is_missing || /不匹配|缺证|missing|not matched/i.test(text)) return "tone-risk";
      if (/部分|待验证|需追问|conditional|partial|pending/i.test(text)) return "tone-warn";
      return "tone-good";
    }
    
    function scorecardRowTone(item) {
      if (scorecardMatchTone(item) === "tone-risk" || scorecardEvidenceTone(item.evidence_level, item.is_missing) === "tone-risk") return "risk";
      if (scorecardMatchTone(item) === "tone-warn" || scorecardEvidenceTone(item.evidence_level, item.is_missing) === "tone-warn") return "warn";
      return "good";
    }
    
    function renderReport(markdown) {
      reportEl.className = "report report-content";
      reportEl.innerHTML = markdownToHtml(markdown);
      renderStreamProgress(markdown, getText().reportUpdated, true);
      renderEvidenceGraph(resolveCurrentRun());
      renderDecisionSummaryCard(resolveCurrentRun());
      renderInterviewerScorecard(resolveCurrentRun());
    }
    
    function renderStreamingReport(markdown, label = getText().mockStreaming, isDone = false) {
      reportEl.className = "report report-content streaming";
      const content = markdown.trim()
        ? markdownToHtml(markdown)
        : `<p class="stream-placeholder">${escapeHtml(getText().streamPlaceholder)}</p>`;
      const cursor = isDone ? "" : '<span class="stream-cursor" aria-hidden="true"></span>';
    
      renderStreamProgress(markdown, label, isDone);
      reportEl.innerHTML = `<div class="stream-content">${content}${cursor}</div>`;
      reportEl.scrollTop = reportEl.scrollHeight;
      renderEvidenceGraph(isDone ? resolveCurrentRun() : null);
      renderDecisionSummaryCard(isDone ? resolveCurrentRun() : null);
      renderInterviewerScorecard(isDone ? resolveCurrentRun() : null);
    }
    
    function renderGenerationError(message) {
      const title = resolveLanguage() === "en" ? "Generation Failed" : "生成失败";
      const hint = resolveLanguage() === "en"
        ? "The live model or proxy endpoint did not return a valid response. Check the provider, Base URL, API key, and model name, or switch back to Mock Demo."
        : "真实模型或代理接口没有返回有效结果。请检查模型服务商、Base URL、API Key 和模型名称，或先切回 Mock Demo。";
      reportEl.className = "report report-content empty";
      reportEl.innerHTML = `<div class="empty-state">
        <span class="empty-mark">OA</span>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <p>${escapeHtml(hint)}</p>
      </div>`;
      renderStreamProgress("", title, true);
      renderEvidenceGraph(null);
      renderDecisionSummaryCard(null);
      renderInterviewerScorecard(null);
    }
    
    function renderStreamProgress(markdown, label, isDone) {
      if (!reportProgressEl) return;
      reportProgressEl.innerHTML = buildStreamProgress(markdown, label, isDone);
    }
    
    function buildStreamProgress(markdown, label, isDone) {
      const activeIndex = inferStageIndex(markdown, isDone);
      const stages = getReportStages();
      const steps = stages
        .map((stage, index) => {
          const state = isDone || index < activeIndex ? "done" : index === activeIndex ? "active" : "";
          return `<div class="stream-step ${state}">
            <span>${index + 1}</span>
            <strong>${stage.title}</strong>
            <small>${stage.detail}</small>
          </div>`;
        })
        .join("");
    
      return `<div class="stream-title">
          <span>${escapeHtml(label)}</span>
          <small>${isDone ? getText().streamDone : getText().streaming}</small>
        </div>
        <div class="stream-steps">${steps}</div>`;
    }
    
    function inferStageIndex(markdown, isDone) {
      const stages = getReportStages();
      if (isDone) return stages.length;
    
      let activeIndex = 0;
      stages.forEach((stage, index) => {
        if (markdown.includes(stage.marker)) activeIndex = index;
      });
      return activeIndex;
    }
    
    function renderOfferRunPanel(offerRun, labels) {
      if (!offerRun) return "";
      const scenarios = offerRun.scenario_comparison || [];
      const steps = offerRun.lifecycle_steps || [];
      return `<div class="offer-run-panel">
        <div>
          <strong>${escapeHtml(labels.offerRunTitle)}</strong>
        </div>
        <div class="offer-lifecycle">
          ${steps.map((step) => `<span class="state-${escapeHtml(step.status)}">${escapeHtml(step.label)}</span>`).join("")}
        </div>
        <div class="offer-scenarios">
          ${scenarios.map((scenario) => `<article class="${escapeHtml(offerScenarioToneClass(scenario))}">
            <strong>${escapeHtml(localizeOfferScenarioName(scenario.name))}</strong>
            <b>${escapeHtml(String(scenario.probability))}%</b>
            <span>${escapeHtml(scenario.assumption)}</span>
          </article>`).join("")}
        </div>
      </div>`;
    }
    
    function renderFeedbackDistillationPanel(distillation, labels) {
      const actions = distillation.actions || [];
      const diffs = distillation.impact_diff || [];
      const suggestions = distillation.skill_update_suggestions || [];
      return `<div class="feedback-distillation-panel">
        <strong>${escapeHtml(labels.feedbackTitle)}</strong>
        <div class="feedback-action-list">
          ${
            actions.length
              ? actions.slice(0, 5).map((action) => `<article>
                  <span>${escapeHtml(localizeFeedbackActionType(action.type))}</span>
                  <strong>${escapeHtml(localizeFeedbackTarget(action.target_id))}</strong>
                  <small>${escapeHtml(action.reason || "")}</small>
                </article>`).join("")
              : `<p>${escapeHtml(labels.noFeedbackActions)}</p>`
          }
        </div>
        ${diffs.length ? `<div class="feedback-diff-list">${diffs.slice(0, 3).map((diff) => `<p><strong>${escapeHtml(localizeFeedbackTarget(diff.target))}</strong> ${escapeHtml(diff.before)} → ${escapeHtml(diff.after)}</p>`).join("")}</div>` : ""}
        ${suggestions.length ? `<div class="skill-suggestion-list">${suggestions.slice(0, 4).map((item) => `<p><strong>${escapeHtml(localizeSkillId(item.skill_id))}</strong> ${escapeHtml(item.suggestion)} · ${escapeHtml(localizeFeedbackStatus(item.status))}</p>`).join("")}</div>` : ""}
      </div>`;
    }
    
    function markdownToHtml(markdown) {
      const escaped = escapeHtml(cleanReportMarkdown(markdown));
      const lines = escaped.split("\n");
      const html = [];
      let inList = false;
      let listType = "";
      let inTable = false;
      let tableRowIndex = 0;
    
      const closeList = () => {
        if (inList) {
          html.push(`</${listType}>`);
          inList = false;
          listType = "";
        }
      };
    
      const closeTable = () => {
        if (inTable) {
          html.push("</tbody></table></div>");
          inTable = false;
          tableRowIndex = 0;
        }
      };
    
      for (const line of lines) {
        if (/^# /.test(line)) {
          closeList();
          closeTable();
          html.push(`<h2>${line.replace(/^# /, "")}</h2>`);
        } else if (/^## /.test(line)) {
          closeList();
          closeTable();
          html.push(`<h3>${line.replace(/^## /, "")}</h3>`);
        } else if (/^### /.test(line)) {
          closeList();
          closeTable();
          html.push(`<h4>${line.replace(/^### /, "")}</h4>`);
        } else if (isMarkdownTableLine(line)) {
          closeList();
          if (isMarkdownTableDivider(line)) continue;
          const cells = parseMarkdownTableCells(line);
          if (!inTable) {
            html.push('<div class="table-wrap"><table>');
            inTable = true;
            tableRowIndex = 0;
          }
          if (tableRowIndex === 0) {
            html.push(`<thead><tr>${cells.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>`);
          } else {
            html.push(`<tr>${cells.map((cell) => `<td class="${cellToneClass(cell)}">${cell}</td>`).join("")}</tr>`);
          }
          tableRowIndex += 1;
        } else if (/^- /.test(line)) {
          closeTable();
          if (!inList || listType !== "ul") {
            closeList();
            html.push("<ul>");
            listType = "ul";
          }
          inList = true;
          html.push(`<li>${line.replace(/^- /, "")}</li>`);
        } else if (/^\d+\. /.test(line)) {
          closeTable();
          if (!inList || listType !== "ol") {
            closeList();
            html.push("<ol>");
            listType = "ol";
          }
          inList = true;
          html.push(`<li>${line.replace(/^\d+\. /, "")}</li>`);
        } else if (line.trim() === "") {
          closeList();
          closeTable();
        } else {
          closeList();
          closeTable();
          html.push(`<p>${line}</p>`);
        }
      }
    
      closeList();
      closeTable();
      return html.join("");
    }
    
    function isMarkdownTableLine(line) {
      const trimmed = line.trim();
      return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length > 2;
    }
    
    function isMarkdownTableDivider(line) {
      return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
    }
    
    function parseMarkdownTableCells(line) {
      return line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
    }
    
    function cellToneClass(value) {
      return riskToneClass(value);
    }

    return {
      cleanReportMarkdown,
      markdownToHtml,
      renderReport,
      renderStreamingReport,
      renderGenerationError,
      renderStreamProgress,
      buildStreamProgress,
      inferStageIndex,
      renderDecisionSummaryCard,
      renderDecisionSummaryCards,
      buildDecisionSummaryCards,
      renderInterviewerScorecard,
      buildInterviewerScorecardRows,
      renderOfferRunPanel,
      renderFeedbackDistillationPanel,
      scorecardEvidenceTone,
      scorecardMatchTone,
      scorecardRowTone,
    };
  }

  global.OfferAgentReportsView = {
    createReportsView,
  };
})(typeof window !== "undefined" ? window : globalThis);
