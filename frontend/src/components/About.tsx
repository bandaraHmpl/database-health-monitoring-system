import React from 'react';

import {
  Github,
  Globe,
  Cpu,
  Database,
  Layers,
  Heart,
  ExternalLink
} from 'lucide-react';

export default function About() {

  return (

    <div className="space-y-12 max-w-[1000px] mx-auto py-8">

      {/* HERO */}

      <div className="text-center space-y-4">

        <div
          className="
            inline-flex w-20 h-20
            bg-blue-600
            rounded-3xl
            items-center justify-center
            text-white
            shadow-2xl shadow-blue-300/40
            dark:shadow-blue-900/30
            mb-4 rotate-3
            transform hover:rotate-0
            transition-transform duration-500
          "
        >

          <Database size={40} />

        </div>

        <h2
          className="
            text-4xl font-black tracking-tight
            text-slate-900 dark:text-white
          "
        >
          Database Health Monitoring System
        </h2>

        <p className="text-lg text-slate-500 dark:text-slate-400 font-medium italic">
          "Real-time Database Analysis & Diagnostic Platform"
        </p>

        <div className="flex justify-center gap-2 flex-wrap">

          <span
            className="
              px-3 py-1 rounded-full
              text-xs font-bold font-mono tracking-widest
              bg-slate-100 dark:bg-slate-800
              text-slate-600 dark:text-slate-300
            "
          >
            VERSION 1.0.0
          </span>

          <span
            className="
              px-3 py-1 rounded-full
              text-xs font-bold font-mono tracking-widest
              bg-blue-50 dark:bg-blue-500/10
              text-blue-600 dark:text-blue-400
            "
          >
            SPRING BOOT + REACT
          </span>

        </div>

      </div>

      {/* MAIN GRID */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* TECH STACK */}

        <div className="glass-card p-8">

          <h3
            className="
              text-xl font-bold mb-6
              flex items-center gap-2
              text-slate-800 dark:text-white
            "
          >

            <Cpu size={24} className="text-blue-500" />

            Technology Stack

          </h3>

          <div className="space-y-4">

            <TechItem
              icon={Layers}
              label="React + TypeScript"
              sub="Frontend User Interface"
            />

            <TechItem
              icon={Globe}
              label="Tailwind CSS"
              sub="Responsive UI Styling"
            />

            <TechItem
              icon={Database}
              label="Spring Boot API"
              sub="Backend REST Services"
            />

            <TechItem
              icon={Cpu}
              label="MySQL Database"
              sub="Relational Database Engine"
            />

          </div>

        </div>

        {/* MISSION */}

        <div
          className="
            glass-card p-8
            bg-slate-900 dark:bg-slate-950
            text-white
            border-slate-800
            shadow-2xl shadow-slate-200/50
            dark:shadow-black/40
          "
        >

          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">

            <Heart size={24} className="text-rose-500" />

            Mission Statement

          </h3>

          <p className="text-slate-400 leading-relaxed text-sm">

            This platform is designed to monitor database health,
            analyze table statistics, detect performance issues,
            and generate diagnostic reports in real time.

            <br />
            <br />

            The system provides administrators with clear visibility
            into database structures, table activity, and potential
            optimization areas using an interactive dashboard and
            automated reporting tools.

          </p>

          <div className="mt-8 flex gap-4">

            <button
              className="
                flex-1 px-4 py-3
                bg-white dark:bg-slate-800
                text-slate-900 dark:text-white
                rounded-xl
                font-bold text-xs
                flex items-center justify-center gap-2
                hover:bg-slate-200 dark:hover:bg-slate-700
                transition-all
              "
            >

              <Github size={16} />

              SOURCE CODE

            </button>

            <button
              className="
                flex-1 px-4 py-3
                bg-blue-600 text-white
                rounded-xl
                font-bold text-xs
                flex items-center justify-center gap-2
                hover:bg-blue-700
                transition-all
                shadow-lg shadow-blue-500/20
              "
            >

              <ExternalLink size={16} />

              SYSTEM DASHBOARD

            </button>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div
        className="
          text-center text-xs font-medium
          tracking-widest uppercase
          text-slate-400 dark:text-slate-500
        "
      >
        © 2026 Database Health Monitoring System
      </div>

    </div>
  );
}

/* =========================================================
   TECH ITEM
========================================================= */

function TechItem({
  icon: Icon,
  label,
  sub
}: any) {

  return (

    <div className="flex items-center gap-4 group">

      <div
        className="
          w-10 h-10 rounded-xl
          bg-slate-50 dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          flex items-center justify-center
          text-slate-400 dark:text-slate-500
          group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10
          group-hover:text-blue-600 dark:group-hover:text-blue-400
          transition-colors
        "
      >

        <Icon size={20} />

      </div>

      <div>

        <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
          {label}
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          {sub}
        </p>

      </div>

    </div>
  );
}