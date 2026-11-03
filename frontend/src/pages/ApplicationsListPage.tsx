import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskLevel, ApplicationStatus } from '../types';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

export const ApplicationsListPage: React.FC = () => {
  const { applications, viewApplicationDetail, showToast, purgeAllData } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'All' | RiskLevel>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | ApplicationStatus>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'riskDesc' | 'riskAsc' | 'flagsDesc' | 'nameAsc'>('riskDesc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter logic
  const filtered = applications.filter((app) => {
    const matchesSearch =
      searchTerm === '' ||
      app.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.aicteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.state.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = selectedRisk === 'All' || app.riskLevel === selectedRisk;
    const matchesStatus = selectedStatus === 'All' || app.status === selectedStatus;
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;

    return matchesSearch && matchesRisk && matchesStatus && matchesCategory;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'riskDesc') return b.riskScore - a.riskScore;
    if (sortBy === 'riskAsc') return a.riskScore - b.riskScore;
    if (sortBy === 'flagsDesc') return b.flagsCount - a.flagsCount;
    if (sortBy === 'nameAsc') return a.institutionName.localeCompare(b.institutionName);
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    const headers = 'AICTE ID,Institution Name,State,Region,Category,Risk Score,Risk Level,Status,Flags Count,Submission Date\n';
    const rows = sorted
      .map(
        (a) =>
          `"${a.aicteId}","${a.institutionName}","${a.state}","${a.region}","${a.category}",${a.riskScore},"${a.riskLevel}","${a.status}",${a.flagsCount},"${a.submissionDate}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICTE_DocVerify_Applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Registry Exported', `Exported ${sorted.length} records to CSV.`, 'success');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutions EoA Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Complete database of technical institutions submitted for AY 2026-27 Extension of Approval
          </p>
        </div>

        <div className="flex items-center gap-2">
          {applications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to completely clear the database? All submitted dossiers, flags, and audit records will be wiped.")) {
                  purgeAllData();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Purge Database</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or state..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
            />
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Risk:</span>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="Flagged">Flagged</option>
              <option value="No issues found">No issues found</option>
              <option value="Manual Review Required">Manual Review Required</option>
              <option value="Reviewed by Official">Reviewed by Official</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="riskDesc">Highest Risk First</option>
              <option value="riskAsc">Lowest Risk First</option>
              <option value="flagsDesc">Most Flags First</option>
              <option value="nameAsc">Institution Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{sorted.length}</strong> institutions matching filter criteria
          </span>
          {(searchTerm || selectedRisk !== 'All' || selectedStatus !== 'All' || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRisk('All');
                setSelectedStatus('All');
                setSelectedCategory('All');
                setCurrentPage(1);
              }}
              className="text-[#1e3a8a] dark:text-blue-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Institute ID</th>
                <th className="py-3 px-4 font-semibold">Institution Title & Region</th>
                <th className="py-3 px-4 font-semibold">Application Category</th>
                <th className="py-3 px-4 font-semibold">Risk Index</th>
                <th className="py-3 px-4 font-semibold text-center">Flags</th>
                <th className="py-3 px-4 font-semibold">Scrutiny Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {applications.length === 0
                      ? 'No applications found. Click "Initiate New Dossier" to validate an application.'
                      : 'No technical institutions matched your search filter.'}
                  </td>
                </tr>
              ) : (
                paginated.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {app.aicteId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block max-w-sm truncate">
                        {app.institutionName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {app.region} · {app.state}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {app.category.replace('Extension of Approval: ', '')}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={app.riskLevel} score={app.riskScore} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          app.flagsCount > 0
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {app.flagsCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewApplicationDetail(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-[#1e3a8a] text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
