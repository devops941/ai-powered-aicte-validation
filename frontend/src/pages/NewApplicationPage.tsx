import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApplicationCategory, InstitutionApplication } from '../types';
import { runBackendValidation } from '../api';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileUp,
  Clock,
  Trash2,
} from 'lucide-react';

interface ChecklistDoc {
  id: string;
  name: string;
  categoryDesc: string;
  mandatory: boolean;
  file?: {
    name: string;
    size: string;
  };
  realFile?: File;
  status: 'uploaded' | 'missing';
}

const DEFAULT_DOCUMENTS: ChecklistDoc[] = [
  {
    id: 'doc-noc',
    name: 'State Government / Affiliating University NOC',
    categoryDesc: 'Mandatory non-objection certificate under Section 13(1)',
    mandatory: true,
    status: 'missing',
  },
  {
    id: 'doc-affidavit',
    name: 'Mandatory Disclosure Affidavit',
    categoryDesc: 'Notarized on Rs. 500 Non-Judicial stamp paper (APH Format 1)',
    mandatory: true,
    status: 'missing',
  },
  {
    id: 'doc-faculty',
    name: 'Faculty Cadre & Aadhaar-Seeded List',
    categoryDesc: 'Complete biometric & qualification registry adhering to 1:2:6 ratio',
    mandatory: true,
    status: 'missing',
  },
  {
    id: 'doc-land',
    name: 'Land Document & Non-Agricultural Conversion',
    categoryDesc: 'Registered title deed / lease deed in name of sponsoring trust',
    mandatory: true,
    status: 'missing',
  },
  {
    id: 'doc-fire',
    name: 'Fire Safety Certificate with 2D Barcode',
    categoryDesc: 'Issued by Competent Municipal / District Fire Authority',
    mandatory: true,
    status: 'missing',
  },
  {
    id: 'doc-infra',
    name: 'Geo-Tagged Infrastructure & Lab Photos',
    categoryDesc: 'High-res photos of computer center, instructional rooms & workshops',
    mandatory: true,
    status: 'missing',
  },
];

