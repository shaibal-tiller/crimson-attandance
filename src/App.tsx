import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Coffee, Loader2 } from 'lucide-react';
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

function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
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
            branchName: u.branchName
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-zinc-950 text-white">
        <div className="animate-pulse flex items-center space-x-2">
          <Coffee className="w-6 h-6 text-red-600" />
          <span className="font-semibold text-lg">Loading Crimson Cup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-[100dvh] w-full relative overflow-hidden bg-zinc-950 font-sans">
      <div className="bg-gradient-glass"></div>
      <div className="glass-panel max-w-md w-full max-h-[90vh] p-8 rounded-2xl flex flex-col items-center relative z-10 mx-4 border border-glass-border">
        <div className="w-16 h-16 bg-glass-accent rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-glass-accent/30 shrink-0">
          <Coffee className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 text-center shrink-0">Crimson Cup BD</h1>
        <p className="text-zinc-400 mb-8 text-center text-sm shrink-0">Select a user profile to sign in to the ERP system.</p>
        
        <div className="w-full space-y-3 overflow-y-auto pr-2">
          {users.map(u => (
            <button
              key={u.id}
              onClick={() => handleLogin(u)}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold group-hover:bg-zinc-700 overflow-hidden">
                  {(u as any).avatar ? <img src={(u as any).avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                </div>
                <div className="ml-4 text-left">
                  <p className="text-white font-medium">{u.name}</p>
                  <p className="text-xs text-zinc-400">{u.role} &bull; {u.branchName}</p>
                </div>
              </div>
            </button>
          ))}
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
