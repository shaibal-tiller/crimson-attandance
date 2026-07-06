import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Plus, X, Check, Loader2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function OvertimeView() {
  const { user } = useUser();
  if (!user) return null;
  const [overtimes, setOvertimes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [hours, setHours] = useState<number>(1);
  const [reason, setReason] = useState('');

  const isManager = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Supervisor';

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/overtime'),
      axios.get('/api/users')
    ]).then(([otRes, uRes]) => {
      const oData = otRes.data || [];
      const uData = uRes.data || [];
      setUsers(uData);

      if (user.role === 'Admin') {
        setOvertimes(oData);
      } else if (isManager) {
        setOvertimes(oData.filter((o: any) => o.branchId === user.branchId));
      } else {
        setOvertimes(oData.filter((o: any) => o.userId === user.id));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/overtime', {
        userId: user.id,
        branchId: user.branchId,
        date,
        hours: Number(hours),
        reason
      });
      setShowForm(false);
      setDate(''); setHours(1); setReason('');
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await axios.put(`/api/overtime/${id}`, { status });
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const getUserName = (uid: string) => {
    const u = users.find(x => x.uid === uid);
    return u ? u.name : uid;
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
          <h1 className="text-2xl font-bold text-glass-text">Overtime Management</h1>
          <p className="text-sm text-glass-text-muted">Log extra hours and manage approvals (1.5x pay rate).</p>
        </div>
        <div className="flex gap-2">
          {!isManager && (
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-glass-accent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#a00f1a]"
            >
              <Plus className="w-4 h-4 mr-2" /> Log Overtime
            </button>
          )}
        </div>
      </div>

      {showForm && !isManager && (
        <div className="glass-panel p-6 rounded-2xl max-w-4xl relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-4 right-4 text-glass-text-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-glass-text mb-4">Log Overtime</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Date</label>
              <input 
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Hours</label>
              <input 
                type="number"
                required
                min="1"
                max="12"
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Reason / Task Completed</label>
              <input 
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., Late night cleanup, emergency stock receive..."
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
              />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full sm:w-auto bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Submit Overtime
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item">
          <h2 className="text-lg font-semibold text-glass-text">{isManager ? 'Pending & Approved Overtime' : 'Your Overtime Logs'}</h2>
        </div>
        <div className="p-0 max-h-[500px] overflow-y-auto">
          {overtimes.length === 0 ? (
            <div className="p-6 text-center text-glass-text-muted text-sm">No overtime requests found.</div>
          ) : (
            <div className="divide-y divide-glass-border-light">
              {overtimes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((o: any) => (
                <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-glass-panel-hover transition-colors gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-glass-text">{isManager ? getUserName(o.userId) : o.date}</h3>
                    <p className="text-xs text-glass-text-muted mt-1">
                      {isManager ? `Date: ${o.date} | ` : ''}Hours: <span className="font-semibold text-white">{o.hours}h</span> (1.5x)
                    </p>
                    <p className="text-xs text-glass-text-muted mt-1 italic">Task: "{o.reason}"</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white ${
                      o.status === 'Approved' ? 'bg-[#2D6A4F]' : o.status === 'Rejected' ? 'bg-red-900' : 'bg-yellow-600'
                    }`}>
                      {o.status}
                    </span>
                    {isManager && o.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(o.id, 'Approved')} className="p-1.5 bg-[#2D6A4F] text-white rounded hover:bg-[#1a4a35]" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(o.id, 'Rejected')} className="p-1.5 bg-red-900 text-white rounded hover:bg-red-800" title="Reject">
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
