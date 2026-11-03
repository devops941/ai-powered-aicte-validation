"""
tamper.py - Document Tamper Detection & Error Level Analysis (ELA) for AICTE VeriSense.
Detects post-issuance PDF editing, software signatures (Photoshop, Canva, Sejda, etc.),
and image-level visual manipulation/splicing via Error Level Analysis (ELA).
"""

import os
import io
from datetime import datetime
from typing import Dict, Any, Optional
import pymupdf as fitz
from PIL import Image, ImageChops, ImageEnhance
import cv2
import numpy as np


# Suspicious editing tools often used to tamper or alter official certificates
SUSPICIOUS_SOFTWARE_KEYWORDS = [
    "photoshop", "gimp", "canva", "sejda", "ilovepdf", "pdfescape",
    "inkscape", "coreldraw", "paint.net", "smallpdf", "adobe illustrator"
]

# Honest analytical disclosure
TAMPER_DISCLAIMER = (
    "NOTICE: Metadata inspections and Error Level Analysis (ELA) are heuristic triage indicators, "
    "not conclusive forensic proof. Benign operations (like scanner re-encoding, mobile compression, "
    "or compliant PDF optimization) may elevate error levels. Results guide human scrutiny."
)


# --- 1. PDF METADATA INTEGRITY CHECK ---

