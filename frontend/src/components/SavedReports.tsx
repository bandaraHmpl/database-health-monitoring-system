import React, { useEffect, useState } from 'react';

import {
  Save,
  Search,
  Download,
  Trash2,
  Clock,
  Database,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function SavedReports() {

  const [reports, setReports] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  /* =====================================================
     FETCH REPORTS
  ===================================================== */

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
          : []
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

  /* =====================================================
     DOWNLOAD
  ===================================================== */

  const handleDownload = (
    fileName: string
  ) => {

    window.open(
      `http://localhost:8080/reports/download/${fileName}`,
      '_blank'
    );
  };

  /* =====================================================
     DELETE
  ===================================================== */

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

  /* =====================================================
     FILTERED REPORTS
  ===================================================== */

  const filteredReports =
    reports.filter((item) =>
      item.type
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  return (

    <div className="space-y-8 max-w-[1600px] mx-auto">

      {/* HEADER */}

      <div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Archive
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Access historically preserved snapshots and diagnostic outputs.
        </p>

      </div>

      {/* MAIN CARD */}

      <div className="glass-card overflow-hidden">

        {/* SEARCH */}

        <div
          className="
            p-6 border-b
            border-slate-100 dark:border-slate-800
            flex items-center justify-between
          "
        >

          <div className="relative flex-1 max-w-md">

            <Search
              className="
                absolute left-3 top-1/2 -translate-y-1/2
                text-slate-400 dark:text-slate-500
              "
              size={16}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search reports..."
              className="
                w-full pl-10 pr-4 py-2
                bg-slate-100 dark:bg-slate-800
                text-slate-800 dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                border border-transparent
                dark:border-slate-700
                rounded-xl text-sm
                focus:ring-2 focus:ring-blue-500
                transition-all outline-none
              "
            />

          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="h-[300px] flex items-center justify-center">

            <Loader2
              size={40}
              className="animate-spin text-blue-500"
            />

          </div>

        ) : filteredReports.length === 0 ? (

          <div className="h-[300px] flex flex-col items-center justify-center">

            <AlertTriangle
              size={50}
              className="text-slate-300 mb-4"
            />

            <h3 className="text-lg font-bold text-slate-700 dark:text-white">
              No Saved Reports
            </h3>

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">

            {filteredReports.map((item) => (

              <div
                key={item.id}

                className="
                  glass-card p-5 group
                  hover:border-blue-300 dark:hover:border-blue-500/40
                  hover:shadow-lg
                  transition-all duration-300
                "
              >

                {/* TOP */}

                <div className="flex items-start justify-between mb-4">

                  <div
                    className="
                      w-10 h-10
                      bg-slate-100 dark:bg-slate-800
                      rounded-xl
                      flex items-center justify-center
                      text-slate-400 dark:text-slate-500
                      group-hover:bg-blue-100
                      dark:group-hover:bg-blue-500/10
                      group-hover:text-blue-600
                      dark:group-hover:text-blue-400
                      transition-colors
                    "
                  >

                    <Save size={20} />

                  </div>

                  <span
                    className="
                      text-[10px] font-bold
                      text-slate-400 dark:text-slate-500
                      font-mono tracking-widest
                    "
                  >
                    {item.id}
                  </span>

                </div>

                {/* TITLE */}

                <h4
                  className="
                    font-bold leading-tight
                    text-slate-800 dark:text-white
                  "
                >
                  {item.type}
                </h4>

                {/* BADGES */}

                <div className="mt-4 flex flex-wrap gap-2">

                  <Badge
                    icon={Clock}
                    label={item.createdOn}
                  />

                  <Badge
                    icon={Database}
                    label={item.status}
                  />

                </div>

                {/* FOOTER */}

                <div
                  className="
                    mt-6 flex items-center justify-between
                    border-t border-slate-100 dark:border-slate-800
                    pt-4
                  "
                >

                  <span
                    className="
                      text-[10px] font-bold uppercase tracking-widest
                      text-slate-400 dark:text-slate-500
                    "
                  >
                    {item.size}
                  </span>

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        handleDownload(item.fileName)
                      }
                      className="
                        p-2 text-slate-400
                        hover:text-blue-600 dark:hover:text-blue-400
                        hover:bg-blue-50 dark:hover:bg-blue-500/10
                        rounded-lg transition-all
                      "
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      className="
                        p-2 text-slate-400
                        hover:text-red-600 dark:hover:text-red-400
                        hover:bg-red-50 dark:hover:bg-red-500/10
                        rounded-lg transition-all
                      "
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

/* =========================================================
   BADGE
========================================================= */

function Badge({
  icon: Icon,
  label
}: any) {

  return (

    <div
      className="
        flex items-center gap-1.5
        px-2 py-1
        bg-slate-100 dark:bg-slate-800
        rounded-lg
        text-slate-500 dark:text-slate-400
      "
    >

      <Icon size={12} />

      <span className="text-[10px] font-bold uppercase tracking-tight">
        {label}
      </span>

    </div>
  );
}