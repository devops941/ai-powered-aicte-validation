"""
rules_engine.py - Declarative Compliance Rules Engine for AICTE VeriSense.
Reads regulatory rules and document checklists from rules.yaml and executes checks
on extracted application document data, cross-document fuzzy comparisons, and AICTE history.
"""

import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import yaml
from db import get_aicte_history


def load_rules_config(yaml_path: str = "rules.yaml") -> Dict[str, Any]:
    """Loads rules and checklist configuration from YAML."""
    if not os.path.exists(yaml_path):
        resolved = os.path.join(os.path.dirname(os.path.abspath(__file__)), yaml_path)
        if os.path.exists(resolved):
            yaml_path = resolved
        else:
            raise FileNotFoundError(f"Rules configuration file not found at: {yaml_path}")
    with open(yaml_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def compute_similarity(s1: str, s2: str) -> float:
    """
    Calculates fuzzy similarity percentage (0.0 to 100.0).
    Uses rapidfuzz if installed; falls back gracefully to difflib.
    """
    if not s1 or not s2:
        return 0.0
    try:
        from rapidfuzz import fuzz
        return float(fuzz.token_sort_ratio(s1, s2))
    except ImportError:
        import difflib
        return round(difflib.SequenceMatcher(None, s1.lower(), s2.lower()).ratio() * 100.0, 1)


# --- CONDITION EVALUATOR IMPLEMENTATIONS ---

def eval_checklist_completeness(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """Checks if all required document types are present in the submitted application."""
    cond = rule["condition"]
    required_docs = cond.get("required_docs", [])
    present_docs = set(doc_bundle.keys())
    missing = [d for d in required_docs if d not in present_docs]

    if not missing:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "pass",
            "document": "Application Bundle",
            "evidence": f"All {len(required_docs)} mandatory documents uploaded: {', '.join(required_docs)}.",
            "timestamp": now_iso
        }
    else:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": "Application Bundle",
            "evidence": f"Missing mandatory document(s): {', '.join(missing)}.",
            "timestamp": now_iso
        }


def eval_date_not_expired(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """Checks if an expiry/validity date is on or after the reference benchmark date."""
    cond = rule["condition"]
    target_doc = cond["document"]
    date_field = cond["date_field"]
    ref_date = cond.get("reference_date", "2026-06-01")

    if target_doc not in doc_bundle:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": target_doc,
            "evidence": f"Cannot verify validity: {target_doc} is missing from application.",
            "timestamp": now_iso
        }

    fields = doc_bundle[target_doc].get("fields", {})
    date_info = fields.get(date_field, {})
    iso_date = date_info.get("value")
    evidence_snippet = date_info.get("evidence", "No snippet found")

    if not iso_date:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": target_doc,
            "evidence": f"Manual Review Required: {date_field} could not be extracted automatically from {target_doc}.",
            "timestamp": now_iso
        }

    if iso_date >= ref_date:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "pass",
            "document": target_doc,
            "evidence": f"Valid until {iso_date} (meets reference deadline {ref_date}). Evidence: '{evidence_snippet}'",
            "timestamp": now_iso
        }
    else:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": target_doc,
            "evidence": f"EXPIRED: Valid until {iso_date}, which is before academic year benchmark {ref_date}. Evidence: '{evidence_snippet}'",
            "timestamp": now_iso
        }


