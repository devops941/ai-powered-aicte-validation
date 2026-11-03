"""
gemini_service.py - Google Gemini AI Service for AICTE DocVerify.
Powers multimodal document intelligence, executive synthesis, interactive copilot Q&A,
and visual campus infrastructure inspection.
"""

import os
import json
from typing import Dict, Any, List, Optional
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
try:
    import google.generativeai as genai
    from PIL import Image
    _GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    Image = None
    _GEMINI_AVAILABLE = False

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ai_config.json")


def load_env_vars():
    """Loads environment variables from local .env files if present."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(base_dir, ".env"),
        os.path.join(base_dir, "..", ".env"),
        os.path.join(base_dir, "..", "frontend", ".env")
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

load_env_vars()


def get_gemini_api_key() -> Optional[str]:
    """Retrieves Gemini API key from environment or local config."""
    key = os.environ.get("GEMINI_API_KEY")
    if key and key != "MY_GEMINI_API_KEY":
        return key

    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                saved_key = data.get("gemini_api_key")
                if saved_key:
                    return saved_key
        except Exception:
            pass
    return None


def save_gemini_api_key(api_key: str) -> None:
    """Persists Gemini API key to local configuration."""
    api_key = api_key.strip()
    os.environ["GEMINI_API_KEY"] = api_key
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump({"gemini_api_key": api_key}, f, indent=2)


def is_gemini_configured() -> bool:
    """Checks whether a valid Gemini API key is configured."""
    key = get_gemini_api_key()
    return bool(key and len(key) > 10)


def get_gemini_model(model_name: str = "gemini-1.5-flash"):
    """Configures and returns a Gemini generative model instance."""
    key = get_gemini_api_key()
    if not key:
        raise ValueError("Gemini API Key is not configured. Set GEMINI_API_KEY or save it via settings.")
    genai.configure(api_key=key)
    return genai.GenerativeModel(model_name)


def generate_ai_dossier_synthesis(app_meta: Dict[str, Any], doc_bundle: Dict[str, Any], flags: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates an executive-level AI Scrutiny Synthesis using Gemini 1.5 Flash.
    """
    if not is_gemini_configured():
        return {
            "configured": False,
            "text": "Gemini AI API key not configured. Add your Google Gemini API key to enable AI-powered scrutiny synthesis, deep clause extraction, and interactive copilot Q&A.",
            "bullet_points": []
        }

    try:
        model = get_gemini_model("gemini-1.5-flash")

        doc_summaries = []
        for dtype, dinfo in doc_bundle.items():
            txt_snippet = (dinfo.get("raw_text") or "")[:1500].replace("\n", " ")
            doc_summaries.append(f"Document [{dtype}]: {txt_snippet}")

        docs_context = "\n".join(doc_summaries) if doc_summaries else "No documents uploaded."
        flags_context = "\n".join([f"- [{f.get('rule_id', 'R')}] {f.get('issue', '')}: {f.get('evidence', '')}" for f in flags]) or "None"

        prompt = f"""
You are an expert AI Scrutiny Officer for the All India Council for Technical Education (AICTE), evaluating an Extension of Approval (EoA) application for AY 2026-27 under Chapter II of the Approval Process Handbook (APH).
Benchmark Reference Date: 2026-06-01 (Statutory certificates must remain valid on or after this benchmark).

APPLICATION METADATA:
- Institution Name: {app_meta.get('institution_name')}
- AICTE Permanent ID: {app_meta.get('aicte_id')}
- Category: {app_meta.get('category', 'Extension of Approval: Add new course')}
- Academic Year: {app_meta.get('academic_year', '2026-27')}

SYSTEM DETECTED REGULATORY FLAGS ({len(flags)} issues found):
{flags_context}

SUBMITTED DOCUMENTS EXCERPTS:
{docs_context}

TASK:
Perform a comprehensive verification of each document and output the report in this exact structure:

### 1. AI DOCUMENT VERIFICATION MATRIX
For EVERY document submitted in this dossier, determine its statutory status: [CLEAN / VALID], [EXPIRED], [DISCREPANCY], or [DEFICIENT].
Format each item exactly like this:
* **[Document Type]**: `[VERDICT]` - [Exact reason with dates, certificate numbers, or acreage details]
  (Example: * **Fire Certificate**: `[EXPIRED]` - Expired on 2025-06-30; violates AY 2026-27 minimum benchmark 2026-06-01)
  (Example: * **NOC**: `[CLEAN / VALID]` - Valid until 2029-04-14 issued by Directorate of Technical Education)

### 2. EXECUTIVE COMPLIANCE SUMMARY
A 2-3 sentence executive synthesis of whether this institution is fit for approval or exhibits critical compliance failures.

### 3. CRITICAL STATUTORY FINDINGS
Bullet points highlighting key regulatory observations (validity expirations, land area, cadre ratio, name matching).

### 4. RECOMMENDED DIRECTIVES FOR HUMAN SCRUTINY COMMITTEE
Actionable recommendation: whether to issue Show Cause, mandate an Expert Visit Committee (EVC), or Clear for approval.

Keep tone formal, rigorous, and adhere strictly to AICTE APH Chapter II standards.
"""
        response = model.generate_content(prompt, request_options={"timeout": 20})
        raw_text = response.text.strip()

        import re
        doc_verifications = []
        for line in raw_text.splitlines():
            line_s = line.strip()
            if line_s.startswith(("* **", "- **")):
                m = re.search(r'[\*\-]\s+\*\*([^\*:]+)\*\*:\s*`?\[?([A-Za-z\s\/]+)\]?`?\s*[-–:]\s*(.+)', line_s)
                if m:
                    doc_verifications.append({
                        "document": m.group(1).strip(),
                        "verdict": m.group(2).strip(),
                        "details": m.group(3).strip()
                    })

        return {
            "configured": True,
            "text": raw_text,
            "document_verifications": doc_verifications,
            "model": "gemini-1.5-flash"
        }
    except Exception as e:
        return {
            "configured": True,
            "error": str(e),
            "text": f"AI Synthesis generation encountered an error: {str(e)}"
        }


