import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Database,
  ArrowLeft,
  Info
} from 'lucide-react';
import { User, AuthTab } from '../types';

interface LoginModuleProps {
  onLoginSuccess: (user: User) => void;
  initialUserEmail?: string;
}

export default function LoginModule({ onLoginSuccess, initialUserEmail = "demo@gmail.com" }: LoginModuleProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Fields state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error / helper feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill setup
  useEffect(() => {
    // If we have initial email from the metadata, pre-fill it for signin
    if (initialUserEmail) {
      setEmail(initialUserEmail);
    }
  }, [initialUserEmail]);

  // Load existing accounts or register default one in local storage
  useEffect(() => {
    const existingUsers = localStorage.getItem('db_health_users');
    if (!existingUsers) {
      const defaultUsers = [
        {
          email: 'demo@gmail.com',
          password: 'Password@123',
          fullName: 'Demo User'
        }
      ];
      localStorage.setItem('db_health_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Password strength computation (value out of 4)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 1, text: 'Weak', color: 'bg-red-500' };
      case 2: return { score: 2, text: 'Fair', color: 'bg-amber-500' };
      case 3: return { score: 3, text: 'Good', color: 'bg-blue-500' };
      case 4: return { score: 4, text: 'Strong', color: 'bg-emerald-500' };
      default: return { score: 0, text: 'None', color: 'bg-slate-200' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/auth/login",  // ✅ /auth/login
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            email,
            password
          })
        }
      );

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        onLoginSuccess({
          email: data.email,
          fullName: data.username,  // ✅ backend returns 'username'
          isLoggedIn: true
        });
      } else {
        setError(data.message);
      }

    } catch (error) {
      setIsLoading(false);
      setError("Backend connection failed");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {

    e.preventDefault();

    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {

      const response = await fetch(
        "http://localhost:8080/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      setIsLoading(false);

      if (data.success) {
        setSuccessMessage("Account created successfully");
        setActiveTab("signin");
      } else {

        setError(data.message);
      }

    } catch (error) {

      setIsLoading(false);
      setError("Backend connection failed");
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your registered email address');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('A reset link has been sent to your email address!');
    }, 1500);
  };

  const triggerAutofill = () => {
    setEmail('demo@gmail.com');
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div id="login-container" className="flex min-h-screen w-full bg-[#f8fafc] font-sans overflow-hidden">

      {/* LEFT SPLIT PANEL - Modern Tech/Database Presentation */}
      <div id="left-panel" className="hidden lg:flex lg:w-1/2 relative bg-[#0c1324] text-white flex-col justify-between p-12 overflow-hidden concentric-rings border-r border-[#1e293b]">

        {/* Deep, glowing visual background layout helper (concentric rings exactly like screenshots) */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <div className="w-[140%] h-[140%] border border-[#1e293b]/20 rounded-full flex items-center justify-center p-36 animate-[pulse_8s_infinite]">
            <div className="w-full h-full border border-[#1e293b]/30 rounded-full flex items-center justify-center p-36">
              <div className="w-full h-full border border-[#1e293b]/40 rounded-full flex items-center justify-center p-36">
                <div className="w-full h-full border border-[#3b82f6]/5 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo block */}
        <div id="left-logo-block" className="flex items-center space-x-3.5 z-10">
          <div className="bg-[#1e293b] p-3 rounded-2xl border border-[#334155] shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            <Database className="w-6 h-6 text-blue-500 fill-blue-500/10" id="db-icon" />
          </div>
          <div>
            <div className="font-display font-bold text-lg tracking-wide uppercase leading-tight text-white" id="brand-name">
              DB HEALTH
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase" id="brand-subname">
              Monitoring System
            </div>
          </div>
        </div>

        {/* Promotional and Value Pitch text block */}
        <div id="left-text-block" className="z-10 my-auto py-12 max-w-md">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Real-time Monitoring</span>
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4 leading-tight text-white" id="welcome-title">
            Enterprise Database <br />
            <span className="text-blue-500">Health Platform</span>
          </h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed" id="welcome-desc">
            Monitor, analyze, and optimize your database performance with intelligent diagnostics and automated reporting.
          </p>

          {/* List parameters and core values */}
          <ul className="space-y-4" id="features-list">
            {[
              "Real-time health score tracking",
              "Automated diagnostic reports",
              "Table performance analytics",
              "Security audit & compliance"
            ].map((feature, i) => (
              <li key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Security badge at bottom left */}
        <div id="left-security-block" className="bg-[#111a2e]/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shrink-0 flex items-center space-x-4 max-w-sm z-10" style={{ contentVisibility: 'auto' }}>
          <div className="bg-[#1e293b] p-2.5 rounded-xl border border-[#334155]">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300">Enterprise Security</div>
            <div className="text-[11px] text-slate-400">256-bit encrypted, role-based access</div>
          </div>
        </div>

      </div>

      {/* RIGHT SPLIT PANEL - Splendid interactive Sign In, Sign Up, and Forgot Password modules */}
      <div id="right-panel" className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 md:p-12 min-h-screen relative overflow-y-auto">

        {/* Mini version Logo on Mobile Header */}
        <div className="lg:hidden flex items-center space-x-3 w-full max-w-md mb-8">
          <div className="bg-[#0c1324] p-2.5 rounded-xl border border-slate-800">
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="font-display font-bold text-slate-900 tracking-wide">DB HEALTH</div>
            <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Monitoring System</div>
          </div>
        </div>

        <div className="w-full max-w-md my-auto relative py-6">

          <AnimatePresence mode="wait">

            {/* RESET PASSWORD / FORGOT PASSWORD FLOW */}
            {activeTab === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="w-full"
                id="forgot-form-container"
              >
                {/* Back to Login link exactly like screenshot 12 */}
                <button
                  onClick={() => {
                    setActiveTab('signin');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 mb-8 transition-colors duration-200"
                  id="back-to-login"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back to Login
                </button>

                <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight" id="forgot-title">
                  Reset Password
                </h2>
                <p className="text-slate-500 text-sm mb-6" id="forgot-desc">
                  Enter your email address and we'll send you a reset link.
                </p>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl flex items-center space-x-2 animate-shake" id="forgot-error">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2.5 rounded-xl flex items-center space-x-2" id="forgot-success">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-5" id="forgot-form">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="forgot-email">
                      EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        className="block w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    id="btn-forgot-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (

              /* SIGN IN / SIGN UP FLOW MODULE */
              <motion.div
                key="auth"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full animate-fade-in"
              >

                {/* Heading section */}
                <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-1 leading-tight" id="auth-title">
                  {activeTab === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-slate-500 text-sm mb-6" id="auth-desc">
                  {activeTab === 'signin'
                    ? 'Sign in to access your monitoring dashboard.'
                    : 'Set up your account to get started.'}
                </p>

                {/* Tab select slider exactly like Image 10 and 11 */}
                <div className="bg-slate-100 p-1 rounded-xl flex mb-6 relative" id="tab-selector-container">
                  <button
                    onClick={() => {
                      setActiveTab('signin');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 z-10 cursor-pointer ${
                      activeTab === 'signin'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    id="tab-signin"
                  >
                    SIGN IN
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('signup');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 text-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 z-10 cursor-pointer ${
                      activeTab === 'signup'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    id="tab-signup"
                  >
                    SIGN UP
                  </button>
                </div>

                {/* Info Autofill Hint box for demo convenience */}
                {activeTab === 'signin' && (
                  <div className="mb-5 bg-blue-50/70 border border-blue-100 p-3.5 rounded-xl flex items-start space-x-3" id="hint-box">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800 leading-relaxed">
                      <span className="font-semibold block mb-0.5">Demo Account Available</span>
                      Sri Lankan user database matching! You can click below to autofill the active profile details.
                      <button
                        type="button"
                        onClick={triggerAutofill}
                        className="block mt-2 font-bold text-blue-700 underline text-[11px] hover:text-blue-800 transition duration-150"
                      >
                        Auto-fill with Demo Account
                      </button>
                    </div>
                  </div>
                )}

                {/* Global messages */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs px-3.5 py-3 rounded-xl flex items-center space-x-2" id="feedback-error">
                    <Info className="w-4.5 h-4.5 shrink-0" />
                    <span>⚠️ {error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3.5 py-3 rounded-xl flex items-center space-x-2" id="feedback-success">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* SIGN IN FORM */}
                {activeTab === 'signin' ? (
                  <form onSubmit={handleSignIn} className="space-y-4" id="signin-form">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signin-email">
                        EMAIL ADDRESS
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="signin-email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signin-password">
                        PASSWORD
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                          tabIndex={-1}
                          id="toggle-signin-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Meta Controls (remember me + forgot link) */}
                    <div className="flex items-center justify-between text-xs pt-1" id="signin-controls">
                      <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-1 w-4 h-4"
                          id="remember-me"
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('forgot');
                          setError(null);
                        }}
                        className="font-semibold text-blue-600 hover:text-blue-700 transition"
                        id="forgot-password-link"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      id="btn-signin-submit"
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Sign In to Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center text-xs text-slate-500 pt-3" id="signup-helper">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signup');
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-700 transition"
                        id="link-to-register"
                      >
                        Sign up free
                      </button>
                    </div>

                  </form>
                ) : (

                  /* SIGN UP FORM */
                  <form onSubmit={handleSignUp} className="space-y-4" id="signup-form">

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signup-fullname">
                        FULL NAME
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          id="signup-fullname"
                          type="text"
                          required
                          className="block w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signup-email">
                        EMAIL ADDRESS
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="signup-email"
                          type="email"
                          required
                          className="block w-full pl-10 pr-3.5 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signup-password">
                        PASSWORD
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          required
                          className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                          tabIndex={-1}
                          id="toggle-signup-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* PASSWORD STRENGTH METER - Dynamic segmented bars exactly like Image 9 */}
                      {password && (
                        <div className="mt-2.5" id="password-strength-container" style={{ contentVisibility: 'auto' }}>
                          <div className="flex space-x-1.5 h-1">
                            {[1, 2, 3, 4].map((barIndex) => (
                              <div
                                key={barIndex}
                                className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                                  strength.score >= barIndex ? strength.color : 'bg-slate-200'
                                }`}
                              ></div>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1" id="strength-label">
                            Strength: <span className="font-bold text-slate-700">{strength.text}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5" htmlFor="signup-confirmpassword">
                        CONFIRM PASSWORD
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="signup-confirmpassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          className="block w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 transition-all text-sm"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                          tabIndex={-1}
                          id="toggle-signup-confirmpassword"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      id="btn-signup-submit"
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-4"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Create My Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center text-xs text-slate-500 pt-3" id="signin-helper">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signin');
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="font-bold text-blue-600 hover:text-blue-700 transition"
                        id="link-to-signin"
                      >
                        Sign in
                      </button>
                    </div>

                  </form>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Dynamic visual page bottom footer exact match */}
        <div className="text-[10px] text-slate-400 font-mono tracking-wider mt-8 text-center" id="right-footer">
          © 2026 DB HEALTH MONITORING SYSTEM · V1.0.0-PRO
        </div>

      </div>

    </div>
  );
}
