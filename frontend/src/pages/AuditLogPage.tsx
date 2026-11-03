import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, FileSpreadsheet } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { auditLogs, showToast, viewApplicationDetail } = useApp();

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Last 7 Days' | 'This Month'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const thisMonthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Filtered audit logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesUser =
      selectedUserFilter === 'All' || log.user.toLowerCase().includes(selectedUserFilter.toLowerCase());

    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'All' && log.rawTimestamp) {
      const logDate = new Date(log.rawTimestamp);
      if (dateFilter === 'Today') {
        matchesDate =
          logDate.getFullYear() === now.getFullYear() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getDate() === now.getDate();
      } else if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = logDate >= sevenDaysAgo;
      } else if (dateFilter === 'This Month') {
        matchesDate =
          logDate.getFullYear() === now.getFullYear() &&
          logDate.getMonth() === now.getMonth();
      }
    }

    return matchesUser && matchesSearch && matchesDate;
  });

  const handleExportCsv = () => {
    const headers = 'Log ID,Timestamp,User,Role,Action,Application ID,IP Address,Details\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.applicationId}","${l.ipAddress || 'Internal'}","${l.details.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AICTE_DocVerify_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Audit Trail Exported', `Exported ${filteredLogs.length} audit trail records to CSV.`, 'success');
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Official System Audit & Compliance Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable forensic logging of scrutiny determinations, rule modifications, and automated evaluations
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by action, user, or application ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-[#1e3a8a] dark:focus:border-blue-500"
            />
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">User:</span>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Users & System</option>
              <option value="Rajesh Sharma">Rajesh Sharma (Official)</option>
              <option value="Dr. Sunita Rao">Dr. Sunita Rao (Admin)</option>
              <option value="AICTE Automated DocVerify Pipeline">System Pipeline</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 shrink-0">Timeframe:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'All' | 'Today' | 'Last 7 Days' | 'This Month')}
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="All">All Time Records</option>
              <option value="Today">Today ({todayLabel})</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">{thisMonthLabel}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Official / Initiator</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Action Performed</th>
                <th className="py-3 px-4 font-semibold">Application Reference</th>
                <th className="py-3 px-4 font-semibold">Audit Details & Directives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors align-top"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          log.role === 'Admin'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            : log.role === 'Official'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      {/^(EOA|AICTE)-/.test(log.applicationId) ? (
                        <button
                          onClick={() => viewApplicationDetail(log.applicationId)}
                          className="font-mono text-[#1e3a8a] dark:text-blue-400 hover:underline text-xs"
                        >
                          {log.applicationId}
                        </button>
                      ) : (
                        <span className="font-mono text-slate-400 text-xs">{log.applicationId}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                      <p className={`leading-relaxed text-xs ${expandedId === log.id ? '' : 'line-clamp-2'}`}>
                        {log.details}
                      </p>
                      {log.details.length > 100 && (
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-[10px] text-[#1e3a8a] dark:text-blue-400 hover:underline mt-0.5"
                        >
                          {expandedId === log.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
