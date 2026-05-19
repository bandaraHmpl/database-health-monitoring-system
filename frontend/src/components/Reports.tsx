import React, { useEffect, useState } from 'react';

import {
  FilePieChart,
  Download,
  Calendar,
  Filter,
  FileText,
  MousePointer2,
  Share2,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { cn } from '../lib/utils';

export default function Reports() {

  const [reports, setReports] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================================================
     FETCH REPORTS
  ========================================================= */

  const fetchReports = async () => {

    try {

      setLoading(true);

      const res = await fetch(
        'http://localhost:8080/reports'
      );

      const data = await res.json();

      setReports(
        Array.isArray(data)
          ? data
          : data.reports || []
      );

    } catch (err) {

      console.error(err);

      setReports([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    fetchReports();

  }, []);

  /* =========================================================
     GENERATE REPORT
  ========================================================= */

  const handleGenerate = async (
    type: string
  ) => {

    try {

      await fetch(
        `http://localhost:8080/reports/generate?type=${type}`,
        {
          method: 'POST'
        }
      );

      fetchReports();

    } catch (err) {

      console.error(err);

    }
  };

  /* =========================================================
     DOWNLOAD REPORT
  ========================================================= */

  const handleDownload = (
    fileName: string
  ) => {

    window.open(
      `http://localhost:8080/reports/download/${fileName}`,
      '_blank'
    );
  };

  /* =========================================================
     DELETE REPORT
  ========================================================= */

  const handleDelete = async (
    id: string
  ) => {

    try {

      await fetch(
        `http://localhost:8080/reports/${id}`,
        {
          method: 'DELETE'
        }
      );

      fetchReports();

    } catch (err) {

      console.error(err);

    }
  };

  return (

    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex items-center justify-between flex-wrap gap-4">

        <div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics & Reports
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Export high-level insights or schedule periodic delivery.
          </p>

        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            className="
              flex items-center gap-2 px-4 py-2
              border border-slate-200 dark:border-slate-700
              rounded-xl text-sm font-medium
              text-slate-600 dark:text-slate-300
              bg-white dark:bg-[#0f172a]
              hover:bg-slate-50 dark:hover:bg-slate-800
              shadow-sm transition-all
            "
          >

            <Filter size={16} />

            Filter Criteria

          </button>

          <button
            onClick={() =>
              handleGenerate("STANDARD")
            }
            className="
              flex items-center gap-2 px-5 py-2
              rounded-xl text-sm font-bold text-white
              bg-blue-600 hover:bg-blue-700
              shadow-lg shadow-blue-500/20
              transition-all
            "
          >

            <FilePieChart size={16} />

            GENERATE REPORT

          </button>

        </div>

      </div>

      {/* =====================================================
          CONFIG CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <ReportConfigCard
          title="Standard Report"
          icon={FileText}
          onClick={() =>
            handleGenerate("STANDARD")
          }
        />

        <ReportConfigCard
          title="Security Audit"
          icon={MousePointer2}
          color="red"
          onClick={() =>
            handleGenerate("SECURITY")
          }
        />

        <ReportConfigCard
          title="Table Profiling"
          icon={Calendar}
          color="emerald"
          onClick={() =>
            handleGenerate("PROFILE")
          }
        />

      </div>

      {/* =====================================================
          REPORT TABLE
      ====================================================== */}

      <div
        className="
          bg-white dark:bg-[#0f172a]
          border border-slate-200 dark:border-slate-800
          rounded-3xl overflow-hidden
          shadow-sm
        "
      >

        {/* TOP BAR */}

        <div
          className="
            p-6 border-b
            border-slate-100 dark:border-slate-800
            flex items-center justify-between
          "
        >

          <h3 className="font-bold text-slate-800 dark:text-white text-lg">
            Generated Reports
          </h3>

          <div
            className="
              h-11 rounded-2xl
              bg-slate-100 dark:bg-slate-800
              px-5 flex items-center gap-2
            "
          >

            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total:
            </span>

            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {reports.length}
            </span>

          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="h-[320px] flex items-center justify-center">

            <Loader2
              size={38}
              className="animate-spin text-blue-500"
            />

          </div>

        ) : reports.length === 0 ? (

          <div className="h-[320px] flex flex-col items-center justify-center text-center px-6">

            <AlertTriangle
              size={50}
              className="text-slate-300 dark:text-slate-600 mb-5"
            />

            <h4 className="text-xl font-bold text-slate-700 dark:text-white">
              No Reports Found
            </h4>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Generate a report to start analytics export tracking.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr
                  className="
                    bg-slate-50 dark:bg-slate-900/60
                    border-b border-slate-200 dark:border-slate-800
                  "
                >

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Report ID
                  </th>

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Type
                  </th>

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Created On
                  </th>

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Status
                  </th>

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Size
                  </th>

                  <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {reports.map((report, index) => (

                  <ReportRow
                    key={index}
                    report={report}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

/* =========================================================
   REPORT CONFIG CARD
========================================================= */

function ReportConfigCard({
  title,
  icon: Icon,
  color = 'blue',
  onClick
}: any) {

  const themes: any = {

    blue:
      "bg-blue-600 text-white shadow-blue-500/20",

    red:
      "bg-rose-600 text-white shadow-rose-500/20",

    emerald:
      "bg-emerald-600 text-white shadow-emerald-500/20",
  };

  return (

    <div
      className="
        bg-white dark:bg-[#0f172a]
        border border-slate-200 dark:border-slate-800
        rounded-3xl p-8 flex flex-col items-center
        text-center group
        hover:border-blue-200 dark:hover:border-blue-500/40
        hover:-translate-y-1
        transition-all duration-300
        cursor-pointer
      "
    >

      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-lg",
          themes[color]
        )}
      >

        <Icon size={30} />

      </div>

      <h4 className="font-bold text-2xl text-slate-800 dark:text-white">
        {title}
      </h4>

      <p className="text-sm text-slate-400 dark:text-slate-500 mt-3 px-4 leading-relaxed">
        Standardized analysis mapping and diagnostic metrics.
      </p>

      <div className="mt-7 w-full h-px bg-slate-100 dark:bg-slate-800" />

      <button
        onClick={onClick}
        className="
          mt-5 text-xs font-bold
          text-blue-600 dark:text-blue-400
          hover:text-blue-700 dark:hover:text-blue-300
          tracking-[0.2em] uppercase
        "
      >
        Configure
      </button>

    </div>
  );
}

/* =========================================================
   REPORT ROW
========================================================= */

function ReportRow({
  report,
  onDownload,
  onDelete
}: any) {

  return (

    <tr
      className="
        hover:bg-slate-50/70 dark:hover:bg-slate-800/40
        transition-colors duration-200
        group
      "
    >

      <td className="px-6 py-5">

        <div className="flex items-center gap-4">

          <div
            className="
              w-11 h-11 rounded-2xl
              bg-slate-100 dark:bg-slate-800
              flex items-center justify-center
              text-slate-400
              group-hover:text-blue-500
              transition-colors
            "
          >

            <FileText size={18} />

          </div>

          <span
            className="
              text-sm font-bold
              text-slate-800 dark:text-white
              font-mono tracking-tight
            "
          >
            {report.id}
          </span>

        </div>

      </td>

      <td className="px-6 py-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {report.type}
      </td>

      <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
        {report.createdOn}
      </td>

      <td className="px-6 py-5">

        <span
          className={cn(
            "text-[11px] font-bold px-3 py-1.5 rounded-xl border",

            report.status === 'SUCCESS'
              ? `
                bg-emerald-50 text-emerald-700 border-emerald-100
                dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
              `
              : `
                bg-amber-50 text-amber-700 border-amber-100
                dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
              `
          )}
        >

          {report.status}

        </span>

      </td>

      <td className="px-6 py-5 text-sm font-mono text-slate-400 dark:text-slate-500">
        {report.size}
      </td>

      <td className="px-6 py-5">

        <div className="flex items-center gap-2">

          <button
            onClick={() =>
              onDownload(report.fileName)
            }
            className="
              p-2.5 text-slate-400
              hover:text-blue-600 dark:hover:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-500/10
              rounded-xl transition-all
            "
          >

            <Download size={17} />

          </button>

          <button
            className="
              p-2.5 text-slate-400
              hover:text-blue-600 dark:hover:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-500/10
              rounded-xl transition-all
            "
          >

            <Share2 size={17} />

          </button>

          <button
            onClick={() =>
              onDelete(report.id)
            }
            className="
              p-2.5 text-slate-400
              hover:text-red-600 dark:hover:text-red-400
              hover:bg-red-50 dark:hover:bg-red-500/10
              rounded-xl transition-all
            "
          >

            <Trash2 size={17} />

          </button>

        </div>

      </td>

    </tr>
  );
}