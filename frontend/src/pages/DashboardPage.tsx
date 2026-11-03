import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { applications, viewApplicationDetail, setCurrentView } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<
    'All' | 'High' | 'Medium' | 'Low' | 'Manual Review Required'
  >('All');

  // Metrics calculation
  const totalApps = applications.length;
  const highRiskCount = applications.filter((a) => a.riskLevel === 'High').length;
  const mediumRiskCount = applications.filter((a) => a.riskLevel === 'Medium').length;
  const lowRiskCount = applications.filter((a) => a.riskLevel === 'Low').length;

  // Chart data 1: Most common issues (aggregated from live flags)
  const issueCounts: Record<string, number> = {};
  applications.forEach((app) => {
    (app.flags || []).forEach((flag) => {
      const issueName = flag.issue || flag.document || 'General Issue';
      issueCounts[issueName] = (issueCounts[issueName] || 0) + 1;
    });
  });

  const palette = ['#ef4444', '#f59e0b', '#f97316', '#dc2626', '#eab308'];
  const commonIssuesData = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], idx) => ({
      name,
      count,
      fill: palette[idx % palette.length],
    }));

  // Chart data 2: Risk level distribution
  const riskDistributionData = [
    { name: 'High Risk', value: highRiskCount, color: '#dc2626' },
    { name: 'Medium Risk', value: mediumRiskCount, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRiskCount, color: '#16a34a' },
  ];

  const highPct = totalApps > 0 ? ((highRiskCount / totalApps) * 100).toFixed(1) : '0.0';
  const medPct = totalApps > 0 ? ((mediumRiskCount / totalApps) * 100).toFixed(1) : '0.0';
  const lowPct = totalApps > 0 ? ((lowRiskCount / totalApps) * 100).toFixed(1) : '0.0';

  // Filtered applications for "Applications needing attention"
  const filteredApps = applications
    .filter((app) => {
      if (selectedFilter === 'All') return true;
      if (selectedFilter === 'Manual Review Required') {
        return app.status === 'Manual Review Required';
      }
      return app.riskLevel === selectedFilter;
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header / Welcome Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pre-Validation Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            AI-assisted decision-support for Extension of Approval (EoA) statutory applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('new-application')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 rounded-lg shadow-xs transition-colors"
          >
            <span>+ Initiate New Validation</span>
          </button>
        </div>
      </div>

      {/* Row of 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Applications
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {totalApps}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              Active Dossiers
            </span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Across registered technical institutions
          </p>
        </div>

        {/* High Risk */}
        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
              High Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-700 dark:text-red-400 tabular-nums">
              {highRiskCount}
            </span>
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
              {highPct}% of submissions
            </span>
          </div>
          <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
            Critical flags / suspected forgery
          </p>
        </div>

        {/* Medium Risk */}
        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Medium Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-800 dark:text-amber-400 tabular-nums">
              {mediumRiskCount}
            </span>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
              {medPct}% of submissions
            </span>
          </div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-1">
            Minor anomalies & review required
          </p>
        </div>

        {/* Low Risk */}
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Low Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
              {lowRiskCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              {lowPct}% clean track
            </span>
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
            Full statutory concordance
          </p>
        </div>
      </div>

      {/* Two Charts Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Most Common Issues */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1e3a8a] dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Most Common Issues Flagged
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Current AY Cycle</span>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={commonIssuesData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <RechartsTooltip
                  formatter={(val: any) => [`${val} institutions`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {commonIssuesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Breakdown across expired NOCs, name discrepancies, tampering, and QR validation errors
          </p>
        </div>

        {/* Chart 2: Risk Level Distribution */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#1e3a8a] dark:text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Risk Level Distribution
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Total: {totalApps}</span>
          </div>

          <div className="h-64 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: any) => [
                    `${val} (${totalApps > 0 ? ((Number(val) / totalApps) * 100).toFixed(1) : '0.0'}%)`,
                    'Institutions',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    color: '#f8fafc',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Clean Legend */}
          <div className="flex items-center justify-center gap-6 text-xs mt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-slate-600 dark:text-slate-400">High Risk ({highPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">Medium Risk ({medPct}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-600 dark:text-slate-400">Low Risk ({lowPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Applications Needing Attention */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Table Header with Quick Filter Chips */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Applications Needing Attention
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ranked dynamically by composite risk score and flag count
            </p>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['All', 'High', 'Medium', 'Low', 'Manual Review Required'] as const).map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setSelectedFilter(filterOption)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    selectedFilter === filterOption
                      ? 'bg-white dark:bg-slate-700 text-[#1e3a8a] dark:text-blue-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {filterOption}
                </button>
              )
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">AICTE ID</th>
                <th className="py-3 px-4 font-semibold">Institution Name</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Risk Score</th>
                <th className="py-3 px-4 font-semibold text-center">Flags</th>
                <th className="py-3 px-4 font-semibold">Scrutiny Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No applications matched the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {app.aicteId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white block max-w-xs truncate">
                        {app.institutionName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {app.state} · {app.region.split('(')[0].trim()}
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1e3a8a] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* View All Applications Link */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={() => setCurrentView('applications')}
            className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Applications in Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
