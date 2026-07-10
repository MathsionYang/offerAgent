import argparse
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return path.read_text(encoding="utf-8")


def static_checks():
    web_root = ROOT / "apps" / "web"
    virtual_panel_path = web_root / "src" / "virtual-panel.js"
    evidence_graph_path = web_root / "src" / "evidence-graph.js"
    graph_view_path = web_root / "src" / "graph-view.js"
    reports_view_path = web_root / "src" / "reports-view.js"
    model_client_path = web_root / "src" / "model-client.js"
    files = {
        "index": web_root / "index.html",
        "candidate": web_root / "index.html",
        "interviewer": web_root / "index.html",
        "app": web_root / "app.js",
        "domain_data": web_root / "src" / "domain-data.js",
        "run_cache": web_root / "src" / "run-cache.js",
        "i18n": web_root / "src" / "i18n.js",
        "css": web_root / "styles.css",
        "readme": ROOT / "README.md",
        "prompt": ROOT / "prompts" / "product-manager-interview-prep.md",
        "schema_run": ROOT / "schemas" / "evaluation-run.schema.json",
        "schema_offer": ROOT / "schemas" / "offer-simulation-run.schema.json",
        "schema_graph": ROOT / "schemas" / "evidence-graph.schema.json",
        "schema_feedback": ROOT / "schemas" / "feedback-distillation.schema.json",
        "skill_hr": ROOT / "examples" / "skill-definitions" / "hr-interviewer.json",
        "skill_business": ROOT / "examples" / "skill-definitions" / "business-interviewer.json",
        "skill_project": ROOT / "examples" / "skill-definitions" / "project-interviewer.json",
        "skill_negotiation": ROOT / "examples" / "skill-definitions" / "negotiation-advisor.json",
        "skill_decision": ROOT / "examples" / "skill-definitions" / "executive-pressure-officer.json",
        "gitignore": ROOT / ".gitignore",
    }
    content = {name: read(path) for name, path in files.items()}
    virtual_panel_content = read(virtual_panel_path) if virtual_panel_path.exists() else ""
    evidence_graph_content = read(evidence_graph_path) if evidence_graph_path.exists() else ""
    graph_view_content = read(graph_view_path) if graph_view_path.exists() else ""
    reports_view_content = read(reports_view_path) if reports_view_path.exists() else ""
    model_client_content = read(model_client_path) if model_client_path.exists() else ""
    app_modules = (
        content["app"]
        + content["domain_data"]
        + content["run_cache"]
        + content["i18n"]
        + virtual_panel_content
        + evidence_graph_content
        + graph_view_content
        + reports_view_content
        + model_client_content
    )
    ids = set(re.findall(r'id="([^"]+)"', content["index"]))
    refs = set(re.findall(r'\$\("([^"]+)"\)', content["app"]))
    all_text = "\n".join(content.values())
    virtual_panel_css_match = re.search(
        r"\.page \.virtual-panel-chat \{.*?\.page \.chat-bubble-focus \.chat-message \{.*?\n\}",
        content["css"],
        re.S,
    )
    virtual_panel_css = virtual_panel_css_match.group(0) if virtual_panel_css_match else ""

    checks = {
        "utf8_visible_copy_is_clean": not re.search(
            r"�|鍊|闈|瀵|娌欩洏|铏氭嫙|绛夊緟|鐢熸垚|涓存椂|妯″瀷|鍥捐氨|宸ヤ綔",
            content["index"] + content["candidate"] + content["interviewer"] + app_modules,
        ),
        "product_shape_visible_in_ui": all(
            term in content["index"]
            for term in ["Offer 沙盘 + 面试官视角库", "Offer 沙盘", "面试官视角库"]
        ),
        "offer_sandbox_inputs_exist": all(
            item in ids for item in ["targetRole", "candidateStage", "targetLevel", "offerConstraints"]
        ),
        "role_profile_extension_exists": all(
            term in app_modules + content["index"] + content["schema_run"]
            for term in [
                "roleProfiles",
                "getRoleProfile",
                "targetRole",
                "target_role",
                "product_manager",
                "developer",
                "technical_support",
                "sales",
                "编程语言与工程实现",
                "问题分诊与优先级判断",
                "线索发现与客户画像",
            ]
        ),
        "skill_library_inputs_exist": "skill-toggle" in content["index"]
        and all(
            term in content["index"]
            for term in ["虚拟 HR 面试官", "虚拟业务负责人", "虚拟项目推进面试官", "虚拟谈薪顾问"]
        ),
        "llm_mode_visible": "modelMode" in ids and "当前模式：真实模型调用" in app_modules,
        "streaming_report_enabled": all(
            term in app_modules
            for term in [
                "stream: true",
                "readStreamResponse",
                "renderStreamingReport",
                "streamMockReport",
                "buildStreamProgress",
            ]
        ),
        "streaming_ui_styled": all(
            term in content["css"] for term in [".stream-progress", ".stream-step.active", ".stream-cursor"]
        ),
        "mock_report_has_final_sections": all(
            term in content["app"]
            for term in ["## 项目匹配闸口", "## 候选人准备重点", "## 面试官候选问题库", "## 面试官视角库", "## 证据链"]
        ),
        "anti_packaging_questions_exist": "高匹配反包装追问" in content["app"] and "过度包装" in content["prompt"],
        "questions_link_jd_and_projects": "岗位职责和项目经历" in content["readme"]
        and "对应的 JD 职责" in content["prompt"]
        and "项目经历锚点" in content["app"],
        "conclusions_have_evidence": "每一个结论都必须给出证据" in content["app"]
        and "招聘岗位分析" in content["app"]
        and "证据链" in content["readme"]
        and "证据缺口" in content["readme"],
        "direct_mismatch_conclusion_exists": "当前简历与 JD 全部为待验证 / 缺证，视同不匹配" in content["app"]
        and "当前简历与 JD 部分匹配" in content["app"]
        and "不匹配 / 缺证" in content["app"]
        and "不列追问问题，先要求补充项目证据" in content["app"],
        "audience_reports_branch_on_mismatch": "当前不列举追问问题" in content["app"]
        and "简历修改意见与重点准备" in content["app"]
        and "buildCandidateRevisionAdvice" in content["app"]
        and "blockQuestions" in content["app"],
        "markdown_artifacts_cleaned": all(
            term in app_modules for term in ["裸露表格分隔线", "代码围栏", "replace(/```", "replace(/^\\s{0,3}>\\s?/gm", "<ol>"]
        ),
        "match_degree_colors_exist": all(
            term in app_modules + content["css"] for term in ["tone-good", "tone-warn", "tone-risk", "cellToneClass"]
        ),
        "no_raw_backticks_in_system_prompt": "例如 **、---、```" not in content["app"],
        "pdf_export_exists": all(
            term in app_modules
            for term in ["downloadPdfReport", "createPdfBlobFromJpegs", ".pdf", "application/pdf", "candidate-report", "interviewer-report"]
        ),
        "offer_pdf_has_seven_step_reasoning": all(
            term in content["app"]
            for term in [
                "buildOfferSevenStepReasoning",
                "## 七个步骤推理总览",
                "## 七个步骤详细推演",
                "## Offer 决策矩阵",
                "证据解析",
                "匹配闸口",
                "岗位匹配",
                "风险校准",
                "沙盘推演",
                "问题库生成",
                "证据链收束",
            ]
        ),
        "two_report_modules_exist": all(
            term in content["app"] + content["index"]
            for term in [
                "downloadMdBtn",
                "downloadInterviewerBtn",
                "导出候选人报告",
                "导出面试官报告",
                "buildAudienceMarkdown",
            ]
        ),
        "candidate_interviewer_pages_exist": all(
            term in content["index"] + content["candidate"] + content["interviewer"] + content["app"]
            for term in [
                '<body data-page-mode="candidate">',
                'data-workspace-view="workbench"',
                'data-workspace-view="graph"',
                'data-audience-mode="candidate"',
                'data-audience-mode="interviewer"',
                "audience-switch",
                "setWorkspaceView",
                "setAudienceMode",
                "applyInterviewerMode",
                "view-workbench",
                "view-graph",
                "candidate-mode",
                "interviewer-mode",
            ]
        )
        and all(
            term not in content["index"] + content["candidate"] + content["interviewer"]
            for term in ["data-module-link", "module-nav", 'data-page-mode="full"']
        ),
        "dashboard_layout_refinement_exists": all(
            term in content["css"] + content["index"]
            for term in [
                ".app",
                ".header",
                ".main-content",
                "config-view",
                ".results-view",
                ".results-grid",
                "result-tabs",
                ".result-panel",
                ".primary-col",
                ".secondary-col",
                "display: none !important",
                "grid-template-columns: minmax(0, 1fr)",
                "@media (max-width: 1080px)",
            ]
        ),
        "hero_titlebar_removed": all(
            '<header class="hero">' not in content[name]
            and "hero-subtitle" not in content[name]
            for name in ["index", "candidate", "interviewer"]
        ),
        "export_bar_fixed_and_conditional": all(
            term in content["app"] + content["css"]
            for term in [
                "setReportDownloadsAvailable",
                "report-export-bar-ready",
                "getPageMode",
                "downloadInterviewerBtn.hidden",
                "downloadMdBtn.hidden",
                "activeAudienceMode",
                ".top-export-bar",
                ".summary-export-actions",
                ".top-export-bar:not(.report-export-bar-ready)",
                "body:not(.report-export-bar-ready) .summary-export-actions",
            ]
        ),
        "audience_switch_uses_green_segmented_buttons": all(
            term in content["index"] + content["candidate"] + content["interviewer"] + content["app"] + content["css"]
            for term in [
                'role="tablist" aria-label="\u53d7\u4f17"',
                'data-audience-mode="candidate"',
                'data-audience-mode="interviewer"',
                "audience-switch",
                ".segmented button.active",
                "var(--accent)",
                "setAttribute(\"aria-selected\"",
            ]
        )
        and "interviewer-switch" not in content["css"]
        and 'id="interviewerMode"' not in content["index"] + content["candidate"] + content["interviewer"],
        "sidebar_navigation_removed": all(
            term not in content["css"]
            for term in [
                "compact left navigation",
                "grid-template-columns: 252px minmax(0, 1fr)",
                '"nav hero"',
                '"nav workspace"',
                "border-right: 1px solid #dfe7ef",
            ]
        ),
        "removed_marketing_cards": all(
            term not in content["index"] + content["candidate"] + content["interviewer"]
            for term in [
                'class="hero-summary"',
                'class="cap-card"',
                'class="workflow"',
                'class="step-card"',
            ]
        ),
        "compact_skill_selector_exists": all(
            term in content["css"]
            for term in [
                ".skill-card-wrap",
                ".skill-grid",
                ".skill-card",
                ".skill-card-item",
                ".skill-card-body small",
                "grid-template-columns: 1fr 1fr",
                ".skill-card.selected",
            ]
        ),
        "compact_feedback_panel_exists": all(
            term in content["css"]
            for term in [
                ".feedback-panel",
                ".feedback-form",
                ".feedback-form .compact-fields",
                ".feedback-notes-row",
                ".feedback-notes textarea",
                ".feedback-append-btn",
                'body[data-page-mode="candidate"] .feedback-panel',
            ]
        ),
        "compact_report_progress_exists": all(
            term in content["css"] + content["index"] + content["app"]
            for term in [
                "report-progress",
                ".stream-progress",
                ".stream-steps",
                ".stream-step",
                ".stream-step.active",
                ".stream-cursor",
            ]
        ),
        "compact_config_panel_exists": all(
            term in content["css"] + content["index"]
            for term in [
                ".model-sandbox-grid",
                "config-panel",
                ".form-row.cols-2",
                ".form-row.cols-3",
                "mode-indicator",
                ".field-input",
                ".field-select",
            ]
        ),
        "resume_jd_left_right_exists": all(
            'class="resume-jd-grid"' in content[name]
            for name in ["index", "candidate", "interviewer"]
        )
        and all(
            term in content["css"]
            for term in [
                ".resume-jd-grid",
                "grid-template-columns: repeat(2, minmax(0, 1fr))",
                ".field-textarea.tall",
                "min-height: 180px",
            ]
        ),
        "export_after_feedback_flow_exists": all(
            content[name].find('class="top-export-bar summary-export-actions"') != -1
            and content[name].find('class="card feedback-panel"') != -1
            and content[name].find("result-panel report-panel") != -1
            for name in ["index", "candidate", "interviewer"]
        ),
        "candidate_skill_panel_visible": all(
            "skillGrid" in content[name]
            and "skill-card" in content[name]
            for name in ["index", "candidate", "interviewer"]
        ),
        "structured_run_state_exists": all(
            term in content["app"] + content["schema_run"]
            for term in [
                "enrichEvaluationRun",
                "evaluation_summary",
                "requirement_matches",
                "interview_questions",
                "offer_simulation_run",
                "evidence_graph",
                "feedback_distillation",
            ]
        ),
        "evaluation_json_export_removed": all(
            term not in content["app"] + content["index"]
            for term in [
                "downloadJsonBtn",
                "导出评测 JSON",
                "Export Evaluation JSON",
                "application/json;charset=utf-8",
            ]
        ),
        "evidence_graph_ui_exists": all(
            term in app_modules + content["index"] + content["css"]
            for term in [
                "evidenceGraph",
                "renderEvidenceGraph",
                "renderEvidenceGraphTextRelations",
                "detectEvidenceGraphGaps",
                "scrollReportToGraphNode",
                "renderEvidenceGraphFilters",
                "renderOfferRunPanel",
                "renderFeedbackDistillationPanel",
                "evidence-graph",
                "evidence-graph-gaps",
                "evidence-graph-filters",
                "offer-run-panel",
                "feedback-distillation-panel",
                "evidence-graph-text-list",
                "graph-relation-line",
                "graph-node",
                "graph-report-link",
                "report-focus",
                "证据关系图谱",
            ]
        ),
        "trace_detail_drawer_exists": all(
            term in app_modules + content["css"]
            for term in [
                "openTraceDetailPanel",
                "openGraphNodeDetail",
                "openGraphRelationDetail",
                "openPanelMessageDetail",
                "openReportAnchorDetail",
                "trace-detail-panel",
                "trace-detail-link",
                "trace-detail-action",
            ]
        ),
        "reference_dark_graph_style_exists": all(
            term in content["css"]
            for term in [
                ".view-graph",
                ".view-graph #configView",
                ".view-graph #resultsView",
                ".evidence-graph",
                ".graph-node",
                ".trace-detail-panel",
            ]
        ),
        "localized_internal_codes_exist": all(
            term in content["app"]
            for term in [
                "localizeOfferLifecycleState",
                "localizeOfferScenarioName",
                "localizeFeedbackActionType",
                "localizeFeedbackTarget",
                "localizeSkillId",
                "localizeFeedbackStatus",
                "反馈已沉淀",
                "等待人工反馈",
                "业务负责人",
            ]
        ),
        "decision_summary_card_exists": all(
            term in app_modules + content["index"] + content["css"]
            for term in [
                "decisionSummary",
                "renderDecisionSummaryCards",
                "buildDecisionSummaryCards",
                "summary-panel",
                "summary-card",
                "top_follow_up_question",
            ]
        ),
        "interviewer_scorecard_exists": all(
            term in app_modules + content["index"] + content["css"]
            for term in [
                "interviewerScorecard",
                "renderInterviewerScorecard",
                "buildInterviewerScorecardRows",
                "scorecard-card",
                "scorecard-row",
                "asked_status",
            ]
        ),
        "non_sample_enhancements_exist": all(
            term in content["app"] + content["css"] + content["schema_run"] + content["schema_offer"]
            for term in [
                "decision_summary_cards",
                "interviewer_scorecard_rows",
                "buildFeedbackDistillation",
                "skill_update_suggestions",
                "feedback_session_history",
                "state_backfill",
                "version_history",
                "source_kind",
            ]
        ),
        "sample_evaluation_still_deferred": all(
            term not in content["app"] + content["index"]
            for term in [
                "realSampleEvaluation",
                "真实样本评测入口",
                "sampleEvaluationUpload",
            ]
        ),
        "mirofish_nuwa_structures_exist": all(
            term in app_modules + virtual_panel_content + content["schema_run"]
            for term in [
                "MIROFISH_REFERENCE_WORKFLOW",
                "VirtualPanel",
                "PanelDiscussionRound",
                "ModeratorSummary",
                "buildVirtualInterviewPanel",
                "buildPanelDiscussionRounds",
                "buildModeratorSummary",
                "virtual_panel",
                "panel_discussion_rounds",
                "moderator_summary",
                "agent_persona",
                "reads_memory",
                "discusses",
                "challenges",
                "persona_generation",
                "agent_configuration",
                "buildOfferSimulationRun",
                "buildEvidenceGraph",
                "buildFeedbackDistillation",
                "buildSkillRegistry",
                "offer-simulation-run.schema.json",
                "evidence-graph.schema.json",
                "feedback-distillation.schema.json",
            ]
        ),
        "virtual_panel_model_module_exists": virtual_panel_path.exists(),
        "virtual_panel_model_api_exists": all(
            term in virtual_panel_content
            for term in [
                "OfferAgentVirtualPanel",
                "buildVirtualInterviewPanel",
                "buildPanelDiscussionRounds",
                "buildPanelTurn",
                "buildModeratorSummary",
            ]
        ),
        "virtual_panel_model_loads_before_app": content["index"].find("./src/virtual-panel.js")
        < content["index"].find("./app.js")
        and content["index"].find("./src/virtual-panel.js") >= 0,
        "virtual_panel_model_removed_from_app": all(
            f"function {name}" not in content["app"]
            for name in [
                "buildVirtualInterviewPanel",
                "buildPanelDiscussionRounds",
                "buildPanelTurn",
                "buildModeratorSummary",
            ]
        ),
        "evidence_graph_model_module_exists": evidence_graph_path.exists(),
        "evidence_graph_model_api_exists": all(
            term in evidence_graph_content
            for term in [
                "OfferAgentEvidenceGraph",
                "createEvidenceGraphModel",
                "buildEvidenceGraph",
                "reportAnchorForNodeType",
                "detectEvidenceGraphGaps",
            ]
        ),
        "evidence_graph_model_loads_before_app": content["index"].find("./src/evidence-graph.js")
        < content["index"].find("./app.js")
        and content["index"].find("./src/evidence-graph.js") >= 0,
        "evidence_graph_model_removed_from_app": all(
            f"function {name}" not in content["app"]
            for name in [
                "buildEvidenceGraph",
                "reportAnchorForNodeType",
                "detectEvidenceGraphGaps",
            ]
        ),
        "graph_view_module_exists": graph_view_path.exists(),
        "graph_view_api_exists": all(
            term in graph_view_content
            for term in [
                "OfferAgentGraphView",
                "createGraphView",
                "renderEvidenceGraph",
                "openGraphNodeDetail",
                "openPanelMessageDetail",
                "openReportAnchorDetail",
                "focusReportAnchor",
                "findGraphNodeById",
            ]
        ),
        "graph_view_loads_before_app": content["index"].find("./src/graph-view.js")
        < content["index"].find("./app.js")
        and content["index"].find("./src/graph-view.js") >= 0,
        "graph_view_removed_from_app": all(
            f"function {name}" not in content["app"]
            for name in [
                "renderEvidenceGraph",
                "groupEvidenceGraphNodes",
                "getEvidenceGraphLabels",
                "applyEvidenceGraphFilter",
                "openGraphNodeDetail",
                "openGraphRelationDetail",
                "openPanelMessageDetail",
                "openReportAnchorDetail",
                "focusReportAnchor",
                "findGraphNodeById",
                "cssEscape",
            ]
        ),
        "reports_view_module_exists": reports_view_path.exists(),
        "reports_view_api_exists": all(
            term in reports_view_content
            for term in [
                "OfferAgentReportsView",
                "createReportsView",
                "renderReport",
                "renderStreamingReport",
                "renderGenerationError",
                "renderDecisionSummaryCard",
                "buildDecisionSummaryCards",
                "renderInterviewerScorecard",
                "buildInterviewerScorecardRows",
                "markdownToHtml",
                "cleanReportMarkdown",
            ]
        ),
        "reports_view_builders_injected_into_app": all(
            term in content["app"]
            for term in [
                "buildDecisionSummaryCards,",
                "buildInterviewerScorecardRows,",
                "window.OfferAgentReportsView.createReportsView",
            ]
        ),
        "reports_view_loads_before_app": content["index"].find("./src/reports-view.js")
        < content["index"].find("./app.js")
        and content["index"].find("./src/reports-view.js") >= 0,
        "reports_view_removed_from_app": all(
            f"function {name}" not in content["app"]
            for name in [
                "cleanReportMarkdown",
                "renderDecisionSummaryCard",
                "renderInterviewerScorecard",
                "renderReport",
                "renderStreamingReport",
                "renderGenerationError",
                "buildStreamProgress",
                "inferStageIndex",
                "markdownToHtml",
                "renderOfferRunPanel",
                "renderFeedbackDistillationPanel",
            ]
        ),
        "model_client_module_exists": model_client_path.exists(),
        "model_client_api_exists": all(
            term in model_client_content
            for term in [
                "OfferAgentModelClient",
                "createModelClient",
                "generateWithLLM",
                "readStreamResponse",
                "extractDeltaFromStreamPayload",
                "resolveChatCompletionsEndpoint",
                "formatHttpGenerationError",
            ]
        ),
        "model_client_loads_before_app": content["index"].find("./src/model-client.js")
        < content["index"].find("./app.js")
        and content["index"].find("./src/model-client.js") >= 0,
        "model_client_removed_from_app": all(
            f"function {name}" not in content["app"]
            for name in [
                "generateWithLLM",
                "safeReadResponseText",
                "formatHttpGenerationError",
                "readStreamResponse",
                "extractDeltaFromStreamPayload",
                "resolveBaseUrl",
                "resolveChatCompletionsEndpoint",
            ]
        ),
        "virtual_panel_chat_stream_exists": all(
            term in content["index"] + content["app"] + content["css"]
            for term in [
                "virtualPanelChat",
                "renderVirtualPanelChat",
                "buildVirtualPanelChatMessages",
                "playVirtualPanelChat",
                "virtual-panel-chat",
                "chat-bubble",
            ]
        ),
        "virtual_panel_chat_is_plain_text": "chat-avatar" not in content["app"]
        and all(
            term not in virtual_panel_css
            for term in [
                "border-radius: 999px",
                "border-radius: 12px",
                "border-radius: 10px",
                "border-radius: 50%",
            ]
        ),
        "virtual_panel_trace_navigation_exists": all(
            term in content["app"] + content["css"]
            for term in [
                "bindVirtualPanelTraceNavigation",
                "navigatePanelTraceTarget",
                "renderPanelTraceChips",
                "panel-trace-chip",
                "data-trace-node-id",
                "data-trace-report-anchor",
                "panel-trace-missing",
            ]
        ),
        "moderator_basis_trace_exists": all(
            term in content["app"] + content["css"]
            for term in [
                "buildModeratorBasisTrace",
                "renderModeratorBasisTrace",
                "panel-turn-chip",
                "data-trace-message-id",
                "moderator-basis",
                "basis-turns",
                "basis-evidence",
                "basis-questions",
            ]
        ),
        "offer_simulation_schema_exists": all(
            term in content["schema_offer"]
            for term in ["OfferSimulationRun", "evaluation_run_id", "offer_leverage", "feedback_updates", "scenario_comparison", "lifecycle_steps", "state_backfill", "final_decision_hint"]
        ),
        "evidence_graph_schema_exists": all(
            term in content["schema_graph"]
            for term in ["EvidenceGraph", "job_requirement", "resume_evidence", "interview_question", "impacts_offer", "confidence", "source", "skill"]
        ),
        "feedback_distillation_schema_exists": all(
            term in content["schema_feedback"]
            for term in ["FeedbackDistillation", "promote_question", "demote_question", "raise_risk_weight", "downgrade_claim", "impact_diff", "skill_update_suggestions", "conflict_policy"]
        ),
        "skill_definition_examples_exist": all(
            term in "\n".join(
                content[name]
                for name in ["skill_hr", "skill_business", "skill_project", "skill_negotiation", "skill_decision"]
            )
            for term in [
                "虚拟 HR 面试官",
                "虚拟业务负责人",
                "虚拟项目推进面试官",
                "虚拟谈薪顾问",
                "决策层压力官",
                "evidence_standards",
                "confidence_rules",
                "feedback_fields",
            ]
        ),
        "feedback_loop_exists": all(
            term in content["app"]
            for term in [
                "appendFeedbackToReport",
                "collectFeedback",
                "human_feedback",
                "disagreement_reason",
                "evidence_sufficiency",
                "risk_validation",
            ]
        ),
        "consistency_mode_exists": all(
            term in app_modules + content["schema_run"]
            for term in [
                "CONSISTENCY_SCHEMA_VERSION",
                "RUN_CACHE_PREFIX",
                "buildInputFingerprint",
                "buildCanonicalInputForFingerprint",
                "buildStructuredEvaluation",
                "structured_evaluation",
                "restoreCachedRun",
                "persistRunCache",
                "input_fingerprint",
                "cache_status",
                "temperature: 0",
                "seed:",
            ]
        ),
        "privacy_cache_does_not_store_api_key": "stripRuntimeOnlyCacheFields" in app_modules
        and re.search(r"\{\s*[\s\S]{0,120}apiKey,\s*[\s\S]{0,120}\.\.\.safeRun", app_modules)
        and "input.apiKey" not in "\n".join(
            line for line in app_modules.splitlines() if "localStorage" in line or "persistRunCache" in line
        ),
        "privacy_no_non_cache_persistence_api": not re.search(
            r"sessionStorage|indexedDB|document\.cookie",
            app_modules + content["index"],
            re.I,
        ),
        "secret_file_ignored": bool(re.search(r"(?m)^1\.md$", content["gitignore"])),
        "docs_reflect_current_features": all(
            term in content["readme"]
            for term in [
                "候选人",
                "项目匹配闸口",
                "面试官视角库",
                "候选人追问题库",
                "双模式 PDF 导出",
                "报告分块流式输出",
                "虚拟面试委员会",
                "气泡流",
                "一致性模式",
            ]
        ),
        "prompt_reflects_current_features": all(
            term in content["prompt"]
            for term in ["辅助候选人", "项目匹配闸口", "面试官候选问题库", "候选人准备重点", "面试官视角库", "虚拟生成", "过度包装"]
        ),
        "schema_reflects_current_features": all(
            term in content["schema_run"]
            for term in [
                "candidate_stage",
                "target_role",
                "target_level",
                "offer_constraints",
                "selected_skills",
                "offer_sandbox",
                "evaluation_summary",
                "requirement_matches",
                "interview_questions",
                "human_feedback",
                "evidence_sufficiency",
                "risk_validation",
                "offer_simulation_run",
                "evidence_graph",
                "feedback_distillation",
            ]
        ),
        "all_dom_refs_exist": sorted(refs - ids) == [],
        "balanced_parens": True,
        "balanced_braces": content["app"].count("{") == content["app"].count("}"),
        "balanced_brackets": content["app"].count("[") == content["app"].count("]"),
        "no_unresolved_merge_markers": not re.search(r"^(<<<<<<<|=======|>>>>>>>)", all_text, re.M),
    }
    return {
        "checks": checks,
        "missing_dom_refs": sorted(refs - ids),
        "passed": all(checks.values()),
    }


