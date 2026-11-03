import {
  InstitutionApplication,
  ValidationRule,
  AuditTrailItem,
  User,
} from '../types';

export const CURRENT_OFFICIAL: User = {
  id: 'OFF-AICTE-4821',
  name: 'Rajesh Sharma',
  designation: 'Senior Scrutiny Officer',
  email: 'rajesh.sharma@aicte-india.gov.in',
  role: 'Official',
  department: 'Approval Bureau - Northern & Western Region',
};

export const CURRENT_ADMIN: User = {
  id: 'ADM-AICTE-1002',
  name: 'Dr. Sunita Rao',
  designation: 'Director of Approvals & Policy',
  email: 'sunita.rao@aicte-india.gov.in',
  role: 'Admin',
  department: 'AICTE Headquarters, New Delhi',
};

export const INITIAL_RULES: ValidationRule[] = [
  {
    id: 'R-01',
    name: 'Document Validity & Expiry Check',
    category: 'Document Validity',
    description: 'Validates that uploaded NOCs, Affidavits, and Certificates have not elapsed the mandatory statutory cutoff date.',
    severity: 'High',
    weight: 9,
    isActive: true,
    lastUpdated: '2026-09-14 11:30 IST',
    updatedBy: 'Dr. Sunita Rao',
    yamlConfig: `rule_id: R-01
name: Document_Validity_Check
target_documents:
  - state_government_noc
  - university_affiliation_noc
  - fire_safety_certificate
conditions:
  - check: expiry_date >= application_cutoff_date
    fallback: flag_violation
    severity: HIGH
    message: "Mandatory statutory document has expired before the designated approval cycle cut-off."
tolerance_days: 0
auto_recheck_on_reupload: true`,
  },
  {
    id: 'R-08',
    name: 'Institutional Identity & Name Similarity',
    category: 'Identity Consistency',
    description: 'Computes Levenshtein and semantic token distance across trust deeds, society registration, and application records.',
    severity: 'Medium',
    weight: 7,
    isActive: true,
    lastUpdated: '2026-08-22 14:15 IST',
    updatedBy: 'Dr. Sunita Rao',
    yamlConfig: `rule_id: R-08
name: Institutional_Identity_Consistency
target_fields:
  - institution_legal_name
  - sponsoring_trust_society_name
threshold_similarity: 0.90
fuzzy_match_mode: token_sort_ratio
conditions:
  - check: similarity >= 0.90
    on_fail:
      severity: MEDIUM
      action: flag_and_highlight
      prompt: "Institution legal name differs across submitted records beyond nominal contraction limits."`,
  },
  {
    id: 'R-14',
    name: 'Digital Tampering & Error Level Analysis (ELA)',
    category: 'Forensic Integrity',
    description: 'Performs compression artifact forensic scans, EXIF metadata auditing, and spliced text boundary detection on scanned deeds.',
    severity: 'High',
    weight: 10,
    isActive: true,
    lastUpdated: '2026-10-02 09:40 IST',
    updatedBy: 'System AI Engine',
    yamlConfig: `rule_id: R-14
name: Forensic_ELA_Tamper_Analysis
target_documents:
  - land_title_deed
  - bank_guarantee_certificate
  - occupancy_certificate
algorithms:
  - error_level_analysis (ELA)
  - double_compression_grid
  - font_glyph_consistency
thresholds:
  ela_anomaly_score_max: 0.40
  exif_software_flags: ["Adobe Photoshop", "GIMP", "Canva", "Pixelmator"]
on_anomaly:
  severity: HIGH
  status: "Flagged"
  generate_heatmap: true`,
  },
  {
    id: 'R-22',
    name: 'Issuing Authority Verification & QR Validation',
    category: 'Authority Cross-Check',
    description: 'Verifies embedded cryptographic 2D barcodes, digital signatures, and cross-references state government gazette APIs.',
    severity: 'Medium',
    weight: 8,
    isActive: true,
    lastUpdated: '2026-07-19 16:50 IST',
    updatedBy: 'Dr. Sunita Rao',
    yamlConfig: `rule_id: R-22
name: Authority_QR_Digital_Verification
target_documents:
  - fire_safety_noc
  - building_stability_certificate
validation_protocols:
  - qr_payload_decryption
  - state_portal_handshake
  - x509_cert_chain_validation
on_unresolvable_qr:
  severity: MEDIUM
  recommended_status: "Manual Review Required"
  evidence_logging: mandatory`,
  },
  {
    id: 'R-31',
    name: 'Infrastructure & Computer Lab Density Norms',
    category: 'Infrastructure Norms',
    description: 'Evaluates computer terminal counts, carpet area per student, and AI-assisted visual verification of uploaded lab photos.',
    severity: 'Low',
    weight: 5,
    isActive: true,
    lastUpdated: '2026-09-01 10:20 IST',
    updatedBy: 'Dr. Sunita Rao',
    yamlConfig: `rule_id: R-31
name: Infrastructure_Density_Advisory
parameters:
  min_carpet_area_sqm_per_student: 4.2
  student_to_terminal_ratio: 3:1
  licensed_software_verification: required
photo_verification:
  detect_duplicate_stock_photos: true
  seating_count_estimation: true
on_discrepancy:
  severity: LOW
  classification: "Advisory"
  recommendation: "May require physical expert committee inspection"`,
  },
  {
    id: 'R-45',
    name: 'Faculty Cadre Ratio & Qualification Verification',
    category: 'Infrastructure Norms',
    description: 'Cross-verifies faculty Aadhaar-seeded records against national database for ghost faculty and cadre ratio (1:2:6).',
    severity: 'High',
    weight: 9,
    isActive: true,
    lastUpdated: '2026-08-05 17:00 IST',
    updatedBy: 'System AI Engine',
    yamlConfig: `rule_id: R-45
name: Faculty_Cadre_And_Ghost_Detection
ratio_standards:
  cadre: "1:2:6" # Professor : Assoc. Prof : Asst. Prof
  faculty_student_ratio: "1:20"
checks:
  - multi_institution_simultaneous_employment
  - phd_mandatory_for_professors
on_violation:
  severity: HIGH
  action: flag_deficiency`,
  },
];

export const MOCK_APPLICATIONS: InstitutionApplication[] = [];

export const INITIAL_AUDIT_LOGS: AuditTrailItem[] = [];
