import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Loader2, Plus, X, Eye, Printer } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function PayrollView() {
  const { user } = useUser();
  if (!user) return null;
  const isManager = user.role === 'Manager' || user.role === 'Admin' || user.role === 'Supervisor';

  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [status, setStatus] = useState('Paid');
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: allOvertime = [] } = useQuery({
    queryKey: ['overtime'],
    queryFn: async () => {
      const res = await axios.get('/api/overtime');
      return res.data;
    }
  });

  const { data: payrollData = { payslips: [], users: [] }, isLoading: loading } = useQuery({
    queryKey: ['payroll', user.id],
    queryFn: async () => {
      const [payrollRes, usersRes] = await Promise.all([
        axios.get('/api/payroll'),
        axios.get('/api/users')
      ]);
      const pData = payrollRes.data || [];
      const uData = usersRes.data || [];
      
      let payslips = [];
      let branchUsers = [];

      if(isManager) {
        branchUsers = user.role === 'Admin' ? uData : uData.filter((u: any) => u.branchId === user.branchId);
        const branchUserIds = new Set(branchUsers.map((u:any) => u.uid));
        payslips = pData.filter((p: any) => branchUserIds.has(p.userId));
      } else {
        payslips = pData.filter((p: any) => p.userId === user.id);
      }
      
      return { payslips, users: branchUsers };
    }
  });

  const { payslips, users } = payrollData;

  const generateMutation = useMutation({
    mutationFn: (payrollData: any) => axios.post('/api/payroll/generate', payrollData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll', user.id] });
      setShowGenerate(false);
    },
    onError: (err) => console.error(err)
  });

  // Derived State Calculations
  const selectedUserInfo = users.find((u: any) => u.uid === selectedUser);
  const userRole = selectedUserInfo?.role || 'Employee';
  const baseSalary = userRole === 'Manager' ? 45000 : (userRole === 'Supervisor' ? 35000 : 20000);
  const basic = Math.floor(baseSalary * 0.6);
  const houseAllowance = Math.floor(baseSalary * 0.2);
  const medical = Math.floor(baseSalary * 0.1);
  const tada = Math.floor(baseSalary * 0.1);

  // Month formatting (YYYY-MM to "October 2023")
  const [year, m] = month.split('-');
  const monthDate = new Date(parseInt(year), parseInt(m) - 1);
  const monthString = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const userOvertime = allOvertime.filter((o: any) => o.userId === selectedUser && o.date.startsWith(month));
  const overtimeHours = userOvertime.reduce((sum: number, o: any) => sum + o.hours, 0);
  const overtimeAmount = Math.floor((baseSalary / 160) * 1.5 * overtimeHours);
  
  const totalAmount = basic + houseAllowance + medical + tada + overtimeAmount;
  const formattedAmount = `৳ ${totalAmount.toLocaleString()}`;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    generateMutation.mutate({
      userId: selectedUser,
      month: monthString,
      amount: formattedAmount,
      basic,
      medical,
      tada,
      houseAllowance,
      overtimeAmount,
      status,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    });
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
                type="month" 
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-glass-text-muted mb-2">Salary Breakdown Summary</label>
              <div className="bg-glass-item border border-glass-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><span className="text-xs text-glass-text-muted block">Basic</span><span className="text-sm font-semibold text-glass-text">৳ {basic.toLocaleString()}</span></div>
                <div><span className="text-xs text-glass-text-muted block">House Allowance</span><span className="text-sm font-semibold text-glass-text">৳ {houseAllowance.toLocaleString()}</span></div>
                <div><span className="text-xs text-glass-text-muted block">Medical</span><span className="text-sm font-semibold text-glass-text">৳ {medical.toLocaleString()}</span></div>
                <div><span className="text-xs text-glass-text-muted block">TA/DA</span><span className="text-sm font-semibold text-glass-text">৳ {tada.toLocaleString()}</span></div>
                <div><span className="text-xs text-glass-text-muted block">Overtime ({overtimeHours} hrs)</span><span className="text-sm font-semibold text-glass-text">৳ {overtimeAmount.toLocaleString()}</span></div>
                <div><span className="text-xs text-glass-accent font-bold block">Total Amount</span><span className="text-lg font-bold text-glass-text">{formattedAmount}</span></div>
              </div>
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
              <button type="submit" disabled={generateMutation.isPending} className="w-full sm:w-auto bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
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
              <div 
                key={slip.id} 
                onClick={() => setSelectedPayslip(slip)}
                className="p-6 flex items-center justify-between hover:bg-glass-panel-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-glass-accent-light text-glass-accent rounded-lg group-hover:bg-glass-accent group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-glass-text">{slip.month}</h3>
                    <p className="text-xs text-glass-text-muted">
                      {isManager ? `Emp: ${getUserName(slip.userId)} | ` : ''}Issued: {slip.date}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-glass-text">{slip.amount}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-medium text-white ${slip.status === 'Paid' ? 'bg-[#2D6A4F]' : 'bg-yellow-600'}`}>
                      {slip.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedPayslip(slip); }}
                      className="p-2 bg-glass-item border border-glass-border text-glass-text hover:bg-glass-panel-hover rounded-lg transition" 
                      title="Preview Payslip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(slip, getUserName(slip.userId)); }}
                      className="p-2 bg-glass-accent/15 border border-glass-accent/30 text-glass-text hover:bg-glass-accent hover:text-white rounded-lg transition" 
                      title="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payslip Preview Modal Overlay */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full relative border border-glass-border shadow-2xl animate-fade-in flex flex-col">
            <button 
              onClick={() => setSelectedPayslip(null)}
              className="absolute top-4 right-4 text-glass-text-muted hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-6">
              <FileText className="w-6 h-6 text-glass-accent" />
              <h2 className="text-lg font-bold text-glass-text">Payslip Preview</h2>
            </div>

            {/* Corporate Invoice Receipt Template */}
            <div id="print-payslip-area" className="bg-white text-zinc-950 p-6 rounded-xl border border-zinc-200 font-sans text-sm space-y-6">
              <div className="flex justify-between border-b border-zinc-200 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-red-700 leading-tight">Crimson Cup BD</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-semibold mt-0.5">Corporate HQ, Dhaka</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-sm text-zinc-800">Payslip Receipt</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">ID: {selectedPayslip.id}</p>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Employee Details</p>
                  <p className="font-bold text-zinc-900 mt-1">{getUserName(selectedPayslip.userId)}</p>
                  <p className="text-[11px] text-zinc-500">ID: {selectedPayslip.userId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Statement Period</p>
                  <p className="font-bold text-zinc-900 mt-1">{selectedPayslip.month}</p>
                  <p className="text-[11px] text-zinc-500">Issued: {selectedPayslip.date}</p>
                </div>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-300">
                    <th className="text-left font-bold text-xs text-zinc-700 pb-2">Description</th>
                    <th className="text-right font-bold text-xs text-zinc-700 pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs pl-2">Basic Salary (60%)</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">৳ {(selectedPayslip.basic || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs pl-2">House Allowance (20%)</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">৳ {(selectedPayslip.houseAllowance || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs pl-2">Medical Allowance (10%)</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">৳ {(selectedPayslip.medical || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs pl-2">TA / DA (10%)</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">৳ {(selectedPayslip.tada || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs pl-2">Overtime Allowance</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">৳ {(selectedPayslip.overtimeAmount || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="font-extrabold text-sm border-t-2 border-zinc-300">
                    <td className="pt-3 text-zinc-900">Total Net Pay</td>
                    <td className="pt-3 text-right text-red-700 text-base">{selectedPayslip.amount}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between pt-10 text-[10px] text-zinc-500">
                <div>
                  <div className="border-b border-zinc-300 w-32 pb-4"></div>
                  <p className="mt-1 text-center">Employee Signature</p>
                </div>
                <div className="text-right">
                  <div className="border-b border-zinc-300 w-32 pb-4"></div>
                  <p className="mt-1 text-center">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 mt-6 pt-4 border-t border-glass-border justify-end">
              <button 
                onClick={() => handleDownload(selectedPayslip, getUserName(selectedPayslip.userId))}
                className="flex items-center px-4 py-2 bg-glass-item hover:bg-glass-panel-hover border border-glass-border text-glass-text rounded-xl text-xs font-semibold transition"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download HTML
              </button>
              <button 
                onClick={() => {
                  const printContents = document.getElementById('print-payslip-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(`
                      <html>
                        <head>
                          <title>Print Payslip</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; }
                            #print-payslip-area { background: #white; width: 100%; max-width: 600px; margin: 0 auto; }
                          </style>
                        </head>
                        <body>
                          ${printContents}
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    `);
                    printWindow?.document.close();
                  }
                }}
                className="flex items-center px-4 py-2 bg-glass-accent hover:bg-red-500 text-white rounded-xl text-xs font-bold transition border border-glass-accent/30"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Payslip
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Add the helper function inside the component before render
const handleDownload = (slip: any, empName: string) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<title>Payslip - ${slip.month}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; padding: 40px; background-color: #f9f9f9; }
  .invoice-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
  .logo { color: #b91c1c; font-size: 24px; font-weight: bold; }
  .title { text-align: right; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .meta-item label { font-size: 10px; text-transform: uppercase; color: #718096; font-weight: bold; }
  .meta-item p { margin: 4px 0 0 0; font-size: 14px; font-weight: 500; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  .table th { text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e0; color: #4a5568; font-size: 12px; }
  .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  .total-row td { font-weight: bold; border-top: 2px solid #cbd5e0; }
  .footer { text-align: center; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px; }
</style>
</head>
<body>
<div class="invoice-card">
  <div class="header">
    <div class="logo">Crimson Cup BD</div>
    <div class="title">
      <h2 style="margin: 0; font-size: 20px;">Payslip Receipt</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #718096;">ID: ${slip.id}</p>
    </div>
  </div>
  
  <div class="meta">
    <div class="meta-item">
      <label>Employee Details</label>
      <p style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">${empName}</p>
      <p style="font-size: 12px; color: #718096; margin: 0;">ID: ${slip.userId}</p>
    </div>
    <div class="meta-item" style="text-align: right;">
      <label>Statement Month</label>
      <p style="font-size: 16px; font-weight: bold; margin: 0;">${slip.month}</p>
      <p style="font-size: 12px; color: #718096; margin: 4px 0 0 0;">Issued: ${slip.date}</p>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Basic Salary</td>
        <td style="text-align: right;">৳ ${(slip.basic || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>House Allowance</td>
        <td style="text-align: right;">৳ ${(slip.houseAllowance || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Medical Allowance</td>
        <td style="text-align: right;">৳ ${(slip.medical || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>TA / DA</td>
        <td style="text-align: right;">৳ ${(slip.tada || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Overtime Allowance</td>
        <td style="text-align: right;">৳ ${(slip.overtimeAmount || 0).toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td>Total Net Pay</td>
        <td style="text-align: right; color: #b91c1c; font-size: 18px;">${slip.amount}</td>
      </tr>
    </tbody>
  </table>

  <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px;">
    <div>
      <div style="border-bottom: 1px solid #cbd5e0; width: 150px; padding-bottom: 5px;"></div>
      <p style="margin: 5px 0 0 0; color: #718096; text-align: center;">Employee Signature</p>
    </div>
    <div style="text-align: right;">
      <div style="border-bottom: 1px solid #cbd5e0; width: 150px; padding-bottom: 5px;"></div>
      <p style="margin: 5px 0 0 0; color: #718096; text-align: center;">Authorized Signatory</p>
    </div>
  </div>

  <div class="footer">
    This is a system generated payslip receipt for Crimson Cup Bangladesh. All amounts in BDT.
  </div>
</div>
</body>
</html>
  `;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Payslip_${slip.month.replace(' ', '_')}_${empName.replace(' ', '_')}.html`;
  link.click();
};
