import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarDays, FilePlus2, Check, X, Loader2, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function RosterView() {
  const { user } = useUser();
  if (!user) return null;
  const [rosters, setRosters] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave Form
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const isManager = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Supervisor';

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/roster'),
      axios.get('/api/leave'),
      axios.get('/api/users')
    ]).then(([rRes, lRes, uRes]) => {
      const rData = rRes.data || [];
      const lData = lRes.data || [];
      const uData = uRes.data || [];
      setUsers(uData);

      if (user.role === 'Admin') {
        setRosters(rData);
        setLeaves(lData);
      } else if (isManager) {
        setRosters(rData.filter((r: any) => r.branchId === user.branchId));
        setLeaves(lData.filter((l: any) => l.branchId === user.branchId));
      } else {
        setRosters(rData.filter((r: any) => r.branchId === user.branchId)); // see branch roster
        setLeaves(lData.filter((l: any) => l.userId === user.id)); // only own leaves
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/leave', {
        userId: user.id,
        branchId: user.branchId,
        type: leaveType,
        startDate,
        endDate,
        reason
      });
      setShowLeaveForm(false);
      setStartDate(''); setEndDate(''); setReason('');
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const handleLeaveAction = async (id: string, status: string) => {
    try {
      await axios.put(`/api/leave/${id}`, { status });
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const getUserName = (uid: string) => {
    const u = users.find(x => x.uid === uid);
    return u ? u.name : uid;
  };

  const getDayRosters = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + offsetDays); // Showing a week spanning recent past to near future
    const dateStr = d.toISOString().split('T')[0];
    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      morning: rosters.filter(r => r.date === dateStr && r.shift.includes('Morning')),
      evening: rosters.filter(r => r.date === dateStr && r.shift.includes('Evening')),
    };
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Roster & Leave</h1>
          <p className="text-sm text-glass-text-muted">Weekly duties, smart scheduling, and leave management.</p>
        </div>
        <div className="flex gap-2">
          {!isManager && (
            <button 
              onClick={() => setShowLeaveForm(true)}
              className="inline-flex items-center px-4 py-2 bg-glass-accent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#a00f1a]"
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> Apply Leave
            </button>
          )}
        </div>
      </div>

      {showLeaveForm && !isManager && (
        <div className="glass-panel p-6 rounded-2xl max-w-4xl relative">
          <button onClick={() => setShowLeaveForm(false)} className="absolute top-4 right-4 text-glass-text-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-glass-text mb-4">Apply for Leave</h2>
          <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Leave Type</label>
              <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent">
                <option value="Sick">Sick Leave</option>
                <option value="Casual">Casual Leave</option>
                <option value="Annual">Annual Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Start Date</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">End Date</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Reason</label>
              <textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"></textarea>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full sm:w-auto bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ROSTER SECTION */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-glass-text">Weekly Shift Schedule</h2>
            <p className="text-xs text-glass-text-muted">Morning (9am - 4:30pm) | Evening (4:30pm - 12am)</p>
          </div>
          {isManager && (
             <button className="text-xs px-3 py-1.5 bg-glass-item border border-glass-border text-glass-text rounded hover:bg-glass-accent hover:text-white transition-colors flex items-center justify-center gap-1 inline-flex">
               <CalendarDays className="w-3 h-3" /> Auto-Generate
             </button>
          )}
        </div>
        <div className="p-6 overflow-x-auto custom-scrollbar">
          <div className="min-w-[900px] grid grid-cols-7 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const dayData = getDayRosters(i);
              const isToday = dayData.dateStr === new Date().toISOString().split('T')[0];
              return (
                <div key={i} className={`border ${isToday ? 'border-glass-accent bg-glass-item/50' : 'border-glass-border bg-glass-item'} rounded-xl overflow-hidden flex flex-col h-full`}>
                  <div className={`text-center py-2 border-b border-glass-border-light ${isToday ? 'bg-glass-accent/20' : 'bg-glass-panel'}`}>
                    <div className="text-[10px] uppercase tracking-wider text-glass-text-muted">{dayData.dayName}</div>
                    <div className={`text-sm font-bold ${isToday ? 'text-glass-accent' : 'text-glass-text'}`}>{dayData.dateStr.split('-')[2]}</div>
                  </div>
                  <div className="flex-1 p-2 space-y-3">
                    <div>
                      <div className="text-[10px] font-semibold text-[#2D6A4F] mb-1 flex items-center"><Users className="w-3 h-3 mr-1"/> Morning</div>
                      <div className="space-y-1">
                        {dayData.morning.length === 0 ? <div className="text-[10px] text-glass-text-muted italic">No staff</div> : 
                          dayData.morning.map((r: any) => (
                            <div key={r.id} className="text-xs p-1.5 rounded bg-glass-panel border border-glass-border shadow-sm truncate" title={r.employeeName}>
                              {r.employeeName}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-400 mb-1 flex items-center"><Users className="w-3 h-3 mr-1"/> Evening</div>
                      <div className="space-y-1">
                        {dayData.evening.length === 0 ? <div className="text-[10px] text-glass-text-muted italic">No staff</div> : 
                          dayData.evening.map((r: any) => (
                            <div key={r.id} className="text-xs p-1.5 rounded bg-glass-panel border border-glass-border shadow-sm truncate" title={r.employeeName}>
                              {r.employeeName}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LEAVES SECTION */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item">
          <h2 className="text-lg font-semibold text-glass-text">{isManager ? 'Leave Requests' : 'Your Leave Requests'}</h2>
        </div>
        <div className="p-0 max-h-[300px] overflow-y-auto">
          {leaves.length === 0 ? (
            <div className="p-6 text-center text-glass-text-muted text-sm">No leave requests found.</div>
          ) : (
            <div className="divide-y divide-glass-border-light">
              {leaves.map((l: any) => (
                <div key={l.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-glass-panel-hover transition-colors gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-glass-text">{isManager ? getUserName(l.userId) : l.type + ' Leave'}</h3>
                    <p className="text-xs text-glass-text-muted mt-1">
                      {isManager ? `${l.type} Leave | ` : ''}From: {l.startDate} To: {l.endDate}
                    </p>
                    <p className="text-xs text-glass-text-muted mt-1 italic">Reason: "{l.reason}"</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white ${
                      l.status === 'Approved' ? 'bg-[#2D6A4F]' : l.status === 'Rejected' ? 'bg-red-900' : 'bg-yellow-600'
                    }`}>
                      {l.status}
                    </span>
                    {isManager && l.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="p-1.5 bg-[#2D6A4F] text-white rounded hover:bg-[#1a4a35]" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="p-1.5 bg-red-900 text-white rounded hover:bg-red-800" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
