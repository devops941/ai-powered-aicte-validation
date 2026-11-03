import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { PdfReportModal } from '../components/common/PdfReportModal';
import { DocumentItem, ValidationFlag } from '../types';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  QrCode,
  Image,
  ArrowRight,
  Eye,
  MessageSquare,
  HelpCircle,
  Building,
  UserCheck,
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const {
    selectedApplication,
    markApplicationAsReviewed,
    showToast,
    user,
  } = useApp();

  const app = selectedApplication;

  const [activeTab, setActiveTab] = useState<
    'summary' | 'documents' | 'flags' | 'history' | 'audit'
  >('summary');

  // Documents tab state
  const [selectedDocId, setSelectedDocId] = useState<string>(
    app?.documents[0]?.id || 'doc-noc'
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [docViewMode, setDocViewMode] = useState<'certificate' | 'raw_text'>('certificate');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [showElaHeatmap, setShowElaHeatmap] = useState<boolean>(false);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Flags tab state
  const [expandedFlagIds, setExpandedFlagIds] = useState<Record<string, boolean>>({
    'FLG-9321-01': true,
    'FLG-9321-02': true,
    'FLG-9321-03': true,
  });

  // Modal states
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [officialCommentsInput, setOfficialCommentsInput] = useState<string>(
    'Dossier scrutinized. Cross-verified with State DTE records and Land revenue gazette.'
  );
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + ESC close for review modal
  useEffect(() => {
    if (!isReviewModalOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Focus first focusable element on open
    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReviewModalOpen(false);
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isReviewModalOpen]);

  if (!app) {
    return (
      <div className="p-8 text-center text-slate-500">
        No application selected.
      </div>
    );
  }

  const selectedDocument: DocumentItem | undefined =
    app.documents.find((d) => d.id === selectedDocId) || app.documents[0];

  const toggleFlagExpand = (flagId: string) => {
    setExpandedFlagIds((prev) => ({
      ...prev,
      [flagId]: !prev[flagId],
    }));
  };

  const handleJumpToDocument = (docId?: string, boxId?: string, docName?: string) => {
    if (docName === 'AICTE Master Database' || (!docId && docName?.toLowerCase().includes('database'))) {
      setActiveTab('history');
      return;
    }
    if (docId) {
      setSelectedDocId(docId);
    }
    if (boxId) {
      setActiveHighlightId(boxId);
    }
    setActiveTab('documents');
  };

  const handleConfirmReview = () => {
    markApplicationAsReviewed(app.id, officialCommentsInput);
    setIsReviewModalOpen(false);
  };





  // Semicircle radial gauge SVG values (180 degree smooth arc)
  const clampedScore = Math.min(100, Math.max(0, Number(app.riskScore) || 0));
  const radius = 49;
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - clampedScore / 100);

  let gaugeColor = '#16a34a'; // green
  if (app.riskLevel === 'Medium' || (clampedScore > 30 && clampedScore <= 60)) gaugeColor = '#f59e0b'; // amber
  if (app.riskLevel === 'High' || clampedScore > 60) gaugeColor = '#dc2626'; // red

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Flagship Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Institution Title & Category */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {app.aicteId}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {app.region} ({app.state})
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                Submitted {app.submissionDate}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {app.institutionName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500">Category:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {app.category}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Current Status:</span>
              <StatusBadge status={app.status} size="sm" />
            </div>
          </div>

          {/* Semicircle Gauge & Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
            {/* Semicircle Gauge Card */}
            <div className="flex flex-col items-center bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-2xs">
              <div className="relative w-36 h-20 flex items-center justify-center">
                <svg className="w-36 h-20" viewBox="0 0 130 76">
                  {/* Background track */}
                  <path
                    d="M 16 66 A 49 49 0 0 1 114 66"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="9"
                    strokeLinecap="round"
                    className="text-slate-200/80 dark:text-slate-750"
                  />
                  {/* Colored progress arc */}
                  <path
                    d="M 16 66 A 49 49 0 0 1 114 66"
                    fill="none"
                    stroke={gaugeColor}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={arcLength}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Score in center */}
                  <text
                    x="65"
                    y="45"
                    textAnchor="middle"
                    className="font-mono text-[21px] font-bold fill-slate-900 dark:fill-white"
                  >
                    {app.riskScore}
                  </text>
                  {/* Score caption */}
                  <text
                    x="65"
                    y="59"
                    textAnchor="middle"
                    className="text-[9px] font-semibold uppercase tracking-wider fill-slate-400 dark:fill-slate-500"
                  >
                    SCORE / 100
                  </text>
                </svg>
              </div>

              {/* Text label with badge */}
              <div className="mt-1">
                <RiskBadge level={app.riskLevel} size="sm" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </button>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                disabled={app.status === 'Reviewed by Official'}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                  app.status === 'Reviewed by Official'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 cursor-default'
                    : 'text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 cursor-pointer shadow-blue-900/20'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {app.status === 'Reviewed by Official'
                    ? 'Reviewed by Official'
                    : 'Mark as Reviewed'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-medium">
          {[
            { id: 'summary', label: 'Summary Overview' },
            { id: 'documents', label: `Documents (${app.documents.length || 6})` },
            { id: 'flags', label: `Flags & Evidence (${app.flags.length})` },
            { id: 'history', label: 'Institutional History' },
            { id: 'audit', label: `Audit Trail (${app.auditTrail.length || 4})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 border-b-2 font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#1e3a8a] text-[#1e3a8a] dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SUMMARY TAB */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Key Findings Notice */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Automated Scrutiny Synthesis
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  {app.flagsCount === 0 ? (
                    'The DocVerify engine scrutinized the submitted statutory dossier and detected no regulatory deviations against AICTE Approval Process Handbook (APH 2026-27).'
                  ) : (
                    <>
                      The DocVerify engine flagged{' '}
                      <strong>
                        {app.flagsCount} potential statutory deviation{app.flagsCount > 1 ? 's' : ''}
                      </strong>{' '}
                      across submitted records.
                      {app.documents.some((d) => d.status === 'Missing') && (
                        <span>
                          {' '}
                          Missing mandatory annexure(s):{' '}
                          <strong>
                            {app.documents
                              .filter((d) => d.status === 'Missing')
                              .map((d) => d.name.split(' ')[0])
                              .join(', ')}
                          </strong>
                          .
                        </span>
                      )}{' '}
                      Key findings:{' '}
                      {app.flags
                        .slice(0, 3)
                        .map((f) => f.issue)
                        .join('; ')}
                      .
                    </>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('flags')}
              className="text-xs font-semibold text-amber-900 dark:text-amber-300 underline hover:no-underline whitespace-nowrap shrink-0"
            >
              Examine Flags →
            </button>
          </div>

          {/* 5 Check Cards in a Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Five Core Regulatory Pillars
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {app.summaryChecks.map((check) => {
                let statusBadge = (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    No issues found
                  </span>
                );

                if (check.status === 'flagged') {
                  statusBadge = (
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                      Flagged ({check.totalCount - check.passedCount} Issues)
                    </span>
                  );
                } else if (check.status === 'review_required') {
                  statusBadge = (
                    <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      Manual Review Required
                    </span>
                  );
                }

                return (
                  <div
                    key={check.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {check.category}
                        </span>
                        {statusBadge}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {check.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {check.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Compliance Concordance</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {check.passedCount} / {check.totalCount} Rules Clear
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics & Official Sign-off Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Official Review Status
              </h4>
              {app.reviewedBy ? (
                <div className="p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Reviewed by Official: {app.reviewedBy}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Timestamp: {app.reviewedAt}</p>
                  <p className="text-slate-700 dark:text-slate-300 pt-1 italic">
                    "{app.officialComments}"
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                  <p>Pending interactive official endorsement. Scrutiny officer may review flags and endorse dossier.</p>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="mt-2 text-xs font-semibold text-[#1e3a8a] dark:text-blue-400 hover:underline"
                  >
                    Open Review Dialog →
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mandatory Institutional Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block">Requested Intake</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">540 Seats</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block">Current AICTE Sanction</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">420 Seats</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block">Total Land Holding</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">12.50 Acres</span>
                </div>
                <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[11px] text-slate-400 block">Full-time Faculty</span>
                  <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">94 Members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Document List */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-100 dark:border-slate-800">
              Submitted Dossiers ({app.documents.length})
            </h3>
            <div className="space-y-1.5">
              {app.documents.map((doc) => {
                const isSelected = doc.id === selectedDocId;

                // Match flags dynamically across document type, name, or filename
                const docTypeClean = (doc.type || '').toLowerCase();
                const docNameClean = (doc.name || '').toLowerCase();
                const matchingFlags = (app.flags || []).filter((f) => {
                  const fDoc = (f.document || '').toLowerCase();
                  if (!fDoc) return false;
                  return (
                    fDoc === docTypeClean ||
                    fDoc === docNameClean ||
                    docTypeClean.includes(fDoc) ||
                    fDoc.includes(docTypeClean) ||
                    docNameClean.includes(fDoc) ||
                    fDoc.includes(docNameClean)
                  );
                });

                const effectiveFlagCount = doc.flagCount || matchingFlags.length;
                const hasFlags = doc.hasFlags || effectiveFlagCount > 0;

                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setActiveHighlightId(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e3a8a] text-white shadow-xs font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.name}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-blue-200' : 'text-slate-400'
                        }`}
                      >
                        {doc.fileName}
                      </p>
                    </div>

                    {doc.status === 'Missing' ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        Missing
                      </span>
                    ) : hasFlags ? (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {effectiveFlagCount} flag
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        Clear
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Interactive Document Viewer */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
            {/* Viewer Toolbar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#1e3a8a] dark:text-blue-400 shrink-0" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedDocument?.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-750 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    onClick={() => setDocViewMode('certificate')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      docViewMode === 'certificate'
                        ? 'bg-white dark:bg-slate-900 text-[#1e3a8a] dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Certificate View
                  </button>
                  <button
                    onClick={() => setDocViewMode('raw_text')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      docViewMode === 'raw_text'
                        ? 'bg-white dark:bg-slate-900 text-[#1e3a8a] dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Extracted OCR Text
                  </button>
                </div>

                {/* Layer toggles */}
                <button
                  onClick={() => setShowBoundingBoxes((prev) => !prev)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    showBoundingBoxes
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1e3a8a] dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Toggle flagged bounding boxes"
                >
                  Bounding Boxes
                </button>

                {selectedDocument?.hasElaAnomaly && (
                  <button
                    onClick={() => setShowElaHeatmap((prev) => !prev)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                      showElaHeatmap
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300'
                        : 'text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Toggle Error Level Analysis forensic heatmap"
                  >
                    ELA Heatmap
                  </button>
                )}

                {/* Zoom */}
                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 15, 70))}
                    aria-label="Zoom out"
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px] text-slate-500 w-9 text-center" aria-live="polite" aria-label={`Zoom level ${zoomLevel}%`}>
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 15, 150))}
                    aria-label="Zoom in"
                    className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Canvas Simulator */}
            <div className="p-6 bg-slate-100 dark:bg-slate-950/80 overflow-auto flex items-center justify-center min-h-[460px]">
              {selectedDocument?.status === 'Missing' ? (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Mandatory Annexure Not Uploaded
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    <strong>{selectedDocument?.name}</strong> is required under AICTE Approval Process Handbook (APH 2026-27). The applicant institution did not attach this statutory document during submission.
                  </p>
                  <div className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Regulatory Non-Compliance: Rule R-DOC-001 Flagged
                  </div>
                </div>
              ) : docViewMode === 'raw_text' ? (
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{selectedDocument?.fileName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                        OCR Extracted Text
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {selectedDocument?.rawText ? `${selectedDocument.rawText.length} characters` : 'Processed'}
                    </span>
                  </div>
                  <div className="max-h-[500px] overflow-auto p-4 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-text border border-slate-200 dark:border-slate-850">
                    {selectedDocument?.rawText || (
                      <span className="text-slate-400 italic">No raw text stream extracted for this file format.</span>
                    )}
                  </div>
                </div>
              ) : (
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="relative bg-white text-slate-900 w-[420px] min-h-[580px] p-6 shadow-xl border border-slate-300 rounded-sm font-serif select-none transition-transform"
              >
                {/* Dynamically Styled Certificate Specific to Document Type */}
                {(() => {
                  const docType = (selectedDocument?.type || '').toLowerCase();
                  const getFieldVal = (kw: string) =>
                    selectedDocument?.extractedFields.find((f) =>
                      f.label.toLowerCase().includes(kw.toLowerCase())
                    )?.value;

                  const instName = getFieldVal('institution') || app.institutionName;
                  const expiry = getFieldVal('expiry') || getFieldVal('valid') || '31-03-2026';
                  const refNum = getFieldVal('number') || getFieldVal('ref') || 'AICTE/APH/2026';
                  const land = getFieldVal('area') || getFieldVal('land') || '2.50 Acres';
                  const addr = getFieldVal('address') || `${app.state}, Western Region`;

                  if (docType.includes('affidavit')) {
                    return (
                      <div className="space-y-3.5 text-[10px] leading-relaxed font-sans text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                          <p className="text-[9px] tracking-widest font-sans font-bold uppercase text-slate-600">
                            NOTARIAL REGISTRY OF INDIA • NOTARY RECORD
                          </p>
                          <h3 className="text-sm font-bold uppercase mt-1 tracking-tight text-slate-900">
                            MANDATORY DISCLOSURE AFFIDAVIT
                          </h3>
                          <p className="text-[8px] font-sans text-slate-500 font-mono mt-0.5">
                            AICTE APH FORMAT 1 • RS. 500 NON-JUDICIAL STAMP PAPER
                          </p>
                        </div>

                        <p>
                          I / We, the authorized deponent and chairman of the sponsoring trust, do hereby solemnly affirm and declare on oath under penalty of law that:
                        </p>

                        <div className="border border-slate-200 p-2.5 rounded bg-slate-50/80 space-y-1 font-mono text-[9px]">
                          <div><strong>Institution Name:</strong> {instName}</div>
                          <div><strong>Permanent AICTE ID:</strong> {app.aicteId}</div>
                          <div><strong>Campus Location:</strong> {addr}</div>
                          <div><strong>Declared Land:</strong> {land}</div>
                        </div>

                        <ul className="list-disc list-inside space-y-1 text-[9px] text-slate-700">
                          <li>Institution complies with all land, building, and safety norms of AICTE APH Chapter II.</li>
                          <li>Strict anti-ragging measures enforced per AICTE Regulations 2009.</li>
                          <li>Faculty-to-student cadre ratio maintained at 1:2:6 with Aadhaar seeding.</li>
                          <li>No capitation fee or unapproved commercial activity is undertaken.</li>
                        </ul>

                        <div className="pt-3 flex justify-between items-end text-[9px] border-t border-slate-200">
                          <div>
                            <p className="font-bold text-slate-900">Affidavit Executed:</p>
                            <p className="font-mono text-slate-700">18-Jan-2025</p>
                            <p className="text-[8px] text-slate-500 font-mono">Notary Reg: NOTARY/MH/7712</p>
                          </div>
                          <div className="text-right">
                            <div className="w-20 h-10 border border-dashed border-slate-400 mb-1 flex items-center justify-center text-[7px] text-slate-500 font-mono">
                              [NOTARY STAMP]
                            </div>
                            <p className="font-bold">Authorized Deponent</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (docType.includes('faculty')) {
                    return (
                      <div className="space-y-3 text-[10px] leading-relaxed font-sans text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                          <p className="text-[9px] tracking-widest font-sans font-bold uppercase text-slate-600">
                            ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                          </p>
                          <h3 className="text-sm font-bold uppercase mt-1 tracking-tight text-slate-900">
                            FACULTY CADRE & AADHAAR REGISTRY
                          </h3>
                          <p className="text-[8px] font-sans text-slate-500 font-mono mt-0.5">
                            STATUTORY CADRE RATIO COMPLIANCE (1:2:6)
                          </p>
                        </div>

                        <div className="border border-slate-200 p-2 rounded bg-slate-50/70 font-mono text-[9px] flex justify-between">
                          <div><strong>Institution:</strong> {instName}</div>
                          <div><strong>AICTE ID:</strong> {app.aicteId}</div>
                        </div>

                        <table className="w-full border-collapse border border-slate-300 text-[9px] text-left">
                          <thead className="bg-slate-100 font-semibold">
                            <tr>
                              <th className="border border-slate-300 p-1">Cadre</th>
                              <th className="border border-slate-300 p-1">Req.</th>
                              <th className="border border-slate-300 p-1">Available</th>
                              <th className="border border-slate-300 p-1">Aadhaar Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-300 p-1 font-medium">Professor</td>
                              <td className="border border-slate-300 p-1">02</td>
                              <td className="border border-slate-300 p-1 font-mono text-emerald-700">02</td>
                              <td className="border border-slate-300 p-1 text-emerald-600">Verified</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-1 font-medium">Associate Prof.</td>
                              <td className="border border-slate-300 p-1">04</td>
                              <td className="border border-slate-300 p-1 font-mono text-emerald-700">04</td>
                              <td className="border border-slate-300 p-1 text-emerald-600">Verified</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-300 p-1 font-medium">Assistant Prof.</td>
                              <td className="border border-slate-300 p-1">12</td>
                              <td className="border border-slate-300 p-1 font-mono text-emerald-700">12</td>
                              <td className="border border-slate-300 p-1 text-emerald-600">Verified</td>
                            </tr>
                          </tbody>
                        </table>

                        <p className="text-[9px] text-slate-600">
                          Certified that all faculty qualifications conform to AICTE 7th CPC guidelines and bio-metric registers are maintained.
                        </p>

                        <div className="pt-3 flex justify-between items-end text-[9px] border-t border-slate-200">
                          <div>
                            <p className="font-bold text-slate-900">Registry Date:</p>
                            <p className="font-mono text-slate-700">10-Jan-2025</p>
                          </div>
                          <div className="text-right">
                            <div className="w-16 h-8 border border-dashed border-slate-400 mb-1 flex items-center justify-center text-[7px] text-slate-500 font-mono">
                              [INSTITUTE SEAL]
                            </div>
                            <p className="font-bold">Principal / Director</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (docType.includes('land')) {
                    return (
                      <div className="space-y-3.5 text-[10px] leading-relaxed font-sans text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                          <p className="text-[9px] tracking-widest font-sans font-bold uppercase text-slate-600">
                            DEPARTMENT OF REVENUE & REGISTRATION • GOVERNMENT ARCHIVE
                          </p>
                          <h3 className="text-sm font-bold uppercase mt-1 tracking-tight text-slate-900">
                            REGISTERED TITLE DEED & NA CONVERSION
                          </h3>
                          <p className="text-[8px] font-sans text-slate-500 font-mono mt-0.5">
                            DEED NUMBER: {refNum} • CATEGORY: CONTIGUOUS CAMPUS LAND
                          </p>
                        </div>

                        <p>
                          This is to certify from the official revenue registry that the land described herein has been lawfully conveyed to the sponsoring trust of <strong>"{instName}"</strong> for permanent technical education establishment.
                        </p>

                        <div className="border border-slate-200 p-2.5 rounded bg-slate-50/80 space-y-1 font-mono text-[9px]">
                          <div><strong>Total Contiguous Land:</strong> <span className="font-bold text-blue-900">{land}</span></div>
                          <div><strong>Survey Numbers:</strong> Gat No. 142/1 & 142/2</div>
                          <div><strong>NA Conversion Ref:</strong> REV-NA/PUN/2020/194</div>
                          <div><strong>Encumbrance / Mortgage:</strong> Nil / Free from Liens</div>
                        </div>

                        <p className="text-[9px] text-slate-600">
                          The property constitutes a contiguous land area with registered approach road conforming to AICTE norms.
                        </p>

                        <div className="pt-3 flex justify-between items-end text-[9px] border-t border-slate-200">
                          <div>
                            <p className="font-bold text-slate-900">Execution Date:</p>
                            <p className="font-mono text-slate-700">14-Sep-2019</p>
                          </div>
                          <div className="text-right">
                            <div className="w-20 h-10 border border-dashed border-slate-400 mb-1 flex items-center justify-center text-[7px] text-slate-500 font-mono">
                              [SUB-REGISTRAR SEAL]
                            </div>
                            <p className="font-bold">Sub-Registrar of Assurances</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (docType.includes('fire')) {
                    return (
                      <div className="space-y-3.5 text-[10px] leading-relaxed font-sans text-slate-800">
                        <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                          <p className="text-[9px] tracking-widest font-sans font-bold uppercase text-slate-600">
                            MUNICIPAL FIRE & EMERGENCY RESCUE COMMAND
                          </p>
                          <h3 className="text-sm font-bold uppercase mt-1 tracking-tight text-slate-900">
                            FIRE SAFETY CLEARANCE CERTIFICATE
                          </h3>
                          <p className="text-[8px] font-sans text-slate-500 font-mono mt-0.5">
                            FIRE NOC NO: {refNum} • CLASS: EDUCATIONAL OCCUPANCY
                          </p>
                        </div>

                        <p>
                          Upon comprehensive physical inspection of fire hydrants, smoke detectors, and emergency exits, clearance is granted for institutional operations to <strong>"{instName}"</strong>.
                        </p>

                        <div className="border border-slate-200 p-2.5 rounded bg-slate-50/80 space-y-1 font-mono text-[9px]">
                          <div><strong>Permanent Institute ID:</strong> {app.aicteId}</div>
                          <div><strong>Covered Premises:</strong> Academic Complex & Central Labs</div>
                          <div><strong>Statutory Expiration:</strong> <span className="font-bold text-slate-900">{expiry}</span></div>
                          <div><strong>Emergency Egress:</strong> Dual 2-Meter Staircases</div>
                        </div>

                        <div className="pt-3 flex justify-between items-end text-[9px] border-t border-slate-200">
                          <div>
                            <p className="font-bold text-slate-900">Valid Upto:</p>
                            <p className="font-mono text-emerald-700 font-bold">{expiry}</p>
                          </div>
                          <div className="text-right">
                            <div className="w-16 h-8 border border-dashed border-slate-400 mb-1 flex items-center justify-center text-[7px] text-slate-500 font-mono">
                              [2D QR BARCODE]
                            </div>
                            <p className="font-bold">Chief Fire Officer</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // State Govt / Affiliating University NOC Layout
                  return (
                    <div className="space-y-3.5 text-[10px] leading-relaxed font-sans text-slate-800">
                      <div className="text-center border-b-2 border-slate-800 pb-3 mb-3">
                        <p className="text-[9px] tracking-widest font-sans font-bold uppercase text-slate-600">
                          DIRECTORATE OF TECHNICAL EDUCATION / AFFILIATING UNIVERSITY
                        </p>
                        <h3 className="text-sm font-bold uppercase mt-1 tracking-tight text-slate-900">
                          {selectedDocument?.name || 'STATE GOVERNMENT / UNIVERSITY NOC'}
                        </h3>
                        <p className="text-[8px] font-sans text-slate-500 font-mono mt-0.5">
                          DISPATCH REF NO: {refNum}
                        </p>
                      </div>

                      <p>
                        This is to certify that under Section 13 of the Technical Institutions Act, the institution titled <strong>"{instName}"</strong> has been granted No Objection for Extension of Approval for Academic Year 2025-26.
                      </p>

                      <div className="border border-slate-200 p-2.5 rounded bg-slate-50/80 space-y-1 font-mono text-[9px]">
                        <div><strong>Permanent Institute ID:</strong> {app.aicteId}</div>
                        <div><strong>Jurisdiction:</strong> Western Division / Directorate of Technical Education</div>
                        <div><strong>Campus Location:</strong> {addr}</div>
                        <div><strong>Validity Period:</strong> {expiry}</div>
                      </div>

                      <div className="pt-3 flex justify-between items-end text-[9px] border-t border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">Valid Upto:</p>
                          <p className="font-mono text-rose-600 font-bold">{expiry}</p>
                        </div>
                        <div className="text-right">
                          <div className="w-16 h-8 border border-dashed border-slate-400 mb-1 flex items-center justify-center text-[7px] text-slate-500 font-mono">
                            [OFFICIAL SEAL]
                          </div>
                          <p className="font-bold">Director of Technical Education</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Simulated Bounding Boxes */}
                {showBoundingBoxes &&
                  selectedDocument?.boundingBoxes.map((box) => {
                    const isHigh = box.severity === 'High';
                    const isSelected = activeHighlightId === box.id;

                    return (
                      <div
                        key={box.id}
                        onClick={() => setActiveHighlightId(box.id)}
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.width}%`,
                          height: `${box.height}%`,
                        }}
                        className={`absolute rounded border-2 cursor-pointer transition-all ${
                          isHigh
                            ? 'border-rose-600 bg-rose-500/20 hover:bg-rose-500/30 ring-2 ring-rose-400/40'
                            : 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 ring-2 ring-amber-400/40'
                        } ${isSelected ? 'ring-4 ring-blue-500 animate-pulse' : ''}`}
                      >
                        <span className="absolute -top-4 left-0 text-[8px] font-sans font-bold px-1 rounded bg-slate-900 text-white whitespace-nowrap">
                          {box.label}
                        </span>
                      </div>
                    );
                  })}

                {/* Simulated ELA Forensic Heatmap Overlay */}
                {showElaHeatmap && selectedDocument?.hasElaAnomaly && (
                  <div className="absolute inset-0 bg-purple-950/80 backdrop-blur-2xs flex flex-col items-center justify-center p-6 text-white text-center font-sans">
                    <Sparkles className="w-8 h-8 text-purple-300 animate-bounce" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-purple-200 mt-2">
                      ELA Compression Heatmap Active
                    </h5>
                    <p className="text-[10px] text-purple-300 mt-1 max-w-xs">
                      High-frequency boundary deviation (ELA Score: {selectedDocument.elaScore}) detected on acreage figures.
                      Indicates localized raster editing prior to PDF synthesis.
                    </p>
                    <div className="mt-3 w-48 h-24 rounded border border-purple-400/60 bg-gradient-to-tr from-purple-900 via-rose-600 to-amber-500 opacity-80 flex items-center justify-center text-[9px] font-mono">
                      [Localized ELA Hotspot: Plot 142/2]
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Right Column: Extracted OCR Fields */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Extracted OCR Fields
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                AI OCR Engine v4.2
              </span>
            </div>

            <div className="space-y-2.5">
              {selectedDocument?.status === 'Missing' ? (
                <div className="p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Document Not Provided
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mandatory parameters cannot be extracted because this statutory document was not uploaded in the dossier.
                  </p>
                </div>
              ) : selectedDocument?.extractedFields && selectedDocument.extractedFields.length > 0 ? (
                selectedDocument.extractedFields.map((field, idx) => {
                const isDiscrepancy = field.status === 'discrepancy';
                const isUnverified = field.status === 'unverified';

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs space-y-1 transition-colors ${
                      isDiscrepancy
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                        : isUnverified
                        ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {field.label}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {field.confidence.toFixed(1)}% conf.
                      </span>
                    </div>

                    <p className="font-semibold text-slate-900 dark:text-white font-mono text-[11px] break-words">
                      {field.value}
                    </p>

                    {field.note && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium pt-0.5">
                        ⚠️ {field.note}
                      </p>
                    )}
                  </div>
                );
              })
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-xs text-slate-500">No structured parameters found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLAGS & EVIDENCE TAB */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Anomalies & Statutory Evidence Trail
              </h3>
              <p className="text-xs text-slate-500">
                Strict requirement: Every flag displays issue, document, rule ID, evidence, source, and timestamp
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-mono">
              {app.flags.length} Flags Identified
            </span>
          </div>

          <div className="space-y-3">
            {app.flags.map((flag) => {
              const isExpanded = !!expandedFlagIds[flag.id];

              return (
                <div
                  key={flag.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all"
                >
                  {/* Flag Header Bar */}
                  <div
                    onClick={() => toggleFlagExpand(flag.id)}
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                        {flag.ruleId}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {flag.issue}
                          </h4>
                          <RiskBadge level={flag.severity} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          Document: <span className="font-medium text-slate-700 dark:text-slate-300">{flag.document}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToDocument(flag.documentId, flag.boundingBoxId, flag.document);
                        }}
                        className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a8a] dark:text-blue-400 hover:underline px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{flag.document === 'AICTE Master Database' ? 'View in History' : 'View in document'}</span>
                      </button>

                      <button
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        aria-label="Expand flag details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details Body */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/40 dark:bg-slate-850/40 text-xs">
                      {/* Evidence Container */}
                      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <span>Forensic Evidence Statement</span>
                          <span className="font-mono text-slate-400">Rule: {flag.ruleId}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                          {flag.evidence}
                        </p>
                      </div>

                      {/* Source & Timestamp Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                            Source Engine / Database
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 mt-0.5 block">
                            {flag.source}
                          </span>
                        </div>
                        <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                            Verification Timestamp
                          </span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                            {flag.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleJumpToDocument(flag.documentId, flag.boundingBoxId, flag.document)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a8a] dark:text-blue-400 hover:underline px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-950/40"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect in Document Viewer</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: INSTITUTIONAL HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Timeline of Past Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              1. Historical AICTE Approval Timeline
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6 my-2">
              {app.history.map((hist, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline point */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#1e3a8a] ring-4 ring-white dark:ring-slate-900" />

                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                        Academic Year {hist.academicYear}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {hist.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-600 dark:text-slate-400 pt-1 text-[11px]">
                      <div>
                        Sanctioned Intake: <strong className="text-slate-900 dark:text-white font-mono">{hist.intakeApproved}</strong>
                      </div>
                      <div>
                        Programs: <strong className="text-slate-900 dark:text-white font-mono">{hist.programsCount}</strong>
                      </div>
                      <div>
                        Scrutiny Date: <span className="font-mono">{hist.scrutinyDate}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 pt-1">
                      Observation: {hist.deficiencyNoted}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table: Claimed vs Recorded */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Cross-Verification Comparison: Claimed vs AICTE Recorded Master
              </h3>
              <p className="text-xs text-slate-500">
                Discrepancies exceeding nominal tolerances highlighted for physical scrutiny
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Statutory Parameter</th>
                    <th className="py-3 px-4 font-semibold">Claimed in AY 2026 Application</th>
                    <th className="py-3 px-4 font-semibold">Recorded in AICTE Database</th>
                    <th className="py-3 px-4 font-semibold">Variance / Observation</th>
                    <th className="py-3 px-4 font-semibold text-right">Discrepancy Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {app.comparisonMetrics.map((item, idx) => (
                    <tr
                      key={idx}
                      className={
                        item.isMismatch
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.parameter}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {item.claimedInApplication}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {item.recordedInAicteDb}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {item.variance}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.isMismatch ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Mismatch Flagged</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Synchronized</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL TAB */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Application-Specific Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Immutable, chronological log of all pipeline events and official scrutinies for {app.id}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {app.auditTrail.length} Logged Actions
            </span>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6 my-2">
            {app.auditTrail.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />
                <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.action}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {log.timestamp}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    {log.details}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                    <span>By: {log.user} ({log.role})</span>
                    {log.ipAddress && <span>· IP: {log.ipAddress}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* PDF Report Modal */}
      <PdfReportModal
        application={app}
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />

      {/* Mark as Reviewed Modal */}
      {isReviewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsReviewModalOpen(false); }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 id="review-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Scrutiny Endorsement
                </h3>
                <p className="text-xs text-slate-500">
                  Record official review for {app.institutionName}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Scrutiny Officer Remarks / Directives
              </label>
              <textarea
                rows={4}
                value={officialCommentsInput}
                onChange={(e) => setOfficialCommentsInput(e.target.value)}
                placeholder="Enter official observations, hearing directives, or compliance instructions..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Notice: Updating status to "Reviewed by Official" will commit an immutable log entry to the National Audit Registry.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-lg shadow-xs"
              >
                Endorse & Mark as Reviewed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
