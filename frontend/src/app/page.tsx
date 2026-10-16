'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Send,
  Award,
  TrendingUp,
  FileText,
  Lock,
  Eye,
  Check,
  Copy,
  BarChart3,
  HelpCircle,
  Zap,
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateProblemModal, setShowCreateProblemModal] = useState(false);
  const [showCreateAssessmentModal, setShowCreateAssessmentModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Auth form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authRole, setAuthRole] = useState<'RECRUITER' | 'CANDIDATE'>('RECRUITER');
  const [authCompanyName, setAuthCompanyName] = useState('');

  // Recruiter states
  const [assessments, setAssessments] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [assessmentReport, setAssessmentReport] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [latestGeneratedToken, setLatestGeneratedToken] = useState('');

  // New Problem Form state
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    type: 'CODING',
    difficulty: 'MEDIUM',
    points: 25,
    tags: 'algorithms, strings',
    starterCode: 'function solution(input) {\n  // Write your solution here\n  return input;\n}',
    testInput: '[2, 7, 11, 15], 9',
    expectedOutput: '[0, 1]',
  });

  // New Assessment Form state
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    passingScore: 60,
    maxTabSwitches: 3,
    selectedProblemIds: [] as string[],
  });

  // Candidate Assessment Arena states
  const [inviteToken, setInviteToken] = useState('');
  const [activeAttempt, setActiveAttempt] = useState<any>(null);
  const [activeProblem, setActiveProblem] = useState<any>(null);
  const [candidateCode, setCandidateCode] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [finalScore, setFinalScore] = useState<any>(null);
  const [antiCheatWarning, setAntiCheatWarning] = useState<string | null>(null);

  // Admin states
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  // Notification Toast Helper
  const notify = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
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
    const interval = setInterval(checkHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Current User on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi
        .getMe()
        .then((res) => {
          if (res?.data) setCurrentUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
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
        notify(`Welcome back, ${res.data.user.fullName}!`, 'success');
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

  // Handle Manual Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const res = await authApi.login({ email: authEmail, password: authPassword });
        localStorage.setItem('token', res.data.accessToken);
        setCurrentUser(res.data.user);
        notify(`Welcome, ${res.data.user.fullName}!`);
        setShowAuthModal(false);
      } else {
        const res = await authApi.register({
          fullName: authFullName,
          email: authEmail,
          password: authPassword,
          role: authRole,
          companyName: authCompanyName,
        });
        notify('Account created! Please sign in with your credentials.');
        setAuthMode('login');
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Tab Data dynamically
  const refreshTabData = () => {
    if (activeTab === 'recruiter') {
      problemApi.getAll().then((res) => setProblems(res.data || [])).catch(() => {});
      assessmentApi.getAll().then((res) => setAssessments(res.data || [])).catch(() => {});
    } else if (activeTab === 'admin') {
      adminApi.getStats().then((res) => setDashboardStats(res.data)).catch(() => {});
      adminApi.getAuditLogs().then((res) => setAuditLogs(res.data || [])).catch(() => {});
      adminApi.getUsers().then((res) => setAdminUsers(res.data || [])).catch(() => {});
    }
  };

  useEffect(() => {
    refreshTabData();
  }, [activeTab]);

  // Anti-cheat watchdog for candidate session
  useEffect(() => {
    if (!activeAttempt) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
        setAntiCheatWarning('⚠️ Proctoring Alert: Tab switch detected and reported to recruiter!');
        attemptApi
          .logAntiCheat(activeAttempt.id, 'TAB_SWITCH', {
            hiddenAt: new Date().toISOString(),
          })
          .catch(() => {});
        setTimeout(() => setAntiCheatWarning(null), 5000);
      }
    };

    const handleBlur = () => {
      attemptApi
        .logAntiCheat(activeAttempt.id, 'WINDOW_BLUR', {
          blurAt: new Date().toISOString(),
        })
        .catch(() => {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activeAttempt]);

  // Assessment Timer Countdown
  useEffect(() => {
    if (!activeAttempt || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalize();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAttempt, timeRemaining]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Candidate Start Attempt
  const handleStartAttempt = async () => {
    if (!inviteToken) {
      notify('Please provide an invitation token', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await attemptApi.start(inviteToken.trim());
      setActiveAttempt(res.data.attempt);
      const firstProblem = res.data.problems?.[0];
      if (firstProblem) {
        setActiveProblem(firstProblem);
        setCandidateCode(firstProblem.starterCode?.javascript || firstProblem.starterCode || '');
      }
      setTimeRemaining((res.data.attempt?.durationMinutes || 60) * 60);
      notify('Assessment started! Good luck on your technical interview.', 'success');
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
      notify(
        `Code Evaluated! Passed: ${res.data?.testCasesPassed || 0}/${res.data?.totalTestCases || 0} tests`,
        'success'
      );
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
      notify('Assessment finalized and scores computed!', 'success');
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Create Problem
  const handleCreateProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await problemApi.create({
        title: newProblem.title,
        description: newProblem.description,
        type: newProblem.type,
        difficulty: newProblem.difficulty,
        points: Number(newProblem.points),
        tags: newProblem.tags.split(',').map((t) => t.trim()),
        starterCode: newProblem.starterCode,
        testCases: [
          {
            input: newProblem.testInput,
            expectedOutput: newProblem.expectedOutput,
            isHidden: false,
            points: Number(newProblem.points),
          },
        ],
      });
      notify('Problem created in bank successfully!');
      setShowCreateProblemModal(false);
      refreshTabData();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Create Assessment
  const handleCreateAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAssessment.selectedProblemIds.length === 0) {
      notify('Please select at least one problem to attach', 'error');
      return;
    }
    setLoading(true);
    try {
      await assessmentApi.create({
        title: newAssessment.title,
        description: newAssessment.description,
        durationMinutes: Number(newAssessment.durationMinutes),
        passingScore: Number(newAssessment.passingScore),
        maxTabSwitches: Number(newAssessment.maxTabSwitches),
        problems: newAssessment.selectedProblemIds.map((pId, idx) => ({
          problemId: pId,
          orderIndex: idx,
        })),
      });
      notify('Assessment assembled and published!');
      setShowCreateAssessmentModal(false);
      refreshTabData();
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
        setLatestGeneratedToken(token);
        setInviteToken(token);
        notify(`Candidate Invited! Timed token: ${token}`, 'success');
      } else {
        notify('Candidate invitation dispatched!', 'success');
      }
      setInviteEmail('');
      setInviteName('');
      setShowInviteModal(false);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Recruiter Checkout Credits (Stripe)
  const handleCheckout = async (bundle: 'STARTER_25' | 'PRO_100' | 'ENTERPRISE_300', isLive: boolean = false) => {
    setLoading(true);
    try {
      const res = await paymentApi.initiate(bundle, 'STRIPE');
      if (isLive && res.data?.checkoutUrl && res.data.checkoutUrl.startsWith('http')) {
        window.open(res.data.checkoutUrl, '_blank');
        notify('Opening secure Stripe Checkout...');
      } else if (res.data?.transactionId) {
        // Instant test checkout
        await paymentApi.testCheckout(res.data.transactionId);
        notify(`Payment verified! Assessment credits added to account.`, 'success');
        setShowPaymentModal(false);
        refreshTabData();
      }
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6] flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Apple-style subtle ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-indigo-600/10 via-cyan-500/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-3 ${
            notification.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-200 shadow-rose-950/50'
              : notification.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/30 text-amber-200 shadow-amber-950/50'
              : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle size={18} className="text-rose-400" />
          ) : (
            <CheckCircle size={18} className="text-emerald-400" />
          )}
          <span className="text-xs font-medium tracking-wide">{notification.message}</span>
        </div>
      )}

      {/* Anti-cheat sticky banner if triggered */}
      {antiCheatWarning && (
        <div className="fixed top-16 inset-x-0 z-50 bg-rose-600/90 text-white text-xs font-semibold py-2 px-4 text-center backdrop-blur-md shadow-lg border-b border-rose-400/30 flex items-center justify-center gap-2 animate-bounce">
          <AlertTriangle size={16} />
          {antiCheatWarning}
        </div>
      )}

      {/* Navigation Header (Apple Frosted Glass) */}
      <header className="sticky top-0 z-40 bg-[#090a0f]/75 backdrop-blur-2xl border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/10">
              <Code className="text-white" size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">
                  DevAssess
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-normal">
                Developer Assessment & Remote Proctoring
              </p>
            </div>
          </div>

          {/* Role Controls & Live Status */}
          <div className="flex items-center gap-3">
            {/* Backend Health Status */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  backendHealth === 'UP' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-mono tracking-wider">
                {backendHealth === 'UP' ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>

            {/* Quick Demo Login Switcher */}
            <div className="hidden lg:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => handleQuickLogin('RECRUITER')}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
              >
                Recruiter
              </button>
              <button
                onClick={() => handleQuickLogin('CANDIDATE')}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
              >
                Candidate
              </button>
              <button
                onClick={() => handleQuickLogin('ADMIN')}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
              >
                Admin
              </button>
            </div>

            {/* User Session Actions */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white">{currentUser.fullName}</div>
                  <div className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase">
                    {currentUser.role}
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                    notify('Signed out successfully');
                  }}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-white text-black hover:bg-slate-200 transition shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Apple-style Segmented Control Navigation */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-6">
        <div className="inline-flex p-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('recruiter')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'recruiter'
                ? 'bg-white text-black shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Briefcase size={15} />
            Recruiter Studio
          </button>
          <button
            onClick={() => setActiveTab('candidate')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'candidate'
                ? 'bg-white text-black shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Code size={15} />
            Candidate Arena
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-black shadow-lg shadow-black/20'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Shield size={15} />
            Admin Telemetry
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* ============================================================ */}
        {/* TAB 1: RECRUITER STUDIO */}
        {/* ============================================================ */}
        {activeTab === 'recruiter' && (
          <div className="space-y-6">
            {/* Top Bar: Company Credits & Quick Actions */}
            <div className="apple-glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Organization Overview
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    TechCorp BD
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Recruiter Studio</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Author questions, assemble timed assessments, invite candidates, and monitor live test submissions with automated grading.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-2 transition shadow-lg shadow-indigo-600/25 border border-indigo-400/20"
                >
                  <CreditCard size={15} /> Buy Assessment Credits
                </button>
                <button
                  onClick={() => setShowCreateProblemModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08] flex items-center gap-1.5 transition"
                >
                  <Plus size={15} /> New Problem
                </button>
                <button
                  onClick={() => setShowCreateAssessmentModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-white border border-white/[0.08] flex items-center gap-1.5 transition"
                >
                  <Plus size={15} /> New Assessment
                </button>
              </div>
            </div>

            {/* Assessment & Problem Bank Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessments List */}
              <div className="apple-glass-card rounded-3xl p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Layers className="text-indigo-400" size={18} />
                    <h3 className="font-semibold text-sm text-white">Created Assessments</h3>
                  </div>
                  <span className="text-xs text-slate-400">{assessments.length} Active</span>
                </div>

                <div className="space-y-3">
                  {assessments.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-white">{item.title}</h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              item.status === 'PUBLISHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {item.durationMinutes} mins | Pass: {item.passingScore}% | Max switches: {item.maxTabSwitches}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(item);
                            setShowInviteModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-slate-200 border border-white/[0.06] transition flex items-center gap-1"
                        >
                          <Send size={12} /> Invite
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssessment(item);
                            assessmentApi.getReport(item.id).then((r) => setAssessmentReport(r.data)).catch(() => {});
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-xs font-medium text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
                        >
                          <BarChart3 size={12} /> Report
                        </button>
                      </div>
                    </div>
                  ))}

                  {assessments.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No assessments found. Click &quot;New Assessment&quot; to assemble one.
                    </div>
                  )}
                </div>
              </div>

              {/* Problem Bank List */}
              <div className="apple-glass-card rounded-3xl p-6 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Database className="text-cyan-400" size={18} />
                    <h3 className="font-semibold text-sm text-white">Problem Bank</h3>
                  </div>
                  <span className="text-xs text-slate-400">{problems.length} Questions</span>
                </div>

                <div className="space-y-3">
                  {problems.map((prob) => (
                    <div
                      key={prob.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm text-white">{prob.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                            {prob.type}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              prob.difficulty === 'EASY'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : prob.difficulty === 'MEDIUM'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {prob.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{prob.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {prob.tags?.map((t: string, idx: number) => (
                          <span key={idx} className="text-[10px] text-slate-500">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {problems.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No problems found. Click &quot;New Problem&quot; to author one.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Performance Analytics Modal */}
            {assessmentReport && (
              <div className="apple-glass-card rounded-3xl p-6 border border-indigo-500/30 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      📊 Performance Report: {assessmentReport.assessment?.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Real-time candidate leaderboard and pass-fail distribution (Cached in Redis Cloud)
                    </p>
                  </div>
                  <button
                    onClick={() => setAssessmentReport(null)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                  >
                    Close Report
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Invited
                    </span>
                    <span className="text-xl font-bold text-white mt-1 block">
                      {assessmentReport.analytics?.totalInvited || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Attempts
                    </span>
                    <span className="text-xl font-bold text-indigo-400 mt-1 block">
                      {assessmentReport.analytics?.totalAttempts || 0}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Pass Rate
                    </span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">
                      {assessmentReport.analytics?.passRate || 0}%
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Average Score
                    </span>
                    <span className="text-xl font-bold text-cyan-400 mt-1 block">
                      {assessmentReport.analytics?.averageScore || 0} pts
                    </span>
                  </div>
                </div>

                {/* Candidate Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-slate-400">
                        <th className="pb-3 font-medium">Candidate Name</th>
                        <th className="pb-3 font-medium">Score</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Proctoring Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {assessmentReport.leaderboard?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-medium text-white">{item.candidateName}</td>
                          <td className="py-3 text-slate-300 font-mono">{item.totalScore} pts</td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                item.passed
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {item.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">
                            {item.tabSwitchCount > 0 ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <AlertTriangle size={12} /> {item.tabSwitchCount} tab switch(es)
                              </span>
                            ) : (
                              <span className="text-emerald-400">No violations</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CANDIDATE EXAM ARENA */}
        {/* ============================================================ */}
        {activeTab === 'candidate' && (
          <div className="space-y-6">
            {!activeAttempt ? (
              <div className="max-w-lg mx-auto apple-glass-card rounded-3xl p-8 border border-white/[0.08] text-center shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                  <Terminal size={24} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Candidate Coding Arena</h3>
                <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
                  Enter your assessment invitation token below. Once started, full-screen proctoring, timer countdown, and isolated code evaluation will initiate.
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Paste Invitation Token..."
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value)}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-center tracking-wider"
                  />

                  {latestGeneratedToken && (
                    <button
                      onClick={() => setInviteToken(latestGeneratedToken)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline block mx-auto"
                    >
                      Use latest recruiter-generated token: {latestGeneratedToken.slice(0, 16)}...
                    </button>
                  )}

                  <button
                    onClick={handleStartAttempt}
                    disabled={loading || !inviteToken}
                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30"
                  >
                    <Play size={15} /> Launch Assessment
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Session Top Bar */}
                <div className="apple-glass-card rounded-2xl p-4 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Active Proctoring Session</h4>
                      <p className="text-[11px] font-mono text-slate-400">Session ID: {activeAttempt.id.slice(0, 18)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Countdown Timer */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono font-bold text-indigo-300">
                      <Clock size={14} />
                      {formatTimer(timeRemaining)}
                    </div>

                    {/* Anti-cheat tab switches indicator */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                      <AlertTriangle size={14} />
                      Tab Switches: {tabSwitches}
                    </div>

                    <button
                      onClick={handleFinalize}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition"
                    >
                      Finalize Attempt
                    </button>
                  </div>
                </div>

                {/* LeetCode-style Split Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Problem Statement & Test Cases */}
                  <div className="apple-glass-card rounded-3xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {activeProblem?.type || 'CODING'}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {activeProblem?.difficulty || 'MEDIUM'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {activeProblem?.points || 25} Points
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{activeProblem?.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {activeProblem?.description}
                      </p>

                      {/* Public Sample Test Cases */}
                      {activeProblem?.testCases && (
                        <div className="mt-6 space-y-3">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Sample Assertions (Sanitized)
                          </h5>
                          {activeProblem.testCases.map((tc: any, i: number) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] text-xs font-mono space-y-1"
                            >
                              <div className="text-slate-400">Input: {tc.input}</div>
                              <div className="text-emerald-400">Expected: {tc.expectedOutput}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] text-[11px] text-slate-500">
                      ℹ️ Secret test cases are validated automatically during sandbox evaluation.
                    </div>
                  </div>

                  {/* Right: Code Sandbox & Runner */}
                  <div className="apple-glass-card rounded-3xl p-6 border border-white/[0.08] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] mb-3">
                        <span className="text-xs font-bold text-slate-300">JavaScript Sandbox</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                          Node.js VM
                        </span>
                      </div>
                      <textarea
                        rows={14}
                        value={candidateCode}
                        onChange={(e) => setCandidateCode(e.target.value)}
                        className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-4 text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none shadow-inner"
                      />
                    </div>

                    <div>
                      {submissionResult && (
                        <div
                          className={`mb-4 p-3 rounded-2xl border text-xs font-mono ${
                            submissionResult.testCasesPassed === submissionResult.totalTestCases
                              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          ✓ Passed {submissionResult.testCasesPassed} / {submissionResult.totalTestCases} test cases
                          (Earned: {submissionResult.score} pts)
                        </div>
                      )}

                      <button
                        onClick={handleSubmitCode}
                        disabled={loading}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30"
                      >
                        <Play size={14} /> Run in Node.js VM Sandbox
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finalized Score Card Modal */}
            {finalScore && (
              <div className="max-w-md mx-auto apple-glass-card rounded-3xl p-8 border border-white/[0.08] text-center shadow-2xl">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Assessment Finished</h3>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {finalScore.totalScore} pts
                  </span>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                        finalScore.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {finalScore.passed ? 'PASSED TECHNICAL THRESHOLD' : 'DID NOT MEET PASSING SCORE'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  Your responses have been recorded and forwarded to the recruiting team for review.
                </p>
                <button
                  onClick={() => setFinalScore(null)}
                  className="mt-6 w-full py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-bold transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ADMIN TELEMETRY */}
        {/* ============================================================ */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {/* KPI Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="apple-glass-card rounded-3xl p-5 border border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Registered Users
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {dashboardStats?.totalUsers || 0}
                </span>
              </div>
              <div className="apple-glass-card rounded-3xl p-5 border border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Revenue
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                  ${dashboardStats?.totalRevenueUSD || 0} USD
                </span>
              </div>
              <div className="apple-glass-card rounded-3xl p-5 border border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Assessments
                </span>
                <span className="text-2xl font-bold text-indigo-400 mt-1 block">
                  {dashboardStats?.activeAssessments || 0}
                </span>
              </div>
              <div className="apple-glass-card rounded-3xl p-5 border border-white/[0.08]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completed Attempts
                </span>
                <span className="text-2xl font-bold text-cyan-400 mt-1 block">
                  {dashboardStats?.completedAttempts || 0}
                </span>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="apple-glass-card rounded-3xl p-6 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Activity className="text-indigo-400" size={18} />
                  <h3 className="font-semibold text-sm text-white">Immutable Platform Audit Trail</h3>
                </div>
                <span className="text-xs text-slate-400">Live Telemetry</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-slate-400">
                      <th className="pb-3 font-medium">Action</th>
                      <th className="pb-3 font-medium">Entity</th>
                      <th className="pb-3 font-medium">Actor</th>
                      <th className="pb-3 font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-mono text-indigo-300 font-semibold">{log.action}</td>
                        <td className="py-3 text-slate-300">{log.entityType}</td>
                        <td className="py-3 font-mono text-slate-400">{log.userId?.slice(0, 8)}...</td>
                        <td className="py-3 text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-500">
                          No audit events recorded yet.
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

      {/* ============================================================ */}
      {/* MODAL 1: STRIPE CREDIT BUNDLES PURCHASE */}
      {/* ============================================================ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="apple-glass-card border border-white/[0.12] rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-lg font-bold text-white">Top Up Assessment Credits</h3>
                <p className="text-xs text-slate-400">
                  Select a bundle below to initiate a real Stripe checkout session or instant demo test.
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Starter */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/50 transition flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starter</span>
                  <h4 className="text-xl font-bold text-white mt-1">$15 USD</h4>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">25 Credits</p>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleCheckout('STARTER_25', true)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center justify-center gap-1"
                  >
                    <CreditCard size={12} /> Stripe
                  </button>
                  <button
                    onClick={() => handleCheckout('STARTER_25', false)}
                    className="w-full py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 transition"
                  >
                    Instant Demo
                  </button>
                </div>
              </div>

              {/* Pro */}
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 relative flex flex-col justify-between">
                <span className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Popular
                </span>
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Professional</span>
                  <h4 className="text-xl font-bold text-white mt-1">$49 USD</h4>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">100 Credits</p>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleCheckout('PRO_100', true)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/30"
                  >
                    <CreditCard size={12} /> Stripe
                  </button>
                  <button
                    onClick={() => handleCheckout('PRO_100', false)}
                    className="w-full py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 transition"
                  >
                    Instant Demo
                  </button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/50 transition flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enterprise</span>
                  <h4 className="text-xl font-bold text-white mt-1">$129 USD</h4>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">300 Credits</p>
                </div>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleCheckout('ENTERPRISE_300', true)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center justify-center gap-1"
                  >
                    <CreditCard size={12} /> Stripe
                  </button>
                  <button
                    onClick={() => handleCheckout('ENTERPRISE_300', false)}
                    className="w-full py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 transition"
                  >
                    Instant Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: CREATE PROBLEM */}
      {/* ============================================================ */}
      {showCreateProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="apple-glass-card border border-white/[0.12] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Create New Problem</h3>
              <button onClick={() => setShowCreateProblemModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProblemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Problem Title</label>
                <input
                  type="text"
                  required
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  placeholder="e.g. Reverse Linked List"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Type</label>
                  <select
                    value={newProblem.type}
                    onChange={(e) => setNewProblem({ ...newProblem, type: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CODING">CODING</option>
                    <option value="MCQ">MCQ</option>
                    <option value="WRITTEN">WRITTEN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Difficulty</label>
                  <select
                    value={newProblem.difficulty}
                    onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Points</label>
                  <input
                    type="number"
                    value={newProblem.points}
                    onChange={(e) => setNewProblem({ ...newProblem, points: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  placeholder="Explain the problem statement..."
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newProblem.tags}
                  onChange={(e) => setNewProblem({ ...newProblem, tags: e.target.value })}
                  placeholder="algorithms, arrays"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Sample Test Input</label>
                <input
                  type="text"
                  value={newProblem.testInput}
                  onChange={(e) => setNewProblem({ ...newProblem, testInput: e.target.value })}
                  placeholder="[2, 7, 11, 15], 9"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Expected Output</label>
                <input
                  type="text"
                  value={newProblem.expectedOutput}
                  onChange={(e) => setNewProblem({ ...newProblem, expectedOutput: e.target.value })}
                  placeholder="[0, 1]"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-4 transition"
              >
                Save Problem to Bank
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: CREATE ASSESSMENT */}
      {/* ============================================================ */}
      {showCreateAssessmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="apple-glass-card border border-white/[0.12] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Assemble Assessment</h3>
              <button onClick={() => setShowCreateAssessmentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAssessmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer Test"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={newAssessment.description}
                  onChange={(e) => setNewAssessment({ ...newAssessment, description: e.target.value })}
                  placeholder="Evaluation guidelines..."
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newAssessment.durationMinutes}
                    onChange={(e) => setNewAssessment({ ...newAssessment, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Passing %</label>
                  <input
                    type="number"
                    value={newAssessment.passingScore}
                    onChange={(e) => setNewAssessment({ ...newAssessment, passingScore: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Max Tab Switches</label>
                  <input
                    type="number"
                    value={newAssessment.maxTabSwitches}
                    onChange={(e) => setNewAssessment({ ...newAssessment, maxTabSwitches: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Problems from Bank</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-black/30 rounded-xl border border-white/[0.06]">
                  {problems.map((p) => {
                    const isSelected = newAssessment.selectedProblemIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          const updated = isSelected
                            ? newAssessment.selectedProblemIds.filter((id) => id !== p.id)
                            : [...newAssessment.selectedProblemIds, p.id];
                          setNewAssessment({ ...newAssessment, selectedProblemIds: updated });
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                          isSelected ? 'bg-indigo-600/30 text-white border border-indigo-500/40' : 'hover:bg-white/[0.04] text-slate-400'
                        }`}
                      >
                        <span className="font-medium">{p.title}</span>
                        <span className="text-[10px] uppercase font-bold">{p.difficulty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-4 transition"
              >
                Assemble & Publish Assessment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: INVITE CANDIDATE */}
      {/* ============================================================ */}
      {showInviteModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="apple-glass-card border border-white/[0.12] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Invite to {selectedAssessment.title}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Inviting a candidate deducts 1 credit inside a transaction and dispatches a secure invitation token.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Candidate Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="candidate@devassess.com"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Candidate Name (Optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nusrat Jahan"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => handleInviteCandidate(selectedAssessment.id)}
                disabled={loading || !inviteEmail}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-3 transition"
              >
                Send Invite (1 Credit)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: SIGN IN / REGISTER */}
      {/* ============================================================ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="apple-glass-card border border-white/[0.12] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">
                {authMode === 'login' ? 'Sign In to DevAssess' : 'Create an Account'}
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Tanvir Ahmed"
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Role</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as any)}
                      className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-2 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="RECRUITER">RECRUITER (Hiring Manager)</option>
                      <option value="CANDIDATE">CANDIDATE (Job Seeker)</option>
                    </select>
                  </div>
                  {authRole === 'RECRUITER' && (
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Company Name</label>
                      <input
                        type="text"
                        value={authCompanyName}
                        onChange={(e) => setAuthCompanyName(e.target.value)}
                        placeholder="Pathao Engineering"
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold mt-4 transition"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-slate-400 hover:text-indigo-300 text-[11px]"
                >
                  {authMode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer (Apple Subtle Minimal) */}
      <footer className="border-t border-white/[0.06] bg-[#090a0f] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="tracking-tight">
            © 2026 DevAssess Platform. Engineered with Apple-grade design and fullstack precision.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/rashedulraha/DevAssess-Backend"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition flex items-center gap-1.5"
            >
              GitHub Repository <ExternalLink size={12} />
            </a>
            <a
              href="https://devassess-alpha.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition flex items-center gap-1.5"
            >
              Live API Gateway <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
