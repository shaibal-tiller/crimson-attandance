import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Loader2, Plus, X } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function PayrollView() {
  const { user } = useUser();
  if (!user) return null;
  const [payslips, setPayslips] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [month, setMonth] = useState('October 2023');
  const [amount, setAmount] = useState('৳ 20,000');
  const [status, setStatus] = useState('Paid');

  const isManager = user.role === 'Manager' || user.role === 'Admin' || user.role === 'Supervisor';

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/payroll'),
      axios.get('/api/users')
    ]).then(([payrollRes, usersRes]) => {
      const pData = payrollRes.data || [];
      const uData = usersRes.data || [];
      
      if(isManager) {
        const branchUsers = user.role === 'Admin' ? uData : uData.filter((u: any) => u.branchId === user.branchId);
        setUsers(branchUsers);
        
        const branchUserIds = new Set(branchUsers.map((u:any) => u.uid));
        setPayslips(pData.filter((p: any) => branchUserIds.has(p.userId)));
      } else {
        setPayslips(pData.filter((p: any) => p.userId === user.id));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user.id, user.role, user.branchId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await axios.post('/api/payroll/generate', {
        userId: selectedUser,
        month,
        amount,
        status,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      });
      setShowGenerate(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Payroll</h1>
          <p className="text-sm text-glass-text-muted">Manage payslips and payment receipts.</p>
        </div>
        {isManager && (
          <button 
            onClick={() => setShowGenerate(true)}
            className="mt-4 sm:mt-0 flex items-center bg-glass-accent hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-glass-accent/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Payslip
          </button>
        )}
      </div>

      {showGenerate && isManager && (
        <div className="glass-panel p-6 rounded-2xl max-w-4xl relative">
          <button 
            onClick={() => setShowGenerate(false)}
            className="absolute top-4 right-4 text-glass-text-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-glass-text mb-4">Generate New Payslip</h2>
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Employee</label>
              <select 
                value={selectedUser} 
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
                required
              >
                <option value="">Select Employee</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Month</label>
              <input 
                type="text" 
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Base Amount (Adjust for Overtime 1.5x)</label>
              <input 
                type="text" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Status</label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full sm:w-auto bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                Generate
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden max-w-4xl">
        <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item">
          <h2 className="text-lg font-semibold text-glass-text">{isManager ? 'Branch Payslips' : 'Your Payslips'}</h2>
        </div>
        <div className="divide-y divide-glass-border-light">
          {payslips.length === 0 ? (
            <div className="p-6 text-center text-glass-text-muted">No payslips found.</div>
          ) : (
            payslips.map(slip => (
              <div key={slip.id} className="p-6 flex items-center justify-between hover:bg-glass-panel-hover transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-glass-accent-light text-glass-accent rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-glass-text">{slip.month}</h3>
                    <p className="text-xs text-glass-text-muted">
                      {isManager ? `Emp: ${getUserName(slip.userId)} | ` : ''}Issued: {slip.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-glass-text">{slip.amount}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-medium text-white ${slip.status === 'Paid' ? 'bg-[#2D6A4F]' : 'bg-yellow-600'}`}>
                    {slip.status}
                  </span>
                </div>
                {!isManager && (
                  <button className="p-2 text-glass-text-muted hover:text-white transition-colors" title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
