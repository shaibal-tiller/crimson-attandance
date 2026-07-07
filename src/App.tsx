import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Coffee, Loader2, ChevronRight, ChevronDown, Shield, Award,
  UserCheck, User as UserIcon, Folder, FolderOpen, ArrowRight, Sparkles
} from 'lucide-react';
import type { User } from './types';
import axios from 'axios';
import { useUser } from './context/UserContext';
import Layout from './components/Layout';

// Lazy-loaded page components for code splitting
const DashboardView = lazy(() => import('./views/DashboardView'));
const AttendanceView = lazy(() => import('./views/AttendanceView'));
const RosterView = lazy(() => import('./views/RosterView'));
const OvertimeView = lazy(() => import('./views/OvertimeView'));
const PayrollView = lazy(() => import('./views/PayrollView'));
const InventoryView = lazy(() => import('./views/InventoryView'));
const AIChatView = lazy(() => import('./views/AIChatView'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Loader2 className="w-8 h-8 text-glass-accent animate-spin" />
    </div>
  );
}

// ─── HOME PAGE ─────────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="h-[100dvh] w-full overflow-y-auto lg:overflow-hidden bg-glass-bg font-sans flex flex-col lg:flex-row relative">
      {/* Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/15 rounded-full filter blur-3xl animate-blob pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C1121F]/10 rounded-full filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-950/20 rounded-full filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

      {/* ── LEFT: Graphic / Brand Half ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-10 py-16 lg:py-0 border-b lg:border-b-0 lg:border-r border-zinc-800/50 overflow-hidden">
        {/* Coffee cup SVG illustration */}
        <div className="relative mb-8">
          <svg className="w-40 h-40 lg:w-52 lg:h-52 drop-shadow-2xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Cup body */}
            <path d="M50 80 L60 170 H140 L150 80 Z" fill="url(#cupGrad)" rx="4"/>
            {/* Cup rim */}
            <rect x="45" y="72" width="110" height="14" rx="7" fill="#3f0a0a"/>
            {/* Handle */}
            <path d="M150 100 Q180 100 180 130 Q180 160 150 155" stroke="#5c1a1a" strokeWidth="10" fill="none" strokeLinecap="round"/>
            {/* Coffee surface */}
            <ellipse cx="100" cy="86" rx="45" ry="8" fill="#1a0806" opacity="0.9"/>
            {/* Steam lines */}
            <path d="M80 65 Q77 50 82 38 Q87 26 83 15" stroke="#C1121F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="0 0" to="0 -8" dur="2s" repeatCount="indefinite" additive="sum"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
            </path>
            <path d="M100 58 Q97 42 102 30 Q107 18 103 6" stroke="#C1121F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="0 0" to="0 -8" dur="2.4s" repeatCount="indefinite" additive="sum"/>
              <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite"/>
            </path>
            <path d="M120 62 Q117 46 122 34 Q127 22 123 10" stroke="#C1121F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6">
              <animateTransform attributeName="transform" attributeType="XML" type="translate" from="0 0" to="0 -8" dur="2.8s" repeatCount="indefinite" additive="sum"/>
              <animate attributeName="opacity" from="0.6" to="0" dur="2.8s" repeatCount="indefinite"/>
            </path>
            {/* Plate */}
            <ellipse cx="100" cy="170" rx="60" ry="8" fill="#2a0808" opacity="0.7"/>
            <defs>
              <linearGradient id="cupGrad" x1="50" y1="80" x2="150" y2="170" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#5c1a1a"/>
                <stop offset="100%" stopColor="#1a0404"/>
              </linearGradient>
            </defs>
          </svg>
          {/* Glow ring under cup */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 lg:w-44 lg:h-44 rounded-full bg-red-900/10 blur-2xl"/>
          </div>
        </div>

        <h1 className="text-3xl lg:text-5xl font-extrabold text-white text-center leading-tight tracking-tight">
          Crimson Cup <span className="text-glass-accent">BD</span>
        </h1>
        <p className="mt-4 text-zinc-400 text-sm lg:text-base text-center max-w-xs lg:max-w-sm leading-relaxed">
          The intelligence behind every cup. Smart attendance, payroll & inventory management for your coffee brand.
        </p>

        {/* Feature Pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {['Attendance', 'Payroll', 'Roster & Leave', 'Inventory', 'AI Insights'].map(f => (
            <span key={f} className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              {f}
            </span>
          ))}
        </div>

        {/* Bottom badge */}
        <div className="mt-10 flex items-center space-x-1.5 text-zinc-600 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-glass-accent/50" />
          <span>Powered by Gemini AI · Neon DB · React</span>
        </div>
      </div>

      {/* ── RIGHT: Auth Panel ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 py-12 lg:py-0">
        <div className="w-full max-w-sm">
          {/* Logo mark */}
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-glass-accent flex items-center justify-center shadow-lg shadow-glass-accent/30">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold leading-none">Crimson Cup ERP</p>
              <p className="text-zinc-500 text-xs mt-0.5">Staff Management Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-zinc-400 text-sm mb-8">Select your access level to continue.</p>

          {/* CTA Buttons */}
          <div className="space-y-4">
            <Link
              to="/login"
              className="group flex items-center justify-between w-full px-5 py-4 bg-glass-accent hover:bg-glass-accent/90 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg shadow-glass-accent/20 hover:shadow-glass-accent/30 active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <UserIcon className="w-5 h-5 opacity-90" />
                <span>Sign In as Team Member</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="group flex items-center justify-between w-full px-5 py-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-white rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <span>Manager / Admin Portal</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-zinc-400" />
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800/50">
            <p className="text-zinc-600 text-xs text-center">
              Crimson Cup BD · All branches connected · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM PORTAL (Finder Style) ─────────────────────────────────────────────
function TeamPortalPage() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    axios.get('/api/users')
      .then(res => {
        const data = res.data;
        if (data?.length > 0) {
          const formatted = data.map((u: any) => ({
            id: u.uid, name: u.name, role: u.role,
            branchId: u.branchId, branchName: u.branchName, avatar: u.avatar
          }));
          setAllUsers(formatted);
          // Auto-select the first branch
          const firstBranch = [...new Map(formatted.filter((u: any) => u.role !== 'Admin').map((u: any) => [u.branchId, u.branchName])).entries()];
          if (firstBranch.length > 0) {
            setSelectedBranch(firstBranch[0][0]);
          }
        }
      })
      .catch(err => console.error('Failed to load users', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    navigate('/dashboard', { replace: true });
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => ({ ...prev, [branchId]: !prev[branchId] }));
    setSelectedBranch(branchId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-glass-bg text-glass-text">
        <div className="flex items-center space-x-3">
          <Coffee className="w-6 h-6 text-glass-accent animate-pulse" />
          <span className="font-semibold">Loading Team Portal...</span>
        </div>
      </div>
    );
  }

  // Build hierarchy
  const admins = allUsers.filter(u => u.role === 'Admin');
  const branchMap: Record<string, { name: string; managers: any[]; supervisors: any[]; employees: any[] }> = {};
  allUsers.forEach(u => {
    if (u.role === 'Admin') return;
    if (!branchMap[u.branchId]) {
      branchMap[u.branchId] = { name: u.branchName, managers: [], supervisors: [], employees: [] };
    }
    if (u.role === 'Manager') branchMap[u.branchId].managers.push(u);
    else if (u.role === 'Supervisor') branchMap[u.branchId].supervisors.push(u);
    else branchMap[u.branchId].employees.push(u);
  });

  const contentUsers: any[] = selectedBranch && branchMap[selectedBranch]
    ? [
        ...branchMap[selectedBranch].managers,
        ...branchMap[selectedBranch].supervisors,
        ...branchMap[selectedBranch].employees
      ]
    : admins;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Manager': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Supervisor': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="w-3 h-3" />;
      case 'Manager': return <Award className="w-3 h-3" />;
      case 'Supervisor': return <UserCheck className="w-3 h-3" />;
      default: return <UserIcon className="w-3 h-3" />;
    }
  };

  // Group content users by role for section headers
  const grouped: Record<string, any[]> = {};
  contentUsers.forEach(u => {
    if (!grouped[u.role]) grouped[u.role] = [];
    grouped[u.role].push(u);
  });
  const roleOrder = ['Admin', 'Manager', 'Supervisor', 'Employee'];
  const sortedGroups = roleOrder.filter(r => grouped[r]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-glass-bg text-glass-text font-sans flex flex-col relative">
      {/* Blob background */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-900/10 rounded-full filter blur-3xl animate-blob pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#C1121F]/8 rounded-full filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-glass-border bg-glass-panel backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <div className="w-7 h-7 rounded-lg bg-glass-accent flex items-center justify-center">
              <Coffee className="w-4 h-4 text-white" />
            </div>
          </Link>
          <span className="text-glass-text font-semibold text-sm">Team Portal</span>
          <span className="text-glass-text-muted text-xs">/ Select Profile</span>
        </div>
        <Link to="/" className="text-xs text-glass-text-muted hover:text-glass-text transition">← Back</Link>
      </div>

      {/* Finder Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Sidebar (Branch Folders) ── */}
        <div className="w-56 shrink-0 border-r border-glass-border bg-glass-panel/20 overflow-y-auto flex flex-col">
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-2 mb-1">Branches</p>
          </div>

          {/* Admin section in sidebar */}
          <button
            onClick={() => setSelectedBranch(null)}
            className={`flex items-center space-x-2.5 px-3 py-2 mx-2 rounded-lg text-sm transition-all ${selectedBranch === null ? 'bg-glass-accent text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
          >
            <Shield className={`w-4 h-4 shrink-0 ${selectedBranch === null ? 'text-white' : 'text-red-500'}`} />
            <span className="truncate font-medium">HQ Admin</span>
            <span className="ml-auto text-[10px] opacity-60">{admins.length}</span>
          </button>

          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-2 mb-1">Branches</p>
          </div>

          {Object.entries(branchMap).map(([branchId, branch]) => {
            const isOpen = expandedBranches[branchId];
            const isSelected = selectedBranch === branchId;
            const totalCount = branch.managers.length + branch.supervisors.length + branch.employees.length;
            return (
              <div key={branchId}>
                <button
                  onClick={() => toggleBranch(branchId)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 mx-2 rounded-lg text-sm transition-all group ${isSelected ? 'bg-glass-accent text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                  style={{ width: 'calc(100% - 1rem)' }}
                >
                  {isOpen
                    ? <FolderOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                    : <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500/70'}`} />
                  }
                  <span className="truncate font-medium text-left">{branch.name}</span>
                  <span className="ml-auto text-[10px] opacity-60 shrink-0">{totalCount}</span>
                  {isOpen
                    ? <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                    : <ChevronRight className="w-3 h-3 shrink-0 opacity-30" />
                  }
                </button>
              </div>
            );
          })}

          <div className="flex-1" />
          <div className="px-4 py-4 border-t border-zinc-800/40">
            <p className="text-[10px] text-zinc-600">{allUsers.length} total members</p>
          </div>
        </div>

        {/* ── Content Panel (User List) ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Content header */}
          <div className="sticky top-0 z-10 px-6 py-3 bg-glass-panel backdrop-blur-md border-b border-glass-border flex items-center space-x-2">
            {selectedBranch === null
              ? <><Shield className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-glass-text">HQ Administration</span></>
              : <><FolderOpen className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-glass-text">{branchMap[selectedBranch]?.name}</span></>
            }
            <span className="text-xs text-glass-text-muted ml-1">— click a name to sign in</span>
          </div>

          {/* User Rows grouped by role */}
          <div className="px-6 py-4">
            {sortedGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Select a branch from the sidebar</p>
              </div>
            ) : (
              sortedGroups.map(role => (
                <div key={role} className="mb-6">
                  {/* Role section header */}
                  <div className="flex items-center space-x-2 mb-2 pb-1 border-b border-zinc-800/40">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleColor(role)}`}>
                      {getRoleIcon(role)}
                      <span>{role}s</span>
                    </span>
                    <span className="text-[10px] text-zinc-600">{grouped[role].length} {grouped[role].length === 1 ? 'person' : 'people'}</span>
                  </div>

                  {/* Individual user rows */}
                  <div className="space-y-0.5">
                    {grouped[role].map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => handleLogin(u)}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-all group text-left active:scale-[0.99]"
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-800 group-hover:border-zinc-700 transition">
                          <img
                            src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Name */}
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition truncate">{u.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{u.branchName}</p>
                        </div>
                        {/* Sign-in arrow */}
                        <div className="ml-3 shrink-0 opacity-0 group-hover:opacity-100 transition-all flex items-center space-x-1 text-glass-accent text-xs font-medium">
                          <span>Sign in</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROUTER ────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<TeamPortalPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardView /></Suspense>} />
        <Route path="/attendance" element={<Suspense fallback={<PageLoader />}><AttendanceView /></Suspense>} />
        <Route path="/roster" element={<Suspense fallback={<PageLoader />}><RosterView /></Suspense>} />
        <Route path="/overtime" element={<Suspense fallback={<PageLoader />}><OvertimeView /></Suspense>} />
        <Route path="/payroll" element={<Suspense fallback={<PageLoader />}><PayrollView /></Suspense>} />
        <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><InventoryView /></Suspense>} />
        <Route path="/ai" element={<Suspense fallback={<PageLoader />}><AIChatView /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