def check_pdf_metadata(pdf_path: str) -> Dict[str, Any]:
    """
    Examines PDF internal metadata for editing traces, creator software,
    and discrepancy between CreationDate and ModDate.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    doc = fitz.open(pdf_path)
    meta = doc.metadata or {}
    doc.close()

    creator = str(meta.get("creator", "")).lower()
    producer = str(meta.get("producer", "")).lower()
    creation_date = meta.get("creationDate", "")
    mod_date = meta.get("modDate", "")

    suspicious_tools = []
    combined_sig = f"{creator} {producer}".lower()
    for tool in SUSPICIOUS_SOFTWARE_KEYWORDS:
        if tool in combined_sig:
            suspicious_tools.append(tool)

    # Check if document was modified after creation
    is_modified = False
    if creation_date and mod_date and creation_date != mod_date:
        is_modified = True

    if suspicious_tools:
        evidence = (
            f"SUSPICIOUS SOFTWARE SIGNATURE DETECTED: Created/Modified with '{', '.join(suspicious_tools)}'. "
            f"Producer: '{meta.get('producer', 'N/A')}', Creator: '{meta.get('creator', 'N/A')}'."
        )
        return {
            "status": "fail",
            "is_suspicious": True,
            "suspicious_tools": suspicious_tools,
            "creation_date": creation_date,
            "mod_date": mod_date,
            "evidence": evidence,
            "disclaimer": TAMPER_DISCLAIMER
        }

    if is_modified:
        evidence = (
            f"POST-CREATION MODIFICATION DETECTED: Original creation timestamp ({creation_date}) "
            f"differs from modification timestamp ({mod_date}). Manual inspection recommended."
        )
        return {
            "status": "manual_review",
            "is_suspicious": False,
            "suspicious_tools": [],
            "creation_date": creation_date,
            "mod_date": mod_date,
            "evidence": evidence,
            "disclaimer": TAMPER_DISCLAIMER
        }

    return {
        "status": "pass",
        "is_suspicious": False,
        "suspicious_tools": [],
        "creation_date": creation_date,
        "mod_date": mod_date,
        "evidence": f"Standard PDF metadata. Producer: '{meta.get('producer', 'Standard PDF Engine')}'.",
        "disclaimer": TAMPER_DISCLAIMER
    }


# --- 2. ERROR LEVEL ANALYSIS (ELA) ON IMAGES ---

def perform_ela(
    file_path: str,
    output_dir: str = "uploads",
    quality: int = 90,
    threshold_score: float = 50.0
) -> Dict[str, Any]:
    """
    Performs Error Level Analysis (ELA) on an image or first page of a PDF.
    
    How ELA works:
      1. Re-compresses the image at a known JPEG quality (default 90).
      2. Computes absolute difference between original and re-compressed pixels.
      3. Areas altered or spliced in will compress at distinct error rates compared
         to original authentic text, creating high-frequency pixel anomalies.
      4. Generates a JET colormap heatmap showing suspicious regions.
    """
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.basename(file_path)
    root_name, ext = os.path.splitext(base_name)

    # 1. Load image (render first page if PDF)
    if ext.lower() == ".pdf":
        doc = fitz.open(file_path)
        page = doc[0]
        pix = page.get_pixmap(dpi=150)
        orig_img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        doc.close()
    else:
        orig_img = Image.open(file_path).convert("RGB")

    # Downscale large images to keep ELA fast and memory-light
    if orig_img.width > 850 or orig_img.height > 850:
        orig_img = orig_img.copy()
        orig_img.thumbnail((850, 850), Image.Resampling.BILINEAR)

    # 2. Resave as JPEG at specified quality in-memory
    buf = io.BytesIO()
    orig_img.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    resaved_img = Image.open(buf)

    # 3. Compute absolute difference
    diff = ImageChops.difference(orig_img, resaved_img)

    # Calculate extrema
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
    scale = 255.0 / max_diff if max_diff > 0 else 1.0

    # Enhanced visual diff for human inspection
    enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale)
    diff_arr = np.array(enhanced_diff)

    # 4. Compute Statistical ELA Score
    # Use unscaled difference array for objective statistical compression error evaluation
    raw_diff_arr = np.array(diff)
    if len(raw_diff_arr.shape) == 3:
        raw_gray = cv2.cvtColor(raw_diff_arr, cv2.COLOR_RGB2GRAY)
    else:
        raw_gray = raw_diff_arr

    if max_diff <= 25:
        # Uniform low-level compression noise (typical of benign scanned or generated JPEG)
        ela_score = round(float(max_diff) * 0.6, 1)
        outlier_ratio = 0.0
        is_tampered = False
    else:
        h, w = raw_gray.shape
        b_size = 32
        max_block_mean = 0.0
        for r in range(0, h - b_size, b_size):
            for c in range(0, w - b_size, b_size):
                b_val = float(np.mean(raw_gray[r:r+b_size, c:c+b_size]))
                if b_val > max_block_mean:
                    max_block_mean = b_val

        mean_err = float(np.mean(raw_gray))
        std_err = float(np.std(raw_gray))
        outlier_pixels = np.sum(raw_gray > (mean_err + 2.5 * std_err))
        outlier_ratio = (outlier_pixels / raw_gray.size) * 100.0
        ela_score = min(100.0, (max_block_mean * 4.0) + (outlier_ratio * 4.0) + (max_diff * 0.3))
        is_tampered = bool(ela_score >= threshold_score)

    # 5. Generate and Save Heatmap
    heatmap_gray = cv2.normalize(raw_gray, None, 0, 255, cv2.NORM_MINMAX)
    heatmap_color = cv2.applyColorMap(heatmap_gray.astype(np.uint8), cv2.COLORMAP_JET)

    orig_cv = cv2.cvtColor(np.array(orig_img), cv2.COLOR_RGB2BGR)
    overlay = cv2.addWeighted(orig_cv, 0.6, heatmap_color, 0.4, 0)

    heatmap_filename = f"ela_{root_name}.png"
    heatmap_path = os.path.join(output_dir, heatmap_filename)
    cv2.imwrite(heatmap_path, overlay)

    if is_tampered:
        evidence = (
            f"ELEVATED COMPRESSION DISCREPANCY: ELA Anomaly Score {ela_score:.1f}/100 "
            f"(Outlier pixel ratio: {outlier_ratio:.2f}%, Max diff: {max_diff}). "
            f"Heatmap generated at '{heatmap_path}' highlights spliced or altered regions."
        )
        status = "fail"
    else:
        evidence = (
            f"Consistent compression levels across document. ELA Score: {ela_score:.1f}/100 "
            f"(Outlier ratio: {outlier_ratio:.2f}% within normal bounds)."
        )
        status = "pass"

    return {
        "status": status,
        "is_tampered": is_tampered,
        "ela_score": round(ela_score, 1),
        "heatmap_path": heatmap_path,
        "evidence": evidence,
        "disclaimer": TAMPER_DISCLAIMER
    }


if __name__ == "__main__":
    print("==========================================================================================")
    print("AICTE VeriSense - Document Tamper & ELA Detection Benchmark")
    print("==========================================================================================")

    # Test 1: Clean Land Document ELA
    print("\n--- TEST 1: Clean Land Document ELA ---")
    clean_ela = perform_ela("samples/app1_clean_land.png")
    print(f"Status:     {clean_ela['status'].upper()}")
    print(f"ELA Score:  {clean_ela['ela_score']}/100")
    print(f"Evidence:   {clean_ela['evidence']}")
    print(f"Heatmap:    {clean_ela['heatmap_path']}")

    # Test 2: Tampered Land Document ELA (Spliced Patch)
    print("\n--- TEST 2: Tampered Land Document ELA (Spliced Patch) ---")
    tampered_ela = perform_ela("samples/app5_tampered_land.png")
    print(f"Status:     {tampered_ela['status'].upper()}")
    print(f"ELA Score:  {tampered_ela['ela_score']}/100")
    print(f"Evidence:   {tampered_ela['evidence']}")
    print(f"Heatmap:    {tampered_ela['heatmap_path']}")

    # Test 3: PDF Metadata Check
    print("\n--- TEST 3: Clean PDF Metadata Check ---")
    pdf_meta = check_pdf_metadata("samples/app1_clean_noc.pdf")
    print(f"Status:     {pdf_meta['status'].upper()}")
    print(f"Evidence:   {pdf_meta['evidence']}")
    print(f"\n{clean_ela['disclaimer']}")
