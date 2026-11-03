"""
risk.py - Risk Scoring Engine for AICTE VeriSense.
Computes a weighted compliance risk score (capped at 100), categorizes risk level
(Low, Medium, High), and determines overall pre-validation status.

HARD RULE ENFORCED:
The system NEVER outputs "Approved" or "Rejected".
Allowed statuses: "Flagged", "No issues found", "Manual Review Required".
"""

from typing import List, Dict, Any


def calculate_risk(rule_results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes weighted risk score from rule execution results.
    
    Formula:
      raw_score = sum(weight of all failed rules)
      score = min(100.0, raw_score)
      
    Classification:
      - 0 to 30:   Low Risk
      - 31 to 60:  Medium Risk
      - 61 to 100: High Risk
      
    Status:
      - If any rule fails: 'Flagged'
      - Else if any rule requires manual review: 'Manual Review Required'
      - Else: 'No issues found'
    """
    total_rules = len(rule_results)
    passed_rules = 0
    failed_rules = 0
    manual_review_rules = 0

    critical_flags = 0
    warning_flags = 0
    info_flags = 0

    accumulated_weight = 0.0
    flags_list = []

    for r in rule_results:
        status = r.get("status", "manual_review").lower()
        severity = r.get("severity", "INFO").upper()
        weight = float(r.get("weight", 0))

        if status == "pass":
            passed_rules += 1
        elif status == "fail":
            failed_rules += 1
            accumulated_weight += weight
            flags_list.append(r)

            if severity in ("CRITICAL", "HIGH"):
                critical_flags += 1
            elif severity in ("WARNING", "MEDIUM"):
                warning_flags += 1
            else:
                info_flags += 1
        elif status == "manual_review":
            manual_review_rules += 1
            flags_list.append(r)
            # Manual reviews add a moderate baseline weight (5 pts) to prompt human scrutiny
            accumulated_weight += min(weight * 0.3, 5.0)

    # Cap score at 100.0
    risk_score = round(min(100.0, accumulated_weight), 1)

    # Determine Risk Level
    if risk_score <= 30.0:
        risk_level = "Low"
        risk_color = "#10B981"  # Emerald Green
    elif risk_score <= 60.0:
        risk_level = "Medium"
        risk_color = "#F59E0B"  # Amber Orange
    else:
        risk_level = "High"
        risk_color = "#EF4444"  # Crimson Red

    # Determine Application Status (HARD RULE: Never Approved/Rejected)
    if failed_rules > 0:
        app_status = "Flagged"
    elif manual_review_rules > 0:
        app_status = "Manual Review Required"
    else:
        app_status = "No issues found"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "status": app_status,
        "total_rules": total_rules,
        "passed_rules": passed_rules,
        "failed_rules": failed_rules,
        "manual_review_rules": manual_review_rules,
        "critical_flags": critical_flags,
        "warning_flags": warning_flags,
        "info_flags": info_flags,
        "flags": flags_list
    }


if __name__ == "__main__":
    # Benchmark tests
    print("==========================================================================================")
    print("AICTE VeriSense - Risk Scoring Engine Benchmark")
    print("==========================================================================================")

    # Clean application (all pass)
    sample_clean = [
        {"rule_id": "R-DOC-001", "severity": "CRITICAL", "weight": 30, "status": "pass"},
        {"rule_id": "R-NOC-001", "severity": "CRITICAL", "weight": 25, "status": "pass"},
        {"rule_id": "R-NAME-001", "severity": "WARNING", "weight": 15, "status": "pass"},
    ]
    res_clean = calculate_risk(sample_clean)
    print(f"Clean Set:   Score: {res_clean['risk_score']} | Level: {res_clean['risk_level']} | Status: '{res_clean['status']}'")

    # Flagged application with expired NOC (weight 25) + name mismatch (weight 15)
    sample_flagged = [
        {"rule_id": "R-DOC-001", "severity": "CRITICAL", "weight": 30, "status": "pass"},
        {"rule_id": "R-NOC-001", "severity": "CRITICAL", "weight": 25, "status": "fail"},
        {"rule_id": "R-NAME-001", "severity": "WARNING", "weight": 15, "status": "fail"},
    ]
    res_flagged = calculate_risk(sample_flagged)
    print(f"Flagged Set: Score: {res_flagged['risk_score']} | Level: {res_flagged['risk_level']} | Status: '{res_flagged['status']}'")

    # High Risk application (Missing doc 30 + expired NOC 25 + tampered doc 25)
    sample_high = [
        {"rule_id": "R-DOC-001", "severity": "CRITICAL", "weight": 30, "status": "fail"},
        {"rule_id": "R-NOC-001", "severity": "CRITICAL", "weight": 25, "status": "fail"},
        {"rule_id": "R-TAMPER-001", "severity": "CRITICAL", "weight": 25, "status": "fail"},
    ]
    res_high = calculate_risk(sample_high)
    print(f"High Set:    Score: {res_high['risk_score']} | Level: {res_high['risk_level']} | Status: '{res_high['status']}'")

