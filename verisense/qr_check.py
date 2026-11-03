"""
qr_check.py - Official Authority QR Verification Engine for AICTE VeriSense.
Decodes 2D QR codes from scanned documents/PDFs and authenticates payloads
against the State Authority Registry in SQLite.
"""

import os
import io
from typing import Dict, Any, Optional
import pymupdf as fitz
from PIL import Image
try:
    import cv2
except Exception:
    cv2 = None
import numpy as np
from db import lookup_authority_qr, DB_PATH

# Analytical limits disclosure
QR_LIMITATION_NOTE = (
    "NOTICE: QR code decoding verifies that the document contains a machine-readable payload "
    "matching the issuing authority's database. However, a QR code alone cannot prevent physical "
    "copy-paste cloning without cryptographic signature validation and OCR cross-field matching."
)


def decode_qr_from_file(file_path: str) -> Optional[str]:
    """
    Decodes QR code from an image or the first page of a PDF.
    Uses OpenCV QRCodeDetector natively (reliable, fast, no external C++ runtime required).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    # 1. Render PDF page to image or load image
    if ext == ".pdf":
        doc = fitz.open(file_path)
        page = doc[0]
        # High DPI helps small QR codes
        pix = page.get_pixmap(dpi=200)
        img_pil = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        doc.close()
        cv_img = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR) if cv2 is not None else None
    else:
        cv_img = cv2.imread(file_path) if cv2 is not None else None

    if cv_img is None:
        return None

    # 2. Try OpenCV QRCodeDetector
    detector = cv2.QRCodeDetector()
    data, bbox, _ = detector.detectAndDecode(cv_img)
    if data and data.strip():
        return data.strip()

    # 3. If full image didn't catch it, try grayscale & threshold preprocessing
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    data, _, _ = detector.detectAndDecode(gray)
    if data and data.strip():
        return data.strip()

    # 4. Optional fallback to pyzbar if available
    try:
        import pyzbar.pyzbar as pyzbar
        decoded = pyzbar.decode(cv_img)
        if decoded:
            return decoded[0].data.decode("utf-8").strip()
    except Exception:
        pass

    return None


def verify_document_qr(
    file_path: str,
    doc_type: str = "Fire Certificate",
    db_path: str = DB_PATH
) -> Dict[str, Any]:
    """
    Decodes QR code from file and cross-references it against SQLite authority_qr_registry.
    
    Hard Rules Enforced:
      - If no QR found: 'Manual Review Required'.
      - If QR matches authority DB: 'pass'.
      - If QR does not match authority DB: 'fail' (Counterfeit / Phishing).
    """
    payload = decode_qr_from_file(file_path)

    # HARD RULE: If no QR code can be detected or verified, require manual review
    if not payload:
        return {
            "status": "manual_review",
            "qr_found": False,
            "qr_payload": None,
            "issuer": None,
            "document_ref": None,
            "evidence": f"Manual Review Required: No decodable QR code detected on {doc_type}.",
            "disclaimer": QR_LIMITATION_NOTE
        }

    # Query Authority Registry
    record = lookup_authority_qr(payload, db_path=db_path)

    if record:
        evidence = (
            f"GENUINE QR CODE VERIFIED: Decoded payload authenticated against "
            f"'{record['issuer_authority']}' registry (Ref: {record['document_ref']}, "
            f"Valid until: {record.get('valid_until', 'N/A')})."
        )
        return {
            "status": "pass",
            "qr_found": True,
            "qr_payload": payload,
            "issuer": record["issuer_authority"],
            "document_ref": record["document_ref"],
            "evidence": evidence,
            "disclaimer": QR_LIMITATION_NOTE
        }
    else:
        evidence = (
            f"COUNTERFEIT/UNVERIFIED QR CODE DETECTED: Decoded payload '{payload}' "
            f"does not exist in the state issuing authority registry. Potential fraudulent submission."
        )
        return {
            "status": "fail",
            "qr_found": True,
            "qr_payload": payload,
            "issuer": "UNAUTHORIZED / UNKNOWN",
            "document_ref": "UNKNOWN",
            "evidence": evidence,
            "disclaimer": QR_LIMITATION_NOTE
        }


if __name__ == "__main__":
    import db
    db.init_db()

    print("==========================================================================================")
    print("AICTE VeriSense - QR Code Authority Verification Benchmark")
    print("==========================================================================================")

    # Test 1: Clean Fire Certificate (Genuine QR)
    print("\n--- TEST 1: Genuine Fire Certificate QR ---")
    res_clean = verify_document_qr("samples/app1_clean_fire.png", "Fire Certificate")
    print(f"Status:     {res_clean['status'].upper()}")
    print(f"QR Payload: {res_clean['qr_payload']}")
    print(f"Evidence:   {res_clean['evidence']}")

    # Test 2: Counterfeit QR Fire Certificate (Phishing link / Unknown)
    print("\n--- TEST 2: Counterfeit QR Fire Certificate ---")
    res_fake = verify_document_qr("samples/app6_fakeqr_fire.png", "Fire Certificate")
    print(f"Status:     {res_fake['status'].upper()}")
    print(f"QR Payload: {res_fake['qr_payload']}")
    print(f"Evidence:   {res_fake['evidence']}")

    # Test 3: Document without QR code (e.g. NOC)
    print("\n--- TEST 3: Document without QR Code (Manual Review Required) ---")
    res_none = verify_document_qr("samples/app1_clean_noc.pdf", "NOC")
    print(f"Status:     {res_none['status'].upper()}")
    print(f"Evidence:   {res_none['evidence']}")

    print(f"\n{res_clean['disclaimer']}")

