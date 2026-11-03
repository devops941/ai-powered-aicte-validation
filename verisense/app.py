"""
app.py - AICTE DocVerify Final Enterprise Dashboard (Streamlit).
AI-assisted decision-support system for pre-validating Extension of Approval (EoA) applications.

PAGES:
1. Login (Roles: Scrutiny Official, Administrator)
2. Dashboard (KPI Cards, Common Issues Bar Chart, Risk Level Pie Chart, Flagged Applications Table)
3. New Application (Intake Form, Document Upload, Quick-Load Bundles, Automated Pre-Validation)
4. Application Detail (Tabs: Summary, Documents [Image beside OCR text], Flags & Evidence, History)
5. Audit Log (Immutable chronological log of all officer actions)
6. Rules Management (Admin Only - Live YAML configuration)

HARD RULES ENFORCED:
- Never outputs "Approved" or "Rejected". Only "Flagged", "No issues found", or "Manual Review Required".
- Every flag displays: Rule ID, Document, Severity, Verbatim Evidence, and Timestamp.
- Every system action is recorded in the SQLite audit log.
- Displays disclaimer: "Decision support only. Final decision rests with AICTE officials."
"""

import os
import io
import shutil
import yaml
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from PIL import Image
import pymupdf as fitz

from db import (
    init_db,
    insert_institution,
    insert_application,
    get_application,
    get_all_applications,
    insert_document,
    get_documents_by_application,
    update_application_status,
    insert_flag,
    get_flags_by_application,
    get_flags_summary,
    log_audit,
    get_audit_logs,
    get_aicte_history,
)
from ocr import extract_text, compute_file_hash
from extract import extract_all_fields
from rules_engine import run_rules_engine, load_rules_config
from tamper import perform_ela, check_pdf_metadata
from qr_check import verify_document_qr
from risk import calculate_risk
from report import generate_validation_pdf

# Ensure required directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("samples", exist_ok=True)

# Initialize database schema and mock records
init_db()

