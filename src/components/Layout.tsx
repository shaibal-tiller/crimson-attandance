import { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coffee,
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  Package,
  MessageSquareText,
  Menu,
  X,
  FileText,
  LogOut,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { usePageTitle } from '../hooks/usePageTitle';

const allNavigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
  { name: 'Attendance', path: '/attendance', icon: UserCheck, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
  { name: 'Roster & Leave', path: '/roster', icon: CalendarDays, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
  { name: 'Overtime', path: '/overtime', icon: Clock, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
  { name: 'Payroll', path: '/payroll', icon: FileText, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
  { name: 'Inventory', path: '/inventory', icon: Package, roles: ['Admin', 'Manager', 'Supervisor'] },
  { name: 'AI Insights', path: '/ai', icon: MessageSquareText, roles: ['Admin', 'Manager', 'Supervisor', 'Employee'] },
];

export default function Layout() {
  const { user, logout } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  usePageTitle();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const navigation = allNavigation.filter(nav => nav.roles.includes(user.role));

  return (
    <div className="flex h-[100dvh] w-full text-glass-text font-sans overflow-hidden relative bg-zinc-950">
      <div className="bg-gradient-glass"></div>
      
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-glass-panel backdrop-blur-[20px] border-r border-glass-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-2 text-glass-accent font-extrabold text-xl tracking-wide uppercase">
            <div className="w-6 h-6 bg-glass-accent rounded flex items-center justify-center text-white">
              <Coffee className="w-4 h-4" />
            </div>
            <span>Crimson Cup BD</span>
          </div>
          <button className="lg:hidden text-glass-text-muted hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-glass-accent-light text-glass-text border-l-4 border-glass-accent" 
                  : "text-glass-text-muted hover:bg-glass-panel hover:text-glass-text border-l-4 border-transparent"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-glass-text" : "text-glass-text-muted")} />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-glass-border mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <div className="h-9 w-9 rounded-full bg-glass-border flex items-center justify-center text-glass-text font-bold shrink-0 overflow-hidden">
                {(user as any).avatar ? <img src={(user as any).avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
              </div>
              <div className="ml-3 truncate pr-2">
                <p className="text-sm font-semibold text-glass-text truncate">{user.name}</p>
                <p className="text-[11px] text-glass-text-muted truncate">{user.branchName}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 rounded-lg text-glass-text-muted hover:bg-glass-panel hover:text-red-400 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-glass-panel backdrop-blur-md border-b border-glass-border safe-area-top">
          <div className="flex items-center space-x-2 text-glass-accent font-bold">
            <Coffee className="w-5 h-5" />
            <span>Crimson Cup BD</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-glass-text p-2 -mr-2 active:bg-white/10 rounded-lg transition">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full max-w-6xl mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden flex items-center justify-around bg-glass-panel backdrop-blur-[20px] border-t border-glass-border safe-area-bottom py-1">
          {navigation.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-all min-w-0",
                isActive
                  ? "text-glass-accent"
                  : "text-glass-text-muted active:text-glass-text"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_rgba(200,30,40,0.5)]")} />
                  <span className="text-[10px] mt-0.5 font-medium truncate max-w-[56px]">{item.name.split(' ')[0]}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* More button for remaining items on mobile */}
          {navigation.length > 5 && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center py-2 px-3 rounded-lg text-glass-text-muted active:text-glass-text transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">More</span>
            </button>
          )}
        </nav>
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
