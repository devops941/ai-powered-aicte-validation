import React from 'react';
import { InstitutionApplication } from '../../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { Printer, Download, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getReportPdfUrl } from '../../api';

interface PdfReportModalProps {
  application: InstitutionApplication;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({
  application,
  isOpen,
  onClose,
}) => {
  const { user, showToast } = useApp();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Download real ReportLab PDF from Python backend
    const pdfUrl = getReportPdfUrl(application.id);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `AICTE_DocVerify_${application.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(
      'Report Downloaded',
      `Official EoA Pre-Validation Dossier for ${application.aicteId} downloaded as PDF.`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              AICTE
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Official Pre-Validation Decision-Support Dossier
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Ref: {application.id} · Generated on {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-md shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
          {/* Government / AICTE Formal Letterhead */}
          <div className="border-b-2 border-[#1e3a8a] pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-widest text-[#1e3a8a] dark:text-blue-400 uppercase">
                All India Council for Technical Education (AICTE)
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                DocVerify Pre-Validation Scrutiny Dossier
              </h1>
              <p className="text-xs text-slate-500">
                Statutory Regulatory Body under Ministry of Education, Government of India
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="inline-block px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded text-[11px] font-medium text-amber-800 dark:text-amber-300">
                Internal Scrutiny Dossier
              </div>
              <p className="text-xs text-slate-500">
                Cycle: <strong className="text-slate-700 dark:text-slate-300">AY 2026-2027 (EoA)</strong>
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Mandatory Advisory Notice */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Notice:</span>
              <span>Decision support only. Final decision rests with AICTE officials.</span>
            </div>
            <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">Section 10(k) AICTE Act</span>
          </div>

          {/* Institution Master Card */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Institution Name</span>
              <strong className="text-slate-900 dark:text-white font-medium block mt-0.5">{application.institutionName}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Permanent Institute ID</span>
              <span className="font-mono text-slate-900 dark:text-white block mt-0.5">{application.aicteId}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Category Requested</span>
              <span className="text-slate-900 dark:text-white block mt-0.5">{application.category}</span>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Region & State</span>
              <span className="text-slate-900 dark:text-white block mt-0.5">{application.region}, {application.state}</span>
            </div>
          </div>

          {/* Validation Score & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-medium">Computed Risk Index</span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {application.riskScore}
                  <span className="text-sm font-normal text-slate-500">/100</span>
                </span>
                <RiskBadge level={application.riskLevel} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-medium">Current Scrutiny Status</span>
              <div className="mt-2">
                <StatusBadge status={application.status} size="lg" />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-medium">Identified Flags</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {application.flagsCount}
                </span>
                <span className="text-xs text-slate-500">anomalies flagged across 6 checklists</span>
              </div>
            </div>
          </div>

          {/* Detailed Flags Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-800 pb-1">
              Automated Flags & Evidential Records
            </h4>
            {application.flags.length === 0 ? (
              <div className="p-4 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero statutory or forensic discrepancies observed across submitted dossiers.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {application.flags.map((flag, idx) => (
                  <div
                    key={flag.id}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                          {idx + 1}. [{flag.ruleId}]
                        </span>
                        <strong className="text-slate-900 dark:text-white text-xs">{flag.issue}</strong>
                      </div>
                      <RiskBadge level={flag.severity} size="sm" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Document: </span>
                        <span>{flag.document}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Source: </span>
                        <span>{flag.source}</span>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-white">Evidence: </span>
                      {flag.evidence}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-0.5">
                      Flagged At: {flag.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scrutiny Official Sign-off Block */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px]">Scrutiny Official</p>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end pb-1 font-mono text-slate-700 dark:text-slate-300">
                {application.reviewedBy || user?.name || 'Assigned Scrutiny Officer'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Approval Bureau, AICTE New Delhi</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px]">Competent Authority Countersign</p>
              <div className="h-12 border-b border-dashed border-slate-300 dark:border-slate-700 flex items-end pb-1 font-mono text-slate-700 dark:text-slate-300">
                Dr. Sunita Rao (Director)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Approval & Compliance Cell, AICTE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
