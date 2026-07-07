import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Coffee, Loader2, ChevronDown, ChevronRight, Users, Shield, Award, UserCheck, User as UserIcon } from 'lucide-react';
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

function UserNodeCard({ u, onLogin }: { u: User; onLogin: (u: User) => void; key?: any }) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="w-3.5 h-3.5 text-red-500" />;
      case 'Manager': return <Award className="w-3.5 h-3.5 text-amber-500" />;
      case 'Supervisor': return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <UserIcon className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Manager': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Supervisor': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const avatarUrl = (u as any).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff`;

  return (
    <button
      onClick={() => onLogin(u)}
      className="flex items-center p-3 bg-zinc-900/40 hover:bg-zinc-800/80 border border-glass-border hover:border-glass-accent/40 rounded-xl transition-all duration-300 w-full text-left group active:scale-[0.98] shadow-md hover:shadow-glass-accent/10 hover:shadow-lg"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold overflow-hidden border border-glass-border group-hover:border-glass-accent/40 transition">
          <img src={avatarUrl} alt={u.name} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="ml-3 min-w-0 flex-1">
        <p className="text-white text-sm font-semibold truncate group-hover:text-glass-text transition">{u.name}</p>
        <div className="flex items-center space-x-1.5 mt-1">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeColor(u.role)}`}>
            <span className="mr-1">{getRoleIcon(u.role)}</span>
            {u.role}
          </span>
          <span className="text-[10px] text-zinc-500 truncate">{u.branchName}</span>
        </div>
      </div>
    </button>
  );
}

