import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Search,
  FileText,
  Save,
  Settings,
  Info,
  ChevronRight,
  LogOut,
  Bell,
  User,
  DatabaseIcon,
  Moon,
  Sun
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages
import Dashboard from './components/Dashboard';
import ScanDatabase from './components/ScanDatabase';
import Reports from './components/Reports';
import SavedReports from './components/SavedReports';
import SettingsPage from './components/Settings';
import About from './components/About';

type PageId =
  | 'dashboard'
  | 'scan'
  | 'reports'
  | 'saved'
  | 'settings'
  | 'about';

export default function App() {

  const [activePage, setActivePage] =
    useState<PageId>('dashboard');

  // =========================
  // THEME
  // =========================

  const [theme, setTheme] =
    useState('light');

  // =========================
  // LOAD DB CONFIG
  // =========================

  const fetchDbConfig = async () => {

    try {

      const res = await fetch(
        'http://localhost:8080/config'
      );

      const data = await res.json();

      setDbConfig({
        host: data.host || 'Unknown',
        database: data.database || 'No DB',
        username: data.username || 'Unknown'
      });

    } catch (err) {

      console.error(err);

    }
  };

  useEffect(() => {

    fetchDbConfig();

  }, []);

useEffect(() => {

  const handleDbConfigUpdated = () => {

    fetchDbConfig();
  };

  window.addEventListener(
    'db-config-updated',
    handleDbConfigUpdated
  );

  return () => {

    window.removeEventListener(
      'db-config-updated',
      handleDbConfigUpdated
    );
  };

}, []);

  useEffect(() => {

    const savedTheme =
      localStorage.getItem('theme') || 'system';

    applyTheme(savedTheme);

  }, []);

  const applyTheme = (selectedTheme: string) => {

    let actualTheme = selectedTheme;

    if (selectedTheme === 'system') {

      const prefersDark =
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;

      actualTheme =
        prefersDark ? 'dark' : 'light';
    }

    document.documentElement.classList.remove(
      'light',
      'dark'
    );

    document.documentElement.classList.add(
      actualTheme
    );

    localStorage.setItem(
      'theme',
      selectedTheme
    );

    setTheme(selectedTheme);
  };

  // =========================
  // NAVIGATION
  // =========================

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'scan',
      label: 'Scan Database',
      icon: Search
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText
    },
    {
      id: 'saved',
      label: 'Saved Reports',
      icon: Save
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    },
    {
      id: 'about',
      label: 'About',
      icon: Info
    },
  ] as const;

  const renderPage = () => {

    switch (activePage) {

      case 'dashboard':
        return <Dashboard />;

      case 'scan':
        return <ScanDatabase />;

      case 'reports':
        return <Reports />;

      case 'saved':
        return <SavedReports />;

      case 'settings':
        return <SettingsPage />;

      case 'about':
        return <About />;

      default:
        return <Dashboard />;
    }
  };

const [dbConfig, setDbConfig] = useState({
  host: 'Loading...',
  database: 'Loading...',
  username: 'Loading...'
});

  return (

    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] transition-all duration-300">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="w-64 bg-[#0f172a] dark:bg-black text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-300">

        {/* LOGO */}

        <div className="p-6 flex items-center gap-3">

          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">

            <DatabaseIcon size={24} />

          </div>

          <div className="flex flex-col">

            <h1 className="font-bold text-white text-lg leading-tight uppercase tracking-wider">
              DB HEALTH
            </h1>

            <span className="text-[10px] font-medium text-slate-500 tracking-widest uppercase">
              Monitoring System
            </span>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 mt-6 space-y-2">

          {navItems.map((item) => {

            const Icon = item.icon;

            const isActive =
              activePage === item.id;

            return (

              <button
                key={item.id}
                onClick={() =>
                  setActivePage(item.id)
                }

                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",

                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >

                <Icon
                  size={18}

                  className={cn(
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-blue-400"
                  )}
                />

                {item.label}

              </button>
            );
          })}

        </nav>

        {/* DATABASE STATUS */}

        <div className="p-4 mt-auto">

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">

            <div className="flex items-center gap-2 mb-3">

              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

              <span className="text-xs text-slate-400 font-medium tracking-wide">
                CONNECTED
              </span>

            </div>

            <div className="space-y-2 text-[11px] text-slate-500 font-mono">

              <div className="flex justify-between">
                <span>HOST:</span>
                <span className="text-slate-300">
                  {dbConfig.host}
                </span>
              </div>

              <div className="flex justify-between">
                <span>DB:</span>
                <span className="text-slate-300">
                  {dbConfig.database}
                </span>
              </div>

              <div className="flex justify-between">
                <span>USER:</span>
                <span className="text-slate-300">
                  {dbConfig.username}
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="p-4 border-t border-slate-800">

          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors text-sm font-medium">

            <LogOut size={18} />

            Logout Session

          </button>

          <div className="px-4 py-2 text-[10px] text-slate-600 font-mono">

            BUILD v1.0.0-PRO

          </div>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}

        <header className="h-16 px-8 flex items-center justify-between bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-all duration-300">

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">

            <span className="text-xs font-medium uppercase tracking-widest">
              Workspace
            </span>

            <ChevronRight size={14} />

            <span className="text-slate-900 dark:text-white font-semibold capitalize">

              {activePage.replace('-', ' ')}

            </span>

          </div>

          <div className="flex items-center gap-4">

            {/* THEME BUTTON */}

            <button
              onClick={() =>
                applyTheme(
                  theme === 'dark'
                    ? 'light'
                    : 'dark'
                )
              }

              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            >

              {theme === 'dark'
                ? <Sun size={18} />
                : <Moon size={18} />
              }

            </button>

            {/* BELL */}

            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white relative transition-colors">

              <Bell size={20} />

              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />

            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* USER */}

            <div className="flex items-center gap-3">

              <div className="text-right hidden sm:block">

                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                  Admin User
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Super Administrator
                </p>

              </div>

              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">

                <User
                  size={20}
                  className="text-slate-400"
                />

              </div>

            </div>

          </div>

        </header>

        {/* PAGE */}

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#020617] transition-all duration-300">

          <AnimatePresence mode="wait">

            <motion.div
              key={activePage}

              initial={{
                opacity: 0,
                y: 10
              }}

              animate={{
                opacity: 1,
                y: 0
              }}

              exit={{
                opacity: 0,
                y: -10
              }}

              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}

              className="p-8 h-full text-slate-900 dark:text-white"
            >

              {renderPage()}

            </motion.div>

          </AnimatePresence>

        </div>

        {/* FOOTER */}

        <footer className="h-10 bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between transition-all duration-300">

          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">

              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />

              <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                SYSTEMS OPERATIONAL
              </span>

            </div>

            <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

            <span className="text-[10px] text-slate-400 font-medium tracking-tight">
              AUTO-SYNC: 120s
            </span>

          </div>

          <div className="text-[10px] font-mono text-slate-400">

            TIMESTAMP: {new Date().toISOString()}

          </div>

        </footer>

      </main>

    </div>
  );
}