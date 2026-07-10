// Evidence graph rendering, filtering, trace details, and report navigation.
(function initOfferAgentGraphView(global) {
  "use strict";

  function createGraphView(dependencies = {}) {
    const {
      evidenceGraphEl = null,
      reportEl = null,
      getCurrentRun = () => null,
      getLanguage = () => "zh",
      detectEvidenceGraphGaps = () => [],
      reportAnchorForNodeType = () => "",
      escapeHtml = (value) => String(value ?? ""),
      clip = (value) => String(value ?? ""),
      riskToneClass = () => "",
      localizeSkillId = (value) => value ?? "",
      localizePanelStance = (value) => value ?? "",
    } = dependencies;
    const resolveCurrentRun = () => getCurrentRun?.() || null;
    const resolveLanguage = () => getLanguage?.() === "en" ? "en" : "zh";
    let traceDetailPanelEl = null;

    // Render graph state and bind node, relation, filter, and gap interactions.
    function renderEvidenceGraph(run) {
      if (!evidenceGraphEl) return;
      const graph = run?.evidence_graph;
      if (!graph?.nodes?.length) {
        const emptyTitle = resolveLanguage() === "en" ? "Evidence Graph" : "证据关系图谱";
        const emptyText = resolveLanguage() === "en"
          ? "Generate a report to visualize how JD requirements, resume evidence, questions, risks, feedback, and offer signals connect."
          : "生成报告后，这里会展示 JD 要求、简历证据、追问问题、风险、反馈和 Offer 信号之间的关系。";
        evidenceGraphEl.className = "evidence-graph empty";
        evidenceGraphEl.innerHTML = `<div class="evidence-graph-empty">
          <strong>${escapeHtml(emptyTitle)}</strong>
          <span>${escapeHtml(emptyText)}</span>
        </div>`;
        return;
      }

      const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
      const grouped = groupEvidenceGraphNodes(graph.nodes);
      const labels = getEvidenceGraphLabels();
      const gaps = detectEvidenceGraphGaps(graph);
      evidenceGraphEl.className = "evidence-graph";
      evidenceGraphEl.innerHTML = `<div class="evidence-graph-head">
          <div>
            <p class="eyebrow">${escapeHtml(labels.eyebrow)}</p>
            <h3>${escapeHtml(labels.title)}</h3>
          </div>
          <span>${escapeHtml(labels.count(graph.nodes.length, graph.edges.length))}</span>
        </div>
        ${renderEvidenceGraphFilters(labels)}
        ${renderEvidenceGraphGaps(gaps, labels)}
        <div class="evidence-graph-text-list">
          ${renderEvidenceGraphColumn(labels.columns.requirements, grouped.requirements)}
          ${renderEvidenceGraphColumn(labels.columns.evidence, grouped.evidence)}
          ${renderEvidenceGraphColumn(labels.columns.validation, grouped.validation)}
        </div>`;

      evidenceGraphEl.querySelectorAll(".graph-node").forEach((nodeEl) => {
        nodeEl.addEventListener("click", () => {
          const node = nodesById.get(nodeEl.dataset.nodeId);
          if (!node) return;
          evidenceGraphEl.querySelectorAll(".graph-node").forEach((item) => item.classList.remove("active"));
          nodeEl.classList.add("active");
          renderEvidenceGraphDetail(node, graph.edges, nodesById);
        });
      });

      evidenceGraphEl.querySelectorAll(".graph-relation-line").forEach((relationEl) => {
        relationEl.addEventListener("click", () => {
          const edge = graph.edges.find((item) => item.from === relationEl.dataset.relationFrom && item.to === relationEl.dataset.relationTo);
          if (edge) openGraphRelationDetail(edge, nodesById, labels);
        });
      });

      evidenceGraphEl.querySelectorAll(".graph-filter").forEach((filterEl) => {
        filterEl.addEventListener("click", () => {
          const type = filterEl.dataset.filterType;
          evidenceGraphEl.querySelectorAll(".graph-filter").forEach((item) => item.classList.remove("active"));
          filterEl.classList.add("active");
          applyEvidenceGraphFilter(type);
        });
      });

      evidenceGraphEl.querySelectorAll(".evidence-gap-item").forEach((gapEl) => {
        gapEl.addEventListener("click", () => {
          const target = evidenceGraphEl.querySelector(`[data-node-id="${cssEscape(gapEl.dataset.gapNodeId)}"]`);
          target?.click();
        });
      });

    }

    // Keep graph grouping and localization helpers independent from the page shell.
    function groupEvidenceGraphNodes(nodes) {
      return {
        requirements: nodes.filter((node) => node.type === "job_requirement"),
        evidence: nodes.filter((node) => node.type === "resume_evidence"),
        validation: nodes.filter((node) => !["job_requirement", "resume_evidence"].includes(node.type)),
      };
    }

    function getEvidenceGraphLabels() {
      if (resolveLanguage() === "en") {
        return {
          eyebrow: "Traceability",
          title: "Evidence Graph",
          count: (nodes, edges) => `${nodes} nodes / ${edges} links`,
          filters: [
            ["all", "All"],
            ["job_requirement", "JD"],
            ["resume_evidence", "Evidence"],
            ["interview_question", "Questions"],
            ["risk", "Risks"],
            ["offer_signal", "Offer"],
            ["feedback", "Feedback"],
            ["skill", "Skills"],
            ["agent_persona", "Agents"],
          ],
          gapTitle: "Evidence gaps",
          gapEmpty: "No obvious evidence gaps detected.",
          gapAction: "Click to inspect",
          columns: {
            requirements: "JD Requirements",
            evidence: "Resume Evidence",
            validation: "Questions / Risks / Offer",
          },
          detailTitle: "Node details",
          detailPlaceholder: "Click a node to inspect evidence, questions, linked risks, and report location.",
          reportAnchor: "Report section",
          offerRunTitle: "Offer run state",
          feedbackTitle: "Feedback distillation",
          noFeedbackActions: "No feedback actions yet.",
          edgeMeta: "Edge confidence",
        };
      }
      return {
        eyebrow: "可追溯关系",
        title: "证据关系图谱",
        count: (nodes, edges) => `${nodes} 个节点 / ${edges} 条关系`,
        filters: [
          ["all", "全部"],
          ["job_requirement", "JD"],
          ["resume_evidence", "证据"],
          ["interview_question", "追问"],
          ["risk", "风险"],
          ["offer_signal", "Offer"],
          ["feedback", "反馈"],
          ["skill", "Skill"],
          ["agent_persona", "Agent"],
        ],
        gapTitle: "证据缺口",
        gapEmpty: "暂未发现明显证据缺口。",
        gapAction: "点击查看",
        columns: {
          requirements: "JD 要求",
          evidence: "简历证据",
          validation: "追问 / 风险 / Offer",
        },
        detailTitle: "节点详情",
        detailPlaceholder: "点击节点查看摘要、证据等级、验证问题、关联关系和报告位置。",
        reportAnchor: "报告定位",
        offerRunTitle: "Offer 推演状态",
        feedbackTitle: "反馈蒸馏",
        noFeedbackActions: "暂无反馈动作。",
        edgeMeta: "关系置信度",
      };
    }

    function renderEvidenceGraphFilters(labels) {
      return `<div class="evidence-graph-filters">
        ${labels.filters.map(([type, label], index) => `<button class="graph-filter ${index === 0 ? "active" : ""}" type="button" data-filter-type="${escapeHtml(type)}">${escapeHtml(label)}</button>`).join("")}
      </div>`;
    }

    function applyEvidenceGraphFilter(type) {
      const isAll = type === "all";
      evidenceGraphEl.querySelectorAll(".graph-node").forEach((nodeEl) => {
        const visible = isAll || nodeEl.dataset.nodeType === type;
        nodeEl.classList.toggle("graph-node-hidden", !visible);
      });
      evidenceGraphEl.querySelectorAll(".evidence-graph-column").forEach((columnEl) => {
        const visibleNodes = Array.from(columnEl.querySelectorAll(".graph-node")).filter((nodeEl) => !nodeEl.classList.contains("graph-node-hidden"));
        columnEl.classList.toggle("graph-column-dimmed", !isAll && visibleNodes.length === 0);
      });
    }

    function renderEvidenceGraphGaps(gaps, labels) {
      const items = gaps.length
        ? gaps.slice(0, 3).map((node) => `<button class="evidence-gap-item" type="button" data-gap-node-id="${escapeHtml(node.id)}">
            <span class="gap-card-type">${escapeHtml(typeLabel(node.type))}</span>
            <strong>${escapeHtml(node.label)}</strong>
            <span class="gap-card-summary">${escapeHtml(clip(node.summary || ""))}</span>
            <em>${escapeHtml(labels.gapAction)}</em>
          </button>`).join("")
        : `<p>${escapeHtml(labels.gapEmpty)}</p>`;
      return `<div class="evidence-graph-gaps">
        <strong>${escapeHtml(labels.gapTitle)}</strong>
        <div>${items}</div>
      </div>`;
    }

    function renderEvidenceGraphColumn(title, nodes) {
      return `<section class="evidence-graph-column">
        <h4>${escapeHtml(title)}</h4>
        <div class="graph-node-list">
          ${nodes.map(renderEvidenceGraphNode).join("") || `<p class="graph-node-empty">${resolveLanguage() === "en" ? "No nodes" : "暂无节点"}</p>`}
        </div>
      </section>`;
    }

    function renderEvidenceGraphNode(node) {
      const meta = node.metadata || {};
      const badge = meta.evidence_level_label || meta.severity || meta.adoption_status || node.type;
      const badgeTone = riskToneClass(badge);
      return `<button class="graph-node type-${escapeHtml(node.type)}" type="button" data-node-id="${escapeHtml(node.id)}" data-node-type="${escapeHtml(node.type)}">
        <span>${escapeHtml(typeLabel(node.type))}</span>
        <strong>${escapeHtml(node.label)}</strong>
        <small>${escapeHtml(clip(node.summary || ""))}</small>
        <em class="${escapeHtml(badgeTone)}">${escapeHtml(String(badge || ""))}</em>
      </button>`;
    }

    function renderEvidenceGraphTextRelations(edges, nodesById, labels) {
      const title = resolveLanguage() === "en" ? "Relations" : "文字关系";
      const empty = resolveLanguage() === "en" ? "No relations yet." : "暂无关系。";
      const rows = (edges || []).slice(0, 18).map((edge) => {
        const from = nodesById.get(edge.from);
        const to = nodesById.get(edge.to);
        const confidence = edge.confidence ?? edge.weight ?? 0;
        return `<button class="graph-relation-line" type="button" data-relation-from="${escapeHtml(edge.from)}" data-relation-to="${escapeHtml(edge.to)}">
          <strong>${escapeHtml(from?.label || edge.from)}</strong>
          <span>${escapeHtml(localizeGraphEdgeType(edge.type))}</span>
          <strong>${escapeHtml(to?.label || edge.to)}</strong>
          <em>${escapeHtml(labels.edgeMeta)} ${(confidence * 100).toFixed(0)}% · ${escapeHtml(localizeGraphSource(edge.source))}</em>
        </button>`;
      }).join("");
      return `<section class="evidence-graph-relations">
        <h4>${escapeHtml(title)}</h4>
        <div>${rows || `<p>${escapeHtml(empty)}</p>`}</div>
      </section>`;
    }

    function typeLabel(type) {
      const zh = {
        job_requirement: "JD",
        resume_evidence: "证据",
        interview_question: "追问",
        risk: "风险",
        feedback: "反馈",
        offer_signal: "Offer",
        skill: "Skill",
        agent_persona: "Agent",
      };
      const en = {
        job_requirement: "JD",
        resume_evidence: "Evidence",
        interview_question: "Question",
        risk: "Risk",
        feedback: "Feedback",
        offer_signal: "Offer",
        skill: "Skill",
      };
      return (resolveLanguage() === "en" ? en : zh)[type] || type;
    }

    function renderEvidenceGraphDetail(node, edges, nodesById) {
      const labels = getEvidenceGraphLabels();
      const detailEl = evidenceGraphEl?.querySelector("#evidenceGraphDetail");
      if (detailEl) {
        detailEl.innerHTML = `<strong>${escapeHtml(node.label)}</strong>
          <p>${escapeHtml(node.summary || "")}</p>
          <button class="graph-report-link" type="button">${escapeHtml(resolveLanguage() === "en" ? "Open details" : "打开详情弹窗")}</button>`;
        detailEl.querySelector(".graph-report-link")?.addEventListener("click", () => openGraphNodeDetail(node, edges, nodesById, labels));
      }
      openGraphNodeDetail(node, edges, nodesById, labels);
    }

    function scrollReportToGraphNode(node) {
      const anchor = node.metadata?.report_anchor || node.label;
      openReportAnchorDetail(anchor, node);
    }

    function scrollReportToAnchor(anchor, node = null) {
      openReportAnchorDetail(anchor, node);
    }

    // Resolve graph anchors against the rendered report and highlight the target.
    function focusReportAnchor(anchor, node = null) {
      const heading = findReportHeading(anchor, node);
      const target = heading || findReportText(node?.label) || findReportText(node?.summary);
      if (!target) return;
      reportEl.querySelectorAll(".report-focus").forEach((item) => item.classList.remove("report-focus"));
      target.classList.add("report-focus");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => target.classList.remove("report-focus"), 1800);
    }

    function findReportHeading(text, node = null) {
      const candidates = resolveReportAnchorAliases(text, node);
      if (!candidates.length) return null;
      const headings = Array.from(reportEl.querySelectorAll("h2, h3, h4"));
      return headings.find((element) => {
        const headingText = normalizeSearchText(element.textContent);
        return candidates.some((candidate) => {
          const normalized = normalizeSearchText(candidate);
          return normalized && (headingText.includes(normalized) || normalized.includes(headingText));
        });
      }) || null;
    }

    function findReportText(text) {
      if (!text) return null;
      const normalized = normalizeSearchText(clip(text, 32));
      if (!normalized) return null;
      return Array.from(reportEl.querySelectorAll("h2, h3, h4, p, li, td")).find((element) => normalizeSearchText(element.textContent).includes(normalized));
    }

    function normalizeSearchText(value) {
      return String(value || "")
        .replace(/[（(][^）)]*[）)]/g, "")
        .replace(/[\s#：:·.,，。;；、/\\|_\-—–"'“”‘’【】\[\]{}<>《》]/g, "")
        .toLowerCase();
    }

    function resolveReportAnchorAliases(anchor, node = null) {
      const raw = [
        anchor,
        node?.metadata?.report_anchor,
        node?.label,
        node?.type ? reportAnchorForNodeType(node.type) : "",
      ].filter(Boolean);
      const normalizedSet = new Set(raw.map((item) => normalizeSearchText(item)));
      const zhAliases = [
        ["一页摘要", "摘要", "虚拟面试委员会", "委员会总结", "主持人总结", "面试官一分钟速览"],
        ["JD 隐性痛点解码", "JD痛点", "隐性痛点", "岗位痛点"],
        ["项目匹配闸口", "匹配闸口", "闸口判断"],
        ["岗位匹配", "角色匹配", "岗位要求", "JD要求"],
        ["风险与待验证", "风险", "待验证", "风险验证"],
        ["Offer 沙盘推演", "Offer推演", "Offer信号", "谈薪", "沙盘推演"],
        ["必问追问", "追问问题", "Follow-up", "问题"],
        ["面试官候选问题库", "面试官候选问题库（供挑选）", "问题库", "候选问题库", "interview_question"],
        ["面试官决策辅助", "决策辅助", "推荐等级"],
        ["面试官视角库", "视角库", "Skill", "技能"],
        ["角色分化面试官模块", "角色分化", "agent_persona"],
        ["证据链", "证据", "Evidence Chain", "resume_evidence"],
        ["人工反馈建议", "人工反馈记录", "人工反馈", "反馈校准", "Human Feedback Calibration"],
        ["动态校准指令", "动态校准", "FeedbackDistillation"],
      ];
      const enAliases = [
        ["One-Page Summary", "Summary", "Virtual Interview Panel", "Moderator Summary"],
        ["JD Hidden Pain Point Decoding", "Hidden Pain", "JD Pain"],
        ["Project Match Gate", "Match Gate"],
        ["Role Match", "JD Requirement", "Role Requirement"],
        ["Risks and Validation Needed", "Risk", "Validation Needed"],
        ["Offer Simulation", "Offer Signal", "Offer"],
        ["Must-Ask Follow-Up Questions", "Follow-Up Questions", "Question"],
        ["Interviewer Question Bank", "Question Bank", "interview_question"],
        ["Interviewer Decision Support", "Decision Support"],
        ["Interviewer Lens Library", "Lens Library", "Skill"],
        ["Virtual Interview Panel", "Panel", "agent_persona"],
        ["Evidence Chain", "Evidence", "resume_evidence"],
        ["Human Feedback Suggestions", "Human Feedback", "Human Feedback Calibration"],
        ["Dynamic Calibration Instruction", "Dynamic Calibration", "FeedbackDistillation"],
      ];
      const aliases = [...zhAliases, ...enAliases];
      aliases.forEach((group) => {
        const groupMatches = group.some((item) => {
          const normalized = normalizeSearchText(item);
          return normalizedSet.has(normalized) || Array.from(normalizedSet).some((rawValue) => rawValue.includes(normalized) || normalized.includes(rawValue));
        });
        if (groupMatches) group.forEach((item) => raw.push(item));
      });
      return Array.from(new Set(raw.filter(Boolean)));
    }

    // Share one trace-detail drawer across graph nodes, relations, and panel turns.
    function openGraphNodeDetail(node, edges = resolveCurrentRun()?.evidence_graph?.edges || [], nodesById = buildCurrentGraphNodeMap(), labels = getEvidenceGraphLabels()) {
      if (!node) return;
      const metadata = node.metadata ? Object.entries(node.metadata).slice(0, 8).map(([key, value]) => [localizeGraphMetadataKey(key), localizeGraphMetadataValue(key, value)]) : [];
      const relatedEdges = edges.filter((edge) => edge.from === node.id || edge.to === node.id).slice(0, 8);
      const anchor = node.metadata?.report_anchor;
      const relatedHtml = relatedEdges.length
        ? relatedEdges.map((edge) => {
          const otherId = edge.from === node.id ? edge.to : edge.from;
          const other = nodesById.get(otherId);
          const confidence = edge.confidence ?? edge.weight ?? 0;
          return `<button class="trace-detail-link" type="button" data-trace-node-id="${escapeHtml(otherId)}">
            <span class="link-type">${escapeHtml(localizeGraphEdgeType(edge.type))}</span>
            <span>${escapeHtml(other?.label || otherId)}</span>
            <small>${escapeHtml(labels.edgeMeta)} ${(confidence * 100).toFixed(0)}% · ${escapeHtml(localizeGraphSource(edge.source))}</small>
          </button>`;
        }).join("")
        : `<p>${escapeHtml(resolveLanguage() === "en" ? "No linked edges." : "暂无关联关系。")}</p>`;
      openTraceDetailPanel({
        meta: typeLabel(node.type),
        title: node.label,
        body: `<div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Description" : "描述")}</div>
            <p>${escapeHtml(node.summary || "")}</p>
          </div>
          ${metadata.length ? `<div class="trace-detail-section"><div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Metadata" : "元数据")}</div>${renderTraceDetailRows(metadata)}</div>` : ""}
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Related nodes" : "关联节点")}</div>
            ${relatedHtml}
          </div>
          ${anchor ? `<div class="trace-detail-section"><button class="trace-detail-action" type="button" data-trace-report-anchor="${escapeHtml(anchor)}">${escapeHtml(labels.reportAnchor)}：${escapeHtml(anchor)}</button></div>` : ""}`,
      });
    }

    function openGraphRelationDetail(edge, nodesById = buildCurrentGraphNodeMap(), labels = getEvidenceGraphLabels()) {
      const from = nodesById.get(edge.from);
      const to = nodesById.get(edge.to);
      const confidence = edge.confidence ?? edge.weight ?? 0;
      openTraceDetailPanel({
        meta: resolveLanguage() === "en" ? "Relation" : "关系",
        title: `${from?.label || edge.from} → ${to?.label || edge.to}`,
        body: `<div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Relation type" : "关系类型")}</div>
            <p>${escapeHtml(localizeGraphEdgeType(edge.type))}</p>
          </div>
          <div class="trace-detail-section">${renderTraceDetailRows([
            [labels.edgeMeta, `${(confidence * 100).toFixed(0)}%`],
            [resolveLanguage() === "en" ? "Source" : "来源", localizeGraphSource(edge.source)],
          ])}</div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Note" : "说明")}</div>
            <p>${escapeHtml(edge.note || "")}</p>
          </div>
          <div class="trace-detail-section">
            <button class="trace-detail-link" type="button" data-trace-node-id="${escapeHtml(edge.from)}"><span class="link-type">${escapeHtml(resolveLanguage() === "en" ? "From" : "来源")}</span><span>${escapeHtml(from?.label || edge.from)}</span></button>
            <button class="trace-detail-link" type="button" data-trace-node-id="${escapeHtml(edge.to)}"><span class="link-type">${escapeHtml(resolveLanguage() === "en" ? "To" : "指向")}</span><span>${escapeHtml(to?.label || edge.to)}</span></button>
          </div>`,
      });
    }

    function openPanelMessageDetail(messageEl) {
      openTraceDetailPanel({
        meta: resolveLanguage() === "en" ? "Panel turn" : "委员发言",
        title: messageEl.querySelector(".chat-meta strong")?.textContent || "",
        body: `<div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Role" : "角色")}</div>
            <p>${escapeHtml(messageEl.querySelector(".chat-meta span")?.textContent || "")}</p>
          </div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Statement" : "发言")}</div>
            <p>${escapeHtml(messageEl.querySelector(".chat-message > p")?.textContent || "")}</p>
          </div>
          <div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Trace links" : "追溯入口")}</div>
            ${messageEl.querySelector(".panel-trace-chips")?.innerHTML || `<p>${escapeHtml(resolveLanguage() === "en" ? "No trace links." : "暂无追溯入口。")}</p>`}
          </div>`,
      });
    }

    function openReportAnchorDetail(anchor, node = null) {
      const heading = findReportHeading(anchor);
      const target = heading || findReportText(node?.label) || findReportText(node?.summary);
      const excerpt = target ? buildReportExcerpt(target) : (resolveLanguage() === "en" ? "No matching report section found." : "未找到匹配的报告段落。");
      openTraceDetailPanel({
        meta: resolveLanguage() === "en" ? "Report section" : "报告段落",
        title: anchor || node?.label || (resolveLanguage() === "en" ? "Report" : "报告"),
        body: `<div class="trace-detail-section">
            <div class="trace-detail-section-title">${escapeHtml(resolveLanguage() === "en" ? "Excerpt" : "段落内容")}</div>
            <p>${escapeHtml(excerpt)}</p>
          </div>
          ${target ? `<button class="trace-detail-action" type="button" data-focus-report-anchor="${escapeHtml(anchor || "")}">${escapeHtml(resolveLanguage() === "en" ? "Highlight in report" : "在报告中高亮")}</button>` : ""}`,
      });
    }

    function openTraceDetailPanel({ meta = "", title = "", body = "" }) {
      const panel = ensureTraceDetailPanel();
      panel.querySelector(".trace-detail-meta").textContent = meta;
      panel.querySelector(".trace-detail-title").textContent = title;
      panel.querySelector(".trace-detail-body").innerHTML = body;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      bindTraceDetailActions(panel);
    }

    function ensureTraceDetailPanel() {
      if (traceDetailPanelEl) return traceDetailPanelEl;
      traceDetailPanelEl = document.createElement("aside");
      traceDetailPanelEl.className = "trace-detail-panel";
      traceDetailPanelEl.setAttribute("aria-hidden", "true");
      traceDetailPanelEl.innerHTML = `<div class="trace-detail-header">
          <div>
            <div class="trace-detail-meta"></div>
            <div class="trace-detail-title"></div>
          </div>
          <button class="trace-detail-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="trace-detail-body"></div>`;
      document.body.appendChild(traceDetailPanelEl);
      traceDetailPanelEl.querySelector(".trace-detail-close")?.addEventListener("click", closeTraceDetailPanel);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeTraceDetailPanel();
      });
      return traceDetailPanelEl;
    }

    function closeTraceDetailPanel() {
      traceDetailPanelEl?.classList.remove("open");
      traceDetailPanelEl?.setAttribute("aria-hidden", "true");
    }

    function bindTraceDetailActions(panel) {
      panel.querySelectorAll("[data-trace-node-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const node = findGraphNodeById(button.dataset.traceNodeId);
          if (node) openGraphNodeDetail(node);
        });
      });
      panel.querySelectorAll("[data-trace-report-anchor]").forEach((button) => {
        button.addEventListener("click", () => openReportAnchorDetail(button.dataset.traceReportAnchor));
      });
      panel.querySelectorAll("[data-focus-report-anchor]").forEach((button) => {
        button.addEventListener("click", () => focusReportAnchor(button.dataset.focusReportAnchor));
      });
    }

    function renderTraceDetailRows(rows) {
      return `<dl class="trace-detail-rows">${rows.map(([key, value]) => {
        const label = localizeGraphMetadataKey(String(key));
        return `<dt>${escapeHtml(label)}</dt><dd class="${escapeHtml(riskToneClass(value))}">${escapeHtml(String(value ?? ""))}</dd>`;
      }).join("")}</dl>`;
    }

    function localizeGraphMetadataKey(key) {
      if (resolveLanguage() === "en") {
        const enMap = {
          version: "Version",
          lens: "Interviewer role",
          adoption_status: "Adoption status",
          evidence_reason: "Evidence reason",
          match_status: "Match status",
          report_anchor: "Report anchor",
          source: "Source",
          source_type: "Source type",
          source_excerpt: "Source excerpt",
          evidence_level: "Evidence level",
          evidence_level_label: "Evidence level",
          verification_question: "Verification question",
          capability: "Capability",
          role_id: "Role type",
          role_label: "Role",
          skill_id: "Skill",
          stance: "Stance",
          influence_weight: "Influence weight",
          activity_level: "Activity level",
        };
        return enMap[key] || key;
      }
      const map = {
        version: "版本",
        lens: "面试官角色",
        adoption_status: "采用状态",
        evidence_reason: "证据原因",
        match_status: "匹配状态",
        report_anchor: "报告定位",
        source: "来源",
        source_type: "来源类型",
        source_excerpt: "来源摘录",
        evidence_level: "证据等级",
        evidence_level_label: "证据等级",
        verification_question: "验证问题",
        capability: "能力项",
        role_id: "岗位类型",
        role_label: "岗位",
        skill_id: "技能",
        stance: "立场",
        influence_weight: "影响权重",
        activity_level: "活跃度",
      };
      return map[key] || key;
    }

    function localizeGraphMetadataValue(key, value) {
      if (resolveLanguage() === "en") return value ?? "";
      if (key === "source" || key === "source_type") return localizeGraphSource(value);
      if (key === "report_anchor") return value || "";
      if (key === "stance") return localizePanelStance(value);
      if (key === "match_status") return value || "";
      if (key === "lens") return localizeInterviewerLens(value);
      if (key === "skill_id") return localizeSkillId(value);
      if (key === "version") return localizeSkillVersion(value);
      if (key === "adoption_status") return localizeAdoptionStatus(value);
      return value ?? "";
    }

    function localizeGraphEdgeType(type) {
      if (resolveLanguage() === "en") return type || "";
      const map = {
        supports: "支持",
        contradicts: "缺证 / 矛盾",
        validates: "验证",
        questions: "追问",
        impacts_offer: "影响 Offer",
        reads_memory: "读取记忆",
        updates: "更新",
        challenges: "质疑",
        references: "引用",
        discusses: "讨论",
        generates: "生成",
      };
      return map[type] || type || "";
    }

    function localizeSkillVersion(value) {
      const text = String(value || "");
      const match = text.match(/^skill\.([a-z_]+)\.v(\d+)$/i);
      if (!match) return text;
      const [, skillId, version] = match;
      return `${localizeSkillId(skillId)} v${version}`;
    }

    function localizeInterviewerLens(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        "HR Interviewer": "HR 面试官",
        "Business Owner": "业务负责人",
        "Product Owner": "产品负责人",
        "Project Interviewer": "项目推进面试官",
        "Technical Architect": "技术架构面试官",
        "Customer Solution": "客户方案面试官",
        "Anti-packaging Validator": "反包装验证官",
        "Executive Pressure Officer": "决策层压力官",
        hr: "HR 面试官",
        business: "业务负责人",
        product: "产品负责人",
        project: "项目推进面试官",
        technical: "技术架构面试官",
        solution: "客户方案面试官",
        decision: "决策层压力官",
        negotiation: "谈薪顾问",
      };
      return map[value] || value || "";
    }

    function localizeAdoptionStatus(value) {
      if (resolveLanguage() === "en") return value || "";
      const map = {
        selected: "已选择",
        auto_selected: "自动选择",
        adopted: "已采用",
        keep: "保留",
        rewrite: "改写采用",
        downgrade: "降权",
        delete: "删除",
        pending: "待确认",
        waiting_feedback: "等待人工反馈",
        "未反馈": "未反馈",
        "采用": "采用",
        "改写采用": "改写采用",
        "未采用": "未采用",
      };
      return map[value] || value || "";
    }

    function localizeGraphSource(source) {
      if (resolveLanguage() === "en") return source || "";
      const map = {
        resume: "简历",
        job_description: "岗位 JD",
        company_context: "公司 / 面试上下文",
        offer_constraints: "Offer / 谈薪约束",
        missing_resume_evidence: "简历证据缺口",
        resume_requirement_match: "简历与 JD 匹配",
        generated_question_bank: "生成的问题库",
        generated_interview_question: "生成的面试追问",
        evidence_gap_detection: "证据缺口检测",
        risk_rule: "风险规则",
        offer_simulation_rule: "Offer 推演规则",
        skill_registry: "技能库",
        persona_generation: "虚拟角色生成",
        mirofish_persona_generation: "MiroFish 角色生成",
        virtual_panel_memory: "虚拟委员会记忆",
        seed_extraction: "种子材料读取",
        panel_simulation: "委员会讨论",
        moderator_report: "主持人总结",
        human_feedback: "人工反馈",
      };
      return map[source] || source || "";
    }

    function findGraphNodeById(nodeId) {
      return resolveCurrentRun()?.evidence_graph?.nodes?.find((node) => node.id === nodeId) || null;
    }

    function buildCurrentGraphNodeMap() {
      return new Map((resolveCurrentRun()?.evidence_graph?.nodes || []).map((node) => [node.id, node]));
    }

    function buildReportExcerpt(target) {
      const pieces = [target.textContent || ""];
      let sibling = target.nextElementSibling;
      while (sibling && pieces.join(" ").length < 360 && !["H2", "H3"].includes(sibling.tagName)) {
        pieces.push(sibling.textContent || "");
        sibling = sibling.nextElementSibling;
      }
      return clip(pieces.join(" ").replace(/\s+/g, " ").trim(), 420);
    }

    function drawEvidenceGraphEdges(edges) {
      return edges;
    }

    function cssEscape(value) {
      if (window.CSS?.escape) return window.CSS.escape(value);
      return String(value).replace(/["\\]/g, "\\$&");
    }

    return {
      renderEvidenceGraph,
      groupEvidenceGraphNodes,
      getEvidenceGraphLabels,
      typeLabel,
      focusReportAnchor,
      normalizeSearchText,
      resolveReportAnchorAliases,
      openGraphNodeDetail,
      openPanelMessageDetail,
      openReportAnchorDetail,
      findGraphNodeById,
      cssEscape,
    };
  }

  global.OfferAgentGraphView = {
    createGraphView,
  };
})(typeof window !== "undefined" ? window : globalThis);
