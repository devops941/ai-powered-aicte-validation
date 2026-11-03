"""
report.py - PDF Validation Report Generator for AICTE DocVerify.
Generates an official, printable PDF summary report using ReportLab containing
institution details, risk score, flagged compliance rules with verbatim evidence,
and mandatory regulatory disclaimers.

HARD RULE ENFORCED:
Never outputs "Approved" or "Rejected".
Includes disclaimer: "Decision support only. Final decision rests with AICTE officials."
"""

import os
import io
from datetime import datetime
from typing import Dict, Any, List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_validation_pdf(
    app_meta: Dict[str, Any],
    risk_summary: Dict[str, Any],
    output_path: Optional[str] = None
) -> bytes:
    """
    Builds the official AICTE DocVerify Pre-Validation Report in PDF format.
    
    Parameters:
      app_meta: Application details (app_no, institution_name, aicte_id, officer_name, academic_year)
      risk_summary: Risk calculation dictionary returned by risk.calculate_risk()
      output_path: Optional file path to save the PDF. If None, returns PDF bytes.
      
    Returns:
      PDF binary bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        output_path if output_path else buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#1E3A8A'),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#4B5563'),
        alignment=1
    )
    section_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#1E3A8A'),
        spaceBefore=10,
        spaceAfter=6
    )
    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )
    evidence_style = ParagraphStyle(
        'EvidenceText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1F2937')
    )

    # 1. Official Header
    story.append(Paragraph("ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)", title_style))
    story.append(Paragraph("DocVerify AI-Assisted Extension of Approval (EoA) Pre-Validation Report", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1E3A8A'), spaceAfter=12))

    # 2. Application & Institution Profile Table
    now_str = datetime.now().strftime("%d-%B-%Y %H:%M:%S IST")
    app_info_data = [
        [
            Paragraph("<b>Application Number:</b>", cell_style),
            Paragraph(str(app_meta.get("application_no", "N/A")), cell_bold),
            Paragraph("<b>AICTE Permanent ID:</b>", cell_style),
            Paragraph(str(app_meta.get("aicte_id", "N/A")), cell_bold),
        ],
        [
            Paragraph("<b>Institution Name:</b>", cell_style),
            Paragraph(str(app_meta.get("institution_name", "N/A")), cell_bold),
            Paragraph("<b>Academic Year:</b>", cell_style),
            Paragraph(str(app_meta.get("academic_year", "2025-26")), cell_bold),
        ],
        [
            Paragraph("<b>Scrutiny Officer:</b>", cell_style),
            Paragraph(str(app_meta.get("officer_name", "Officer Sharma")), cell_style),
            Paragraph("<b>Report Generated:</b>", cell_style),
            Paragraph(now_str, cell_style),
        ],
    ]
    app_table = Table(app_info_data, colWidths=[110, 160, 110, 160])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(app_table)
    story.append(Spacer(1, 12))

    # 3. Executive Risk & Status Summary
    story.append(Paragraph("1. Pre-Validation Executive Summary", section_h2))

    status_str = risk_summary.get("status", "Pending Review")
    risk_score = risk_summary.get("risk_score", 0.0)
    risk_level = risk_summary.get("risk_level", "Low")

    # Status color coding
    if status_str == "No issues found":
        status_bg = colors.HexColor('#DCFCE7')  # Light green
        status_fg = colors.HexColor('#166534')  # Dark green
    elif status_str == "Flagged":
        status_bg = colors.HexColor('#FEE2E2')  # Light red
        status_fg = colors.HexColor('#991B1B')  # Dark red
    else:
        status_bg = colors.HexColor('#FEF3C7')  # Light yellow
        status_fg = colors.HexColor('#92400E')  # Dark yellow

    summary_data = [
        [
            Paragraph("<b>Pre-Validation Status:</b>", cell_style),
            Paragraph(f"<font color='{status_fg.hexval()}'><b>{status_str.upper()}</b></font>", cell_bold),
            Paragraph("<b>Overall Risk Score:</b>", cell_style),
            Paragraph(f"<b>{risk_score} / 100 ({risk_level} Risk)</b>", cell_bold),
        ],
        [
            Paragraph("<b>Rules Evaluated:</b>", cell_style),
            Paragraph(f"{risk_summary.get('total_rules', 0)} Norms Checked", cell_style),
            Paragraph("<b>Flags Raised:</b>", cell_style),
            Paragraph(
                f"<b>{risk_summary.get('critical_flags', 0)} Critical</b>, "
                f"{risk_summary.get('warning_flags', 0)} Warning, "
                f"{risk_summary.get('manual_review_rules', 0)} Manual Review",
                cell_style
            ),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[120, 150, 110, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), status_bg),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # 4. Detailed Flags & Compliance Audit Table
    story.append(Paragraph("2. Detailed Findings & Compliance Rule Checklist", section_h2))

    flags = risk_summary.get("flags", [])
    if flags:
        table_rows = [
            [
                Paragraph("<b>Rule ID</b>", cell_bold),
                Paragraph("<b>Severity</b>", cell_bold),
                Paragraph("<b>Document</b>", cell_bold),
                Paragraph("<b>Issue & Verbatim Evidence</b>", cell_bold),
                Paragraph("<b>Timestamp</b>", cell_bold),
            ]
        ]

        for f in flags:
            sev = f.get("severity", "INFO")
            sev_color = "#DC2626" if sev == "CRITICAL" else ("#D97706" if sev == "WARNING" else "#2563EB")
            status_tag = f.get("status", "fail").upper()

            issue_text = f"<b>[{status_tag}] {f.get('rule_name', f.get('issue', 'Compliance Check'))}</b><br/>"
            evidence_text = f"<i>Evidence:</i> {f.get('evidence', 'No evidence snippet available.')}"
            
            ts = f.get("timestamp", now_str)[:19].replace("T", " ")

            table_rows.append([
                Paragraph(f"<b>{f.get('rule_id', 'N/A')}</b>", cell_style),
                Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", cell_style),
                Paragraph(str(f.get("document", "Bundle")), cell_style),
                Paragraph(issue_text + evidence_text, cell_style),
                Paragraph(ts, evidence_style),
            ])

        flags_table = Table(table_rows, colWidths=[65, 55, 85, 255, 80])
        flags_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3E50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(flags_table)
    else:
        no_flags_box = [
            [Paragraph("<b>No Compliance Discrepancies Found</b>", cell_bold)],
            [Paragraph("All submitted documents satisfied the mandatory checklist, date validity, cross-document consistency, and regulatory norms.", cell_style)]
        ]
        t = Table(no_flags_box, colWidths=[540])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#DCFCE7')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#16A34A')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(t)

    story.append(Spacer(1, 20))

    # 5. Mandatory Disclaimer Box (HARD RULE)
    disclaimer_data = [
        [Paragraph("<b>REGULATORY NOTICE & SYSTEM SAFEGUARD</b>", ParagraphStyle('DisH', parent=cell_bold, textColor=colors.HexColor('#B91C1C')))],
        [Paragraph(
            "<b>Decision support only. Final decision rests with AICTE officials.</b><br/>"
            "This report is generated by AICTE DocVerify as an automated pre-validation decision-support tool. "
            "Optical Character Recognition (OCR), Error Level Analysis (ELA), and heuristic cross-checks are triage "
            "indicators designed to assist scrutiny officers. This automated report does not constitute administrative "
            "Approval or Rejection under the AICTE Approval Process Handbook.",
            evidence_style
        )]
    ]
    disc_table = Table(disclaimer_data, colWidths=[540])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#EF4444')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    story.append(KeepTogether([disc_table]))

    doc.build(story)

    if output_path:
        with open(output_path, "rb") as f:
            return f.read()
    else:
        return buffer.getvalue()


if __name__ == "__main__":
    print("==========================================================================================")
    print("AICTE DocVerify - PDF Validation Report Generator Benchmark")
    print("==========================================================================================")

    test_meta = {
        "application_no": "EOA-2025-00109",
        "institution_name": "Apex Institute of Technology",
        "aicte_id": "1-9312456781",
        "academic_year": "2025-26",
        "officer_name": "Officer S. Sharma"
    }

    test_risk = {
        "risk_score": 40.0,
        "risk_level": "Medium",
        "status": "Flagged",
        "total_rules": 13,
        "passed_rules": 11,
        "failed_rules": 2,
        "manual_review_rules": 0,
        "critical_flags": 1,
        "warning_flags": 1,
        "info_flags": 0,
        "flags": [
            {
                "rule_id": "R-NOC-001",
                "rule_name": "NOC Validity for Proposed Academic Year",
                "severity": "CRITICAL",
                "document": "NOC",
                "status": "fail",
                "evidence": "EXPIRED: Valid until 2023-05-31, which is before academic year benchmark 2025-06-01. Evidence: 'Validity Period: Valid until 31-May-2023.'",
                "timestamp": "2026-10-31T12:45:00"
            },
            {
                "rule_id": "R-NAME-001",
                "rule_name": "Institution Name Consistency Across Documents",
                "severity": "WARNING",
                "document": "Cross-Document Check",
                "status": "fail",
                "evidence": "DISCREPANCY in 'institution_name': 'Apex Institute of Technology' (NOC) vs 'Apex Clg of Tech' (Land Document) -> Similarity: 59.1% (Required: >=90%)",
                "timestamp": "2026-10-31T12:45:00"
            }
        ]
    }

    out_file = "samples/sample_validation_report.pdf"
    pdf_bytes = generate_validation_pdf(test_meta, test_risk, output_path=out_file)
    print(f"Generated validation report ({len(pdf_bytes)} bytes) at: {out_file}")
    assert os.path.exists(out_file), "PDF file was not created!"
    print("ReportLab PDF generation test passed successfully!")
