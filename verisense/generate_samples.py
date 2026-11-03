"""
generate_samples.py - Synthetic Document Generator for AICTE VeriSense.
Generates PDFs and images with embedded QR codes and controlled anomalies
for testing compliance rules, OCR, cross-document matching, and tamper detection.
"""

import os
import csv
from datetime import datetime
import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

OUTPUT_DIR = "samples"
os.makedirs(OUTPUT_DIR, exist_ok=True)


# --- HELPER: GENERATE QR CODE IMAGE ---
def create_qr_code(data: str, filename: str) -> str:
    """Generates a QR code image with clear quiet zones for reliable decoding."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    path = os.path.join(OUTPUT_DIR, filename)
    img.save(path)
    return path


# --- 1. NOC GENERATOR ---
def generate_noc(filename: str, institution: str, valid_until: str, is_expired: bool = False):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40)
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=1, textColor=colors.navy)
    story.append(Paragraph("STATE DIRECTORATE OF TECHNICAL EDUCATION", title_style))
    story.append(Paragraph("NO OBJECTION CERTIFICATE (NOC)", ParagraphStyle('Sub', parent=styles['Heading2'], alignment=1)))
    story.append(Spacer(1, 15))

    noc_no = "NOC/DTE/2021/EXP-09" if is_expired else "NOC/DTE/2025/APP-881"
    body = f"""
    <b>Certificate Number:</b> {noc_no}<br/>
    <b>Date of Issue:</b> 10-June-2021<br/><br/>
    This is to certify that the Directorate has <b>NO OBJECTION</b> for introducing the following new course at:
    <br/><br/>
    <b>Institution Name:</b> {institution}<br/>
    <b>Proposed Course:</b> B.Tech in Artificial Intelligence & Machine Learning<br/>
    <b>Proposed Intake:</b> 60 Seats<br/>
    <b>Academic Year:</b> 2025-2026<br/><br/>
    <b>Validity Period:</b> Valid until <b>{valid_until}</b>.<br/><br/>
    The institution shall strictly abide by AICTE Approval Process Handbook norms.
    """
    story.append(Paragraph(body, styles['Normal']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>Authorized Signatory</b><br/>Director, Technical Education", styles['Normal']))
    doc.build(story)
    return filepath


# --- 2. AFFIDAVIT GENERATOR ---
def generate_affidavit(filename: str, institution: str, land_area: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("GOVERNMENT OF MAHARASHTRA - STAMP DUTY", ParagraphStyle('Stamp', alignment=1, textColor=colors.darkred)))
    story.append(Paragraph("AFFIDAVIT (ON RS. 100 NON-JUDICIAL STAMP PAPER)", ParagraphStyle('Title', parent=styles['Heading2'], alignment=1)))
    story.append(Spacer(1, 15))

    body = f"""
    I, Secretary of the Governing Trust of <b>{institution}</b>, do hereby solemnly affirm and state:<br/><br/>
    1. That our institution owns and possesses <b>{land_area}</b> of contiguous land at Sector 4, Hinjawadi, Pune.<br/>
    2. That the institution has fulfilled all requirements for introducing <b>B.Tech Artificial Intelligence & Machine Learning</b> (Intake 60).<br/>
    3. That faculty Cadre ratio (1:2:6) and student-teacher ratio (1:20) shall be fully maintained.<br/>
    4. That the Fire Safety Certificate and Land records submitted are true, authentic, and unencumbered.<br/><br/>
    Declared on this 15th Day of January 2025.
    """
    story.append(Paragraph(body, styles['Normal']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>Deponent / Chairman</b><br/>Notary Public Registration No: NOT/MH/9941", styles['Normal']))
    doc.build(story)
    return filepath


# --- 3. FACULTY LIST GENERATOR ---
def generate_faculty_list(filename: str, institution: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=30, rightMargin=30, topMargin=30)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"FACULTY LIST - {institution.upper()}", ParagraphStyle('H1', parent=styles['Heading2'], alignment=1)))
    story.append(Paragraph("Proposed Department: Artificial Intelligence & Machine Learning (Intake: 60)", styles['Normal']))
    story.append(Spacer(1, 10))

    data = [
        ["Sr.", "Faculty Name", "Designation", "Qualification", "Experience"],
        ["1", "Dr. Rajesh K. Verma", "Professor & HOD", "Ph.D (AI / CSE)", "18 Years"],
        ["2", "Dr. Meera S. Nair", "Associate Professor", "Ph.D (Data Science)", "12 Years"],
        ["3", "Prof. Anand Sharma", "Associate Professor", "M.Tech, Ph.D pursuing", "9 Years"],
        ["4", "Prof. Neha Gupta", "Assistant Professor", "M.Tech (CSE)", "5 Years"],
        ["5", "Prof. Saurabh Joshi", "Assistant Professor", "M.Tech (AI & Robotics)", "4 Years"],
        ["6", "Prof. Ritu Deshmukh", "Assistant Professor", "M.Tech (IT)", "3 Years"],
    ]

    table = Table(data, colWidths=[30, 150, 130, 130, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 1, colors.grey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 20))
    story.append(Paragraph("Certified that all faculty qualifications align with AICTE Cadre Norms (Cadre Ratio 1:2:6).", styles['Italic']))
    doc.build(story)
    return filepath


# --- 4. LAND DOCUMENT GENERATOR (PDF & IMAGE) ---
def generate_land_pdf(filename: str, institution: str, area_acres: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("SUB-REGISTRAR OFFICE OF REVENUE", ParagraphStyle('SubReg', alignment=1, textColor=colors.darkblue)))
    story.append(Paragraph("CERTIFICATE OF REGISTERED LAND TITLE", ParagraphStyle('Title', parent=styles['Heading2'], alignment=1)))
    story.append(Spacer(1, 15))

    body = f"""
    <b>Registration / Deed Number:</b> REV-LAND-2018-77192<br/>
    <b>Date of Registration:</b> 14-November-2018<br/><br/>
    This is to certify that the title and possession of property situated at:<br/>
    <b>Address:</b> Survey No: 142/A & 143/B, Hinjawadi IT Park Road, Pune<br/>
    is legally owned and held by:<br/><br/>
    <b>Institution:</b> {institution}<br/><br/>
    <b>Total Land Area:</b> {area_acres} Acres (Contiguous, Non-agricultural land)<br/>
    <b>Classification:</b> Institutional Educational Purpose Only<br/>
    <b>Encumbrance Status:</b> NIL (Free of all legal liabilities & mortgages)<br/><br/>
    Verified by Sub-Registrar (Pune Division).
    """
    story.append(Paragraph(body, styles['Normal']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>Authorized Revenue Officer</b><br/>Sub-Registrar Office, Govt of Maharashtra", styles['Normal']))
    doc.build(story)
    return filepath


def generate_land_document(filename: str, institution: str, area_acres: str, tamper: bool = False):
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    # Render document as image with Pillow for easy pixel-level tampering demonstration
    img = Image.new("RGB", (800, 1050), color="white")
    draw = ImageDraw.Draw(img)

    # Document Header
    draw.rectangle([(20, 20), (780, 1030)], outline="black", width=2)
    draw.text((220, 50), "SUB-REGISTRAR OFFICE OF REVENUE", fill="black")
    draw.text((250, 75), "CERTIFICATE OF REGISTERED LAND TITLE", fill="darkblue")
    draw.line([(50, 105), (750, 105)], fill="gray", width=1)

    # Document Body
    body_lines = [
        f"Registration / Deed Number: REV-LAND-2018-77192",
        f"Date of Registration: 14-November-2018",
        "",
        f"This is to certify that the title and possession of property situated at:",
        f"Survey No: 142/A & 143/B, Hinjawadi IT Park Road, Pune",
        f"is legally owned and held by:",
        f"Institution: {institution}",
        "",
        f"Total Land Area: {area_acres} Acres (Contiguous, Non-agricultural land)",
        f"Classification: Institutional Educational Purpose Only",
        f"Encumbrance Status: NIL (Free of all legal liabilities & mortgages)",
    ]

    y = 140
    for line in body_lines:
        if "Institution:" in line or "Total Land Area:" in line:
            draw.text((60, y), line, fill="darkred")
        else:
            draw.text((60, y), line, fill="black")
        y += 35

    # Seal and Signature
    draw.ellipse([(550, 700), (700, 850)], outline="navy", width=3)
    draw.text((580, 760), "OFFICIAL SEAL\nGOVT OF MH", fill="navy")
    draw.text((560, 880), "Sub-Registrar (Pune Division)", fill="black")

    # If tampering requested, paint an obvious altered patch over the land area
    if tamper:
        # Draw a misaligned white patch over the area text to simulate pasted/edited alteration
        draw.rectangle([(180, 415), (420, 455)], fill=(245, 245, 245), outline="red", width=2)
        draw.text((190, 425), "ALTERED: 5.50 Acres", fill="red")

    img.save(filepath)
    return filepath


# --- 5. FIRE SAFETY CERTIFICATE (PDF & QR-ENABLED IMAGE) ---
def generate_fire_pdf(filename: str, institution: str, valid_until: str, cert_no: str):
    filepath = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(filepath, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("STATE DISASTER MANAGEMENT & FIRE SERVICES", ParagraphStyle('FireH1', alignment=1, textColor=colors.firebrick)))
    story.append(Paragraph("FIRE SAFETY COMPLIANCE CERTIFICATE", ParagraphStyle('FireH2', parent=styles['Heading2'], alignment=1)))
    story.append(Spacer(1, 15))

    body = f"""
    <b>Certificate Number:</b> {cert_no}<br/>
    <b>Date of Inspection:</b> 05-Jan-2025<br/><br/>
    This is to certify that the educational building occupied by:<br/>
    <b>Institution:</b> {institution}<br/>
    Address: Sector 4, Hinjawadi, Pune<br/><br/>
    has been inspected and found compliant with all fire safety regulations under National Building Code (NBC) Part IV.<br/><br/>
    <b>Validity Period:</b> Valid up to <b>{valid_until}</b>.<br/>
    <b>Status:</b> Safe for Educational Operations.<br/><br/>
    Verified via official command registry.
    """
    story.append(Paragraph(body, styles['Normal']))
    story.append(Spacer(1, 30))
    story.append(Paragraph("<b>Chief Fire Officer</b><br/>State Fire Services Command", styles['Normal']))
    doc.build(story)
    return filepath


def generate_fire_certificate(filename: str, institution: str, valid_until: str, cert_no: str, qr_data: str):
    filepath = os.path.join(OUTPUT_DIR, filename)

    img = Image.new("RGB", (800, 1000), color="white")
    draw = ImageDraw.Draw(img)

    # Borders & Header
    draw.rectangle([(25, 25), (775, 975)], outline="firebrick", width=3)
    draw.rectangle([(32, 32), (768, 968)], outline="gold", width=1)
    draw.text((230, 60), "STATE DISASTER MANAGEMENT & FIRE SERVICES", fill="darkred")
    draw.text((270, 90), "FIRE SAFETY COMPLIANCE CERTIFICATE", fill="black")
    draw.line([(60, 120), (740, 120)], fill="gray", width=1)

    body = [
        f"Certificate Number: {cert_no}",
        f"Date of Inspection: 05-Jan-2025",
        "",
        f"This is to certify that the educational building occupied by:",
        f"{institution}",
        "has been inspected and found compliant with all fire safety regulations",
        "under National Building Code (NBC) Part IV.",
        "",
        f"Validity Period: Valid up to {valid_until}",
        f"Status: Safe for Educational Operations",
    ]

    y = 160
    for line in body:
        if "Certificate Number" in line or "Validity Period" in line:
            draw.text((70, y), line, fill="darkblue")
        else:
            draw.text((70, y), line, fill="black")
        y += 35

    # Generate and Paste QR Code onto the certificate
    qr_img_path = create_qr_code(qr_data, f"temp_qr_{filename}")
    qr_img = Image.open(qr_img_path)
    img.paste(qr_img.convert("RGB"), (540, 650))
    if os.path.exists(qr_img_path):
        os.remove(qr_img_path)

    draw.text((545, 830), "Scan to Verify at\nfireservices.gov.in", fill="gray")
    draw.text((80, 850), "Chief Fire Officer\nState Fire Services Command", fill="black")

    img.save(filepath)
    return filepath


# --- MASTER GENERATOR ---
def generate_all_samples():
    print("Generating 19 synthetic test documents across 6 test application sets...")

    # Set 1: Fully Clean Application (APP-01-CLEAN)
    generate_noc("app1_clean_noc.pdf", "Apex Institute of Technology", "31-May-2028")
    generate_affidavit("app1_clean_affidavit.pdf", "Apex Institute of Technology", "2.50")
    generate_faculty_list("app1_clean_faculty.pdf", "Apex Institute of Technology")
    generate_land_document("app1_clean_land.png", "Apex Institute of Technology", "2.50")
    generate_land_pdf("app1_clean_land.pdf", "Apex Institute of Technology", "2.50")
    generate_fire_certificate("app1_clean_fire.png", "Apex Institute of Technology", "31-Dec-2026", "FS/MH/2025/1102", "VERIFIED|FS/MH/2025/1102|Apex Institute of Technology|31-Dec-2026")
    generate_fire_pdf("app1_clean_fire.pdf", "Apex Institute of Technology", "31-Dec-2026", "FS/MH/2025/1102")

    # Set 2: Expired NOC (APP-02-EXP-NOC)
    generate_noc("app2_expired_noc.pdf", "Apex Institute of Technology", "31-May-2023", is_expired=True)

    # Set 3: Missing Fire Certificate (APP-03-NO-FIRE)
    # (Uses standard NOC, Affidavit, Faculty, Land from Set 1, but Fire Cert will not be uploaded)

    # Set 4: Name Mismatch on Land Record (APP-04-MISMATCH)
    generate_land_document("app4_mismatch_land.png", "Apex Clg of Tech", "2.50")
    generate_land_pdf("app4_mismatch_land.pdf", "Apex Clg of Tech", "2.50")

    # Set 5: Tampered Land Document (APP-05-TAMPER)
    generate_land_document("app5_tampered_land.png", "Apex Institute of Technology", "2.50", tamper=True)

    # Set 6: Counterfeit QR Code on Fire Certificate (APP-06-FAKE-QR)
    # QR points to a totally unrelated malicious phishing payload
    generate_fire_certificate("app6_fakeqr_fire.png", "Apex Institute of Technology", "31-Dec-2026", "FS/MH/2025/9981", "http://fake-cert-portal.xyz/verify?id=unknown")

    # Write expected_results.csv ground truth table
    matrix_path = os.path.join(OUTPUT_DIR, "expected_results.csv")
    with open(matrix_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Application_ID", "Document_File", "Document_Type", "Test_Scenario",
            "Expected_Rule_ID", "Expected_Severity", "Expected_Status", "Description"
        ])
        
        # Test ground-truth rows
        test_rows = [
            ["APP-01-CLEAN", "app1_clean_noc.pdf", "NOC", "Clean baseline", "NONE", "NONE", "No issues found", "NOC valid till 2028"],
            ["APP-01-CLEAN", "app1_clean_affidavit.pdf", "Affidavit", "Clean baseline", "NONE", "NONE", "No issues found", "Land declared 2.50 Acres"],
            ["APP-01-CLEAN", "app1_clean_faculty.pdf", "Faculty List", "Clean baseline", "NONE", "NONE", "No issues found", "Meets 1:20 ratio and cadre"],
            ["APP-01-CLEAN", "app1_clean_land.png", "Land Document", "Clean baseline", "NONE", "NONE", "No issues found", "2.50 Acres unencumbered"],
            ["APP-01-CLEAN", "app1_clean_fire.png", "Fire Certificate", "Clean baseline", "NONE", "NONE", "No issues found", "Valid till Dec 2026, QR matches"],

            ["APP-02-EXP-NOC", "app2_expired_noc.pdf", "NOC", "Expired NOC", "R-NOC-001", "CRITICAL", "Flagged", "NOC expired on 31-May-2023"],
            
            ["APP-03-NO-FIRE", "MISSING", "Fire Certificate", "Mandatory doc missing", "R-DOC-001", "CRITICAL", "Flagged", "Fire Safety Certificate not uploaded"],

            ["APP-04-MISMATCH", "app4_mismatch_land.png", "Land Document", "Institution name discrepancy", "R-NAME-001", "WARNING", "Flagged", "Apex Clg of Tech does not match Apex Institute of Technology"],

            ["APP-05-TAMPER", "app5_tampered_land.png", "Land Document", "Altered/spliced image patch", "R-TAMPER-001", "CRITICAL", "Flagged", "Inconsistent box/pixel variance detected in land area"],

            ["APP-06-FAKE-QR", "app6_fakeqr_fire.png", "Fire Certificate", "QR payload discrepancy", "R-QR-001", "CRITICAL", "Flagged", "QR payload does not match certificate metadata"]
        ]
        writer.writerows(test_rows)

    print(f"Generated synthetic documents in: {OUTPUT_DIR}/")
    print(f"Saved Ground-Truth Matrix in: {matrix_path}")


if __name__ == "__main__":
    generate_all_samples()

