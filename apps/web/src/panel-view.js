// Virtual panel rendering, streaming playback, filters, and trace navigation.
(function initOfferAgentPanelView(global) {
  "use strict";

  function createPanelView(dependencies = {}) {
    const {
      virtualPanelChatEl = null,
      virtualPanelChatStatusEl = null,
      evidenceGraphEl = null,
      getLanguage = () => "zh",
      getText = () => ({}),
      detectEvidenceGraphGaps = () => [],
      reportAnchorForNodeType = (type) => type,
      escapeHtml = (value) => String(value ?? ""),
      cssEscape = (value) => String(value ?? ""),
      setWorkspaceView = () => {},
      openPanelMessageDetail = () => {},
      openGraphNodeDetail = () => {},
      openReportAnchorDetail = () => {},
      findGraphNodeById = () => null,
      schedule = (callback, delay) => global.setTimeout(callback, delay),
      cancelSchedule = (timer) => global.clearTimeout(timer),
    } = dependencies;

    let chatTimer = null;
    const resolveLanguage = () => getLanguage?.() === "en" ? "en" : "zh";

    // Render a complete panel state or the pending placeholder.
    function renderVirtualPanelChat(run, options = {}) {
      if (!virtualPanelChatEl) return;
      stopVirtualPanelChat();
      const text = getText();
      if (options.pending) {
        if (virtualPanelChatStatusEl) {
          virtualPanelChatStatusEl.textContent = text.panelChatThinking;
        }
        virtualPanelChatEl.innerHTML = `<div class="panel-discussion-shell">
          ${renderVirtualPanelStats([], null)}
          <section class="panel-conclusion-card">
            <strong>${escapeHtml(text.panelChatThinking)}</strong>
            <p>${escapeHtml(text.panelChatSeed)}</p>
          </section>
        </div>`;
        return;
      }

      const messages = buildVirtualPanelChatMessages(run);
      if (virtualPanelChatStatusEl) {
        virtualPanelChatStatusEl.textContent = messages.length ? text.panelChatDone : text.panelChatWaiting;
      }
      virtualPanelChatEl.innerHTML = messages.length
        ? renderVirtualPanelDiscussion(run, messages)
        : `<div class="panel-discussion-shell">
            ${renderVirtualPanelStats([], null)}
            <section class="panel-conclusion-card">
              <strong>${escapeHtml(text.panelChatWaiting)}</strong>
              <p>${escapeHtml(text.panelChatEmpty)}</p>
            </section>
          </div>`;
      bindVirtualPanelTraceNavigation();
      bindVirtualPanelRoundFilters();
      virtualPanelChatEl.scrollTop = virtualPanelChatEl.scrollHeight;
    }

    // Append panel turns progressively to preserve the chat-like experience.
    function playVirtualPanelChat(run) {
      if (!virtualPanelChatEl) return;
      stopVirtualPanelChat();
      const text = getText();
      const messages = buildVirtualPanelChatMessages(run);
      if (!messages.length) {
        renderVirtualPanelChat(run);
        return;
      }

      if (virtualPanelChatStatusEl) {
        virtualPanelChatStatusEl.textContent = text.panelChatThinking;
      }
      virtualPanelChatEl.innerHTML = `<div class="panel-discussion-shell">
        ${renderVirtualPanelStats(messages, run)}
        ${renderVirtualPanelConclusion(run, messages)}
        ${renderVirtualPanelRoundTabs(run)}
        <div class="panel-thread-list"></div>
      </div>`;
      const threadList = virtualPanelChatEl.querySelector(".panel-thread-list");
      bindVirtualPanelRoundFilters();
      let index = 0;

      const appendNext = () => {
        const message = messages[index];
        if (!message) {
          if (virtualPanelChatStatusEl) {
            virtualPanelChatStatusEl.textContent = text.panelChatDone;
          }
          chatTimer = null;
          return;
        }
        threadList?.insertAdjacentHTML("beforeend", renderVirtualPanelChatMessage(message));
        bindVirtualPanelTraceNavigation();
        applyVirtualPanelFilters();
        virtualPanelChatEl.scrollTop = virtualPanelChatEl.scrollHeight;
        index += 1;
        chatTimer = schedule(appendNext, index < 3 ? 180 : 260);
      };

      appendNext();
    }

    function stopVirtualPanelChat() {
      if (!chatTimer) return;
      cancelSchedule(chatTimer);
      chatTimer = null;
    }

    // Normalize model output into a single render-friendly message stream.
    function buildVirtualPanelChatMessages(run) {
      const panel = run?.virtual_panel || [];
      const rounds = run?.panel_discussion_rounds || [];
      const agentsById = new Map(panel.map((agent) => [agent.id, agent]));
      const messages = [];
      const turnTraceItems = [];

      rounds.forEach((round, roundIndex) => {
        messages.push({
          id: `${round.id || "round"}_intro`,
          type: "system",
          roundId: round.id || `round_${roundIndex + 1}`,
          roundIndex: roundIndex + 1,
          name: resolveLanguage() === "en" ? `Round ${roundIndex + 1}` : `第 ${roundIndex + 1} 轮`,
          role: localizePanelStage(round.stage),
          text: localizePanelTopic(round.topic || round.stage),
          meta: localizePanelStage(round.stage),
        });

        (round.turns || []).forEach((turn, turnIndex) => {
          const agent = agentsById.get(turn.agent_id) || {};
          const messageId = `${round.id || "round"}_${turn.agent_id || "agent"}_${turnIndex}`;
          const messageName = agent.name || turn.agent_id || "Agent";
          const messageText = localizePanelClaim(turn.claim);
          turnTraceItems.push({
            id: messageId,
            label: messageName,
            summary: messageText,
            impact: turn.impact || "",
          });
          messages.push({
            id: messageId,
            type: "agent",
            roundId: round.id || `round_${roundIndex + 1}`,
            roundIndex: roundIndex + 1,
            agentId: turn.agent_id,
            name: messageName,
            role: agent.focus || agent.persona || "",
            stance: turn.stance || agent.stance || "",
            text: messageText,
            meta: buildPanelMessageMeta(turn),
            evidenceIds: turn.evidence_ids || [],
            questionIds: turn.question_ids || [],
            reportAnchor: panelTraceReportAnchor(turn),
          });
        });
      });

      if (run?.moderator_summary) {
        const summary = run.moderator_summary;
        messages.push({
          id: summary.id || "moderator_summary",
          type: "moderator",
          roundId: "moderator",
          roundIndex: 0,
          name: getText().panelChatModerator,
          role: summary.consensus || "",
          stance: summary.offer_impact || "",
          text: localizePanelClaim(summary.final_recommendation || ""),
          meta: resolveLanguage() === "en"
            ? `${summary.disagreement_count || 0} challenges / ${summary.support_count || 0} supports`
            : `${summary.disagreement_count || 0} 个挑战 / ${summary.support_count || 0} 个支持`,
          evidenceIds: buildModeratorTraceIds(run, "evidence"),
          questionIds: buildModeratorTraceIds(run, "question"),
          turnTraceItems: buildModeratorBasisTrace(turnTraceItems, run),
          reportAnchor: reportAnchorForNodeType("agent_persona"),
        });
      }

      return messages;
    }

    function renderVirtualPanelDiscussion(run, messages) {
      return `<div class="panel-discussion-shell">
        ${renderVirtualPanelStats(messages, run)}
        ${renderVirtualPanelConclusion(run, messages)}
        ${renderVirtualPanelRoundTabs(run)}
        <div class="panel-thread-list">${messages.map(renderVirtualPanelChatMessage).join("")}</div>
      </div>`;
    }

    function renderVirtualPanelStats(messages, run) {
      const evidenceCount = new Set(messages.flatMap((message) => message.evidenceIds || [])).size;
      const riskCount = detectEvidenceGraphGaps(run?.evidence_graph || { nodes: [], edges: [] }).length;
      const challengeCount = Math.max(
        messages.filter((message) => /challenge|risk|recalibrate|raise/i.test(message.meta || message.stance || "")).length,
        run?.moderator_summary?.disagreement_count || 0,
      );
      const labels = resolveLanguage() === "en"
        ? [["Pending challenges", challengeCount], ["Supporting evidence", evidenceCount], ["High-risk gaps", riskCount]]
        : [["待验证挑战", challengeCount], ["支持证据", evidenceCount], ["高风险缺口", riskCount]];
      return `<section class="panel-stats-grid">
        ${labels.map(([label, value]) => `<div class="panel-stat">
          <strong>${escapeHtml(String(value))}</strong>
          <span>${escapeHtml(label)}</span>
        </div>`).join("")}
      </section>`;
    }

    function renderVirtualPanelConclusion(run, messages) {
      const summary = run?.moderator_summary;
      const fallback = messages.find((message) => message.type === "moderator");
      const title = resolveLanguage() === "en" ? "Panel conclusion" : "委员会结论";
      const body = localizePanelClaim(summary?.final_recommendation || fallback?.text || "");
      const empty = resolveLanguage() === "en"
        ? "Generate a report to see the panel's consensus, challenges, and traceable evidence."
        : "生成报告后，这里会展示委员会共识、分歧挑战和可追溯证据。";
      return `<section class="panel-conclusion-card">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(body || empty)}</p>
      </section>`;
    }

    function renderVirtualPanelRoundTabs(run) {
      const rounds = run?.panel_discussion_rounds || [];
      if (!rounds.length) return "";
      const allLabel = resolveLanguage() === "en" ? "All turns" : "全部轮次";
      const moderatorLabel = resolveLanguage() === "en" ? "Moderator summary" : "主持人总结";
      const roundButtons = rounds.map((round, index) => `<button class="panel-round-filter" type="button" data-panel-round="${escapeHtml(round.id || `round_${index + 1}`)}">${escapeHtml(resolveLanguage() === "en" ? `Round ${index + 1}` : `第 ${index + 1} 轮`)}</button>`);
      const labels = getPanelFilterLabels();
      return `<div class="panel-filter-shell">
        <nav class="panel-round-tabs" aria-label="${escapeHtml(resolveLanguage() === "en" ? "Panel rounds" : "委员会轮次")}">
          <button class="panel-round-filter active" type="button" data-panel-round="all">${escapeHtml(allLabel)}</button>
          ${roundButtons.join("")}
          <button class="panel-round-filter" type="button" data-panel-round="moderator">${escapeHtml(moderatorLabel)}</button>
        </nav>
        <div class="panel-chat-filter-row">
          ${renderPanelFilterSelect("agent", labels.agent, collectPanelAgentOptions(run, labels))}
          ${renderPanelFilterSelect("evidence", labels.evidence, collectPanelEvidenceOptions(run, labels))}
        </div>
        <p class="panel-filter-empty" hidden>${escapeHtml(labels.empty)}</p>
      </div>`;
    }

    function renderVirtualPanelChatMessage(message) {
      const roundClass = message.type === "system" ? "round-marker" : "";
      const avatarText = message.type === "system"
        ? (resolveLanguage() === "en" ? "R" : "第")
        : message.type === "moderator"
          ? (resolveLanguage() === "en" ? "M" : "总")
          : (resolveLanguage() === "en" ? "V" : "虚");
      return `<article class="chat-bubble ${escapeHtml(message.type || "agent")} ${roundClass}" data-message-id="${escapeHtml(message.id || "")}" data-panel-round="${escapeHtml(message.roundId || "all")}" data-panel-agent="${escapeHtml(message.agentId || message.type || "")}" data-panel-evidence-ids="${escapeHtml((message.evidenceIds || []).join(" "))}">
        <span class="panel-message-avatar">${escapeHtml(avatarText)}</span>
        <div class="chat-message">
          <div class="chat-meta">
            <strong>${escapeHtml(message.name || "")}</strong>
            <span>${escapeHtml(message.role || message.stance || "")}</span>
          </div>
          <p>${escapeHtml(message.text || "")}</p>
          ${message.meta ? `<small>${escapeHtml(message.meta)}</small>` : ""}
          ${message.type === "moderator" ? renderModeratorBasisTrace(message) : ""}
          ${renderPanelTraceChips(message)}
        </div>
      </article>`;
    }

    function getPanelFilterLabels() {
      return resolveLanguage() === "en"
        ? {
            agent: "Role",
            evidence: "Evidence",
            allAgents: "All roles",
            allEvidence: "All evidence",
            moderator: "Moderator",
            evidenceItem: (index) => `Evidence ${index + 1}`,
            empty: "No panel turns match the current filters.",
          }
        : {
            agent: "角色",
            evidence: "证据",
            allAgents: "全部角色",
            allEvidence: "全部证据",
            moderator: "主持人",
            evidenceItem: (index) => `证据 ${index + 1}`,
            empty: "当前筛选条件下没有匹配发言。",
          };
    }

    function renderPanelFilterSelect(kind, label, options) {
      return `<label class="panel-chat-filter">
        <span>${escapeHtml(label)}</span>
        <select class="panel-chat-filter-select" data-panel-filter="${escapeHtml(kind)}">
          ${options.map(([value, optionLabel]) => `<option value="${escapeHtml(value)}">${escapeHtml(optionLabel)}</option>`).join("")}
        </select>
      </label>`;
    }

    function collectPanelAgentOptions(run, labels = getPanelFilterLabels()) {
      const options = [["all", labels.allAgents]];
      (run?.virtual_panel || []).forEach((agent) => {
        options.push([agent.id, agent.name || agent.focus || agent.id]);
      });
      options.push(["moderator", labels.moderator]);
      return options;
    }

    function collectPanelEvidenceOptions(run, labels = getPanelFilterLabels()) {
      const ids = new Set();
      (run?.panel_discussion_rounds || [])
        .flatMap((round) => round.turns || [])
        .flatMap((turn) => turn.evidence_ids || [])
        .forEach((id) => ids.add(id));
      return [
        ["all", labels.allEvidence],
        ...Array.from(ids).map((id, index) => [id, `${labels.evidenceItem(index)} · ${id}`]),
      ];
    }

    function bindVirtualPanelRoundFilters() {
      if (!virtualPanelChatEl) return;
      const filters = Array.from(virtualPanelChatEl.querySelectorAll(".panel-round-filter"));
      filters.forEach((filter) => {
        if (filter.dataset.filterBound === "true") return;
        filter.dataset.filterBound = "true";
        filter.addEventListener("click", () => {
          const selectedRound = filter.dataset.panelRound || "all";
          filters.forEach((item) => item.classList.toggle("active", item === filter));
          applyVirtualPanelFilters();
          const target = selectedRound === "all"
            ? virtualPanelChatEl.querySelector(".chat-bubble:not([hidden])")
            : virtualPanelChatEl.querySelector(`.chat-bubble[data-panel-round="${cssEscape(selectedRound)}"]:not([hidden])`);
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
      virtualPanelChatEl.querySelectorAll(".panel-chat-filter-select").forEach((selectEl) => {
        if (selectEl.dataset.filterBound === "true") return;
        selectEl.dataset.filterBound = "true";
        selectEl.addEventListener("change", applyVirtualPanelFilters);
      });
      applyVirtualPanelFilters();
    }

    function applyVirtualPanelFilters() {
      if (!virtualPanelChatEl) return;
      const selectedRound = virtualPanelChatEl.querySelector(".panel-round-filter.active")?.dataset.panelRound || "all";
      const selectedAgent = virtualPanelChatEl.querySelector('[data-panel-filter="agent"]')?.value || "all";
      const selectedEvidence = virtualPanelChatEl.querySelector('[data-panel-filter="evidence"]')?.value || "all";
      let visibleCount = 0;
      virtualPanelChatEl.querySelectorAll(".chat-bubble").forEach((messageEl) => {
        const roundMatches = selectedRound === "all" || messageEl.dataset.panelRound === selectedRound;
        const agentMatches = selectedAgent === "all" || messageEl.dataset.panelAgent === selectedAgent;
        const evidenceIds = String(messageEl.dataset.panelEvidenceIds || "").split(/\s+/).filter(Boolean);
        const evidenceMatches = selectedEvidence === "all" || evidenceIds.includes(selectedEvidence);
        const visible = roundMatches && agentMatches && evidenceMatches;
        messageEl.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      const emptyEl = virtualPanelChatEl.querySelector(".panel-filter-empty");
      if (emptyEl) emptyEl.hidden = visibleCount !== 0;
    }

    function buildModeratorBasisTrace(turnTraceItems, run) {
      const turns = turnTraceItems
        .filter((item) => /raise_follow_up_priority|recalibrate|feed_offer|support|keep/i.test(item.impact) || item.summary)
        .slice(0, 3);
      return {
        turns,
        evidenceIds: buildModeratorTraceIds(run, "evidence"),
        questionIds: buildModeratorTraceIds(run, "question"),
      };
    }

    function renderModeratorBasisTrace(message) {
      const basis = message.turnTraceItems || {};
      const turns = basis.turns || [];
      const evidenceIds = basis.evidenceIds || message.evidenceIds || [];
      const questionIds = basis.questionIds || message.questionIds || [];
      const title = resolveLanguage() === "en" ? "Based on" : "结论依据";
      const turnsLabel = resolveLanguage() === "en" ? "Panel turns" : "委员发言";
      const evidenceLabel = resolveLanguage() === "en" ? "Evidence nodes" : "证据节点";
      const questionsLabel = resolveLanguage() === "en" ? "Follow-up questions" : "追问问题";
      const turnChips = turns.map((turn, index) => `<button class="panel-trace-chip panel-turn-chip" type="button" data-trace-message-id="${escapeHtml(turn.id)}" title="${escapeHtml(turn.summary || "")}">${escapeHtml(`${turnsLabel} ${index + 1}`)}</button>`);
      const evidenceChips = evidenceIds.slice(0, 3).map((id, index) => `<button class="panel-trace-chip basis-evidence" type="button" data-trace-node-id="${escapeHtml(id)}">${escapeHtml(`${evidenceLabel} ${index + 1}`)}</button>`);
      const questionChips = questionIds.slice(0, 3).map((id, index) => `<button class="panel-trace-chip basis-questions" type="button" data-trace-node-id="${escapeHtml(id)}">${escapeHtml(`${questionsLabel} ${index + 1}`)}</button>`);
      return `<div class="moderator-basis">
        <strong>${escapeHtml(title)}</strong>
        <div class="basis-turns">${turnChips.join("") || `<span class="panel-trace-missing">${escapeHtml(turnsLabel)}</span>`}</div>
        <div class="basis-evidence">${evidenceChips.join("") || `<span class="panel-trace-missing">${escapeHtml(evidenceLabel)}</span>`}</div>
        <div class="basis-questions">${questionChips.join("") || `<span class="panel-trace-missing">${escapeHtml(questionsLabel)}</span>`}</div>
      </div>`;
    }

    function renderPanelTraceChips(message) {
      const evidenceIds = message.evidenceIds || [];
      const questionIds = message.questionIds || [];
      const reportAnchor = message.reportAnchor || "";
      const hasTrace = evidenceIds.length || questionIds.length || reportAnchor;
      if (!hasTrace) {
        return `<div class="panel-trace-chips"><span class="panel-trace-missing">${escapeHtml(resolveLanguage() === "en" ? "Evidence pending" : "待补证据")}</span></div>`;
      }

      const evidenceChips = evidenceIds.slice(0, 2).map((id, index) => `<button class="panel-trace-chip" type="button" data-trace-node-id="${escapeHtml(id)}">${escapeHtml(resolveLanguage() === "en" ? `Evidence ${index + 1}` : `证据 ${index + 1}`)}</button>`);
      const questionChips = questionIds.slice(0, 2).map((id, index) => `<button class="panel-trace-chip" type="button" data-trace-node-id="${escapeHtml(id)}">${escapeHtml(resolveLanguage() === "en" ? `Question ${index + 1}` : `问题 ${index + 1}`)}</button>`);
      const reportChip = reportAnchor
        ? [`<button class="panel-trace-chip report" type="button" data-trace-report-anchor="${escapeHtml(reportAnchor)}">${escapeHtml(resolveLanguage() === "en" ? "Report" : "报告段落")}</button>`]
        : [];
      return `<div class="panel-trace-chips">${[...evidenceChips, ...questionChips, ...reportChip].join("")}</div>`;
    }

    function bindVirtualPanelTraceNavigation() {
      if (!virtualPanelChatEl) return;
      virtualPanelChatEl.querySelectorAll(".panel-trace-chip").forEach((chip) => {
        if (chip.dataset.traceBound === "true") return;
        chip.dataset.traceBound = "true";
        chip.addEventListener("click", () => navigatePanelTraceTarget(chip));
      });
    }

    // Resolve trace targets without exposing graph-view internals to the panel.
    function navigatePanelTraceTarget(chip) {
      const nodeId = chip.dataset.traceNodeId;
      const reportAnchor = chip.dataset.traceReportAnchor;
      const messageId = chip.dataset.traceMessageId;
      if (messageId) {
        const messageEl = virtualPanelChatEl?.querySelector(`[data-message-id="${cssEscape(messageId)}"]`);
        if (messageEl) openPanelMessageDetail(messageEl);
        return;
      }
      if (nodeId) {
        setWorkspaceView("graph");
        schedule(() => {
          const nodeEl = evidenceGraphEl?.querySelector(`[data-node-id="${cssEscape(nodeId)}"]`);
          const graphNode = findGraphNodeById(nodeId);
          if (graphNode) {
            nodeEl?.classList.add("active");
            openGraphNodeDetail(graphNode);
          } else if (reportAnchor) {
            openReportAnchorDetail(reportAnchor);
          }
        }, 0);
        return;
      }
      if (reportAnchor) {
        setWorkspaceView("graph");
        schedule(() => openReportAnchorDetail(reportAnchor), 0);
      }
    }

    function panelTraceReportAnchor(turn) {
      const questionIds = turn.question_ids || [];
      const evidenceIds = turn.evidence_ids || [];
      if (questionIds.length) return reportAnchorForNodeType("interview_question");
      if (evidenceIds.length) return reportAnchorForNodeType("resume_evidence");
      return reportAnchorForNodeType("agent_persona");
    }

    function buildModeratorTraceIds(run, kind) {
      const rounds = run?.panel_discussion_rounds || [];
      const ids = rounds
        .flatMap((round) => round.turns || [])
        .flatMap((turn) => (kind === "question" ? turn.question_ids || [] : turn.evidence_ids || []));
      return Array.from(new Set(ids)).slice(0, 3);
    }

    function buildPanelMessageMeta(turn) {
      const evidenceCount = turn.evidence_ids?.length || 0;
      const questionCount = turn.question_ids?.length || 0;
      if (resolveLanguage() === "en") {
        return `${turn.impact || "panel_signal"} · ${evidenceCount} evidence · ${questionCount} questions`;
      }
      return `${localizePanelImpact(turn.impact || "panel_signal")} · ${evidenceCount} 条证据 · ${questionCount} 个问题`;
    }

    function localizePanelClaim(claim) {
      if (!claim) return "";
      if (resolveLanguage() === "en") return claim;
      return claim
        .replaceAll(" reads ", " 读取 ")
        .replaceAll(" as ", "，判断为 ")
        .replaceAll("pending validation", "待验证")
        .replaceAll("usable evidence", "可用证据")
        .replaceAll(" challenges whether ", " 挑战：")
        .replaceAll(" has first-hand evidence", " 是否具备一手证据")
        .replaceAll(" links ", " 将 ")
        .replaceAll(" offer leverage to ", " 的 Offer 杠杆关联到 ")
        .replaceAll("Enter the next interview or offer sandbox only after validating the highest-risk evidence nodes.", "建议先验证最高风险证据节点，再进入下一轮面试或 Offer 沙盘。")
        .replaceAll("Pause offer progression and request stronger project-loop evidence before deep interview questions.", "建议暂停 Offer 推进，先补强项目闭环证据，再进入深度追问。");
    }

    function localizePanelStage(value) {
      const map = resolveLanguage() === "en"
        ? {
            seed_extraction: "Seed extraction",
            panel_simulation: "Panel discussion",
            moderator_report: "Moderator summary",
          }
        : {
            seed_extraction: "种子材料读取",
            panel_simulation: "委员会讨论",
            moderator_report: "主持人总结",
          };
      return map[value] || value || "";
    }

    function localizePanelTopic(value) {
      const map = resolveLanguage() === "en"
        ? {
            "JD / resume seed reading": "JD / resume seed reading",
            "risk challenge and counter-evidence": "Risk challenge and counter-evidence",
            "offer readiness alignment": "Offer readiness alignment",
            seed_extraction: "JD / resume seed reading",
            panel_simulation: "Risk challenge and counter-evidence",
            moderator_report: "Offer readiness alignment",
          }
        : {
            "JD / resume seed reading": "JD / 简历种子读取",
            "risk challenge and counter-evidence": "风险挑战与反证",
            "offer readiness alignment": "Offer 就绪度对齐",
            seed_extraction: "JD / 简历种子读取",
            panel_simulation: "风险挑战与反证",
            moderator_report: "Offer 就绪度对齐",
          };
      return map[value] || value || "";
    }

    function localizePanelStance(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        supportive: "支持",
        opposing: "质疑",
        observer: "观察",
        neutral: "中立",
      };
      return map[value] || value || "";
    }

    function localizePanelImpact(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        raise_follow_up_priority: "提高追问优先级",
        keep_as_supporting_evidence: "保留为支持证据",
        recalibrate_with_human_feedback: "结合人工反馈校准",
        feed_offer_simulation: "回填 Offer 推演",
        panel_signal: "委员会信号",
      };
      return map[value] || value || "";
    }

    function localizeModeratorConsensus(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        conditional_progress: "有条件推进",
        evidence_first: "证据优先",
      };
      return map[value] || value || "";
    }

    function localizeFeedbackImpact(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        human_feedback_applied_to_panel_summary: "人工反馈已纳入委员会总结",
        waiting_for_human_feedback: "等待人工反馈",
      };
      return map[value] || value || "";
    }

    return {
      renderVirtualPanelChat,
      playVirtualPanelChat,
      stopVirtualPanelChat,
      buildVirtualPanelChatMessages,
      renderVirtualPanelDiscussion,
      renderVirtualPanelStats,
      renderVirtualPanelConclusion,
      renderVirtualPanelRoundTabs,
      renderVirtualPanelChatMessage,
      bindVirtualPanelRoundFilters,
      buildModeratorBasisTrace,
      renderModeratorBasisTrace,
      renderPanelTraceChips,
      bindVirtualPanelTraceNavigation,
      navigatePanelTraceTarget,
      applyVirtualPanelFilters,
      panelTraceReportAnchor,
      buildModeratorTraceIds,
      buildPanelMessageMeta,
      localizePanelClaim,
      localizePanelStage,
      localizePanelTopic,
      localizePanelStance,
      localizePanelImpact,
      localizeModeratorConsensus,
      localizeFeedbackImpact,
    };
  }

  global.OfferAgentPanelView = {
    createPanelView,
  };
})(typeof window !== "undefined" ? window : globalThis);