def ask_dossier_copilot(question: str, app_meta: Dict[str, Any], doc_bundle: Dict[str, Any], flags: List[Dict[str, Any]]) -> str:
    """
    Answers questions from Scrutiny Officers regarding the submitted dossier.
    Grounds answers strictly on submitted documents and statutory APH norms.
    """
    if not is_gemini_configured():
        return "Gemini AI API key is not configured. Please provide your Gemini API key in settings to interact with the AI Scrutiny Copilot."

    try:
        model = get_gemini_model("gemini-1.5-flash")

        doc_texts = []
        for dtype, dinfo in doc_bundle.items():
            txt = (dinfo.get("raw_text") or "")[:2500]
            doc_texts.append(f"=== DOCUMENT TYPE: {dtype} ===\n{txt}")

        full_dossier_text = "\n\n".join(doc_texts) if doc_texts else "No documents attached."
        flags_text = "\n".join([f"- [{f.get('rule_id')}] {f.get('issue')}: {f.get('evidence')}" for f in flags]) or "None"

        system_instruction = f"""
You are the AICTE DocVerify Copilot — an AI Decision-Support assistant for official AICTE Scrutiny Officers evaluating an institution's Extension of Approval (EoA) dossier.

CONTEXT:
Institution: {app_meta.get('institution_name')} ({app_meta.get('aicte_id')})
Application: {app_meta.get('application_no')}
Category: {app_meta.get('category')}

REGULATORY FLAGS RAISED:
{flags_text}

SUBMITTED DOSSIER EVIDENCE:
{full_dossier_text}

INSTRUCTIONS:
1. Answer the official's question accurately, quoting exact text, dates, names, or clause numbers where applicable.
2. If the document does not contain the requested information or is missing, state clearly that the document was not provided.
3. Keep the response concise, authoritative, and helpful for a regulatory inspection officer.
"""
        prompt = f"{system_instruction}\n\nOFFICIAL'S QUESTION:\n{question}\n\nCOPILOT RESPONSE:"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Copilot error: {str(e)}"