def eval_cross_document_match(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """
    Ensures a field (e.g., institution_name, land_area, address) agrees across documents.
    Uses fuzzy string matching with similarity score logging when min_similarity is set.
    """
    cond = rule["condition"]
    field_name = cond["field"]
    target_docs = cond["documents"]
    min_similarity = float(cond.get("min_similarity", 100.0))

    collected_values = {}
    for d in target_docs:
        if d in doc_bundle:
            f = doc_bundle[d].get("fields", {}).get(field_name, {})
            val = f.get("value")
            if val is not None and str(val).strip():
                collected_values[d] = str(val).strip()

    if len(collected_values) < 2:
        present = list(collected_values.keys())
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": "Cross-Document Check",
            "evidence": f"Manual Review Required: Field '{field_name}' only found in {present or 'no documents'}; need at least 2 to cross-verify.",
            "timestamp": now_iso
        }

    # Perform Pairwise Comparison
    doc_keys = list(collected_values.keys())
    mismatches = []
    pairwise_scores = []

    for i in range(len(doc_keys)):
        for j in range(i + 1, len(doc_keys)):
            doc_a, val_a = doc_keys[i], collected_values[doc_keys[i]]
            doc_b, val_b = doc_keys[j], collected_values[doc_keys[j]]

            # Numeric comparison if both values represent numbers
            try:
                num_a, num_b = float(val_a), float(val_b)
                if abs(num_a - num_b) > 0.001:
                    mismatches.append(f"{doc_a} ({num_a}) != {doc_b} ({num_b})")
                continue
            except (ValueError, TypeError):
                pass

            # String / Fuzzy comparison
            sim = compute_similarity(val_a, val_b)
            pairwise_scores.append(sim)
            if sim < min_similarity:
                mismatches.append(
                    f"'{val_a}' ({doc_a}) vs '{val_b}' ({doc_b}) -> Similarity: {sim:.1f}% (Required: >={min_similarity:.0f}%)"
                )

    if not mismatches:
        avg_sim = sum(pairwise_scores) / len(pairwise_scores) if pairwise_scores else 100.0
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "pass",
            "document": "Cross-Document Check",
            "evidence": f"Field '{field_name}' agrees across {len(collected_values)} documents (Average similarity: {avg_sim:.1f}%).",
            "timestamp": now_iso
        }
    else:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": "Cross-Document Check",
            "evidence": f"DISCREPANCY in '{field_name}': " + "; ".join(mismatches),
            "timestamp": now_iso
        }


def eval_numeric_threshold(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """Compares numeric values like land area against minimum regulatory requirements."""
    cond = rule["condition"]
    target_doc = cond["document"]
    field_name = cond["field"]
    op = cond.get("operator", ">=")
    target_val = float(cond["target_value"])

    if target_doc not in doc_bundle:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": target_doc,
            "evidence": f"{target_doc} is missing from application bundle.",
            "timestamp": now_iso
        }

    field_data = doc_bundle[target_doc].get("fields", {}).get(field_name, {})
    val = field_data.get("value")
    evidence = field_data.get("evidence", "No evidence snippet")

    if val is None:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": target_doc,
            "evidence": f"Manual Review Required: Numeric '{field_name}' could not be identified in {target_doc}.",
            "timestamp": now_iso
        }

    try:
        val_float = float(val)
        passed = (val_float >= target_val) if op == ">=" else (val_float <= target_val)
        unit = field_data.get("unit", "")
        if passed:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "pass",
                "document": target_doc,
                "evidence": f"{field_name} is {val_float} {unit} (meets threshold {op} {target_val}). Evidence: '{evidence}'",
                "timestamp": now_iso
            }
        else:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "fail",
                "document": target_doc,
                "evidence": f"NON-COMPLIANT: {field_name} is {val_float} {unit}, which violates requirement {op} {target_val}. Evidence: '{evidence}'",
                "timestamp": now_iso
            }
    except Exception as e:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": target_doc,
            "evidence": f"Manual Review Required: Could not evaluate numeric value: {str(e)}",
            "timestamp": now_iso
        }


