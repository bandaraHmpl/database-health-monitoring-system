import axios from 'axios';
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Play,
  Terminal,
  Loader2,
  Zap,
  RotateCcw,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Database
} from 'lucide-react';

import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface ScanResponse {
  issues: any[];
  suggestions: string[];
  queryEfficiency: number;
  schemaNormality: number;
  indexCoverage: number;
  summary: {
    healthScore: number;
    totalTables: number;
    activeIssues: number;
    insights: number;
  };
  tables: any[];
  tableHealth: any[];
}

export default function ScanDatabase() {

  const [isScanning, setIsScanning] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [logs, setLogs] =
    useState<LogEntry[]>([]);

  const [activeTab, setActiveTab] =
    useState<'summary' | 'issues' | 'suggestions'>('summary');

  const [scanData, setScanData] =
    useState<ScanResponse | null>(null);

  const [scanCompleted, setScanCompleted] =
    useState(false);

  // =========================
  // LOGS
  // =========================

  const addLog = (
    type: 'info' | 'success' | 'warning' | 'error',
    message: string
  ) => {

    const log: LogEntry = {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString(),
      type,
      message
    };

    setLogs(prev =>
      [log, ...prev].slice(0, 100)
    );
  };

  // =========================
  // START SCAN
  // =========================

  const startScan = async () => {

    if (isScanning) return;

    setProgress(0);
    setLogs([]);
    setScanCompleted(false);
    setScanData(null);

    setIsScanning(true);

    addLog(
      'info',
      'Starting database analysis...'
    );

    const interval = setInterval(() => {

      setProgress(prev => {

        if (prev >= 90) return 90;

        return prev + 10;
      });

    }, 300);

    try {

      const res =
        await axios.get(
          'http://localhost:8080/scan'
        );

      clearInterval(interval);

      setProgress(100);

      setScanData({
        issues:
          res.data.issues || [],

        suggestions:
          res.data.suggestions || [],

        queryEfficiency:
          res.data.queryEfficiency || 0,

        schemaNormality:
          res.data.schemaNormality || 0,

        indexCoverage:
          res.data.indexCoverage || 0,

        summary:
          res.data.summary || {
            healthScore: 0,
            totalTables: 0,
            activeIssues: 0,
            insights: 0
          },

        tables:
          res.data.tables || [],

        tableHealth:
          res.data.tableHealth || []
      });

      setScanCompleted(true);

      addLog(
        'success',
        `Database scan completed - Score: ${res.data.summary?.healthScore || 0}/100`
      );

      window.dispatchEvent(
        new Event('refreshDashboard')
      );

    } catch (err) {

      clearInterval(interval);

      console.error(err);

      addLog(
        'error',
        'Database scan failed'
      );

    } finally {

      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }
  };

  // =========================
  // DOWNLOAD LOGS
  // =========================

  const downloadLogs = () => {

    const text =
      logs
        .map(
          l =>
            `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`
        )
        .join('\n');

    const blob =
      new Blob([text], {
        type: 'text/plain'
      });

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement('a');

    a.href = url;

    a.download =
      'scan-logs.txt';

    a.click();

    URL.revokeObjectURL(url);
  };

  // =========================
  // PDF
  // =========================

  const generatePDF = () => {

    if (!scanData) return;

    const doc =
      new jsPDF();

    const margin = 20;

    const pageWidth =
      doc.internal.pageSize.getWidth();

    doc.setFontSize(22);

    doc.text(
      'Database Health Report',
      margin,
      25
    );

    doc.setFontSize(16);

    doc.text(
      'Summary',
      margin,
      45
    );

    doc.setFontSize(11);

    doc.text(
      `Overall Health Score: ${scanData.summary.healthScore}/100`,
      margin,
      58
    );

    doc.text(
      `Total Tables: ${scanData.summary.totalTables}`,
      margin,
      66
    );

    doc.text(
      `Active Issues: ${scanData.summary.activeIssues}`,
      margin,
      74
    );

    doc.text(
      `Healthy Tables: ${scanData.summary.insights}`,
      margin,
      82
    );

    doc.text(
      `Query Efficiency: ${scanData.queryEfficiency}%`,
      margin,
      92
    );

    doc.text(
      `Schema Normality: ${scanData.schemaNormality}%`,
      margin,
      100
    );

    doc.text(
      `Index Coverage: ${scanData.indexCoverage}%`,
      margin,
      108
    );

    let currentY = 125;

    doc.setFontSize(16);

    doc.text(
      'Issues',
      margin,
      currentY
    );

    currentY += 10;

    if (scanData.issues.length > 0) {

      autoTable(doc, {
        startY: currentY,

        margin: {
          left: margin,
          right: margin
        },

        head: [['Issue', 'Severity']],

        body:
          scanData.issues.map(
            issue => [
              issue.title,
              issue.severity
            ]
          ),

        styles: {
          fontSize: 10,
          cellPadding: 4
        },

        headStyles: {
          fillColor: [37, 99, 235]
        }
      });

      currentY =
        (doc as any)
          .lastAutoTable
          .finalY + 20;

    } else {

      doc.text(
        'No issues found',
        margin,
        currentY
      );

      currentY += 20;
    }

    doc.setFontSize(16);

    doc.text(
      'Suggestions',
      margin,
      currentY
    );

    currentY += 10;

    scanData.suggestions.forEach(
      (s, i) => {

        const splitSuggestion =
          doc.splitTextToSize(
            `${i + 1}. ${s}`,
            pageWidth - margin * 2
          );

        doc.setFontSize(11);

        doc.text(
          splitSuggestion,
          margin,
          currentY
        );

        currentY +=
          splitSuggestion.length * 7;
      }
    );

    const pageHeight =
      doc.internal.pageSize.getHeight();

    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      margin,
      pageHeight - 10
    );

    doc.save(
      'database-health-report.pdf'
    );
  };

  // =========================
  // UI
  // =========================

  return (

    <div className="space-y-8 max-w-[1600px] mx-auto">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">

            Health Scanner

          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-1">

            Execute deep-level heuristic analysis of schema and data integrity.

          </p>

        </div>

        <div className="flex gap-3">

          <button

            onClick={() => {

              setProgress(0);

              setLogs([]);

              setScanCompleted(false);

              setScanData(null);

            }}

            className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-all"
          >

            <RotateCcw
              size={18}
              className="text-slate-700 dark:text-slate-300"
            />

          </button>

          <button

            onClick={startScan}

            disabled={isScanning}

            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all",

              isScanning
                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >

            {isScanning
              ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )
              : (
                <Play size={18} />
              )
            }

            {isScanning
              ? "SCANNING..."
              : "START ANALYZER"
            }

          </button>

        </div>

      </div>

      {/* MAIN */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* LEFT */}

        <div className="xl:col-span-2 space-y-6">

          {/* PROGRESS */}

          <div className="glass-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">

            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">

              <Activity
                size={20}
                className="text-blue-500"
              />

              Current Progress

            </h3>

            <div className="flex justify-between mb-3">

              <span className="text-sm font-bold text-slate-900 dark:text-white">

                {progress}%

              </span>

              <span className="text-sm text-slate-500 dark:text-slate-400">

                {isScanning
                  ? 'Analyzing...'
                  : progress === 100
                    ? 'Completed'
                    : 'Ready'
                }

              </span>

            </div>

            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">

              <motion.div

                animate={{
                  width: `${progress}%`
                }}

                className={cn(
                  "h-full",

                  progress === 100
                    ? "bg-emerald-500"
                    : "bg-blue-600"
                )}
              />

            </div>

          </div>

          {/* RESULTS */}

          {scanCompleted && scanData && (

            <>

              <div className="grid grid-cols-3 gap-6">

                <div className="glass-card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">

                  <Database
                    size={24}
                    className="mx-auto text-blue-500 mb-2"
                  />

                  <p className="text-2xl font-bold text-slate-900 dark:text-white">

                    {scanData.summary.totalTables}

                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Tables Indexed

                  </p>

                </div>

                <div className="glass-card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">

                  <AlertTriangle
                    size={24}
                    className="mx-auto text-amber-500 mb-2"
                  />

                  <p className="text-2xl font-bold text-slate-900 dark:text-white">

                    {scanData.summary.activeIssues}

                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Issues Found

                  </p>

                </div>

                <div className="glass-card p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">

                  <CheckCircle2
                    size={24}
                    className="mx-auto text-emerald-500 mb-2"
                  />

                  <p className="text-2xl font-bold text-slate-900 dark:text-white">

                    {scanData.summary.healthScore}%

                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Health Score

                  </p>

                </div>

              </div>

              {/* TABS */}

              <div className="glass-card flex flex-col min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">

                <div className="border-b border-slate-100 dark:border-slate-800 px-6">

                  <div className="flex gap-8">

                    <TabButton
                      active={activeTab === 'summary'}
                      onClick={() =>
                        setActiveTab('summary')
                      }
                    >
                      Summary
                    </TabButton>

                    <TabButton
                      active={activeTab === 'issues'}
                      onClick={() =>
                        setActiveTab('issues')
                      }
                    >
                      Issues ({scanData.issues.length})
                    </TabButton>

                    <TabButton
                      active={activeTab === 'suggestions'}
                      onClick={() =>
                        setActiveTab('suggestions')
                      }
                    >
                      Suggestions ({scanData.suggestions.length})
                    </TabButton>

                  </div>

                </div>

                <div className="p-8 flex-1">

                  {/* SUMMARY */}

                  {activeTab === 'summary' && (

                    <div className="space-y-6">

                      <Metric
                        label="Query Efficiency"
                        value={scanData.queryEfficiency}
                        color="bg-blue-500"
                      />

                      <Metric
                        label="Schema Normality"
                        value={scanData.schemaNormality}
                        color="bg-emerald-500"
                      />

                      <Metric
                        label="Index Coverage"
                        value={scanData.indexCoverage}
                        color="bg-purple-500"
                      />

                      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">

                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">

                          Overall Assessment

                        </p>

                        <p className="text-sm text-blue-800 dark:text-blue-300">

                          {scanData.summary.healthScore >= 80
                            ? "Excellent - Database is healthy!"
                            : scanData.summary.healthScore >= 60
                              ? "Good - Some improvements needed"
                              : scanData.summary.healthScore >= 40
                                ? "Fair - Requires attention"
                                : "Critical - Immediate action required"
                          }

                        </p>

                      </div>

                    </div>
                  )}

                  {/* ISSUES */}

                  {activeTab === 'issues' && (

                    <div className="space-y-3">

                      {scanData.issues.length === 0 ? (

                        <div className="text-center text-slate-500 dark:text-slate-400 py-20">

                          <CheckCircle2
                            size={40}
                            className="mx-auto text-emerald-500 mb-3"
                          />

                          No issues found

                        </div>

                      ) : (

                        scanData.issues.map(
                          (issue, i) => (

                            <div

                              key={i}

                              className={cn(
                                "p-4 rounded-xl border flex items-center gap-3",

                                issue.severity === "Critical"
                                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                                  : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
                              )}
                            >

                              <AlertTriangle

                                size={18}

                                className={
                                  issue.severity === "Critical"
                                    ? "text-red-500"
                                    : "text-amber-500"
                                }
                              />

                              <div className="flex-1">

                                <p className="font-bold text-slate-800 dark:text-white">

                                  {issue.title}

                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400">

                                  {issue.severity} issue detected

                                </p>

                              </div>

                              <span

                                className={cn(
                                  "text-xs px-2 py-1 rounded",

                                  issue.severity === "Critical"
                                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"
                                    : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                )}
                              >

                                {issue.severity}

                              </span>

                            </div>
                          )
                        )
                      )}

                    </div>
                  )}

                  {/* SUGGESTIONS */}

                  {activeTab === 'suggestions' && (

                    <div className="space-y-3">

                      {scanData.suggestions.length === 0 ? (

                        <div className="text-center text-slate-500 dark:text-slate-400 py-20">

                          <CheckCircle2
                            size={40}
                            className="mx-auto text-emerald-500 mb-3"
                          />

                          No suggestions available

                        </div>

                      ) : (

                        scanData.suggestions.map(
                          (s, i) => (

                            <div

                              key={i}

                              className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20"
                            >

                              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">

                                {s}

                              </p>

                            </div>
                          )
                        )
                      )}

                    </div>
                  )}

                </div>

                {/* FOOTER */}

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">

                  <button

                    onClick={downloadLogs}

                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
                  >

                    <Download size={14} />

                    DOWNLOAD LOG

                  </button>

                  <button

                    onClick={generatePDF}

                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >

                    <FileText size={14} />

                    GENERATE PDF

                  </button>

                </div>

              </div>

            </>
          )}

          {/* EMPTY STATE */}

          {!scanCompleted && !isScanning && (

            <div className="glass-card p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">

              <Zap
                size={48}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
              />

              <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">

                No Scan Performed Yet

              </h3>

              <p className="text-slate-500 dark:text-slate-400">

                Click the "START ANALYZER" button to begin database health analysis.

              </p>

            </div>
          )}

        </div>

        {/* CONSOLE */}

        <div className="bg-[#0f172a] dark:bg-black border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full">

          <div className="bg-slate-800 dark:bg-slate-900 p-3 border-b border-slate-700 flex justify-between">

            <div className="flex items-center gap-2">

              <Terminal
                size={14}
                className="text-slate-400"
              />

              <span className="text-[10px] font-bold text-slate-300 uppercase">

                Diagnostic Console

              </span>

            </div>

            {isScanning && (

              <Loader2
                size={12}
                className="animate-spin text-blue-400"
              />
            )}

          </div>

          <div
            className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-2"
            style={{
              minHeight: '400px',
              maxHeight: '500px'
            }}
          >

            {logs.length === 0 ? (

              <div className="text-slate-500">

                No logs available. Click START ANALYZER to begin...

              </div>

            ) : (

              logs.map(log => (

                <div
                  key={log.id}
                  className="flex gap-2"
                >

                  <span className="text-slate-500">

                    [{log.time}]

                  </span>

                  <span

                    className={cn(
                      log.type === 'info' &&
                      "text-blue-400",

                      log.type === 'success' &&
                      "text-emerald-400",

                      log.type === 'warning' &&
                      "text-amber-400",

                      log.type === 'error' &&
                      "text-red-400"
                    )}
                  >

                    [{log.type.toUpperCase()}]

                  </span>

                  <span className="text-slate-200">

                    {log.message}

                  </span>

                </div>
              ))
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

// =========================
// METRIC
// =========================

function Metric({
  label,
  value,
  color
}: any) {

  return (

    <div>

      <div className="flex justify-between text-xs mb-1">

        <span className="font-bold text-slate-500 dark:text-slate-400">

          {label}

        </span>

        <span className="text-slate-800 dark:text-white">

          {value}%

        </span>

      </div>

      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">

        <div
          className={cn("h-full", color)}
          style={{
            width: `${value}%`
          }}
        />

      </div>

    </div>
  );
}

// =========================
// TAB BUTTON
// =========================

function TabButton({
  children,
  active,
  onClick
}: any) {

  return (

    <button

      onClick={onClick}

      className={cn(
        "py-4 text-xs font-bold uppercase tracking-widest relative transition-colors",

        active
          ? "text-blue-600 dark:text-blue-400"
          : "text-slate-400 dark:text-slate-500"
      )}
    >

      {children}

      {active && (

        <motion.div

          layoutId="tab"

          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
        />
      )}

    </button>
  );
}