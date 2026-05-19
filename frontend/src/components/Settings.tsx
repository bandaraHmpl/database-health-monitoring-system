import React, { useState, useEffect } from 'react';

import {
    Settings as SettingsIcon,
    Shield,
    Database,
    Bell,
    Cloud,
    Eye,
    EyeOff,
    ChevronRight,
    Sun,
    Moon,
    Monitor,
    CheckCircle,
    AlertCircle
} from 'lucide-react';

import { cn } from '../lib/utils';

export default function Settings() {

    const [activeTab, setActiveTab] = useState('database');

    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState('3306');
    const [database, setDatabase] = useState('');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [theme, setTheme] = useState('system');

    const [saveStatus, setSaveStatus] = useState<{
        type: 'success' | 'error' | 'warning' | null;
        message: string;
    }>({
        type: null,
        message: ''
    });

    const [loading, setLoading] = useState(false);

    // =========================
    // LOAD SAVED THEME
    // =========================

    useEffect(() => {

        const savedTheme =
            localStorage.getItem('theme') || 'system';

        setTheme(savedTheme);

        applyTheme(savedTheme);

    }, []);

    // =========================
    // FETCH CONFIG
    // =========================

    useEffect(() => {
        fetchCurrentConfig();
    }, []);

    // =========================
    // APPLY THEME
    // =========================

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
    };

    // =========================
    // CHANGE THEME
    // =========================

    const changeTheme = (newTheme: string) => {

        setTheme(newTheme);

        applyTheme(newTheme);
    };

    // =========================
    // FETCH CONFIG
    // =========================

    const fetchCurrentConfig = async () => {

        try {

            const response =
                await fetch(
                    'http://localhost:8080/config'
                );

            if (response.ok) {

                const data = await response.json();

                setHost(data.host || 'localhost');
                setPort(data.port || '3306');
                setDatabase(data.database || '');
                setUsername(data.username || 'root');
            }

        } catch (error) {

            console.error(
                'Error fetching config:',
                error
            );
        }
    };

    // =========================
    // TEST CONNECTION
    // =========================

    const testConnection = async () => {

        setLoading(true);

        try {

            const response = await fetch(
                'http://localhost:8080/test-connection',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        host,
                        port,
                        database,
                        username,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {

                setSaveStatus({
                    type: 'success',
                    message:
                        'Connection successful! Database is reachable.'
                });

            } else {

                setSaveStatus({
                    type: 'error',
                    message:
                        data.message ||
                        'Connection failed!'
                });
            }

        } catch (error) {

            setSaveStatus({
                type: 'error',
                message:
                    'Failed to connect to backend server!'
            });

        } finally {

            setLoading(false);

            setTimeout(() => {

                setSaveStatus({
                    type: null,
                    message: ''
                });

            }, 3000);
        }
    };

    // =========================
    // SAVE CONFIGURATION
    // =========================

    const saveConfiguration = async () => {

        setLoading(true);

        try {

            const response = await fetch(
                'http://localhost:8080/save-config',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        host,
                        port,
                        database,
                        username,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {

                window.dispatchEvent(
                    new Event('db-config-updated')
                );

                setSaveStatus({
                    type: 'success',
                    message:
                        'Configuration saved successfully! Please go to Scan Database page and run a scan.'
                });

                window.dispatchEvent(
                    new Event('refreshDashboard')
                );

            } else {

                setSaveStatus({
                    type: 'error',
                    message:
                        data.message ||
                        'Failed to save configuration!'
                });
            }

        } catch (error) {

            setSaveStatus({
                type: 'error',
                message:
                    'Failed to connect to backend server!'
            });

        } finally {

            setLoading(false);

            setTimeout(() => {

                setSaveStatus({
                    type: null,
                    message: ''
                });

            }, 5000);
        }
    };

    return (

        <>

            {/* FLOATING STATUS MESSAGE */}

            {saveStatus.type && (

                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">

                    <div
                        className={cn(
                            "backdrop-blur-xl shadow-2xl p-4 rounded-2xl flex items-center gap-3 border transition-all",

                            saveStatus.type === 'success'
                                ? "bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"

                                : saveStatus.type === 'warning'
                                    ? "bg-amber-50/95 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"

                                    : "bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                        )}
                    >

                        {saveStatus.type === 'success'
                            ? <CheckCircle size={20} className="shrink-0" />
                            : <AlertCircle size={20} className="shrink-0" />
                        }

                        <span className="text-sm font-semibold">
                            {saveStatus.message}
                        </span>

                    </div>

                </div>
            )}

            <div className="space-y-8 max-w-[1000px]">

                {/* HEADER */}

                <div>

                    <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">
                        System Preferences
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400">
                        Configure instance connectivity and diagnostic thresholds.
                    </p>

                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* SIDEBAR */}

                    <aside className="w-full md:w-64 space-y-2">

                        <SettingsNavLink
                            active={activeTab === 'database'}
                            icon={Database}
                            onClick={() => setActiveTab('database')}
                        >
                            Database Connection
                        </SettingsNavLink>

                        <SettingsNavLink
                            active={activeTab === 'appearance'}
                            icon={SettingsIcon}
                            onClick={() => setActiveTab('appearance')}
                        >
                            Appearance
                        </SettingsNavLink>

                        <SettingsNavLink
                            active={activeTab === 'security'}
                            icon={Shield}
                            onClick={() => setActiveTab('security')}
                        >
                            Security & Auth
                        </SettingsNavLink>

                        <SettingsNavLink
                            active={activeTab === 'alerts'}
                            icon={Bell}
                            onClick={() => setActiveTab('alerts')}
                        >
                            Alert Thresholds
                        </SettingsNavLink>

                        <SettingsNavLink
                            active={activeTab === 'cloud'}
                            icon={Cloud}
                            onClick={() => setActiveTab('cloud')}
                        >
                            Cloud Syncing
                        </SettingsNavLink>

                    </aside>

                    {/* CONTENT */}

                    <div className="flex-1">

                        {/* DATABASE TAB */}

                        {activeTab === 'database' && (

                            <div className="glass-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl">

                                <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">
                                    Database Connectivity
                                </h3>

                                <div className="space-y-6">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <InputGroup
                                            label="HOST ADDRESS"
                                            value={host}
                                            onChange={(e: any) => setHost(e.target.value)}
                                            placeholder="localhost"
                                        />

                                        <InputGroup
                                            label="PORT"
                                            value={port}
                                            onChange={(e: any) => setPort(e.target.value)}
                                            placeholder="3306"
                                        />

                                    </div>

                                    <InputGroup
                                        label="DATABASE NAME"
                                        value={database}
                                        onChange={(e: any) => setDatabase(e.target.value)}
                                        placeholder="database_name"
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <InputGroup
                                            label="USERNAME"
                                            value={username}
                                            onChange={(e: any) => setUsername(e.target.value)}
                                            placeholder="root"
                                        />

                                        <div className="space-y-1.5">

                                            <label className="text-xs font-bold uppercase tracking-widest pl-1 text-slate-500 dark:text-slate-400">
                                                Authentication Key
                                            </label>

                                            <div className="relative">

                                                <input
                                                    type={
                                                        showPassword
                                                            ? "text"
                                                            : "password"
                                                    }

                                                    value={password}

                                                    onChange={(e: any) =>
                                                        setPassword(e.target.value)
                                                    }

                                                    placeholder="Enter password"

                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(!showPassword)
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-blue-500"
                                                >

                                                    {showPassword
                                                        ? <EyeOff size={16} />
                                                        : <Eye size={16} />
                                                    }

                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                    <div className="flex gap-3">

                                        <button
                                            onClick={testConnection}
                                            disabled={loading}
                                            className="px-6 py-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                        >
                                            {loading
                                                ? 'Testing...'
                                                : 'Test Connection'
                                            }
                                        </button>

                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-4">

                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">

                                            <Shield size={20} />

                                        </div>

                                        <div>

                                            <h5 className="text-sm font-bold text-blue-900 dark:text-blue-300">
                                                SSL Enforcement Active
                                            </h5>

                                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                                                All diagnostic data is encrypted via TLS 1.3.
                                            </p>

                                        </div>

                                    </div>

                                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">

                                        <button
                                            onClick={fetchCurrentConfig}
                                            className="px-6 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                        >
                                            Cancel Changes
                                        </button>

                                        <button
                                            onClick={saveConfiguration}
                                            disabled={loading}
                                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all"
                                        >
                                            {loading
                                                ? 'Saving...'
                                                : 'Save Configuration'
                                            }
                                        </button>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* APPEARANCE TAB */}

                        {activeTab === 'appearance' && (

                            <div className="glass-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none rounded-3xl">

                                <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white">
                                    Appearance
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    <ThemeCard
                                        icon={Sun}
                                        label="Light"
                                        active={theme === 'light'}
                                        onClick={() => changeTheme('light')}
                                    />

                                    <ThemeCard
                                        icon={Moon}
                                        label="Dark"
                                        active={theme === 'dark'}
                                        onClick={() => changeTheme('dark')}
                                    />

                                    <ThemeCard
                                        icon={Monitor}
                                        label="System"
                                        active={theme === 'system'}
                                        onClick={() => changeTheme('system')}
                                    />

                                </div>

                            </div>
                        )}

                    </div>

                </div>

            </div>

        </>
    );
}

/* =========================
   THEME CARD
========================= */

function ThemeCard({
    icon: Icon,
    label,
    active,
    onClick
}: any) {

    return (

        <div
            onClick={onClick}

            className={cn(
                "p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-4 bg-white dark:bg-slate-900",

                active
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            )}
        >

            <div
                className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all",

                    active
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300"
                )}
            >

                <Icon size={24} />

            </div>

            <span
                className={cn(
                    "text-xs font-bold uppercase tracking-widest",

                    active
                        ? "text-blue-600 dark:text-blue-300"
                        : "text-slate-500 dark:text-slate-400"
                )}
            >
                {label}
            </span>

        </div>
    );
}

/* =========================
   NAV LINK
========================= */

function SettingsNavLink({
    children,
    icon: Icon,
    active,
    onClick
}: any) {

    return (

        <button
            onClick={onClick}

            className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group",

                active
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-700"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
        >

            <div className="flex items-center gap-3">

                <Icon
                    size={18}
                    className={cn(
                        active
                            ? "text-blue-600 dark:text-blue-300"
                            : "text-slate-400 dark:text-slate-500"
                    )}
                />

                {children}

            </div>

            <ChevronRight
                size={14}
                className="text-slate-300 dark:text-slate-600"
            />

        </button>
    );
}

/* =========================
   INPUT GROUP
========================= */

function InputGroup({
    label,
    value,
    onChange,
    placeholder,
    type = "text"
}: any) {

    return (

        <div className="space-y-1.5">

            <label className="text-xs font-bold uppercase tracking-widest pl-1 text-slate-500 dark:text-slate-400">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}

                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

        </div>
    );
}