/**
 * AICTE DocVerify Type Definitions
 * Strict compliance:
 * - Allowed statuses: "Flagged" | "No issues found" | "Manual Review Required" | "Reviewed by Official"
 * - Risk levels: "Low" | "Medium" | "High"
 */

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type ApplicationStatus =
  | 'Flagged'
  | 'No issues found'
  | 'Manual Review Required'
  | 'Reviewed by Official';

export type UserRole = 'Official' | 'Admin';

export interface User {
  id: string;
  name: string;
  designation: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
}

export type ApplicationCategory =
  | 'Extension of Approval: Add new course'
  | 'Extension of Approval: Increase intake'
  | 'Extension of Approval: Change of name'
  | 'Extension of Approval: Existing course continuation';

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0 - 100
  status: 'matched' | 'discrepancy' | 'unverified';
  note?: string;
}

export interface BoundingBox {
  id: string;
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  label: string;
  severity: RiskLevel;
  description: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: 'Uploaded' | 'Missing';
  hasFlags: boolean;
  flagCount: number;
  extractedFields: ExtractedField[];
  boundingBoxes: BoundingBox[];
  elaScore?: number; // Error Level Analysis score (0.0 to 1.0)
  hasElaAnomaly?: boolean;
  rawText?: string;
}

export interface ValidationFlag {
  id: string;
  ruleId: string;
  issue: string;
  document: string;
  severity: RiskLevel;
  evidence: string;
  source: string;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Action Requested';
  officialNotes?: string;
  boundingBoxId?: string;
  documentId?: string;
}

export interface SummaryCheck {
  id: string;
  title: string;
  category: string;
  status: 'passed' | 'flagged' | 'review_required';
  passedCount: number;
  totalCount: number;
  description: string;
}

export interface HistoricalRecord {
  academicYear: string;
  status: 'Sanctioned EoA' | 'Sanctioned with Compliance Note' | 'Held for Hearing';
  intakeApproved: number;
  programsCount: number;
  deficiencyNoted: string;
  scrutinyDate: string;
}

export interface ComparisonMetric {
  parameter: string;
  claimedInApplication: string;
  recordedInAicteDb: string;
  variance: string;
  isMismatch: boolean;
  severity: RiskLevel;
}

export interface AuditTrailItem {
  id: string;
  timestamp: string;
  rawTimestamp: string;
  user: string;
  role: UserRole | 'System';
  action: string;
  details: string;
  applicationId: string;
  ipAddress?: string;
}

export interface InstitutionApplication {
  id: string; // e.g., AICTE-1-932184109
  institutionName: string;
  aicteId: string; // Permanent Institute ID
  state: string;
  region: string;
  category: ApplicationCategory;
  submissionDate: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  status: ApplicationStatus;
  flagsCount: number;
  assignedOfficer?: string;
  flags: ValidationFlag[];
  documents: DocumentItem[];
  summaryChecks: SummaryCheck[];
  history: HistoricalRecord[];
  comparisonMetrics: ComparisonMetric[];
  auditTrail: AuditTrailItem[];
  reviewedBy?: string;
  reviewedAt?: string;
  officialComments?: string;
}

export interface ValidationRule {
  id: string; // e.g. R-01
  name: string;
  category: 'Document Validity' | 'Identity Consistency' | 'Forensic Integrity' | 'Infrastructure Norms' | 'Authority Cross-Check';
  description: string;
  severity: RiskLevel;
  weight: number; // 1 to 10
  isActive: boolean;
  yamlConfig: string;
  lastUpdated: string;
  updatedBy: string;
}
