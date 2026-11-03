"""
ocr.py - Text Extraction and OCR Engine for AICTE VeriSense.
Handles both searchable PDFs (via PyMuPDF) and scanned documents/images (via EasyOCR / Tesseract).
"""

import os
import io

# Optimize threading for lightweight container hosting (avoids high RAM usage on Render)
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
import hashlib
from typing import Tuple, Optional
import pymupdf as fitz  # Modern PyMuPDF import
from PIL import Image

# Global cache for RapidOCR engine
_rapidocr_engine = None

def get_rapidocr_engine():
    """Lazily loads and caches the RapidOCR ONNX engine."""
    global _rapidocr_engine
    if _rapidocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _rapidocr_engine = RapidOCR()
        except Exception:
            _rapidocr_engine = False
    return _rapidocr_engine if _rapidocr_engine is not False else None


# Global cache for EasyOCR reader so it doesn't reload the neural net weights repeatedly
_easyocr_reader = None


def get_easyocr_reader():
    """Lazily loads and caches the optional EasyOCR reader (CPU mode, English)."""
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import importlib
            easyocr = importlib.import_module("easyocr")
            # gpu=False ensures it runs smoothly on standard 8GB laptops without CUDA
            _easyocr_reader = easyocr.Reader(['en'], gpu=False)
        except Exception:
            _easyocr_reader = None
    return _easyocr_reader


def compute_file_hash(filepath: str) -> str:
    """Calculates SHA-256 hash of a file for integrity and audit verification."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def ocr_image(image: Image.Image) -> str:
    """
    Extracts text from a PIL Image.
    Uses RapidOCR (ONNX) first; falls back to EasyOCR and PyTesseract.
    """
    # Downscale high-resolution images to conserve RAM on container hosting
    if image.width > 1200 or image.height > 1200:
        image = image.copy()
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    # 1. Try RapidOCR (fast, high-accuracy, runs on CPU via ONNX)
    engine = get_rapidocr_engine()
    if engine is not None:
        try:
            import numpy as np
            img_np = np.array(image.convert("RGB"))
            result, _ = engine(img_np)
            if result:
                lines = [item[1] for item in result]
                return "\n".join(lines).strip()
        except Exception:
            pass

    # 2. Try EasyOCR
    reader = get_easyocr_reader()
    if reader is not None:
        try:
            # Convert PIL image to bytes or numpy array
            import numpy as np
            img_np = np.array(image.convert("RGB"))
            results = reader.readtext(img_np, detail=0)
            return "\n".join(results).strip()
        except Exception as e:
            pass

    # 3. Fallback to PyTesseract (only if pytesseract & tesseract executable are installed)
    try:
        import importlib
        pytesseract = importlib.import_module("pytesseract")
        import shutil

        tess_bin = None
        common_tesseract_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe")
        ]
        for path in common_tesseract_paths:
            if os.path.exists(path):
                tess_bin = path
                break
        
        if not tess_bin:
            tess_bin = shutil.which("tesseract")

        if tess_bin:
            pytesseract.pytesseract.tesseract_cmd = tess_bin
            text = pytesseract.image_to_string(image)
            return text.strip()
    except Exception:
        pass

    return "[OCR Engine Note: Scanned image detected. To enable image OCR, install 'easyocr' or Windows Tesseract-OCR]."


def extract_text_from_pdf(pdf_path: str) -> Tuple[str, str]:
    """
    Extracts text from a PDF file.
    Uses PyMuPDF (fast, native text extraction) first.
    If a page contains little or no text (< 30 characters), renders it as an image
    and runs OCR (for scanned pages).
    
    Returns:
        (extracted_text, extraction_method)
    """
    doc = fitz.open(pdf_path)
    full_text = []
    methods_used = set()

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text("text").strip()

        # If page has substantial text, it is a native/digital PDF
        if len(page_text) > 30:
            full_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
            methods_used.add("PyMuPDF (Native)")
        else:
            # Scanned page: Render to high-DPI image and perform OCR
            pix = page.get_pixmap(dpi=200)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            ocr_text = ocr_image(img)
            full_text.append(f"--- Page {page_num + 1} [Scanned/OCR] ---\n{ocr_text}")
            methods_used.add("OCR")

    doc.close()
    combined_text = "\n\n".join(full_text)
    method_str = " + ".join(sorted(methods_used)) if methods_used else "None"
    return combined_text, method_str


def extract_text_from_image(image_path: str) -> Tuple[str, str]:
    """Extracts text directly from an image file (PNG, JPG, TIFF, etc.)."""
    img = Image.open(image_path)
    text = ocr_image(img)
    return text, "OCR (Image)"


def extract_text(file_path: str) -> Tuple[str, str]:
    """
    Unified text extraction entry point.
    Dispatches to PDF or Image extractor based on file extension.
    
    Returns:
        (extracted_text, extraction_method)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".webp"]:
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Allowed: PDF, PNG, JPG, JPEG")


if __name__ == "__main__":
    # Quick standalone CLI test
    import sys
    test_file = sys.argv[1] if len(sys.argv) > 1 else "samples/app1_clean_noc.pdf"
    if os.path.exists(test_file):
        print(f"Testing extraction on: {test_file}")
        text, method = extract_text(test_file)
        print(f"Method: {method}")
        print(f"Hash: {compute_file_hash(test_file)[:16]}...")
        print("--- EXTRACTED TEXT PREVIEW ---")
        print(text[:300] + ("..." if len(text) > 300 else ""))
    else:
        print(f"Test file not found: {test_file}. Run generate_samples.py first.")
