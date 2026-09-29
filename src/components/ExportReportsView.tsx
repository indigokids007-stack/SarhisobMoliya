import React, { useState } from 'react';
import { Expense, Category, AuditLogEntry, ThreeMonthPeriodSettings, AppUser } from '../types';
import { formatUZS, formatShortDate } from '../utils/formatters';
import { 
  FileDown, 
  FileSpreadsheet, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  ShieldAlert,
  Download
} from 'lucide-react';

interface ExportReportsViewProps {
  expenses: Expense[];
  categories: Category[];
  auditLog: AuditLogEntry[];
  settings: ThreeMonthPeriodSettings;
  currentUser: AppUser | null;
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  expenses,
  categories,
  auditLog,
  settings,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [selectedReportType, setSelectedReportType] = useState<
    'current_month' | 'month_1' | 'month_2' | 'month_3' | 'full_3_month' | 'categories' | 'audit'
  >('full_3_month');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const getFilteredData = () => {
    const active = expenses.filter((e) => e.status === 'ACTIVE');
    if (selectedReportType === 'month_1') return active.filter((e) => e.month === 'Month 1');
    if (selectedReportType === 'month_2') return active.filter((e) => e.month === 'Month 2');
    if (selectedReportType === 'month_3') return active.filter((e) => e.month === 'Month 3');
    if (selectedReportType === 'current_month') return active.filter((e) => e.month === 'Month 1');
    return active;
  };

  const handleExportCSV = () => {
    if (selectedReportType === 'audit') {
      const headers = ['Audit ID', 'Timestamp', 'Action', 'Expense ID', 'User Email', 'Details', 'Reason'];
      const rows = auditLog.map((a) => [
        a.id,
        a.timestamp,
        a.action,
        a.expenseId || '',
        a.userEmail,
        `"${(a.newValue || a.oldValue || '').replace(/"/g, '""')}"`,
        `"${(a.reason || '').replace(/"/g, '""')}"`,
      ]);
      downloadCSV([headers, ...rows], `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
      return;
    }

    if (selectedReportType === 'categories') {
      const active = expenses.filter((e) => e.status === 'ACTIVE');
      const catMap = new Map<string, { count: number; total: number }>();
      active.forEach((e) => {
        const cur = catMap.get(e.category) || { count: 0, total: 0 };
        catMap.set(e.category, { count: cur.count + 1, total: cur.total + e.amount });
      });

      const headers = ['Category', 'Transaction Count', 'Total Amount (UZS)'];
      const rows = Array.from(catMap.entries()).map(([cat, val]) => [
        cat,
        val.count,
        val.total,
      ]);
      downloadCSV([headers, ...rows], `category_report_${new Date().toISOString().split('T')[0]}.csv`);
      return;
    }

    const data = getFilteredData();
    const headers = [
      'Expense ID',
      'Date',
      'Time',
      'Month',
      'Category',
      'Description',
      'Amount (UZS)',
      'Payment Method',
      'Responsible Person',
      'Created By',
      'Status',
    ];
    const rows = data.map((e) => [
      e.id,
      e.date,
      e.time,
      e.month,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.paymentMethod,
      e.responsiblePerson,
      e.createdBy,
      e.status,
    ]);

    downloadCSV([headers, ...rows], `expenses_${selectedReportType}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (rows: any[][], filename: string) => {
    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg(`Successfully generated and downloaded ${filename}`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Financial Reports & Data Export
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Generate accounting reports in CSV, Excel-compatible tables, and printable PDF summaries
        </p>
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Select Report Scope Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          1. Select Report Scope & Data
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          <button
            onClick={() => setSelectedReportType('full_3_month')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'full_3_month'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">Entire 3-Month Period</span>
            <span className="text-xs text-slate-400 block mt-1">
              Full consolidated report for Month 1, 2, and 3
            </span>
          </button>

          <button
            onClick={() => setSelectedReportType('month_1')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'month_1'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">{settings.month1.name}</span>
            <span className="text-xs text-slate-400 block mt-1">
              {formatShortDate(settings.month1.startDate)} — {formatShortDate(settings.month1.endDate)}
            </span>
          </button>

          <button
            onClick={() => setSelectedReportType('month_2')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'month_2'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">{settings.month2.name}</span>
            <span className="text-xs text-slate-400 block mt-1">
              {formatShortDate(settings.month2.startDate)} — {formatShortDate(settings.month2.endDate)}
            </span>
          </button>

          <button
            onClick={() => setSelectedReportType('month_3')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'month_3'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">{settings.month3.name}</span>
            <span className="text-xs text-slate-400 block mt-1">
              {formatShortDate(settings.month3.startDate)} — {formatShortDate(settings.month3.endDate)}
            </span>
          </button>

          <button
            onClick={() => setSelectedReportType('categories')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'categories'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">Category Report</span>
            <span className="text-xs text-slate-400 block mt-1">
              Aggregated amounts and transactions per category
            </span>
          </button>

          <button
            onClick={() => setSelectedReportType('audit')}
            className={`p-4 rounded-xl border text-left transition ${
              selectedReportType === 'audit'
                ? 'bg-emerald-600/15 border-emerald-500 text-white'
                : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className="font-bold text-sm block">Full Audit Trail</span>
            <span className="text-xs text-slate-400 block mt-1">
              Immutable creation, edit, and deletion history
            </span>
          </button>

        </div>
      </div>

      {/* Export Action Buttons Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          2. Download or Print
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Download CSV Spreadsheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Excel XLSX (.csv)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>Print PDF Summary</span>
          </button>
        </div>
      </div>

    </div>
  );
};
