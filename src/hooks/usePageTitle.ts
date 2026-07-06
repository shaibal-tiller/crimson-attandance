import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/': 'Sign In',
  '/dashboard': 'Dashboard',
  '/attendance': 'Attendance',
  '/roster': 'Roster & Leave',
  '/overtime': 'Overtime',
  '/payroll': 'Payroll',
  '/inventory': 'Inventory',
  '/ai': 'AI Insights',
};

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = TITLES[pathname] || 'Crimson Cup BD';
    document.title = `${page} — Crimson Cup BD`;
  }, [pathname]);
}
