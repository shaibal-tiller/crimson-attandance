import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, AlertTriangle, Coffee, Loader2, Check, X } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function DashboardView() {
  const { user } = useUser();
  if (!user) return null;
  const [stats, setStats] = useState<any>({ users: 0, present: 0, alerts: 0, branches: 0 });
  const [attendance, setAttendance] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isManager = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Supervisor';

  const fetchDashboard = async () => {
    try {
      const [usersRes, attRes, invRes, leaveRes, overtimeRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/attendance'),
        axios.get('/api/inventory'),
        axios.get('/api/leave'),
        axios.get('/api/overtime')
      ]);
      
      let usersList = usersRes.data || [];
      let attList = attRes.data || [];
      let invList = invRes.data || [];
      let leaveList = leaveRes.data || [];
      let overtimeList = overtimeRes.data || [];

      if (user.role !== 'Admin') {
        usersList = usersList.filter((u: any) => u.branchId === user.branchId);
        attList = attList.filter((a: any) => a.branchId === user.branchId);
        invList = invList.filter((i: any) => i.branchId === user.branchId);
        leaveList = leaveList.filter((l: any) => l.branchId === user.branchId);
        overtimeList = overtimeList.filter((o: any) => o.branchId === user.branchId);
      }

      const today = new Date().toISOString().split('T')[0];
      const presentToday = attList.filter((a: any) => a.date === today && a.status === 'Present').length;
      const alerts = invList.filter((i: any) => i.quantity <= i.threshold).length;
      
      const branchIds = new Set(usersList.map((u: any) => u.branchId));

      setStats({
        users: usersList.length,
        present: presentToday,
        alerts: alerts,
        branches: branchIds.size
      });

      // Add user names to attendance
      const attWithNames = attList.map((a: any) => {
        const u = usersList.find((u: any) => u.uid === a.userId);
        return { ...a, userName: u ? u.name : 'Unknown' };
      }).reverse().slice(0, 5); // Last 5

      setAttendance(attWithNames);

      // Pending requests
      const pLeaves = leaveList.filter((l: any) => l.status === 'Pending').map((l:any) => ({
        ...l, reqType: 'Leave', userName: usersList.find((u:any) => u.uid === l.userId)?.name || l.userId
      }));
      const pOvertime = overtimeList.filter((o: any) => o.status === 'Pending').map((o:any) => ({
        ...o, reqType: 'Overtime', userName: usersList.find((u:any) => u.uid === o.userId)?.name || o.userId
      }));
      
      setPendingRequests([...pLeaves, ...pOvertime].slice(0, 10)); // up to 10
    } catch(e) {
      console.error("Dashboard error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const handleLeaveAction = async (id: string, status: string) => {
    try { await axios.put(`/api/leave/${id}`, { status }); fetchDashboard(); } catch(err) { console.error(err); }
  };
  
  const handleOvertimeAction = async (id: string, status: string) => {
    try { await axios.put(`/api/overtime/${id}`, { status }); fetchDashboard(); } catch(err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-glass-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Welcome back, {user.name}</h1>
          <p className="text-sm text-glass-text-muted">Here's what's happening at {user.branchName} today.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Staff" value={stats.users.toString()} icon={Users} trend="Active" trendColor="text-[#2D6A4F]" />
        <StatCard title="Present Today" value={stats.present.toString()} icon={UserCheck} trend="Today" trendColor="text-[#2D6A4F]" />
        <StatCard title="Inventory Alerts" value={stats.alerts.toString()} icon={AlertTriangle} trend={stats.alerts > 0 ? "Action needed" : "All good"} trendColor={stats.alerts > 0 ? "text-glass-accent" : "text-[#2D6A4F]"} />
        <StatCard title="Branches" value={stats.branches.toString()} icon={Coffee} trend="Managed" trendColor="text-[#2D6A4F]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-glass-text mb-4">Recent Attendance</h2>
          <div className="space-y-4">
            {attendance.length === 0 ? (
               <p className="text-sm text-glass-text-muted">No recent activity.</p>
            ) : (
               attendance.map(a => (
                 <div key={a.id} className="flex items-center justify-between py-2 border-b border-glass-border-light last:border-0">
                   <div>
                     <p className="text-sm font-medium text-glass-text">{a.userName}</p>
                     <p className="text-xs text-glass-text-muted">Checked in at {a.checkIn} ({a.type})</p>
                   </div>
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2D6A4F] text-white">
                     {a.status}
                   </span>
                 </div>
               ))
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-glass-text mb-4">Pending Requests</h2>
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
             {pendingRequests.length === 0 ? (
                <p className="text-sm text-glass-text-muted">No pending requests.</p>
             ) : (
                pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b border-glass-border-light last:border-0">
                    <div>
                      <p className="text-sm font-medium text-glass-text">{req.reqType}: {req.userName}</p>
                      <p className="text-xs text-glass-text-muted">
                        {req.reqType === 'Leave' 
                          ? `${req.type} Leave (${req.startDate} to ${req.endDate})` 
                          : `${req.hours}h Overtime on ${req.date}`}
                      </p>
                    </div>
                    {isManager && (
                      <div className="flex space-x-2">
                        <button onClick={() => req.reqType === 'Leave' ? handleLeaveAction(req.id, 'Approved') : handleOvertimeAction(req.id, 'Approved')} className="p-1.5 bg-[#2D6A4F] text-white rounded hover:bg-[#1a4a35] transition" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => req.reqType === 'Leave' ? handleLeaveAction(req.id, 'Rejected') : handleOvertimeAction(req.id, 'Rejected')} className="p-1.5 bg-glass-item text-glass-text border border-glass-border rounded hover:bg-glass-panel-hover transition" title="Deny">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendColor = 'text-[#2D6A4F]' }: any) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex items-center">
      <div className="p-3 rounded-xl bg-glass-accent-light text-glass-accent mr-4 hidden sm:block">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.5px] font-medium text-glass-text-muted">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h3 className="text-2xl font-bold text-glass-text mt-1">{value}</h3>
          <span className={`text-[10px] font-medium ${trendColor}`}>{trend}</span>
        </div>
      </div>
    </div>
  );
}
