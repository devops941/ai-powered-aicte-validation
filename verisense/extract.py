"""
extract.py - Regex and Heuristic Field Extraction Engine for AICTE VeriSense.
Extracts key compliance fields (institution name, doc type, certificate number,
issue date, expiry date, address, land area) with exact text evidence snippets.
"""

import re
from typing import Dict, Any, Optional
from dateutil import parser as date_parser


def parse_date_to_iso(date_str: str) -> Optional[str]:
    """
    Normalizes diverse date formats into standard ISO (YYYY-MM-DD).
    Handles:
      - 10-June-2021 / 10-Jun-2021
      - 31-May-2028 / 31-05-2028
      - 15th Day of January 2025 / 15th January 2025
      - 12 March 2024 / 12/03/2024
    """
    if not date_str:
        return None
    try:
        # Remove ordinal suffixes (1st, 2nd, 3rd, 4th, 15th) and legal 'Day of' phrasing
        cleaned = re.sub(r'(\d+)(?:st|nd|rd|th)\s+(?:Day\s+of\s+)?', r'\1 ', date_str, flags=re.IGNORECASE).strip()
        # Clean trailing dots or commas
        cleaned = cleaned.rstrip('.,;:')
        dt = date_parser.parse(cleaned, dayfirst=True)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def extract_document_type(text: str) -> Dict[str, Any]:
    """Detects document category based on authoritative keywords."""
    patterns = [
        ("NOC", r"(NO\s+OBJECTION\s+CERTIFICATE|NOC\b|No\s*Objection)", "NOC"),
        ("Affidavit", r"(AFFIDAVIT\s*(?:\(ON|\b)|NON-JUDICIAL\s+STAMP)", "Affidavit"),
        ("Faculty List", r"(FACULTY\s+LIST|Cadre\s+Norms|Designation\s+Qualification)", "Faculty List"),
        ("Land Document", r"(CERTIFICATE\s+OF\s+REGISTERED\s+LAND\s+TITLE|SUB-REGISTRAR\s+OFFICE|Total\s+Land\s+Area)", "Land Document"),
        ("Fire Certificate", r"(FIRE\s+SAFETY\s+(?:COMPLIANCE\s+)?CERTIFICATE|DISASTER\s+MANAGEMENT\s+&\s+FIRE|Fire\s+(?:and\s+Rescue\s+)?Services)", "Fire Certificate"),
    ]
    for doc_type, regex, label in patterns:
        match = re.search(regex, text, re.IGNORECASE)
        if match:
            # Extract line as evidence
            start = max(0, text.rfind("\n", 0, match.start()))
            end = text.find("\n", match.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            return {"value": doc_type, "evidence": snippet}

    return {"value": "Unknown Document", "evidence": "No standard header pattern matched"}


def extract_institution_name(text: str) -> Dict[str, Any]:
    """Extracts institution name using common administrative label patterns."""
    patterns = [
        # Explicit label: "Institution Name: Apex Institute of Technology"
        r"(?:Institution\s*Name|Institution|College\s*Name)\s*[:\-]\s*([A-Za-z0-9\s.,&'-]+?)(?:\n|Proposed|Address|Total|$)",
        # Trust/Deponent label: "Trust of Apex Institute of Technology, do hereby"
        r"(?:Governing\s*Trust\s*of|Trust\s*of|College\s*of)\s+([A-Za-z0-9\s.,&'-]+?)(?:,|\s+do\s+hereby|\s+owns|\n)",
        # Faculty List header: "FACULTY LIST - APEX INSTITUTE OF TECHNOLOGY"
        r"FACULTY\s+LIST\s*-\s*([A-Za-z0-9\s.,&'-]+?)(?:\n|$)",
        # Land owner label: "held by:\s*\n*Institution:\s*([A-Za-z0-9\s.,&'-]+)"
        r"(?:owned\s+and\s+held\s+by|occupied\s+by)[\s\S]*?Institution\s*[:\-]\s*([A-Za-z0-9\s.,&'-]+?)(?:\n|$)",
    ]

    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = m.group(1).strip().strip(".,-")
            start = max(0, text.rfind("\n", 0, m.start()))
            end = text.find("\n", m.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            if len(val) >= 4:
                return {"value": val, "evidence": snippet}

    return {"value": None, "evidence": "Institution name not identified in text"}


def extract_certificate_number(text: str) -> Dict[str, Any]:
    """Extracts certificate, NOC, deed, or registration numbers."""
    patterns = [
        # "Certificate Number: NOC/DTE/2025/APP-881" or "FC/2026/00456" or "DocumentNo:LD/TN/2019/33120"
        r"(?:Document\s*(?:No\.?|Number)|Certificate\s*(?:Number|No\.?)|Registration\s*(?:\/\s*Deed\s*)?Number|Deed\s*No\.?|Registration\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\/\-_]+)",
        # Notary registration: "Notary Public Registration No: NOT/MH/9941"
        r"(?:Notary\s+Public\s+Registration\s+No|Notary\s+Reg\s+No)\s*[:\-]\s*([A-Za-z0-9\/\-_]+)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = m.group(1).strip()
            start = max(0, text.rfind("\n", 0, m.start()))
            end = text.find("\n", m.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            return {"value": val, "evidence": snippet}

    return {"value": None, "evidence": "Certificate/Registration number not found"}


def extract_dates(text: str) -> Dict[str, Dict[str, Any]]:
    """Extracts both issue date and expiry/validity date with ISO normalization."""
    # 1. Issue Date Patterns
    issue_patterns = [
        r"(?:Date\s*of\s*Issue|Issue\s*Date|Date\s*of\s*Registration|Date\s*of\s*Inspection)\s*[:\-]\s*([0-9]{1,2}(?:st|nd|rd|th)?[\s\/\-][A-Za-z0-9\/\-]+(?:\s*[0-9]{4})?)",
        r"(?:Declared\s*on\s*this)\s*([0-9]{1,2}(?:st|nd|rd|th)?\s+(?:Day\s+of\s+)?[A-Za-z]+\s+[0-9]{4})",
    ]
    
    issue_result = {"value": None, "raw": None, "evidence": "Issue date not found"}
    for p in issue_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            raw = m.group(1).strip()
            iso = parse_date_to_iso(raw)
            start = max(0, text.rfind("\n", 0, m.start()))
            end = text.find("\n", m.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            issue_result = {"value": iso, "raw": raw, "evidence": snippet}
            break

    # 2. Expiry / Validity Date Patterns
    expiry_patterns = [
        r"(?:Valid\s*(?:Till|till|Until|until|Through|through)|Valid\s*up\s*to|Validity\s*Period[:\s]*Valid\s*until|Expiry\s*Date|Expiry)\s*[:\-]?\s*([0-9]{1,2}(?:st|nd|rd|th)?[\s\/\-][A-Za-z0-9\/\-]+(?:\s*[0-9]{4})?)",
        r"(?:Valid\s*(?:through|upto))\s*[:\-]?\s*([0-9]{1,2}(?:st|nd|rd|th)?[\s\/\-][A-Za-z0-9\/\-]+(?:\s*[0-9]{4})?)",
    ]

    expiry_result = {"value": None, "raw": None, "evidence": "Expiry/validity date not found"}
    for p in expiry_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            raw = m.group(1).strip()
            iso = parse_date_to_iso(raw)
            start = max(0, text.rfind("\n", 0, m.start()))
            end = text.find("\n", m.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            expiry_result = {"value": iso, "raw": raw, "evidence": snippet}
            break

    return {"issue_date": issue_result, "expiry_date": expiry_result}


def extract_address(text: str) -> Dict[str, Any]:
    """Extracts institutional or campus address."""
    patterns = [
        r"Address\s*[:\-]\s*([A-Za-z0-9\s,/\-#&:\.]{6,120}?(?:Pune|Mumbai|Delhi|Bangalore|Chennai|[A-Z]{2,}\b|\b\d{6}\b))",
        r"(?:situated\s*at|property\s*situated\s*at)\s*[:\-]?\s*(?:Address\s*[:\-]?)?\s*([A-Za-z0-9\s,/\-#&:\.]{6,120}?(?:Pune|Mumbai|Delhi|Bangalore|Chennai|[A-Z]{2,}\b|\b\d{6}\b))",
        r"(?:land\s+at)\s+([A-Za-z0-9\s,/\-#&:\.]{6,120}?(?:Pune|Mumbai|Delhi|Bangalore|Chennai|\.))",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            val = m.group(1).strip().strip(".,\n\r")
            val = re.sub(r"^(?:Address\s*[:\-]?\s*)", "", val, flags=re.IGNORECASE).strip()
            if len(val) >= 6:
                start = max(0, text.rfind("\n", 0, m.start()))
                end = text.find("\n", m.end())
                snippet = text[start:end if end != -1 else len(text)].strip()
                return {"value": val, "evidence": snippet}

    return {"value": None, "evidence": "Campus/property address not found"}


def extract_land_area(text: str) -> Dict[str, Any]:
    """Extracts declared or titled land area in Acres."""
    patterns = [
        r"(?:Total\s*Land\s*Area|Land\s*Area)\s*[:\-]\s*([0-9]+(?:\.[0-9]+)?)\s*(Acres?|Sq\.?\s*Meters?|Hectares?)",
        r"(?:possesses|owns\s*and\s*possesses)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:Acres?|of\s*contiguous\s*land)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            num = float(m.group(1))
            unit = m.group(2) if m.lastindex >= 2 and m.group(2) else "Acres"
            start = max(0, text.rfind("\n", 0, m.start()))
            end = text.find("\n", m.end())
            snippet = text[start:end if end != -1 else len(text)].strip()
            return {"value": num, "unit": "Acres", "evidence": snippet}

    return {"value": None, "unit": None, "evidence": "Land area specification not found"}


def extract_all_fields(text: str) -> Dict[str, Any]:
    """
    Main extraction function: extracts all key metadata fields from raw document text.
    Returns a structured dictionary with parsed values and evidence snippets.
    """
    doc_type_res = extract_document_type(text)
    inst_res = extract_institution_name(text)
    cert_res = extract_certificate_number(text)
    dates_res = extract_dates(text)
    addr_res = extract_address(text)
    land_res = extract_land_area(text)

    return {
        "document_type": doc_type_res,
        "institution_name": inst_res,
        "certificate_number": cert_res,
        "issue_date": dates_res["issue_date"],
        "expiry_date": dates_res["expiry_date"],
        "address": addr_res,
        "land_area": land_res,
    }


if __name__ == "__main__":
    import os
    import pandas as pd
    from ocr import extract_text

    print("==========================================================================================")
    print("AICTE VeriSense - Field Extraction Engine Benchmark")
    print("==========================================================================================")

    test_files = [
        ("NOC (Clean)", "samples/app1_clean_noc.pdf"),
        ("NOC (Expired)", "samples/app2_expired_noc.pdf"),
        ("Affidavit (Clean)", "samples/app1_clean_affidavit.pdf"),
        ("Faculty List", "samples/app1_clean_faculty.pdf"),
        ("Land Doc (Clean)", "samples/app1_clean_land.pdf"),
        ("Fire Cert (Clean)", "samples/app1_clean_fire.pdf"),
        ("Land Doc (Mismatch)", "samples/app4_mismatch_land.pdf"),
    ]

    results = []
    for label, path in test_files:
        if os.path.exists(path):
            text, method = extract_text(path)
            extracted = extract_all_fields(text)
            results.append({
                "Document": label,
                "Doc Type": extracted["document_type"]["value"],
                "Institution": extracted["institution_name"]["value"],
                "Cert / Reg No": extracted["certificate_number"]["value"],
                "Issue Date": extracted["issue_date"]["value"],
                "Expiry Date": extracted["expiry_date"]["value"],
                "Land Area": f"{extracted['land_area']['value']} {extracted['land_area']['unit']}" if extracted['land_area']['value'] else None,
                "Address": extracted["address"]["value"][:25] + "..." if extracted["address"]["value"] else None,
            })

    df = pd.DataFrame(results)
    # Print formatted table
    print(df.to_string(index=False))

    print("\n--- SAMPLE EVIDENCE SNIPPETS (HARD RULE COMPLIANCE) ---")
    sample_text, _ = extract_text("samples/app1_clean_noc.pdf")
    sample_fields = extract_all_fields(sample_text)
    print(f"Institution Name Evidence: '{sample_fields['institution_name']['evidence']}'")
    print(f"Certificate No Evidence:   '{sample_fields['certificate_number']['evidence']}'")
    print(f"Expiry Date Evidence:      '{sample_fields['expiry_date']['evidence']}' -> Normalized: {sample_fields['expiry_date']['value']}")

