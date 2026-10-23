import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
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
  User as UserIcon,
  DatabaseIcon,
  Moon,
  Sun,
  AlertTriangle
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { NotificationItem, User } from './types';
import { clearSession, getStoredUser, saveSession } from './lib/session';
import { apiFetch } from './lib/api';

// Pages
const Dashboard = lazy(() => import('./components/Dashboard'));
const ScanDatabase = lazy(() => import('./components/ScanDatabase'));
const Reports = lazy(() => import('./components/Reports'));
const SavedReports = lazy(() => import('./components/SavedReports'));
const SettingsPage = lazy(() => import('./components/Settings'));
const About = lazy(() => import('./components/About'));
const LoginModule = lazy(() => import("./components/Login"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-label="Loading">
      <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-blue-600 animate-spin" />
    </div>
  );
}

// User type definition
type UserType = User;

type PageId =
  | 'dashboard'
  | 'scan'
  | 'reports'
  | 'saved'
  | 'settings'
  | 'about';

export default function App() {

  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // =========================
  // THEME
  // =========================

  const [theme, setTheme] = useState('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // =========================
  // AUTHENTICATION
  // =========================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // =========================
  // LOAD DB CONFIG
  // =========================

  const fetchDbConfig = async () => {

    try {

      const res = await apiFetch('/config');

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

  // Check authentication on mount
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {

    if (isAuthenticated) {
      fetchDbConfig();
    }

  }, [isAuthenticated]);

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
    setResolvedTheme(actualTheme as 'light' | 'dark');
  };

  const fetchNotifications = useCallback(async () => {
    const userId = currentUser?.userId;
    if (!userId) {
      return;
    }

    try {
      const res = await apiFetch('/notifications', {}, userId);
      const data = await res.json();
      const items = Array.isArray(data.notifications)
        ? data.notifications
        : [];

      setNotifications(items);
      setNotificationCount(data.count ?? items.length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [currentUser?.userId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.userId) {
      return;
    }

    fetchNotifications();

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('refreshDashboard', handleRefresh);

    return () => {
      window.removeEventListener('refreshDashboard', handleRefresh);
    };
  }, [isAuthenticated, currentUser?.userId, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current
        && !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const userId = currentUser?.userId;

    if (!userId) {
      return (
        <div className="flex justify-center items-center h-96">
          <p className="text-slate-500">Session expired. Please log in again.</p>
        </div>
      );
    }

    switch (activePage) {

      case 'dashboard':
        return <Dashboard key={userId} userId={userId} />;

      case 'scan':
        return <ScanDatabase userId={userId} />;

      case 'reports':
        return <Reports userId={userId} />;

      case 'saved':
        return <SavedReports userId={userId} />;

      case 'settings':
        return <SettingsPage />;

      case 'about':
        return <About />;

      default:
        return <Dashboard key={userId} userId={userId} />;
    }
  };

const [dbConfig, setDbConfig] = useState({
  host: 'Loading...',
  database: 'Loading...',
  username: 'Loading...'
});

  // =========================
  // AUTH HANDLERS
  // =========================

  const handleLoginSuccess = (user: UserType) => {
    saveSession(user);
    setIsAuthenticated(true);
    setCurrentUser(user);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setNotifications([]);
    setNotificationCount(0);
    setShowNotifications(false);
    clearSession();
    sessionStorage.clear();
  };

  // Token rejected by the backend (expired / invalid) -> back to login
  useEffect(() => {
    const onExpired = () => handleLogout();
    window.addEventListener('auth-expired', onExpired);
    return () => window.removeEventListener('auth-expired', onExpired);
  }, []);

  // After login, quietly download the other pages in the background so
  // switching tabs feels instant (the first screen loads without them).
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = window.setTimeout(() => {
      import('./components/ScanDatabase');
      import('./components/Reports');
      import('./components/SavedReports');
      import('./components/Settings');
      import('./components/About');
    }, 1500);
    return () => window.clearTimeout(id);
  }, [isAuthenticated]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#020617]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginModule onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

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
               SCAN TARGET
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

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
          >
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
                  resolvedTheme === 'dark'
                    ? 'light'
                    : 'dark'
                )
              }

              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
            >

              {resolvedTheme === 'dark'
                ? <Sun size={18} />
                : <Moon size={18} />
              }

            </button>

            <div className="relative" ref={notificationRef}>

              <button
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  if (!showNotifications) {
                    fetchNotifications();
                  }
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white relative transition-colors"
              >

                <Bell size={20} />

                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-[9px] font-bold text-white flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}

              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Notifications
                      </p>
                      {notificationCount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                          {notificationCount} active
                        </span>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No issues found. Run a scan to check database health.
                          </p>
                        </div>
                      ) : (
                        notifications.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle
                                size={16}
                                className={cn(
                                  "mt-0.5 shrink-0",
                                  item.severity === 'Critical'
                                    ? "text-red-500"
                                    : item.severity === 'Warning'
                                      ? "text-amber-500"
                                      : "text-blue-500"
                                )}
                              />
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                  {item.title}
                                </p>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                                  {item.severity}
                                  {item.tableName ? ` · ${item.tableName}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

            {/* USER */}

            <div className="flex items-center gap-3">

              <div className="text-right hidden lg:block">

                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                    {currentUser?.fullName || 'User'}
                </p>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentUser?.email}
                </p>

              </div>

              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">

                <UserIcon
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

              <Suspense fallback={<PageLoader />}>
                {renderPage()}
              </Suspense>

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