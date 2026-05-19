import React, { useEffect, useState } from 'react';

import {
  ShieldCheck,
  Database,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { cn } from '../lib/utils';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {

  const [dashboard, setDashboard] = useState<any>(null);
  const [tableStats, setTableStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  const healthDistribution =
    Array.isArray(dashboard?.distribution)
      ? dashboard.distribution
      : [];

  const fetchData = () => {

    setLoading(true);

    fetch('http://localhost:8080/dashboard')
      .then(res => res.json())
      .then(data => {

        setDashboard(data);
        setTableStats(data.tables || []);

        if (data.tables && data.tables.length > 0) {
          setHasData(true);
        } else {
          setHasData(false);
        }

        setLoading(false);

      })
      .catch(err => {

        console.error(err);

        setLoading(false);
        setHasData(false);

      });
  };

  useEffect(() => {

    fetchData();

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener(
      'refreshDashboard',
      handleRefresh
    );

    return () => {

      window.removeEventListener(
        'refreshDashboard',
        handleRefresh
      );

    };

  }, []);

  const tableHealthData =
    dashboard?.tableHealth || [];

  const getBarColor = (status: string) => {

    if (status === "Healthy")
      return '#10b981';

    if (status === "Warning")
      return '#f59e0b';

    return '#ef4444';
  };

  const CustomTooltip = ({
    active,
    payload,
    label
  }: any) => {

    if (active && payload && payload.length) {

      const score = payload[0].value;

      let status = '';
      let statusColor = '';

      if (score >= 80) {

        status = 'Healthy';
        statusColor =
          'text-emerald-500';

      } else if (score >= 50) {

        status = 'Warning';
        statusColor =
          'text-amber-500';

      } else {

        status = 'Critical';
        statusColor =
          'text-red-500';
      }

      return (

        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">

          <p className="font-bold text-slate-900 dark:text-white">
            {label}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">

            Health Score:
            <span className="font-bold ml-1">
              {score}/100
            </span>

          </p>

          <p className={cn(
            "text-sm font-medium",
            statusColor
          )}>
            {status}
          </p>

        </div>
      );
    }

    return null;
  };

  const getHealthStatus = (score: number) => {

    if (score >= 85)
      return "Excellent";

    if (score >= 70)
      return "Good Standing";

    if (score >= 55)
      return "Fair";

    if (score >= 40)
      return "Needs Improvement";

    return "Critical - Immediate Action Required";
  };

  const getTrendValue = () => {

    const recentScans =
      dashboard?.scanHistory || [];

    if (recentScans.length >= 2) {

      const current =
        recentScans[0]?.score || 0;

      const previous =
        recentScans[1]?.score || 0;

      const diff =
        current - previous;

      if (diff > 0)
        return `+${diff}%`;

      if (diff < 0)
        return `${diff}%`;
    }

    return "0%";
  };

  if (loading) {

    return (

      <div className="flex justify-center items-center h-96">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

      </div>
    );
  }

  if (!hasData) {

    return (

      <div className="space-y-8 max-w-[1600px] mx-auto">

        <div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Health Overview
          </h2>

          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Global analysis across synchronized database clusters.
          </p>

        </div>

        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">

          <Database
            size={64}
            className="mx-auto text-slate-300 dark:text-slate-600 mb-4"
          />

          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
            No Data Available
          </h3>

          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Please configure your database in Settings and run a scan.
          </p>

        </div>

      </div>
    );
  }

  return (

    <div className="space-y-8 max-w-[1600px] mx-auto">

      {/* HEADER */}

      <div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Health Overview
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Global analysis across synchronized database clusters.
        </p>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          label="Overall Health Score"
          value={`${dashboard?.summary?.healthScore || 0}/100`}
          sub={getHealthStatus(
            dashboard?.summary?.healthScore || 0
          )}
          icon={ShieldCheck}
          color="blue"
          trend={getTrendValue()}
        />

        <StatCard
          label="Total Tables"
          value={dashboard?.summary?.totalTables || 0}
          sub="Indexed & Verified"
          icon={Database}
          color="emerald"
        />

        <StatCard
          label="Active Issues"
          value={dashboard?.summary?.activeIssues || 0}
          sub="Requiring Attention"
          icon={AlertTriangle}
          color="amber"
          trend="-1"
        />

        <StatCard
          label="Healthy Tables"
          value={dashboard?.summary?.insights || 0}
          sub="Optimized Tables"
          icon={Sparkles}
          color="purple"
        />

      </div>

      {/* CHARTS */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* BAR CHART */}

        <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h3 className="font-bold text-slate-800 dark:text-white">
                Table Health Scores
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Individual table performance metrics
              </p>

            </div>

          </div>

          <div className="h-[400px]">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart
                data={tableHealthData}
                layout="vertical"
                margin={{
                  top: 20,
                  right: 30,
                  left: 100,
                  bottom: 20
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />

                <XAxis
                  type="number"
                  tick={{
                    fill: '#94a3b8',
                    fontSize: 11
                  }}
                />

                <YAxis
                  type="category"
                  dataKey="tableName"
                  tick={{
                    fill: '#cbd5e1',
                    fontSize: 12
                  }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: 'rgba(59,130,246,0.08)',
                    radius: 10
                  }}
                />

                <Bar
                  dataKey="score"
                  radius={[0, 4, 4, 0]}
                >

                  {tableHealthData.map(
                    (entry: any, index: number) => (

                      <Cell
                        key={index}
                        fill={getBarColor(entry.status)}
                      />
                    )
                  )}

                </Bar>

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex flex-col gap-8">

          {/* PIE CHART */}

          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              Health Distribution
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Aggregate score segmentation
            </p>

            <div className="w-full h-[260px] relative">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={healthDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >

                    {healthDistribution.map(
                      (entry, index) => (

                        <Cell
                          key={index}
                          fill={
                            entry.name === "Healthy"
                              ? "#10b981"
                              : entry.name === "Warning"
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                        />
                      )
                    )}

                  </Pie>

                </PieChart>

              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-2xl font-bold text-slate-900 dark:text-white">

                  {dashboard?.summary?.healthScore || 0}%

                </span>

                <span className="text-[10px] uppercase tracking-widest text-slate-400">

                  Avg Score

                </span>

              </div>

            </div>

          </div>

          {/* TABLE ROW COUNTS */}

          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h3 className="font-bold text-slate-800 dark:text-white">
                  Table Row Counts
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live table volume distribution
                </p>

              </div>

              <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium">

                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>

                Synced

              </div>

            </div>

            <div className="space-y-4">

              {tableStats.map((table: any, index: number) => {

                const maxRows = Math.max(
                  ...tableStats.map((t: any) => t.rowCount || 1)
                );

                const width =
                  ((table.rowCount || 0) / maxRows) * 100;

                return (

                  <div key={index}>

                    <div className="flex items-center justify-between mb-2">

                      <div>

                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {table.tableName}
                        </p>

                        <p className="text-[10px] uppercase tracking-widest text-slate-400">
                          Active Records
                        </p>

                      </div>

                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {table.rowCount}
                      </span>

                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">

                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          width >= 70
                            ? "bg-emerald-500"
                            : width >= 40
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        )}
                        style={{
                          width: `${width}%`
                        }}
                      />

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ====================================
   STAT CARD
==================================== */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend
}: any) {

  const colors: any = {

    blue:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100 dark:border-blue-500/20",

    emerald:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20",

    amber:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 dark:border-amber-500/20",

    purple:
      "bg-purple-50 dark:bg-purple-500/10 text-purple-600 border-purple-100 dark:border-purple-500/20",
  };

  return (

    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative group transition-all duration-300">

      <div className={cn(
        "inline-flex p-2 rounded-lg border mb-4",
        colors[color]
      )}>

        <Icon size={20} />

      </div>

      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        {label}
      </p>

      <div className="mt-1 flex items-end gap-2">

        <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
          {value}
        </h4>

        {trend && (

          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1",
            trend.startsWith('+')
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          )}>

            {trend}

          </span>
        )}

      </div>

      <p className="text-xs text-slate-400 mt-1 font-medium italic">
        {sub}
      </p>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">

        <ExternalLink
          size={14}
          className="text-slate-400"
        />

      </div>

    </div>
  );
}