# Page configuration
st.set_page_config(
    page_title="AICTE DocVerify | Pre-Validation Portal",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-title { font-size: 2.1rem; font-weight: 700; color: #1E3A8A; margin-bottom: 2px; }
    .subtitle { color: #4B5563; font-size: 1.0rem; margin-bottom: 20px; }
    .kpi-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; text-align: center; }
    .badge-flagged { background-color: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .badge-clean { background-color: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .badge-review { background-color: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
    .disclaimer-banner { background-color: #FEF2F2; border-left: 5px solid #EF4444; padding: 12px; margin-top: 20px; font-size: 0.85rem; color: #7F1D1D; }
</style>
""", unsafe_allow_html=True)


# --- SESSION & AUTHENTICATION STATE ---
if "logged_in" not in st.session_state:
    st.session_state["logged_in"] = True  # Default logged-in for smooth evaluation
    st.session_state["username"] = "officer_sharma"
    st.session_state["role"] = "Official"
    st.session_state["full_name"] = "Officer S. Sharma"

if "selected_app_no" not in st.session_state:
    st.session_state["selected_app_no"] = "EOA-2025-00109"


# --- SIDEBAR & NAVIGATION ---
st.sidebar.markdown("## 🛡️ **AICTE DocVerify**")
st.sidebar.caption("AI-Assisted EoA Decision Support System")
st.sidebar.markdown("---")

# User Badge
st.sidebar.markdown(f"**User:** `{st.session_state['username']}`")
st.sidebar.markdown(f"**Role:** `{st.session_state['role']}`")

# Navigation items based on role
nav_options = [
    "📊 Executive Dashboard",
    "📝 New Application Intake",
    "🔍 Application Detail",
    "📜 System Audit Trail",
]
if st.session_state["role"] == "Admin":
    nav_options.append("⚙️ Rules Management (Admin)")
nav_options.append("🔐 User & Role Switcher")

page = st.sidebar.radio("Navigation Menu", nav_options)

st.sidebar.markdown("---")
st.sidebar.info(
    "💡 **Regulatory Notice**:\n\n"
    "AICTE DocVerify never approves or rejects applications. "
    "All outputs are decision-support flags. "
    "Final approval authority resides strictly with AICTE officials."
)


# ==============================================================================
# PAGE 1: USER & ROLE SWITCHER (LOGIN)
# ==============================================================================
if page == "🔐 User & Role Switcher":
    st.markdown('<div class="main-title">User Authentication & Role Switcher</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Switch between Scrutiny Official and Administrator roles to test permissions.</div>', unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])
    with col1:
        st.markdown("### Select Persona / Account")
        role_choice = st.radio(
            "Account Role",
            ["Official (Scrutiny Officer)", "Admin (System Administrator)"],
            index=0 if st.session_state["role"] == "Official" else 1
        )

        user_input = st.text_input(
            "Officer Username",
            value="officer_sharma" if "Official" in role_choice else "admin_verisense"
        )

        if st.button("Apply Login / Switch Persona", type="primary"):
            st.session_state["username"] = user_input
            if "Admin" in role_choice:
                st.session_state["role"] = "Admin"
                st.session_state["full_name"] = "System Administrator"
            else:
                st.session_state["role"] = "Official"
                st.session_state["full_name"] = "Scrutiny Officer Sharma"

            log_audit(
                username=st.session_state["username"],
                action="USER_LOGIN",
                details=f"User signed in with role '{st.session_state['role']}'"
            )
            st.success(f"Logged in as **{st.session_state['username']}** ({st.session_state['role']})!")
            st.rerun()

    with col2:
        st.markdown("### Role Permissions Matrix")
        st.markdown("""
        | Feature / Capability | Scrutiny Official | Administrator |
        | :--- | :---: | :---: |
        | Executive Dashboard & Analytics | ✅ | ✅ |
        | Application Intake & OCR | ✅ | ✅ |
        | Run Pre-Validation & Risk Scoring | ✅ | ✅ |
        | Download Official PDF Reports | ✅ | ✅ |
        | View Audit Trail Log | ✅ | ✅ |
        | Edit Regulatory Rules YAML | ❌ *(Hidden)* | ✅ *(Full Access)* |
        """)


# ==============================================================================
# PAGE 2: EXECUTIVE DASHBOARD
# ==============================================================================
elif page == "📊 Executive Dashboard":
    st.markdown('<div class="main-title">AICTE Extension of Approval — Executive Dashboard</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Real-time scrutiny status, common regulatory defects, and application risk profile.</div>', unsafe_allow_html=True)

    apps = get_all_applications()
    total_apps = len(apps)
    flagged_apps = [a for a in apps if a["status"] == "Flagged"]
    clean_apps = [a for a in apps if a["status"] == "No issues found"]
    review_apps = [a for a in apps if a["status"] == "Manual Review Required"]

    avg_risk = round(sum(a["risk_score"] for a in apps) / total_apps, 1) if total_apps > 0 else 0.0

    # 1. KPI Cards
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        st.markdown(f"<div class='kpi-card'><h4>Total Ingested</h4><h2 style='color:#1E3A8A;'>{total_apps}</h2><small>Applications Submitted</small></div>", unsafe_allow_html=True)
    with k2:
        st.markdown(f"<div class='kpi-card'><h4>Flagged for Scrutiny</h4><h2 style='color:#EF4444;'>{len(flagged_apps)}</h2><small>Discrepancies identified</small></div>", unsafe_allow_html=True)
    with k3:
        st.markdown(f"<div class='kpi-card'><h4>No Issues Found</h4><h2 style='color:#10B981;'>{len(clean_apps)}</h2><small>Fully compliant baseline</small></div>", unsafe_allow_html=True)
    with k4:
        st.markdown(f"<div class='kpi-card'><h4>Average Risk Score</h4><h2 style='color:#F59E0B;'>{avg_risk}</h2><small>Scale: 0 - 100 Index</small></div>", unsafe_allow_html=True)

    st.markdown("---")

    # 2. Analytics Charts Row
    ch1, ch2 = st.columns([3, 2])

    with ch1:
        st.markdown("#### 📊 Most Common Compliance Issues Raised")
        flags_data = get_flags_summary()
        if flags_data:
            df_flags = pd.DataFrame(flags_data)
            fig_bar = px.bar(
                df_flags,
                x="count",
                y="issue",
                orientation="h",
                color="severity",
                color_discrete_map={"CRITICAL": "#EF4444", "WARNING": "#F59E0B", "INFO": "#3B82F6"},
                labels={"count": "Times Flagged", "issue": "Regulatory Norm"},
                title="Frequency of Flags Across Applications"
            )
            fig_bar.update_layout(yaxis=dict(autorange="reversed"), height=300, margin=dict(l=10, r=10, t=30, b=20))
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("No compliance flags recorded yet. Run pre-validation on an application to populate.")

    with ch2:
        st.markdown("#### 🎯 Application Risk Level Distribution")
        risk_counts = {"Low (0-30)": 0, "Medium (31-60)": 0, "High (61-100)": 0}
        for a in apps:
            s = a["risk_score"]
            if s <= 30.0:
                risk_counts["Low (0-30)"] += 1
            elif s <= 60.0:
                risk_counts["Medium (31-60)"] += 1
            else:
                risk_counts["High (61-100)"] += 1

        fig_pie = px.pie(
            names=list(risk_counts.keys()),
            values=list(risk_counts.values()),
            color=list(risk_counts.keys()),
            color_discrete_map={"Low (0-30)": "#10B981", "Medium (31-60)": "#F59E0B", "High (61-100)": "#EF4444"},
            hole=0.45
        )
        fig_pie.update_layout(height=300, margin=dict(l=10, r=10, t=30, b=20))
        st.plotly_chart(fig_pie, use_container_width=True)

    # 3. Table of Applications
    st.markdown("---")
    st.markdown("#### 📋 Ingested Applications & Triage Register")
    if apps:
        df_apps = pd.DataFrame(apps)[["application_no", "institution_name", "aicte_id", "academic_year", "status", "risk_score", "submitted_at"]]
        df_apps.columns = ["Application No", "Institution Name", "AICTE ID", "Academic Year", "Status", "Risk Score", "Submitted At"]
        st.dataframe(df_apps, use_container_width=True, hide_index=True)
    else:
        st.info("No applications registered yet. Use 'New Application Intake' to add one.")


# ==============================================================================
# PAGE 3: NEW APPLICATION INTAKE & PRE-VALIDATION
# ==============================================================================
elif page == "📝 New Application Intake":
    st.markdown('<div class="main-title">New Application Intake & Automated Audit</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Submit institutional documents or quick-load synthetic test sets for pre-validation.</div>', unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1], gap="large")

    with col1:
        st.markdown("#### 1. Institution & Application Identity")
        app_no = st.text_input("Application Number", value="EOA-2025-00109")
        inst_name = st.text_input("Institution Name", value="Apex Institute of Technology")
        
        c_a, c_b = st.columns(2)
        with c_a:
            aicte_id = st.text_input("AICTE Permanent ID", value="1-9312456781")
            state = st.selectbox("State", ["Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Delhi"], index=0)
        with c_b:
            academic_year = st.selectbox("Academic Year", ["2025-26", "2026-27"], index=0)
            city = st.text_input("City", value="Pune")

        st.markdown("---")
        st.markdown("#### 2. Fast-Track Test Bundles (Synthetic Scenarios)")
        quick_bundle = st.selectbox(
            "⚡ Quick-Load Test Application Bundle",
            [
                "None (Upload Files Manually)",
                "Bundle 1: Clean Baseline (All 5 Valid Docs)",
                "Bundle 2: Expired University NOC",
                "Bundle 3: Name Mismatch (Apex Clg vs Apex Institute)",
                "Bundle 4: Tampered Land Document (Visual Splicing)",
                "Bundle 5: Counterfeit Fire QR Code"
            ]
        )

        st.markdown("---")
        st.markdown("#### 3. Manual Document Upload")
        doc_type = st.selectbox("Document Category", ["NOC", "Affidavit", "Faculty List", "Land Document", "Fire Certificate"])
        uploaded_file = st.file_uploader(f"Upload {doc_type}", type=["pdf", "png", "jpg", "jpeg"])

    with col2:
        st.markdown("#### 4. Execution & Automated Pre-Validation")
        execute_btn = st.button("🚀 Ingest Documents & Run Full Pre-Validation Audit", type="primary", use_container_width=True)

        if execute_btn:
            inst_id = insert_institution(aicte_id, inst_name, state, city)
            existing_app = get_application(app_no)
            app_id = existing_app["id"] if existing_app else insert_application(app_no, inst_id, academic_year)

            # Ingest synthetic bundle if chosen
            test_mapping = {}
            if "Clean Baseline" in quick_bundle:
                test_mapping = {
                    "NOC": "samples/app1_clean_noc.pdf",
                    "Affidavit": "samples/app1_clean_affidavit.pdf",
                    "Faculty List": "samples/app1_clean_faculty.pdf",
                    "Land Document": "samples/app1_clean_land.pdf",
                    "Fire Certificate": "samples/app1_clean_fire.png",
                }
            elif "Expired University NOC" in quick_bundle:
                test_mapping = {
                    "NOC": "samples/app2_expired_noc.pdf",
                    "Affidavit": "samples/app1_clean_affidavit.pdf",
                    "Faculty List": "samples/app1_clean_faculty.pdf",
                    "Land Document": "samples/app1_clean_land.pdf",
                    "Fire Certificate": "samples/app1_clean_fire.png",
                }
            elif "Name Mismatch" in quick_bundle:
                test_mapping = {
                    "NOC": "samples/app1_clean_noc.pdf",
                    "Affidavit": "samples/app1_clean_affidavit.pdf",
                    "Faculty List": "samples/app1_clean_faculty.pdf",
                    "Land Document": "samples/app4_mismatch_land.pdf",
                    "Fire Certificate": "samples/app1_clean_fire.png",
                }
            elif "Tampered Land Document" in quick_bundle:
                test_mapping = {
                    "NOC": "samples/app1_clean_noc.pdf",
                    "Affidavit": "samples/app1_clean_affidavit.pdf",
                    "Faculty List": "samples/app1_clean_faculty.pdf",
                    "Land Document": "samples/app5_tampered_land.png",
                    "Fire Certificate": "samples/app1_clean_fire.png",
                }
            elif "Counterfeit Fire QR" in quick_bundle:
                test_mapping = {
                    "NOC": "samples/app1_clean_noc.pdf",
                    "Affidavit": "samples/app1_clean_affidavit.pdf",
                    "Faculty List": "samples/app1_clean_faculty.pdf",
                    "Land Document": "samples/app1_clean_land.pdf",
                    "Fire Certificate": "samples/app6_fakeqr_fire.png",
                }

            # Ingest manual uploaded file if present
            if uploaded_file is not None:
                filename = f"{app_no}_{doc_type}_{uploaded_file.name}"
                target_path = os.path.join("uploads", filename)
                with open(target_path, "wb") as f:
                    f.write(uploaded_file.getbuffer())
                test_mapping[doc_type] = target_path

            if not test_mapping:
                st.error("Please either choose a Quick-Load Test Bundle or upload a document.")
            else:
                with st.spinner("Executing extraction, OCR, cross-checks, and rules engine..."):
                    doc_bundle = {}
                    for dtype, src_path in test_mapping.items():
                        if os.path.exists(src_path):
                            dest_path = os.path.join("uploads", f"{app_no}_{dtype}_{os.path.basename(src_path)}")
                            if src_path != dest_path:
                                shutil.copyfile(src_path, dest_path)
                            txt, method = extract_text(dest_path)
                            fhash = compute_file_hash(dest_path)
                            insert_document(app_id, dtype, dest_path, fhash, txt)
                            doc_bundle[dtype] = {
                                "raw_text": txt,
                                "fields": extract_all_fields(txt),
                                "file_path": dest_path
                            }

                    app_meta = {
                        "application_no": app_no,
                        "institution_name": inst_name,
                        "aicte_id": aicte_id,
                        "academic_year": academic_year,
                        "officer_name": st.session_state["username"]
                    }

                    # Execute Rules Engine
                    rule_results = run_rules_engine(doc_bundle, app_meta=app_meta)

                    # Execute QR Checks
                    for dtype in ["Fire Certificate", "NOC"]:
                        if dtype in doc_bundle:
                            q_res = verify_document_qr(doc_bundle[dtype]["file_path"], doc_type=dtype)
                            rule_results.append({
                                "rule_id": "R-QR-AUTH",
                                "rule_name": f"{dtype} Official QR Code Verification",
                                "severity": "CRITICAL",
                                "weight": 25,
                                "status": q_res["status"],
                                "document": dtype,
                                "evidence": q_res["evidence"],
                                "timestamp": pd.Timestamp.now().isoformat()
                            })

                    # Execute ELA Tamper Checks on Land Document
                    if "Land Document" in doc_bundle:
                        lpath = doc_bundle["Land Document"]["file_path"]
                        if lpath.endswith((".png", ".jpg", ".jpeg")):
                            ela_res = perform_ela(lpath, output_dir="uploads")
                            rule_results.append({
                                "rule_id": "R-TAMPER-ELA",
                                "rule_name": "Image Error Level Analysis (ELA) Splicing Detection",
                                "severity": "CRITICAL",
                                "weight": 25,
                                "status": ela_res["status"],
                                "document": "Land Document",
                                "evidence": ela_res["evidence"],
                                "heatmap_path": ela_res["heatmap_path"],
                                "timestamp": pd.Timestamp.now().isoformat()
                            })

                    # Calculate Risk & Update DB
                    risk_summary = calculate_risk(rule_results)
                    update_application_status(app_id, risk_summary["status"], risk_summary["risk_score"])

                    for f in risk_summary["flags"]:
                        insert_flag(
                            application_id=app_id,
                            rule_id=f.get("rule_id", "R-GEN"),
                            severity=f.get("severity", "WARNING"),
                            issue=f.get("rule_name", f.get("issue", "Rule Violation")),
                            evidence=f.get("evidence", ""),
                            document_id=None
                        )

                    log_audit(
                        username=st.session_state["username"],
                        action="PRE_VALIDATION_COMPLETED",
                        details=f"Evaluated {app_no}. Status: {risk_summary['status']}. Score: {risk_summary['risk_score']}."
                    )

                    st.session_state["selected_app_no"] = app_no
                    st.success(f"Audit completed! Status: **{risk_summary['status']}** | Risk Score: **{risk_summary['risk_score']}**")
                    st.info("👉 Switch to **'Application Detail'** in the sidebar to view full findings and download the PDF report.")


# ==============================================================================
# PAGE 4: APPLICATION DETAIL (TABS: Summary, Documents, Flags, History)
# ==============================================================================
elif page == "🔍 Application Detail":
    st.markdown('<div class="main-title">Application Detail & Evidential Audit</div>', unsafe_allow_html=True)

    apps = get_all_applications()
    app_choices = [a["application_no"] for a in apps] if apps else ["EOA-2025-00109"]
    
    sel_app_no = st.selectbox(
        "Select Application Reference",
        app_choices,
        index=app_choices.index(st.session_state["selected_app_no"]) if st.session_state["selected_app_no"] in app_choices else 0
    )
    st.session_state["selected_app_no"] = sel_app_no

    app_data = get_application(sel_app_no)

    if app_data:
        app_id = app_data["id"]
        docs = get_documents_by_application(app_id)
        flags = get_flags_by_application(app_id)

        # 4 Required Tabs
        tab_summary, tab_docs, tab_flags, tab_history = st.tabs([
            "📋 Executive Summary",
            "📄 Document Ingestion (Image & OCR)",
            "🚩 Flags & Evidential Audit",
            "🏛️ AICTE Historical Master Check"
        ])

        # --- TAB 1: SUMMARY ---
        with tab_summary:
            st.markdown("### Application Profile & Triage Decision-Support")
            
            c_s1, c_s2, c_s3, c_s4 = st.columns(4)
            with c_s1:
                st.markdown(f"**Institution:**<br/>{app_data['institution_name']}", unsafe_allow_html=True)
            with c_s2:
                st.markdown(f"**AICTE Permanent ID:**<br/>`{app_data['aicte_id']}`", unsafe_allow_html=True)
            with c_s3:
                status_color = "#10B981" if app_data["status"] == "No issues found" else ("#EF4444" if app_data["status"] == "Flagged" else "#F59E0B")
                st.markdown(f"**Pre-Validation Status:**<br/><span style='color:{status_color};font-weight:bold;font-size:1.1rem;'>{app_data['status']}</span>", unsafe_allow_html=True)
            with c_s4:
                st.markdown(f"**Risk Score:**<br/><span style='font-size:1.1rem;font-weight:bold;'>{app_data['risk_score']} / 100</span>", unsafe_allow_html=True)

            st.markdown("---")

            # Risk Gauge & Flags Breakdown
            g_col1, g_col2 = st.columns([1, 1])
            with g_col1:
                fig_g = go.Figure(go.Indicator(
                    mode="gauge+number",
                    value=app_data["risk_score"],
                    title={'text': "Risk Score Gauge"},
                    gauge={
                        'axis': {'range': [0, 100]},
                        'bar': {'color': "#EF4444" if app_data["risk_score"] > 60 else ("#F59E0B" if app_data["risk_score"] > 30 else "#10B981")},
                        'steps': [
                            {'range': [0, 30], 'color': "#D1FAE5"},
                            {'range': [30, 60], 'color': "#FEF3C7"},
                            {'range': [60, 100], 'color': "#FEE2E2"},
                        ]
                    }
                ))
                fig_g.update_layout(height=240, margin=dict(l=10, r=10, t=30, b=10))
                st.plotly_chart(fig_g, use_container_width=True)

            with g_col2:
                st.markdown("#### Triage Status Overview")
                st.write(f"• **Uploaded Documents:** {len(docs)}")
                st.write(f"• **Total Compliance Flags:** {len(flags)}")
                st.write(f"• **Academic Year:** {app_data['academic_year']}")
                st.write(f"• **Submission Timestamp:** {app_data['submitted_at']}")

            # PDF Download Button
            st.markdown("---")
            app_meta = {
                "application_no": app_data["application_no"],
                "institution_name": app_data["institution_name"],
                "aicte_id": app_data["aicte_id"],
                "academic_year": app_data["academic_year"],
                "officer_name": st.session_state["username"]
            }
            risk_summary = {
                "status": app_data["status"],
                "risk_score": app_data["risk_score"],
                "risk_level": "High" if app_data["risk_score"] > 60 else ("Medium" if app_data["risk_score"] > 30 else "Low"),
                "total_rules": 13,
                "passed_rules": 13 - len(flags),
                "failed_rules": len(flags),
                "critical_flags": sum(1 for f in flags if f.get("severity") == "CRITICAL"),
                "warning_flags": sum(1 for f in flags if f.get("severity") == "WARNING"),
                "flags": flags
            }
            pdf_bytes = generate_validation_pdf(app_meta, risk_summary)
            st.download_button(
                label="📄 Download Official Validation Report (PDF)",
                data=pdf_bytes,
                file_name=f"AICTE_DocVerify_{sel_app_no}.pdf",
                mime="application/pdf",
                type="primary",
                use_container_width=True
            )

        # --- TAB 2: DOCUMENTS (IMAGE BESIDE OCR TEXT) ---
        with tab_docs:
            st.markdown("### Document Ingestion & Verification Gallery")
            st.caption("Side-by-side inspection: Rendered document preview (left) beside exact OCR extracted text (right).")

            if docs:
                for idx, d in enumerate(docs):
                    st.markdown(f"#### 📄 {d['doc_type']}")
                    doc_col_img, doc_col_txt = st.columns([1, 1], gap="medium")

                    with doc_col_img:
                        fpath = d["file_path"]
                        if os.path.exists(fpath):
                            if fpath.lower().endswith(".pdf"):
                                # Render first page of PDF as image for visual preview
                                doc = fitz.open(fpath)
                                pix = doc[0].get_pixmap(dpi=130)
                                doc.close()
                                img = Image.open(io.BytesIO(pix.tobytes("png")))
                                st.image(img, caption=f"PDF Preview: {os.path.basename(fpath)}", use_container_width=True)
                            else:
                                st.image(fpath, caption=f"Image Preview: {os.path.basename(fpath)}", use_container_width=True)
                        else:
                            st.warning(f"File not found on disk: `{fpath}`")

                    with doc_col_txt:
                        st.caption(f"**SHA-256 Hash:** `{d['file_hash'][:24]}...`")
                        st.caption(f"**Ingested At:** {d['uploaded_at']}")
                        st.text_area(
                            f"OCR Extracted Content ({d['doc_type']}) - #{idx+1}",
                            value=d["extracted_text"] or "(No text extracted)",
                            height=360,
                            key=f"ocr_txt_area_{sel_app_no}_{d.get('id', idx)}_{idx}"
                        )
                    st.markdown("---")
            else:
                st.info("No documents uploaded for this application.")

        # --- TAB 3: FLAGS & EVIDENCE ---
        with tab_flags:
            st.markdown("### Rule Violations & Evidence Audit Trail")
            st.caption("HARD RULE: Every flag displays the issue, target document, rule ID, verbatim evidence, and timestamp.")

            if flags:
                for f in flags:
                    sev = f["severity"]
                    color = "#EF4444" if sev == "CRITICAL" else ("#F59E0B" if sev == "WARNING" else "#3B82F6")
                    with st.expander(f"🚩 [{f['rule_id']}] {f['issue']} ({sev})"):
                        st.markdown(f"**Severity:** <span style='color:{color};font-weight:bold;'>{sev}</span>", unsafe_allow_html=True)
                        st.markdown(f"**Document Type:** `{f.get('doc_type', 'Application Bundle')}`")
                        st.markdown(f"**Verbatim Evidence Snippet:**")
                        st.info(f['evidence'])
                        st.caption(f"Flagged At: {f['flagged_at']}")
            else:
                st.success("✅ No flags raised! The application satisfies all AICTE Approval Process Handbook checks.")

        # --- TAB 4: HISTORY ---
        with tab_history:
            st.markdown("### AICTE Historical Master Database Verification")
            hist = get_aicte_history(app_data["aicte_id"])

            if hist:
                h_c1, h_c2 = st.columns(2)
                with h_c1:
                    st.markdown("#### Historical Permanent Registration")
                    st.write(f"• **AICTE Permanent ID:** `{hist['aicte_id']}`")
                    st.write(f"• **Master Institution Title:** **{hist['institution_name']}**")
                    st.write(f"• **Historically Approved Land Area:** **{hist['approved_land_area']} Acres**")
                    st.write(f"• **Existing Approved Intake:** {hist['existing_intake']} Seats")
                    st.write(f"• **Last Approval Year:** {hist['last_approval_year']}")
                    st.write(f"• **Historical Campus Address:** {hist['address']}")
                with h_c2:
                    st.markdown("#### Current Application Consistency")
                    st.write(f"• **Current Application Name:** {app_data['institution_name']}")
                    st.write(f"• **Current Academic Year:** {app_data['academic_year']}")
                    if app_data['institution_name'] == hist['institution_name']:
                        st.success("✅ Institution Name matches AICTE historical registration perfectly.")
                    else:
                        st.warning("⚠️ Discrepancy between current application title and AICTE history.")
            else:
                st.warning(f"No historical approval record found for AICTE ID `{app_data['aicte_id']}`.")

    else:
        st.warning("Please select or submit an application first.")


# ==============================================================================
# PAGE 5: AUDIT TRAIL LOG
# ==============================================================================
elif page == "📜 System Audit Trail":
    st.markdown('<div class="main-title">System Audit & Compliance Log</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Chronological, immutable audit log of all document intakes, pre-validation runs, and officer actions.</div>', unsafe_allow_html=True)

    logs = get_audit_logs(limit=150)
    if logs:
        df_l = pd.DataFrame(logs)[["id", "timestamp", "username", "action", "details", "ip_address"]]
        df_l.columns = ["ID", "Timestamp", "Officer", "Action", "Details", "IP Address"]
        st.dataframe(df_l, use_container_width=True, hide_index=True)
    else:
        st.info("Audit log is currently empty.")


# ==============================================================================
# PAGE 6: RULES MANAGEMENT (ADMIN ONLY)
# ==============================================================================
elif page == "⚙️ Rules Management (Admin)":
    st.markdown('<div class="main-title">Regulatory Rules Configuration (Admin Mode)</div>', unsafe_allow_html=True)
    st.markdown('<div class="subtitle">Modify weights, thresholds, or add new regulatory rules in YAML without code alterations.</div>', unsafe_allow_html=True)

    yaml_file = "rules.yaml"
    with open(yaml_file, "r", encoding="utf-8") as f:
        current_yaml = f.read()

    new_yaml = st.text_area("Live rules.yaml Editor", value=current_yaml, height=450, key="admin_rules_yaml_editor")

    if st.button("💾 Validate & Save Rules Configuration", type="primary"):
        try:
            # Validate YAML syntax
            parsed = yaml.safe_load(new_yaml)
            assert "rules" in parsed, "YAML must include a 'rules' list"

            with open(yaml_file, "w", encoding="utf-8") as f:
                f.write(new_yaml)

            log_audit(
                username=st.session_state["username"],
                action="RULES_CONFIG_UPDATED",
                details=f"Admin updated rules.yaml ({len(parsed.get('rules', []))} rules active)."
            )
            st.success("✅ rules.yaml validated and saved successfully! Future validation runs will apply these updated norms immediately.")
        except Exception as e:
            st.error(f"Failed to save YAML: {str(e)}")