function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});
  const [expandedSupervisors, setExpandedSupervisors] = useState<Record<string, boolean>>({});
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    axios.get('/api/users')
      .then(res => {
        const data = res.data;
        if (data && data.length > 0) {
          const formattedUsers = data.map((u: any) => ({
            id: u.uid,
            name: u.name,
            role: u.role,
            branchId: u.branchId,
            branchName: u.branchName,
            avatar: u.avatar
          }));
          setUsers(formattedUsers);
        }
      })
      .catch(err => console.error("Failed to load users", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    navigate('/dashboard', { replace: true });
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => ({ ...prev, [branchId]: !prev[branchId] }));
  };

  const toggleSupervisor = (supId: string) => {
    setExpandedSupervisors(prev => ({ ...prev, [supId]: !prev[supId] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-zinc-950 text-white">
        <div className="animate-pulse flex items-center space-x-2">
          <Coffee className="w-6 h-6 text-glass-accent" />
          <span className="font-semibold text-lg">Loading Crimson Cup...</span>
        </div>
      </div>
    );
  }

  // Parse hierarchy
  const admins = users.filter(u => u.role === 'Admin');
  
  const branchMap: Record<string, { name: string; managers: User[]; supervisors: User[]; employees: User[] }> = {};
  users.forEach(u => {
    if (u.role === 'Admin') return;
    if (!branchMap[u.branchId]) {
      branchMap[u.branchId] = {
        name: u.branchName,
        managers: [],
        supervisors: [],
        employees: []
      };
    }
    if (u.role === 'Manager') {
      branchMap[u.branchId].managers.push(u);
    } else if (u.role === 'Supervisor') {
      branchMap[u.branchId].supervisors.push(u);
    } else {
      branchMap[u.branchId].employees.push(u);
    }
  });

  return (
    <div className="min-h-[100dvh] w-full relative overflow-y-auto bg-zinc-950 font-sans p-4 sm:p-8 flex flex-col items-center">
      {/* Animated Floating Blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-red-900/10 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-800/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-[#C1121F]/10 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>

      {/* Header section */}
      <div className="relative z-10 text-center mb-10 mt-6 max-w-lg shrink-0">
        <div className="w-16 h-16 bg-glass-accent rounded-2xl flex items-center justify-center text-white mb-4 mx-auto shadow-lg shadow-glass-accent/30 active:scale-95 transition">
          <Coffee className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow">Crimson Cup BD</h1>
        <p className="text-zinc-400 mt-2 text-sm">Select a user profile from the hierarchy tree to log in.</p>
      </div>

      {/* Tree Visualization Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center pb-20">
        
        {/* LEVEL 1: ADMINS */}
        <div className="flex flex-col items-center w-full mb-6">
          <div className="px-4 py-2 bg-red-950/40 border border-red-900/30 rounded-full flex items-center space-x-2 mb-4 shrink-0 shadow-sm">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-red-400">HQ Administration</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl px-4">
            {admins.map(admin => (
              <UserNodeCard key={admin.id} u={admin} onLogin={handleLogin} />
            ))}
          </div>
        </div>

        {/* Connector Line Admin -> Branches */}
        {Object.keys(branchMap).length > 0 && (
          <div className="org-line-v h-8 w-[2px]"></div>
        )}

        {/* LEVEL 2: BRANCHES */}
        <div className="w-full space-y-6">
          <div className="flex justify-center w-full">
            <div className="px-4 py-2 bg-amber-950/20 border border-amber-900/20 rounded-full flex items-center space-x-2 shrink-0 shadow-sm">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Branch Operations</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-2 sm:px-4">
            {Object.entries(branchMap).map(([branchId, branch]) => {
              const isBranchExpanded = expandedBranches[branchId];
              return (
                <div key={branchId} className="glass-panel rounded-2xl border border-glass-border overflow-hidden bg-zinc-900/20 hover:border-zinc-800 transition-all duration-300">
                  {/* Branch Header Row (Click to toggle expansion) */}
                  <button
                    onClick={() => toggleBranch(branchId)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors border-b border-glass-border-light text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-glass-accent-light text-glass-accent flex items-center justify-center font-bold">
                        {branch.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{branch.name}</h3>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {branch.managers.length + branch.supervisors.length + branch.employees.length} Staff Members
                        </p>
                      </div>
                    </div>
                    {isBranchExpanded ? (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {/* Branch Child Node Tree Section */}
                  {isBranchExpanded && (
                    <div className="p-4 space-y-4 relative bg-black/10">
                      
                      {/* 1. Branch Manager Node */}
                      {branch.managers.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider pl-1">Branch Leadership</p>
                          <div className="grid grid-cols-1 gap-2">
                            {branch.managers.map(m => (
                              <UserNodeCard key={m.id} u={m} onLogin={handleLogin} />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 italic pl-1">No Assigned Manager</p>
                      )}

                      {/* Connector line down to Supervisors */}
                      {(branch.supervisors.length > 0 || branch.employees.length > 0) && (
                        <div className="flex justify-center py-1">
                          <div className="org-line-v h-4 w-[2px]"></div>
                        </div>
                      )}

                      {/* 2. Branch Supervisors & Leaf Employees */}
                      {branch.supervisors.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider pl-1">Supervisors</p>
                          <div className="space-y-3 pl-2 border-l border-glass-border/30 ml-2">
                            {branch.supervisors.map(sup => {
                              const isSupExpanded = expandedSupervisors[sup.id];
                              // Find employees in this branch (just fallback group them under the supervisors)
                              const localEmployees = branch.employees;

                              return (
                                <div key={sup.id} className="space-y-2 relative">
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => toggleSupervisor(sup.id)}
                                      className="p-1 hover:bg-zinc-800 rounded transition shrink-0"
                                    >
                                      {isSupExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <UserNodeCard u={sup} onLogin={handleLogin} />
                                    </div>
                                  </div>

                                  {/* Employees under supervisor */}
                                  {isSupExpanded && localEmployees.length > 0 && (
                                    <div className="pl-8 space-y-2 relative border-l border-dashed border-glass-border/20 ml-6 py-1">
                                      {localEmployees.map(emp => (
                                        <div key={emp.id} className="relative">
                                          {/* Horizontal indicator bar */}
                                          <div className="absolute top-1/2 -left-4 w-4 h-[1px] border-t border-dashed border-glass-border/30"></div>
                                          <UserNodeCard u={emp} onLogin={handleLogin} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {isSupExpanded && localEmployees.length === 0 && (
                                    <p className="text-[10px] text-zinc-600 italic pl-8">No employees reporting</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* If no supervisors, but has employees (direct reports to manager) */}
                      {branch.supervisors.length === 0 && branch.employees.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider pl-1">Direct Staff Reports</p>
                          <div className="grid grid-cols-1 gap-2 pl-2">
                            {branch.employees.map(emp => (
                              <UserNodeCard key={emp.id} u={emp} onLogin={handleLogin} />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardView /></Suspense>} />
        <Route path="/attendance" element={<Suspense fallback={<PageLoader />}><AttendanceView /></Suspense>} />
        <Route path="/roster" element={<Suspense fallback={<PageLoader />}><RosterView /></Suspense>} />
        <Route path="/overtime" element={<Suspense fallback={<PageLoader />}><OvertimeView /></Suspense>} />
        <Route path="/payroll" element={<Suspense fallback={<PageLoader />}><PayrollView /></Suspense>} />
        <Route path="/inventory" element={<Suspense fallback={<PageLoader />}><InventoryView /></Suspense>} />
        <Route path="/ai" element={<Suspense fallback={<PageLoader />}><AIChatView /></Suspense>} />
      </Route>
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