def eval_regex_format(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """Validates certificate or registration identifier against regex pattern."""
    cond = rule["condition"]
    target_doc = cond["document"]
    field_name = cond["field"]
    pattern = cond["pattern"]

    if target_doc not in doc_bundle:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": target_doc,
            "evidence": f"{target_doc} is missing from application bundle.",
            "timestamp": now_iso
        }

    field_data = doc_bundle[target_doc].get("fields", {}).get(field_name, {})
    val = field_data.get("value")
    evidence = field_data.get("evidence", "No evidence snippet")

    if not val:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": target_doc,
            "evidence": f"Manual Review Required: '{field_name}' not detected in {target_doc}.",
            "timestamp": now_iso
        }

    if re.match(pattern, str(val)):
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "pass",
            "document": target_doc,
            "evidence": f"Identifier '{val}' conforms to regulatory format. Evidence: '{evidence}'",
            "timestamp": now_iso
        }
    else:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": target_doc,
            "evidence": f"INVALID FORMAT: '{val}' does not follow official pattern. Evidence: '{evidence}'",
            "timestamp": now_iso
        }


def eval_text_clause_presence(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """Verifies that mandatory legal declarations or clauses appear in document text."""
    cond = rule["condition"]
    target_docs = cond.get("documents") or ([cond["document"]] if "document" in cond else [])
    if isinstance(target_docs, str):
        target_docs = [target_docs]
    required_phrases = cond.get("required_phrases", [])
    match_mode = cond.get("match_mode", "all")

    combined_texts = []
    found_docs = []
    for d in target_docs:
        if d in doc_bundle:
            combined_texts.append(doc_bundle[d].get("raw_text", ""))
            found_docs.append(d)

    doc_label = ", ".join(found_docs) if found_docs else (target_docs[0] if target_docs else "Document")

    if not found_docs:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "fail",
            "document": doc_label,
            "evidence": f"Target document(s) ({', '.join(target_docs)}) missing from application bundle.",
            "timestamp": now_iso
        }

    full_text = "\n".join(combined_texts)
    if match_mode == "any":
        matched = [p for p in required_phrases if re.search(r'\b' + re.escape(p) + r'\b', full_text, re.IGNORECASE)]
        if matched:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "pass",
                "document": doc_label,
                "evidence": f"Required legal clause confirmed present ({', '.join(matched)}) across {doc_label}.",
                "timestamp": now_iso
            }
        else:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "fail",
                "document": doc_label,
                "evidence": f"MISSING MANDATORY CLAUSES: None of the acceptable affirmations ({', '.join(required_phrases)}) were found in {doc_label}.",
                "timestamp": now_iso
            }
    else:
        missing_phrases = [p for p in required_phrases if not re.search(r'\b' + re.escape(p) + r'\b', full_text, re.IGNORECASE)]
        if not missing_phrases:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "pass",
                "document": doc_label,
                "evidence": f"All required legal clauses confirmed present ({', '.join(required_phrases)}) across {doc_label}.",
                "timestamp": now_iso
            }
        else:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "fail",
                "document": doc_label,
                "evidence": f"MISSING MANDATORY CLAUSES: The following phrases were not affirmed in {doc_label}: {', '.join(missing_phrases)}.",
                "timestamp": now_iso
            }


