'use client';

import React, { useState, useEffect } from 'react';
import {
  Code,
  Shield,
  Briefcase,
  User,
  CreditCard,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  LogOut,
  ChevronRight,
  Terminal,
  Activity,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import {
  authApi,
  problemApi,
  assessmentApi,
  attemptApi,
  paymentApi,
  adminApi,
} from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'recruiter' | 'candidate' | 'admin'>('recruiter');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Recruiter states
  const [assessments, setAssessments] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [assessmentReport, setAssessmentReport] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Candidate Assessment Arena states
  const [inviteToken, setInviteToken] = useState('');
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [activeProblem, setActiveProblem] = useState<any>(null);
  const [candidateCode, setCandidateCode] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const [finalScore, setFinalScore] = useState<any>(null);

  // Admin stats
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Show notification toast
  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check Backend Health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/health`
        );
        const data = await res.json();
        if (data?.data?.status === 'UP') {
          setBackendHealth('UP');
        } else {
          setBackendHealth('DOWN');
        }
      } catch {
        setBackendHealth('DOWN');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Quick Demo Login
  const handleQuickLogin = async (role: 'ADMIN' | 'RECRUITER' | 'CANDIDATE') => {
    setLoading(true);
    try {
      let email = 'recruiter@techcorp.com';
      let password = 'Recruiter@1234';

      if (role === 'ADMIN') {
        email = 'admin@devassess.com';
        password = 'Admin@1234';
      } else if (role === 'CANDIDATE') {
        email = 'candidate@devassess.com';
        password = 'Candidate@1234';
      }

      const res = await authApi.login({ email, password });
      if (res.data?.accessToken) {
        localStorage.setItem('token', res.data.accessToken);
        setCurrentUser(res.data.user);
        notify(`Logged in as ${res.data.user.fullName} (${res.data.user.role})`);
        if (role === 'RECRUITER') setActiveTab('recruiter');
        if (role === 'CANDIDATE') setActiveTab('candidate');
        if (role === 'ADMIN') setActiveTab('admin');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Tab Data
  useEffect(() => {
    if (activeTab === 'recruiter') {
      problemApi.getAll().then((res) => setProblems(res.data || [])).catch(() => {});
      assessmentApi.getAll().then((res) => setAssessments(res.data || [])).catch(() => {});
    } else if (activeTab === 'admin') {
      adminApi.getStats().then((res) => setDashboardStats(res.data)).catch(() => {});
      adminApi.getAuditLogs().then((res) => setAuditLogs(res.data || [])).catch(() => {});
    }
  }, [activeTab]);

  // Anti-cheat listener for candidate
  useEffect(() => {
    if (!activeAttempt) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        attemptApi
          .logAntiCheat(activeAttempt.id, 'TAB_SWITCH', {
            hiddenAt: new Date().toISOString(),
          })
          .then(() => {
            notify('⚠️ Anti-Cheat Warning: Tab switch recorded!', 'error');
          })
          .catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeAttempt]);

  // Candidate Start Attempt
  const handleStartAttempt = async () => {
    if (!inviteToken) {
      notify('Please enter an invitation token', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await attemptApi.start(inviteToken);
      setActiveAttempt(res.data.attempt);
      const firstProblem = res.data.problems?.[0];
      if (firstProblem) {
        setActiveProblem(firstProblem);
        setCandidateCode(firstProblem.starterCode?.javascript || firstProblem.starterCode || '');
      }
      notify('Assessment started! Good luck.');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Candidate Submit Answer
  const handleSubmitCode = async () => {
    if (!activeAttempt || !activeProblem) return;
    setLoading(true);
    try {
      const res = await attemptApi.submitAnswer(activeAttempt.id, {
        problemId: activeProblem.id,
        codeAnswer: candidateCode,
      });
      setSubmissionResult(res.data);
      notify(`Code evaluated! Passed: ${res.data?.testCasesPassed || 0} tests`);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Candidate Finalize Attempt
  const handleFinalize = async () => {
    if (!activeAttempt) return;
    setLoading(true);
    try {
      const res = await attemptApi.finalize(activeAttempt.id);
      setFinalScore(res.data);
      setActiveAttempt(null);
      notify('Assessment finalized successfully!');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Invite Candidate
  const handleInviteCandidate = async (assessmentId: string) => {
    if (!inviteEmail) {
      notify('Candidate email is required', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await assessmentApi.invite(assessmentId, [
        { email: inviteEmail, candidateName: inviteName || 'Candidate' },
      ]);
      const token = res.data?.invitations?.[0]?.token;
      if (token) {
        setInviteToken(token);
        notify(`Invited! Token copied: ${token}`);
      } else {
        notify('Candidate invited successfully!');
      }
      setInviteEmail('');
      setInviteName('');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Checkout Credits
  const handleCheckout = async (bundle: 'STARTER_25' | 'PRO_100' | 'ENTERPRISE_300', isLive: boolean = false) => {
    setLoading(true);
    try {
      const res = await paymentApi.initiate(bundle, 'STRIPE');
      if (isLive && res.data?.checkoutUrl && res.data.checkoutUrl.startsWith('http')) {
        window.open(res.data.checkoutUrl, '_blank');
        notify('Redirecting to Stripe checkout...');
      } else if (res.data?.transactionId) {
        // Instant test checkout
        await paymentApi.testCheckout(res.data.transactionId);
        notify(`Credits added! Plan upgraded to ${bundle}`);
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
          }`}
        >
          {notification.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Code className="text-white" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  DevAssess
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Developer Assessment & Remote Proctoring Platform
              </p>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <div
                className={`w-2 h-2 rounded-full ${
                  backendHealth === 'UP' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="font-mono text-[11px]">API: {backendHealth}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => handleQuickLogin('RECRUITER')}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition"
              >
                Demo Recruiter
              </button>
              <button
                onClick={() => handleQuickLogin('CANDIDATE')}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition"
              >
                Demo Candidate
              </button>
              <button
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition"
              >
                Demo Admin
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="text-xs font-medium text-indigo-400 hidden lg:inline">
                  {currentUser.fullName}
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                    notify('Logged out');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Tab Controller */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-6">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'recruiter'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Briefcase size={18} />
            Recruiter Hub
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'candidate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code size={18} />
            Candidate Arena
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield size={18} />
            Admin Telemetry
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* TAB 1: RECRUITER HUB */}
        {activeTab === 'recruiter' && (
          <div className="space-y-6">
            {/* Credit Bundles / Stripe Purchase Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Starter Pack
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400">
                      $15 USD
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">25 Credits</h4>
                  <p className="text-xs text-slate-400">
                    Perfect for early-stage screening. Includes automatic grading & report export.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleCheckout('STARTER_25', true)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
                  >
                    <CreditCard size={14} /> Stripe Checkout
                  </button>
                  <button
                    onClick={() => handleCheckout('STARTER_25', false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    title="Instant Demo Checkout"
                  >
                    Test
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900/90 border border-indigo-500/30 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Professional Pack
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
                      $49 USD
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">100 Credits</h4>
                  <p className="text-xs text-slate-400">
                    High volume technical hiring with anti-cheat telemetry and code sandboxing.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleCheckout('PRO_100', true)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
                  >
                    <CreditCard size={14} /> Stripe Checkout
                  </button>
                  <button
                    onClick={() => handleCheckout('PRO_100', false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    title="Instant Demo Checkout"
                  >
                    Test
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Enterprise Scale
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400">
                      $129 USD
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">300 Credits</h4>
                  <p className="text-xs text-slate-400">
                    Unlimited question bank, team collaboration, dedicated webhook IPNs & custom metrics.
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleCheckout('ENTERPRISE_300', true)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
                  >
                    <CreditCard size={14} /> Stripe Checkout
                  </button>
                  <button
                    onClick={() => handleCheckout('ENTERPRISE_300', false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    title="Instant Demo Checkout"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>

            {/* Assessment Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Assessments List */}
              <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="text-indigo-400" size={20} />
                    <h3 className="font-bold text-base text-white">Active Assessments</h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Total: {assessments.length} assessments
                  </span>
                </div>

                <div className="space-y-3">
                  {assessments.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Duration: {item.durationMinutes} mins | Passing: {item.passingScore}% | Max Tab Switches: {item.maxTabSwitches}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(item);
                            assessmentApi.getReport(item.id).then((r) => setAssessmentReport(r.data)).catch(() => {});
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                        >
                          Analytics
                        </button>
                      </div>
                    </div>
                  ))}

                  {assessments.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No assessments found. Sign in as Demo Recruiter to view pre-seeded assessments.
                    </div>
                  )}
                </div>
              </div>

              {/* Invite Candidate Box */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="text-indigo-400" size={20} />
                    <h3 className="font-bold text-base text-white">Invite Candidate</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Deducts 1 credit inside a transaction and dispatches unique timed token.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Select Assessment
                      </label>
                      <select
                        value={selectedAssessment?.id || ''}
                        onChange={(e) => {
                          const found = assessments.find((a) => a.id === e.target.value);
                          setSelectedAssessment(found || null);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">Choose assessment...</option>
                        {assessments.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Candidate Email
                      </label>
                      <input
                        type="email"
                        placeholder="candidate@devassess.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Candidate Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Nusrat Jahan"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => selectedAssessment && handleInviteCandidate(selectedAssessment.id)}
                  disabled={!selectedAssessment || loading}
                  className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                >
                  <Sparkles size={14} /> Send Invitation (1 Credit)
                </button>
              </div>
            </div>

            {/* Assessment Performance Report Modal / Drawer */}
            {assessmentReport && (
              <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-base text-white">
                    📊 Leaderboard & Analytics: {assessmentReport.assessment?.title}
                  </h4>
                  <button
                    onClick={() => setAssessmentReport(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Invites</span>
                    <p className="text-lg font-bold text-white">{assessmentReport.analytics?.totalInvited || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Attempts</span>
                    <p className="text-lg font-bold text-white">{assessmentReport.analytics?.totalAttempts || 0}</p>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Pass Rate</span>
                    <p className="text-lg font-bold text-emerald-400">{assessmentReport.analytics?.passRate || 0}%</p>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Score</span>
                    <p className="text-lg font-bold text-indigo-400">{assessmentReport.analytics?.averageScore || 0}</p>
                  </div>
                </div>

                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Candidate Leaderboard
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Candidate</th>
                        <th className="pb-2">Score</th>
                        <th className="pb-2">Result</th>
                        <th className="pb-2">Anti-Cheat Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {assessmentReport.leaderboard?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 font-medium text-white">{item.candidateName}</td>
                          <td className="py-2.5">{item.totalScore} pts</td>
                          <td className="py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}
                            >
                              {item.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-400">{item.tabSwitchCount} switches</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CANDIDATE ARENA */}
        {activeTab === 'candidate' && (
          <div className="space-y-6">
            {!activeAttempt ? (
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <Terminal size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Take Coding Assessment</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Enter your unique invitation token received via email to launch the timed test environment.
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Paste Invitation Token..."
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 text-center font-mono"
                  />
                  <button
                    onClick={handleStartAttempt}
                    disabled={loading || !inviteToken}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                  >
                    <Play size={16} /> Start Timed Assessment
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Arena Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Active Assessment Session</h4>
                      <p className="text-xs text-slate-400 font-mono">Attempt ID: {activeAttempt.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-bold">
                      <AlertTriangle size={14} />
                      Tab Switches: {tabSwitches}
                    </div>
                    <button
                      onClick={handleFinalize}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition"
                    >
                      Finalize Attempt
                    </button>
                  </div>
                </div>

                {/* Workspace Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Problem Description */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400">
                          {activeProblem?.type || 'CODING'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400">
                          {activeProblem?.difficulty || 'MEDIUM'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-3">
                        {activeProblem?.title || 'Coding Problem'}
                      </h3>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {activeProblem?.description}
                      </p>

                      {/* Public Test cases */}
                      {activeProblem?.testCases && (
                        <div className="mt-6">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Sample Test Cases (Sanitized)
                          </h5>
                          <div className="space-y-2">
                            {activeProblem.testCases.map((tc: any, i: number) => (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                              >
                                <div className="text-slate-400">Input: {tc.input}</div>
                                <div className="text-emerald-400">Expected: {tc.expectedOutput}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Code Editor & Test Runner */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          JavaScript / Node.js VM Sandbox
                        </span>
                        <span className="text-xs text-indigo-400 font-mono">Isolated Context</span>
                      </div>
                      <textarea
                        rows={14}
                        value={candidateCode}
                        onChange={(e) => setCandidateCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                      />
                    </div>

                    <div className="mt-4">
                      {submissionResult && (
                        <div
                          className={`mb-4 p-3 rounded-xl border text-xs font-mono ${
                            submissionResult.testCasesPassed === submissionResult.totalTestCases
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          Passed: {submissionResult.testCasesPassed} / {submissionResult.totalTestCases} test cases
                          (Score: {submissionResult.score} pts)
                        </div>
                      )}

                      <button
                        onClick={handleSubmitCode}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                      >
                        <Play size={14} /> Run in Node.js VM Sandbox
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Final Score Report */}
            {finalScore && (
              <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-2xl text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Assessment Finalized</h4>
                <p className="text-2xl font-bold text-indigo-400 my-2">Score: {finalScore.totalScore} pts</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    finalScore.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {finalScore.passed ? 'CONGRATULATIONS: PASSED' : 'DID NOT PASS THRESHOLD'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMIN TELEMETRY */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Users
                </span>
                <span className="text-2xl font-bold text-white">{dashboardStats?.totalUsers || 0}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Revenue
                </span>
                <span className="text-2xl font-bold text-emerald-400">
                  ${dashboardStats?.totalRevenueUSD || 0} USD
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Tests
                </span>
                <span className="text-2xl font-bold text-indigo-400">
                  {dashboardStats?.activeAssessments || 0}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Completed Attempts
                </span>
                <span className="text-2xl font-bold text-cyan-400">
                  {dashboardStats?.completedAttempts || 0}
                </span>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="text-indigo-400" size={20} />
                  <h3 className="font-bold text-base text-white">Immutable Platform Audit Trail</h3>
                </div>
                <span className="text-xs text-slate-400">Live Telemetry</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Action</th>
                      <th className="pb-2">Entity</th>
                      <th className="pb-2">Actor ID</th>
                      <th className="pb-2">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 font-mono text-indigo-300">{log.action}</td>
                        <td className="py-2.5 text-slate-300">{log.entityType}</td>
                        <td className="py-2.5 font-mono text-slate-400">{log.userId?.slice(0, 8)}...</td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500">
                          No audit entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DevAssess Platform. Full-Stack Developer Assessment System.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/rashedulraha/DevAssess-Backend"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              GitHub Repo <ExternalLink size={12} />
            </a>
            <a
              href="https://devassess-alpha.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              Live API <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
