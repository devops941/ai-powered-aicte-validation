import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ValidationRule, RiskLevel } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import {
  Sliders,
  Code2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  X,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export const RulesPage: React.FC = () => {
  const { rules, updateRule, addRule, user, showToast } = useApp();

  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState<boolean>(false);

  // New Rule Form State
  const [newRuleId, setNewRuleId] = useState<string>('R-52');
  const [newRuleName, setNewRuleName] = useState<string>('Biometric Attendance & Geofencing Integrity');
  const [newRuleCategory, setNewRuleCategory] = useState<any>('Infrastructure Norms');
  const [newRuleSeverity, setNewRuleSeverity] = useState<RiskLevel>('Medium');
  const [newRuleDescription, setNewRuleDescription] = useState<string>(
    'Verifies daily faculty attendance logs against institution IP geofence and national Aadhaar biometric repository.'
  );
  const [newRuleWeight, setNewRuleWeight] = useState<number>(7);
  const [newRuleYaml, setNewRuleYaml] = useState<string>(`rule_id: R-52
name: Biometric_Geofence_Integrity
target_records:
  - faculty_biometric_daily_punch
  - campus_gps_bounding_box
conditions:
  - min_attendance_percentage: 75.0
  - max_outside_geofence_anomalies: 3
on_failure:
  severity: MEDIUM
  action: request_clarification`);

  // Protect Admin Route
  if (user?.role !== 'Admin') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Restricted Directorate Access
        </h2>
        <p className="text-xs text-slate-500">
          The Regulatory Rules Engine is accessible exclusively to AICTE Approvals Directorate Administrators.
        </p>
      </div>
    );
  }

  const handleOpenYamlEditor = (rule: ValidationRule) => {
    setEditingRule(rule);
    setYamlContent(rule.yamlConfig);
  };

  const handleSaveYaml = () => {
    if (!editingRule) return;
    updateRule(editingRule.id, { yamlConfig: yamlContent });
    setEditingRule(null);
  };

  const handleToggleRuleActive = (rule: ValidationRule) => {
    updateRule(rule.id, { isActive: !rule.isActive });
    showToast(
      'Rule State Changed',
      `Rule ${rule.id} is now ${!rule.isActive ? 'Active' : 'Disabled'}.`,
      'info'
    );
  };

  const handleWeightChange = (ruleId: string, newWeight: number) => {
    updateRule(ruleId, { weight: newWeight });
  };

  const handleCreateNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    const created: ValidationRule = {
      id: newRuleId,
      name: newRuleName,
      category: newRuleCategory,
      description: newRuleDescription,
      severity: newRuleSeverity,
      weight: newRuleWeight,
      isActive: true,
      yamlConfig: newRuleYaml,
      lastUpdated: new Date().toLocaleString('en-IN') + ' IST',
      updatedBy: user.name,
    };

    addRule(created);
    setIsAddRuleModalOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            AICTE Regulatory Rules & Heuristic Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure automated validation thresholds, severity weights, and YAML heuristics for EoA statutory checking
          </p>
        </div>

        <button
          onClick={() => setIsAddRuleModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                rule.isActive
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Header & Toggle */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {rule.id}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {rule.category}
                    </span>
                  </div>

                  {/* Active / Inactive Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {rule.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => handleToggleRuleActive(rule)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        rule.isActive ? 'bg-[#1e3a8a]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                      aria-label="Toggle rule activation"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          rule.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {rule.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                  {rule.description}
                </p>
              </div>

              {/* Severity & Weight Slider */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Default Severity:</span>
                    <RiskBadge level={rule.severity} size="sm" showIcon={false} />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Weight: <strong className="text-slate-900 dark:text-white">{rule.weight}/10</strong>
                  </div>
                </div>

                {/* Weight slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Advisory (1)</span>
                    <span>Critical Penalty (10)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rule.weight}
                    disabled={!rule.isActive}
                    onChange={(e) => handleWeightChange(rule.id, parseInt(e.target.value))}
                    className="w-full accent-[#1e3a8a] cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="truncate">Updated {rule.lastUpdated}</span>

                  <button
                    onClick={() => handleOpenYamlEditor(rule)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs text-[#1e3a8a] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Edit YAML</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code-Style YAML Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-white">
                  YAML Heuristic Definition: {editingRule.id} ({editingRule.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Code Editor Body */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950">
              <div className="text-[11px] text-slate-500 pb-1 border-b border-slate-800/80">
                # AICTE Approval Process Handbook (APH) Declarative Specification
              </div>
              <textarea
                rows={14}
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                className="w-full bg-slate-900/90 text-emerald-400 border border-slate-800 rounded p-3 font-mono text-xs leading-relaxed focus:outline-hidden focus:border-blue-500"
                spellCheck={false}
              />
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Valid YAML syntax will hot-reload across active scrutiny evaluations.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveYaml}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#1e3a8a] hover:bg-blue-700 text-white font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Rule YAML</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Rule Modal */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Register New AICTE Validation Rule
              </h3>
              <button
                onClick={() => setIsAddRuleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rule ID (e.g. R-52)
                  </label>
                  <input
                    type="text"
                    value={newRuleId}
                    onChange={(e) => setNewRuleId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Regulatory Category
                  </label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="Document Validity">Document Validity</option>
                    <option value="Identity Consistency">Identity Consistency</option>
                    <option value="Forensic Integrity">Forensic Integrity</option>
                    <option value="Authority Cross-Check">Authority Cross-Check</option>
                    <option value="Infrastructure Norms">Infrastructure Norms</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rule Designation / Name
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Statutory Description & Justification
                </label>
                <textarea
                  rows={2}
                  value={newRuleDescription}
                  onChange={(e) => setNewRuleDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value as RiskLevel)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight Penalty (1 - 10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRuleWeight}
                    onChange={(e) => setNewRuleWeight(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  YAML Declaration
                </label>
                <textarea
                  rows={5}
                  value={newRuleYaml}
                  onChange={(e) => setNewRuleYaml(e.target.value)}
                  className="w-full p-2 bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 rounded-md"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRuleModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#1e3a8a] text-white font-semibold shadow-xs"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