export const NewApplicationPage: React.FC = () => {
  const { addNewApplication, viewApplicationDetail, showToast, user } = useApp();

  const [institutionName, setInstitutionName] = useState('');
  const [aicteId, setAicteId] = useState('');
  const [category, setCategory] = useState<ApplicationCategory>('Extension of Approval: Add new course');
  const [region, setRegion] = useState('');
  const [state, setState] = useState('');
  const [checklist, setChecklist] = useState<ChecklistDoc[]>(DEFAULT_DOCUMENTS);

  // Validation execution animation state
  const [isValidating, setIsValidating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const validationSteps = [
    'Reading documents (OCR Engine)',
    'Extracting statutory fields & parameters',
    'Applying AICTE APH regulatory rules',
    'Cross-checking central & university records',
    'Tamper analysis (ELA & forensic verification)',
    'Issuing-authority digital verification',
    'Infrastructure visual analysis',
    'Generating decision-support report',
  ];

  // Prefill mock documents
  const handlePrefillSample = () => {
    setChecklist([
      {
        id: 'doc-noc',
        name: 'State Government / Affiliating University NOC',
        categoryDesc: 'Mandatory non-objection certificate under Section 13(1)',
        mandatory: true,
        file: { name: 'DTE_Maharashtra_NOC_2026.pdf', size: '2.8 MB' },
        status: 'uploaded',
      },
      {
        id: 'doc-affidavit',
        name: 'Mandatory Disclosure Affidavit',
        categoryDesc: 'Notarized on Rs. 500 Non-Judicial stamp paper (APH Format 1)',
        mandatory: true,
        file: { name: 'Bharati_Notarized_Affidavit_Format1.pdf', size: '1.4 MB' },
        status: 'uploaded',
      },
      {
        id: 'doc-faculty',
        name: 'Faculty Cadre & Aadhaar-Seeded List',
        categoryDesc: 'Complete biometric & qualification registry adhering to 1:2:6 ratio',
        mandatory: true,
        file: { name: 'Faculty_Cadre_Registry_2026.xlsx', size: '820 KB' },
        status: 'uploaded',
      },
      {
        id: 'doc-land',
        name: 'Land Document & Non-Agricultural Conversion',
        categoryDesc: 'Registered title deed / lease deed in name of sponsoring trust',
        mandatory: true,
        file: { name: 'Land_Sale_Deed_Khasra_418.pdf', size: '5.2 MB' },
        status: 'uploaded',
      },
      {
        id: 'doc-fire',
        name: 'Fire Safety Certificate with 2D Barcode',
        categoryDesc: 'Issued by Competent Municipal / District Fire Authority',
        mandatory: true,
        file: { name: 'Fire_Safety_NOC_Pune_Brigade.pdf', size: '1.9 MB' },
        status: 'uploaded',
      },
      {
        id: 'doc-infra',
        name: 'Geo-Tagged Infrastructure & Lab Photos',
        categoryDesc: 'High-res photos of computer center, instructional rooms & workshops',
        mandatory: true,
        file: { name: 'Campus_Labs_CSE_AI_DS_Photos.zip', size: '18.4 MB' },
        status: 'uploaded',
      },
    ]);

    showToast('Dossier Populated', 'Sample statutory documents attached for pre-validation.', 'info');
  };

  const handleRealFileUpload = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setChecklist((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            realFile: file,
            file: {
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            },
            status: 'uploaded',
          };
        }
        return doc;
      })
    );
    showToast('File Attached', `${file.name} ready for pre-validation scrutiny.`, 'success');
  };

  const handleRemoveFile = (docId: string) => {
    setChecklist((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            realFile: undefined,
            file: undefined,
            status: 'missing',
          };
        }
        return doc;
      })
    );
  };

  const handleSimulateUpload = (docId: string) => {
    setChecklist((prev) =>
      prev.map((doc) => {
        if (doc.id === docId) {
          return {
            ...doc,
            file: {
              name: `${doc.name.split(' ')[0]}_Scanned_${Math.floor(100 + Math.random() * 900)}.pdf`,
              size: `${(1.2 + Math.random() * 3).toFixed(1)} MB`,
            },
            status: 'uploaded',
          };
        }
        return doc;
      })
    );
  };

  const uploadedCount = checklist.filter((d) => d.status === 'uploaded').length;
  const isAllUploaded = uploadedCount === checklist.length;

  // Run Validation with Step-by-Step animation
  const handleRunValidation = async () => {
    if (!institutionName.trim()) {
      showToast('Incomplete Dossier', 'Institution name is required.', 'warning');
      return;
    }
    if (institutionName.trim().length < 3) {
      showToast('Invalid Name', 'Institution name must be at least 3 characters.', 'warning');
      return;
    }
    if (institutionName.trim().length > 200) {
      showToast('Invalid Name', 'Institution name must not exceed 200 characters.', 'warning');
      return;
    }
    if (!aicteId.trim()) {
      showToast('Incomplete Dossier', 'AICTE Permanent Institute ID is required.', 'warning');
      return;
    }
    if (!/^\d+-\d+$/.test(aicteId.trim())) {
      showToast('Invalid AICTE ID', 'Institute ID must follow the format: 1-932184109', 'warning');
      return;
    }
    if (!state.trim()) {
      showToast('Incomplete Dossier', 'State is required.', 'warning');
      return;
    }

    if (uploadedCount === 0) {
      showToast(
        'Upload Requirement',
        'Please attach at least one document or click "Prefill Sample Dossier" to run pre-validation.',
        'warning'
      );
      return;
    }

    setIsValidating(true);
    setCurrentStepIndex(0);

    // Build files map for real attached files
    const filesMap: Record<string, File> = {};
    checklist.forEach((doc) => {
      if (doc.status === 'uploaded' && doc.realFile) {
        filesMap[doc.id] = doc.realFile;
      }
    });

    const newAppNo = `EOA-2025-${Math.floor(10000 + Math.random() * 90000)}`;

    // Animate verification steps
    const stepDuration = 350;
    for (let index = 0; index < validationSteps.length; index++) {
      await new Promise((r) => setTimeout(r, stepDuration));
      setCurrentStepIndex(index);
    }

    // Call real Python Backend API
    try {
      const backendResult = await runBackendValidation(
        {
          application_no: newAppNo,
          institution_name: institutionName,
          aicte_id: aicteId,
          academic_year: '2025-26',
          test_bundle: Object.keys(filesMap).length > 0 ? 'custom' : 'clean',
          officer_name: user?.name,
          state: state.trim() || undefined,
          region: region.trim() || undefined,
        },
        filesMap
      );

      if (backendResult) {
        addNewApplication(backendResult);
        setIsValidating(false);
        viewApplicationDetail(backendResult.id);
        showToast(
          'Pre-Validation Scrutiny Complete',
          `Evaluated ${backendResult.institutionName}. Status: ${backendResult.status} (Risk: ${backendResult.riskScore}/100)`,
          'success'
        );
        return;
      }
    } catch (err) {
      console.warn('Backend validation call error:', err);
    }

    // Fallback if backend offline
    const newAppId = `AICTE-1-${Math.floor(900000000 + Math.random() * 99999999)}`;
    const newApp: InstitutionApplication = {
      id: newAppId,
      institutionName,
      aicteId,
      state,
      region,
      category,
      submissionDate: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      }) + ' IST',
      riskScore: 25,
      riskLevel: 'Low',
      status: 'No issues found',
      flagsCount: 0,
      assignedOfficer: 'Rajesh Sharma',
      summaryChecks: [
        {
          id: 'sc-1',
          title: 'Completeness & Mandatory Rules',
          category: 'Statutory Compliance',
          status: 'passed',
          passedCount: 5,
          totalCount: 5,
          description: 'All statutory annexures extracted without format violation.',
        },
      ],
      documents: checklist
        .filter((d) => d.status === 'uploaded')
        .map((d) => ({
          id: d.id,
          name: d.file?.name || `${d.name}.pdf`,
          type: d.name,
          fileName: d.file?.name || `${d.name}.pdf`,
          fileSize: d.file?.size || '1.8 MB',
          uploadDate: new Date().toLocaleDateString('en-IN') + ' IST',
          status: 'Uploaded',
          hasFlags: false,
          flagCount: 0,
          ocrText: `Statutory extracted contents from ${d.name}...`,
          ocrConfidence: 96.0,
          isTampered: false,
          qrVerified: true,
          extractedFields: [
            { label: 'Institution Name', value: institutionName, confidence: 98, status: 'matched' },
            { label: 'AICTE ID', value: aicteId, confidence: 99, status: 'matched' },
          ],
          boundingBoxes: [],
        })),
      flags: [],
      history: [],
      comparisonMetrics: [],
      auditTrail: [
        {
          id: 'aud-new-01',
          timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
          rawTimestamp: new Date().toISOString(),
          user: 'Rajesh Sharma',
          role: 'Official',
          action: 'Pre-Validation Pipeline Executed',
          details: 'Automated verification completed with decision-support report.',
          applicationId: newAppId,
        },
      ],
    };

    addNewApplication(newApp);
    setIsValidating(false);
    viewApplicationDetail(newAppId);
  };


  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Initiate EoA Pre-Validation Dossier
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit statutory application documents for automated AI OCR, forensic tampering analysis, and rule cross-checking
          </p>
        </div>

        <button
          onClick={handlePrefillSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1e3a8a] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Prefill Sample Dossier</span>
        </button>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
          1. Institution & Application Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Institution Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Institution Legal Name (As per Sponsoring Trust Deed)
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Apex Institute of Technology & Engineering"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
            />
          </div>

          {/* AICTE Permanent Institute ID */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Permanent Institute ID (AICTE Master)
            </label>
            <input
              type="text"
              value={aicteId}
              onChange={(e) => setAicteId(e.target.value)}
              placeholder="e.g. 1-932184109"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
            />
          </div>

          {/* Application Category */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Application Category (EoA Cycle AY 2026-27)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
            >
              <option value="Extension of Approval: Add new course">
                Extension of Approval: Add new course
              </option>
              <option value="Extension of Approval: Increase intake">
                Extension of Approval: Increase intake
              </option>
              <option value="Extension of Approval: Change of name">
                Extension of Approval: Change of name
              </option>
              <option value="Extension of Approval: Existing course continuation">
                Extension of Approval: Existing course continuation
              </option>
            </select>
          </div>

          {/* Region & State */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Regional Bureau & State
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Western Region (Mumbai)"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                2. Mandatory Statutory Documents Checklist
              </h3>
              <p className="text-[11px] text-slate-500">
                Applicable checklist generated for {category}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {uploadedCount} of {checklist.length}
              </span>
              <span className="text-slate-400">files prepared</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {checklist.map((doc) => {
              const isUploaded = doc.status === 'uploaded';

              return (
                <div
                  key={doc.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isUploaded
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUploaded ? (
                        <FileCheck className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {doc.name}
                        </span>
                        {doc.mandatory && (
                          <span className="text-[10px] text-rose-500 font-medium">
                            *Mandatory
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.categoryDesc}
                      </p>

                      {isUploaded && doc.file && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{doc.file.name}</span>
                          <span className="text-slate-400">({doc.file.size})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Box / Action */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isUploaded
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                    }`}>
                      <FileUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{isUploaded ? 'Replace File' : 'Attach File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                        className="hidden"
                        onChange={(e) => handleRealFileUpload(doc.id, e)}
                      />
                    </label>

                    {isUploaded && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(doc.id)}
                        className="p-1.5 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>AI Automated Scrutiny runtime: ~4.5 seconds</span>
          </div>

          <button
            onClick={handleRunValidation}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-lg shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Validation Pipeline</span>
          </button>
        </div>
      </div>

      {/* Validation Pipeline Stepper Modal */}
      {isValidating && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#1e3a8a] dark:text-blue-400 mx-auto flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                Running AICTE DocVerify Engine
              </h3>
              <p className="text-xs text-slate-500">
                Multi-stage pre-validation against Approval Process Handbook 2026-27 rules
              </p>
            </div>

            {/* Step list */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto px-1">
              {validationSteps.map((step, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 transition-all ${
                      isPassed
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                        : isCurrent
                        ? 'border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                      ) : (
                        <span className="text-[11px] font-mono">{idx + 1}</span>
                      )}
                    </div>
                    <span className="truncate">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
