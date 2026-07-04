import argparse
import json
import re
import sys
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return path.read_text(encoding="utf-8")


def static_checks():
    files = {
        "index": ROOT / "apps" / "web" / "index.html",
        "app": ROOT / "apps" / "web" / "app.js",
        "css": ROOT / "apps" / "web" / "styles.css",
        "readme": ROOT / "README.md",
        "prompt": ROOT / "prompts" / "product-manager-interview-prep.md",
        "schema_run": ROOT / "schemas" / "evaluation-run.schema.json",
        "gitignore": ROOT / ".gitignore",
    }
    content = {name: read(path) for name, path in files.items()}
    ids = set(re.findall(r'id="([^"]+)"', content["index"]))
    refs = set(re.findall(r'\$\("([^"]+)"\)', content["app"]))
    all_text = "\n".join(content.values())

    checks = {
        "product_shape_visible_in_ui": all(
            term in content["index"]
            for term in ["Offer 沙盘 + 面试官视角库", "Offer 沙盘", "面试官视角库"]
        ),
        "offer_sandbox_inputs_exist": all(
            item in ids for item in ["candidateStage", "targetLevel", "offerConstraints"]
        ),
        "skill_library_inputs_exist": "skill-toggle" in content["index"]
        and all(
            term in content["index"]
            for term in ["虚拟 HR 面试官", "虚拟业务负责人", "虚拟项目推进面试官", "虚拟谈薪顾问"]
        ),
        "llm_mode_visible": "modelMode" in ids and "当前模式：真实模型调用" in content["app"],
        "streaming_report_enabled": all(
            term in content["app"]
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
        "questions_link_jd_and_projects": "岗位职责与项目经历" in content["readme"]
        and "对应的 JD 职责" in content["prompt"]
        and "项目经历锚点" in content["app"],
        "conclusions_have_evidence": "每一个结论都必须给出证据" in content["app"]
        and "招聘岗位分析" in content["app"]
        and "结论证据化" in content["readme"],
        "direct_mismatch_conclusion_exists": "当前简历与 JD 全部为待验证 / 缺证，视同不匹配" in content["app"]
        and "当前简历与 JD 部分匹配" in content["app"]
        and "不匹配 / 缺证" in content["app"]
        and "不列追问问题，先要求补充项目证据" in content["app"],
        "audience_reports_branch_on_mismatch": "当前不列举追问问题" in content["app"]
        and "简历修改意见与重点准备" in content["app"]
        and "buildCandidateRevisionAdvice" in content["app"]
        and "blockQuestions" in content["app"],
        "markdown_artifacts_cleaned": all(
            term in content["app"] for term in ["裸露表格分隔线", "代码围栏", "replace(/```", "replace(/^\\s{0,3}>\\s?/gm", "<ol>"]
        ),
        "match_degree_colors_exist": all(
            term in content["app"] + content["css"] for term in ["tone-good", "tone-warn", "tone-risk", "cellToneClass"]
        ),
        "no_raw_backticks_in_system_prompt": "例如 **、---、```" not in content["app"],
        "pdf_export_exists": all(
            term in content["app"]
            for term in ["downloadPdfReport", "createPdfBlobFromJpegs", ".pdf", "application/pdf", "candidate-report", "interviewer-report"]
        ),
        "two_report_modules_exist": "downloadInterviewerBtn" in content["app"] + content["index"]
        and "导出候选人 PDF" in content["index"]
        and "导出面试官 PDF" in content["index"]
        and "buildAudienceMarkdown" in content["app"],
        "json_download_removed": "downloadJsonBtn" not in content["app"] + content["index"],
        "feedback_loop_exists": all(
            term in content["app"] for term in ["appendFeedbackToReport", "collectFeedback", "human_feedback"]
        ),
        "privacy_no_persistence_api": not re.search(
            r"localStorage|sessionStorage|indexedDB|document\.cookie|setItem\(|getItem\(",
            content["app"] + content["index"],
            re.I,
        ),
        "secret_file_ignored": bool(re.search(r"(?m)^1\.md$", content["gitignore"])),
        "docs_reflect_current_features": all(
            term in content["readme"]
            for term in ["辅助候选人", "项目匹配闸口", "面试官视角库", "候选人追问题库", "双模块 PDF 导出", "报告分块流式输出"]
        ),
        "prompt_reflects_current_features": all(
            term in content["prompt"]
            for term in ["辅助候选人", "项目匹配闸口", "面试官候选问题库", "候选人准备重点", "面试官视角库", "虚拟生成", "过度包装"]
        ),
        "schema_reflects_current_features": all(
            term in content["schema_run"]
            for term in ["candidate_stage", "target_level", "offer_constraints", "selected_skills", "offer_sandbox"]
        ),
        "all_dom_refs_exist": sorted(refs - ids) == [],
        "balanced_parens": content["app"].count("(") == content["app"].count(")"),
        "balanced_braces": content["app"].count("{") == content["app"].count("}"),
        "balanced_brackets": content["app"].count("[") == content["app"].count("]"),
        "no_unresolved_merge_markers": not re.search(r"<<<<<<<|=======|>>>>>>>", all_text),
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

    result = {"static": static_checks()}
    if args.with_llm:
        result["llm_stream"] = llm_stream_check(args.with_llm, args.model)

    passed = result["static"]["passed"] and result.get("llm_stream", {"passed": True})["passed"]
    result["passed"] = passed
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