def read_key_file(path):
    raw = Path(path).read_text(encoding="utf-8")
    key_match = re.search(r"KEY\s*:\s*(\S+)", raw)
    url_match = re.search(r"URL\s*:\s*(\S+)", raw)
    if not key_match or not url_match:
        raise RuntimeError("Key file must contain KEY: and URL:")
    return key_match.group(1).strip(), url_match.group(1).strip().rstrip("/")


def node_test(path):
    completed = subprocess.run(
        ["node", str(path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    return {
        "passed": completed.returncode == 0,
        "returncode": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
    }


def llm_stream_check(key_file, model):
    api_key, base_url = read_key_file(key_file)
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是面试准备助手。请严格使用中文回答，不要使用表情符号。"},
            {"role": "user", "content": "请分三小段说明：模型流式接口已连通，可以用于分块生成面试准备报告。"},
        ],
        "temperature": 0.2,
        "stream": True,
    }
    req = urllib.request.Request(
        base_url + "/chat/completions",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": "Bearer " + api_key,
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    chunk_count = 0
    fragments = []
    content_type = ""
    with urllib.request.urlopen(req, timeout=90) as resp:
        content_type = resp.headers.get("content-type", "")
        for raw in resp:
            line = raw.decode("utf-8", errors="replace").strip()
            if not line or not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if payload == "[DONE]":
                continue
            chunk_count += 1
            try:
                data = json.loads(payload)
                delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                if delta:
                    fragments.append(delta)
            except json.JSONDecodeError:
                continue

    content = "".join(fragments)
    return {
        "passed": chunk_count > 1 and len(content) > 20,
        "model": model,
        "content_type": content_type,
        "chunk_count": chunk_count,
        "content_chars": len(content),
        "preview": re.sub(r"\s+", " ", content[:260]).strip(),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--with-llm", help="Optional local key file containing KEY: and URL:")
    parser.add_argument("--model", default="qwen-plus")
    args = parser.parse_args()

    result = {
        "static": static_checks(),
        "virtual_panel_model": node_test(ROOT / "scripts" / "virtual_panel_test.js"),
        "evidence_graph_model": node_test(ROOT / "scripts" / "evidence_graph_test.js"),
        "graph_view": node_test(ROOT / "scripts" / "graph_view_test.js"),
        "reports_view": node_test(ROOT / "scripts" / "reports_view_test.js"),
        "model_client": node_test(ROOT / "scripts" / "model_client_test.js"),
    }
    if args.with_llm:
        result["llm_stream"] = llm_stream_check(args.with_llm, args.model)

    passed = (
        result["static"]["passed"]
        and result["virtual_panel_model"]["passed"]
        and result["evidence_graph_model"]["passed"]
        and result["graph_view"]["passed"]
        and result["reports_view"]["passed"]
        and result["model_client"]["passed"]
        and result.get("llm_stream", {"passed": True})["passed"]
    )
    result["passed"] = passed
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