def eval_historical_check(rule: Dict[str, Any], doc_bundle: Dict[str, Any], app_meta: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
    """
    Compares the current application against the AICTE historical master database.
    Checks:
      1. Name consistency against registered institutional title.
      2. Land area non-reduction against previously approved campus area.
    """
    cond = rule["condition"]
    check_type = cond.get("check_type")
    aicte_id = str(app_meta.get("aicte_id", "")).strip()

    if not aicte_id:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": "AICTE Master Database",
            "evidence": "Manual Review Required: AICTE Permanent ID was not provided for historical cross-check.",
            "timestamp": now_iso
        }

    history = get_aicte_history(aicte_id)
    if not history:
        return {
            "rule_id": rule["id"],
            "rule_name": rule["name"],
            "severity": rule["severity"],
            "weight": rule["weight"],
            "status": "manual_review",
            "document": "AICTE Master Database",
            "evidence": f"Manual Review Required: No historical record found for AICTE ID '{aicte_id}' (possible first-time applicant).",
            "timestamp": now_iso
        }

    # 1. Historical Name Match Check
    if check_type == "name_match":
        min_sim = float(cond.get("min_similarity", 90.0))
        current_name = app_meta.get("institution_name", "")
        # Fall back to name found in documents if app_meta name is blank
        if not current_name and "NOC" in doc_bundle:
            current_name = doc_bundle["NOC"].get("fields", {}).get("institution_name", {}).get("value", "")

        hist_name = history["institution_name"]
        sim = compute_similarity(current_name, hist_name)

        if sim >= min_sim:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "pass",
                "document": "AICTE Master Database",
                "evidence": f"Institution name '{current_name}' verified against AICTE Historical Record ('{hist_name}', Similarity: {sim:.1f}%).",
                "timestamp": now_iso
            }
        else:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "fail",
                "document": "AICTE Master Database",
                "evidence": f"HISTORICAL NAME MISMATCH: Application declares '{current_name}', but AICTE History records '{hist_name}' (Similarity: {sim:.1f}% < {min_sim:.0f}%).",
                "timestamp": now_iso
            }

    # 2. Historical Land Non-Reduction Check
    elif check_type == "land_non_reduction":
        hist_land = float(history["approved_land_area"])
        curr_land = None

        if "Land Document" in doc_bundle:
            curr_land = doc_bundle["Land Document"].get("fields", {}).get("land_area", {}).get("value")
        if curr_land is None and "Affidavit" in doc_bundle:
            curr_land = doc_bundle["Affidavit"].get("fields", {}).get("land_area", {}).get("value")

        if curr_land is None:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "manual_review",
                "document": "AICTE Master Database",
                "evidence": f"Manual Review Required: Current land area could not be extracted to verify against historical approved {hist_land} Acres.",
                "timestamp": now_iso
            }

        curr_land_float = float(curr_land)
        if curr_land_float >= hist_land:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "pass",
                "document": "AICTE Master Database",
                "evidence": f"Current land ({curr_land_float} Acres) meets or exceeds previously approved AICTE quota ({hist_land} Acres).",
                "timestamp": now_iso
            }
        else:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "status": "fail",
                "document": "AICTE Master Database",
                "evidence": f"UNAUTHORIZED LAND REDUCTION: Current declared land is {curr_land_float} Acres, which is LESS than the {hist_land} Acres approved in {history['last_approval_year']}.",
                "timestamp": now_iso
            }

    return {
        "rule_id": rule["id"],
        "rule_name": rule["name"],
        "severity": rule["severity"],
        "weight": rule["weight"],
        "status": "manual_review",
        "document": "AICTE Master Database",
        "evidence": f"Manual Review Required: Unhandled historical check type '{check_type}'.",
        "timestamp": now_iso
    }


# --- DISPATCH TABLE FOR DECLARATIVE CONDITIONS ---
EVALUATORS = {
    "checklist_completeness": eval_checklist_completeness,
    "date_not_expired": eval_date_not_expired,
    "cross_document_match": eval_cross_document_match,
    "numeric_threshold": eval_numeric_threshold,
    "regex_format": eval_regex_format,
    "text_clause_presence": eval_text_clause_presence,
    "historical_check": eval_historical_check,
}


def run_rules_engine(doc_bundle: Dict[str, Any], app_meta: Optional[Dict[str, Any]] = None, yaml_path: str = "rules.yaml") -> List[Dict[str, Any]]:
    """
    Executes all compliance rules from YAML against an application's document bundle and AICTE history.
    """
    if app_meta is None:
        app_meta = {}

    config = load_rules_config(yaml_path)
    rules = config.get("rules", [])
    now_iso = datetime.now().isoformat(timespec="seconds")
    results = []

    for rule in rules:
        cond_type = rule.get("condition", {}).get("type")
        evaluator_fn = EVALUATORS.get(cond_type)

        if evaluator_fn:
            res = evaluator_fn(rule, doc_bundle, app_meta, now_iso)
        else:
            res = {
                "rule_id": rule.get("id", "UNKNOWN"),
                "rule_name": rule.get("name", "Unknown Rule"),
                "severity": rule.get("severity", "INFO"),
                "weight": rule.get("weight", 0),
                "status": "manual_review",
                "document": "Configuration",
                "evidence": f"Manual Review Required: Unrecognized rule condition type '{cond_type}' in YAML.",
                "timestamp": now_iso
            }
        results.append(res)

    return results


