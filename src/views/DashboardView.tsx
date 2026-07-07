import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserCheck, AlertTriangle, Coffee, Loader2, Check, X, 
  PlusCircle, ShieldAlert, FileText, Clock, Calendar, CheckSquare, Sparkles 
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function DashboardView() {
  const { user } = useUser();
  if (!user) return null;
  // Add member states
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Employee');
  const [newBranchId, setNewBranchId] = useState(user.branchId || '');
  const [addingMember, setAddingMember] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  const isManager = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Supervisor';
  const canAddMember = user.role === 'Admin' || user.role === 'Manager';

  const queryClient = useQueryClient();

  // Queries
  const { data: dashboardData, isLoading: loading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
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

      const stats = {
        users: usersList.length,
        present: presentToday,
        alerts: alerts,
        branches: branchIds.size
      };

      const attendance = attList.map((a: any) => {
        const u = usersList.find((u: any) => u.uid === a.userId);
        return { ...a, userName: u ? u.name : 'Unknown' };
      }).reverse().slice(0, 5);

      const pLeaves = leaveList.filter((l: any) => l.status === 'Pending').map((l:any) => ({
        ...l, reqType: 'Leave', userName: usersList.find((u:any) => u.uid === l.userId)?.name || l.userId
      }));
      const pOvertime = overtimeList.filter((o: any) => o.status === 'Pending').map((o:any) => ({
        ...o, reqType: 'Overtime', userName: usersList.find((u:any) => u.uid === o.userId)?.name || o.userId
      }));
      
      const pendingRequests = [...pLeaves, ...pOvertime].slice(0, 10);

      return { stats, attendance, pendingRequests };
    }
  });

  const { data: branchesList = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await axios.get('/api/branches');
      return res.data || [];
    },
    enabled: canAddMember
  });

  useEffect(() => {
    if (canAddMember && branchesList.length > 0) {
      if (user.role !== 'Admin') {
        setNewBranchId(user.branchId);
      } else {
        setNewBranchId(branchesList[0].id);
      }
    }
  }, [branchesList, canAddMember, user]);

  // Mutations
  const leaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => axios.put(`/api/leave/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const overtimeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => axios.put(`/api/overtime/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  });

  const addMemberMutation = useMutation({
    mutationFn: (newMember: any) => axios.post('/api/users', newMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAddMessage('Member added successfully!');
      setNewName('');
      setNewEmail('');
      setNewRole('Employee');
      setTimeout(() => {
        setShowAddMember(false);
        setAddMessage('');
      }, 1500);
    },
    onError: (err: any) => {
      setAddMessage(err.response?.data?.error || 'Failed to add member');
    }
  });

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newBranchId) return;
    setAddMessage('');
    const selectedB = branchesList.find(b => b.id === newBranchId) || { name: user.branchName };
    addMemberMutation.mutate({
      name: newName,
      email: newEmail,
      role: newRole,
      branchId: newBranchId,
      branchName: selectedB.name
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-glass-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Welcome back, {user.name}</h1>
          <p className="text-sm text-glass-text-muted">Here's what's happening at {user.branchName} today.</p>
        </div>
        {canAddMember && (
          <button 
            onClick={() => setShowAddMember(true)}
            className="flex items-center justify-center bg-glass-accent hover:bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-glass-accent/20 border border-glass-accent/30 active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Team Member
          </button>
        )}
      </div>

      {/* Quick Action Navigation Links */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-2.5">
        <Link to="/attendance" className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border hover:border-glass-accent/30 rounded-xl text-xs font-semibold text-glass-text transition-colors">
          <Clock className="w-3.5 h-3.5 mr-1.5 text-glass-accent" />
          Check In/Out
        </Link>
        <Link to="/roster" className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border hover:border-glass-accent/30 rounded-xl text-xs font-semibold text-glass-text transition-colors">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
          Roster & Leave Requests
        </Link>
        <Link to="/overtime" className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border hover:border-glass-accent/30 rounded-xl text-xs font-semibold text-glass-text transition-colors">
          <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
          Log Overtime Hours
        </Link>
        <Link to="/payroll" className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border hover:border-glass-accent/30 rounded-xl text-xs font-semibold text-glass-text transition-colors">
          <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
          View Payslips
        </Link>
        <Link to="/inventory" className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border hover:border-glass-accent/30 rounded-xl text-xs font-semibold text-glass-text transition-colors">
          <Coffee className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
          Inventory Audit
        </Link>
        <Link to="/ai" className="flex items-center px-4 py-2 bg-glass-accent/20 hover:bg-glass-accent/35 border border-glass-accent/30 rounded-xl text-xs font-bold text-white transition-colors">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-glass-text animate-pulse" />
          Ask AI Assistant
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Staff" value={dashboardData?.stats.users.toString() || '0'} icon={Users} trend="Active" trendColor="text-[#2D6A4F]" />
        <StatCard title="Present Today" value={dashboardData?.stats.present.toString() || '0'} icon={UserCheck} trend="Today" trendColor="text-[#2D6A4F]" />
        <StatCard title="Inventory Alerts" value={dashboardData?.stats.alerts.toString() || '0'} icon={AlertTriangle} trend={(dashboardData?.stats.alerts || 0) > 0 ? "Action needed" : "All good"} trendColor={(dashboardData?.stats.alerts || 0) > 0 ? "text-glass-accent" : "text-[#2D6A4F]"} />
        <StatCard title="Branches" value={dashboardData?.stats.branches.toString() || '0'} icon={Coffee} trend="Managed" trendColor="text-[#2D6A4F]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-glass-text mb-4">Recent Attendance</h2>
          <div className="space-y-4">
            {!dashboardData || dashboardData.attendance.length === 0 ? (
               <p className="text-sm text-glass-text-muted">No recent activity.</p>
            ) : (
               dashboardData.attendance.map((a: any) => (
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
          <div className="space-y-4 max-h-75 overflow-y-auto">
             {!dashboardData || dashboardData.pendingRequests.length === 0 ? (
                <p className="text-sm text-glass-text-muted">No pending requests.</p>
             ) : (
                dashboardData.pendingRequests.map((req: any) => (
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
                        <button onClick={() => req.reqType === 'Leave' ? leaveMutation.mutate({ id: req.id, status: 'Approved'}) : overtimeMutation.mutate({ id: req.id, status: 'Approved'})} className="p-1.5 bg-[#2D6A4F] text-white rounded hover:bg-[#1a4a35] transition" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => req.reqType === 'Leave' ? leaveMutation.mutate({ id: req.id, status: 'Rejected'}) : overtimeMutation.mutate({ id: req.id, status: 'Rejected'})} className="p-1.5 bg-glass-item text-glass-text border border-glass-border rounded hover:bg-glass-panel-hover transition" title="Deny">
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

      {/* Add Member Modal Overlay */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full relative border border-glass-border shadow-2xl animate-fade-in">
            <button 
              onClick={() => { setShowAddMember(false); setAddMessage(''); }}
              className="absolute top-4 right-4 text-glass-text-muted hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2.5 mb-4">
              <PlusCircle className="w-6 h-6 text-glass-accent" />
              <h2 className="text-lg font-bold text-glass-text">Add New Team Member</h2>
            </div>
            
            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-glass-text-muted mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Tanvir Rahman"
                  className="w-full bg-glass-item border border-glass-border focus:border-glass-accent rounded-xl p-2.5 text-sm text-glass-text focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-glass-text-muted mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="e.g. tanvir@crimsoncup.com"
                  className="w-full bg-glass-item border border-glass-border focus:border-glass-accent rounded-xl p-2.5 text-sm text-glass-text focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-glass-text-muted mb-1.5">Role Type</label>
                  <select 
                    value={newRole} 
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full bg-glass-item border border-glass-border focus:border-glass-accent rounded-xl p-2.5 text-sm text-glass-text focus:outline-none transition-colors"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Supervisor">Supervisor</option>
                    {user.role === 'Admin' && <option value="Manager">Manager</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-glass-text-muted mb-1.5">Assign Branch</label>
                  {user.role === 'Admin' ? (
                    <select 
                      value={newBranchId} 
                      onChange={e => setNewBranchId(e.target.value)}
                      className="w-full bg-glass-item border border-glass-border focus:border-glass-accent rounded-xl p-2.5 text-sm text-glass-text focus:outline-none transition-colors"
                      required
                    >
                      {branchesList.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={user.branchName} 
                      disabled
                      className="w-full bg-glass-item border border-glass-border rounded-xl p-2.5 text-sm text-glass-text-muted cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {addMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium text-center ${addMessage.includes('successfully') ? 'bg-[#2D6A4F]/20 text-[#2D6A4F]' : 'bg-red-500/10 text-red-400'}`}>
                  {addMessage}
                </div>
              )}

              <button 
                type="submit" 
                disabled={addMemberMutation.isPending}
                className="w-full bg-glass-accent hover:bg-red-500 text-white py-2.5 rounded-xl font-bold transition shadow-lg shadow-glass-accent/15 border border-glass-accent/20 active:scale-[0.98] disabled:opacity-50"
              >
                {addMemberMutation.isPending ? 'Saving member...' : 'Save Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}
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