def inspect_infrastructure_image(image_path: str, facility_type: str = "Computer Laboratory / Workshop") -> Dict[str, Any]:
    """
    Uses Gemini 1.5 Flash Vision to inspect geo-tagged infrastructure and lab photos.
    Verifies workstation capacity, genuine educational setups, fire safety, and signs of digital tampering.
    """
    if not is_gemini_configured():
        return {
            "configured": False,
            "error": "Gemini AI API key not configured."
        }

    if not os.path.exists(image_path):
        return {
            "configured": True,
            "error": f"Image file not found at: {image_path}"
        }

    try:
        model = get_gemini_model("gemini-1.5-flash")
        img = Image.open(image_path)

        prompt = f"""
You are an expert AICTE Infrastructure Inspector examining submitted institutional lab/campus photos for statutory approval under AICTE APH Chapter II.

Claimed Facility: {facility_type}

Inspect this submitted photo and output your findings in the following JSON format:
{{
  "detected_facility": "Name of room/lab detected",
  "is_authentic_academic_facility": true/false,
  "equipment_observed": ["list", "of", "visible", "items"],
  "estimated_workstation_capacity": 30,
  "safety_features_visible": ["Fire extinguisher", "Ventilation", etc],
  "concerns_or_anomalies": ["Any signs of stock photo, artificial staging, empty room, or lack of electrical conduits"],
  "compliance_verdict": "Compliant" / "Deficiency Noted" / "Manual Site Inspection Required",
  "confidence_score": 95
}}

Return ONLY valid JSON.
"""
        response = model.generate_content([prompt, img])
        raw_text = response.text.strip()

        # Extract JSON from code fence if present
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].split("```")[0].strip()

        parsed = json.loads(raw_text)
        parsed["configured"] = True
        return parsed
    except Exception as e:
        return {
            "configured": True,
            "error": str(e),
            "compliance_verdict": "Manual Site Inspection Required"
        }


def extract_fields_with_gemini(raw_text: str, doc_type: str = "Unknown") -> dict:
    """
    Uses Gemini AI to extract structured compliance fields from document OCR text.
    Returns extracted fields dict that supplements/overrides regex-based extraction.
    Falls back gracefully if AI is not configured or errors.
    """
    if not is_gemini_configured():
        return {}
    
    if not raw_text or len(raw_text.strip()) < 20:
        return {}
    
    try:
        model = get_gemini_model("gemini-1.5-flash")
        text_snippet = raw_text[:3000]
        
        prompt = f"""Extract compliance fields from this {doc_type} document text for AICTE regulatory validation.
Return ONLY a valid JSON object with these fields (use null if not found):

{{
  "institution_name": "exact institution name as it appears",
  "certificate_number": "certificate/registration/deed number",
  "issue_date": "YYYY-MM-DD format or null",
  "expiry_date": "YYYY-MM-DD format or null", 
  "address": "campus/property address",
  "land_area_value": numeric value in acres or null,
  "document_type_detected": "NOC or Affidavit or Faculty List or Land Document or Fire Certificate or Unknown"
}}

Document Text:
{text_snippet}

Return ONLY the JSON object. No explanation, no markdown.
"""
        response = model.generate_content(prompt)
        raw_response = response.text.strip()
        
        # Clean markdown fences if present
        if "```json" in raw_response:
            raw_response = raw_response.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_response:
            raw_response = raw_response.split("```")[1].split("```")[0].strip()
        
        parsed = json.loads(raw_response)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