if __name__ == "__main__":
    from ocr import extract_text
    from extract import extract_all_fields
    import pandas as pd

    print("==========================================================================================")
    print("AICTE VeriSense - Cross-Document Fuzzy Matching & AICTE History Benchmark")
    print("==========================================================================================")

    def build_bundle(doc_mapping: Dict[str, str]) -> Dict[str, Any]:
        bundle = {}
        for doc_type, path in doc_mapping.items():
            if os.path.exists(path):
                text, _ = extract_text(path)
                bundle[doc_type] = {
                    "raw_text": text,
                    "fields": extract_all_fields(text),
                    "file_path": path
                }
        return bundle

    # Test Case 1: APP-01-CLEAN against AICTE History ID 1-9312456781
    print("\n--- TEST CASE 1: Clean Bundle vs AICTE History (Expected: 100% Pass) ---")
    clean_bundle = build_bundle({
        "NOC": "samples/app1_clean_noc.pdf",
        "Affidavit": "samples/app1_clean_affidavit.pdf",
        "Faculty List": "samples/app1_clean_faculty.pdf",
        "Land Document": "samples/app1_clean_land.pdf",
        "Fire Certificate": "samples/app1_clean_fire.pdf",
    })
    app_meta_clean = {
        "aicte_id": "1-9312456781",
        "institution_name": "Apex Institute of Technology",
        "academic_year": "2025-26"
    }
    results_clean = run_rules_engine(clean_bundle, app_meta=app_meta_clean)
    df_clean = pd.DataFrame(results_clean)[["rule_id", "severity", "status", "document", "evidence"]]
    print(df_clean.to_string(index=False))

    # Test Case 2: APP-04-MISMATCH ("Apex Clg of Tech" vs "Apex Institute of Technology")
    print("\n--- TEST CASE 2: Name Mismatch (Expected: R-NAME-001 catches with Fuzzy Similarity Score) ---")
    mismatch_bundle = build_bundle({
        "NOC": "samples/app1_clean_noc.pdf",
        "Affidavit": "samples/app1_clean_affidavit.pdf",
        "Faculty List": "samples/app1_clean_faculty.pdf",
        "Land Document": "samples/app4_mismatch_land.pdf",
        "Fire Certificate": "samples/app1_clean_fire.pdf",
    })
    results_mismatch = run_rules_engine(mismatch_bundle, app_meta=app_meta_clean)
    name_rule = next(r for r in results_mismatch if r["rule_id"] == "R-NAME-001")
    print(f"Status:   {name_rule['status'].upper()}")
    print(f"Evidence: {name_rule['evidence']}")

    # Test Case 3: Historical Land Reduction Flag
    print("\n--- TEST CASE 3: Historical Land Discrepancy (Declares 1.50 Acres vs 2.50 Acres in AICTE DB) ---")
    # Simulate a bundle where land is reduced to 1.50 Acres
    reduced_bundle = build_bundle({
        "NOC": "samples/app1_clean_noc.pdf",
        "Affidavit": "samples/app1_clean_affidavit.pdf",
        "Land Document": "samples/app1_clean_land.pdf",
    })
    # Manually override land area field to 1.50 to test the historical reduction trigger
    reduced_bundle["Land Document"]["fields"]["land_area"]["value"] = 1.50

    results_reduced = run_rules_engine(reduced_bundle, app_meta=app_meta_clean)
    hist_land_rule = next(r for r in results_reduced if r["rule_id"] == "R-HIST-002")
    print(f"Status:   {hist_land_rule['status'].upper()}")
    print(f"Evidence: {hist_land_rule['evidence']}")
