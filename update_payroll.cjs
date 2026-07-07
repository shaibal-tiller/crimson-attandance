const fs = require('fs');

let content = fs.readFileSync('src/views/PayrollView.tsx', 'utf-8');

// 1. Add overtime query
content = content.replace(
  "const { data: payrollData = { payslips: [], users: [] }, isLoading: loading } = useQuery({",
  `const { data: allOvertime = [] } = useQuery({
    queryKey: ['overtime'],
    queryFn: async () => {
      const res = await axios.get('/api/overtime');
      return res.data;
    }
  });

  const { data: payrollData = { payslips: [], users: [] }, isLoading: loading } = useQuery({`
);

// 2. State for month should be YYYY-MM
content = content.replace(
  "const [month, setMonth] = useState('October 2023');",
  "const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));"
);

// Remove amount state as we compute it dynamically
content = content.replace(
  "const [amount, setAmount] = useState('৳ 20,000');",
  ""
);

// 3. Dynamic Calculation
content = content.replace(
  "const handleGenerate = (e: React.FormEvent) => {",
  `// Derived State Calculations
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
  const formattedAmount = \`৳ \${totalAmount.toLocaleString()}\`;

  const handleGenerate = (e: React.FormEvent) => {`
);

// 4. Update generate mutation payload
content = content.replace(
  `      userId: selectedUser,
      month,
      amount,
      status,`,
  `      userId: selectedUser,
      month: monthString,
      amount: formattedAmount,
      basic,
      medical,
      tada,
      houseAllowance,
      overtimeAmount,
      status,`
);

// 5. Update Month input in form
content = content.replace(
  `<input 
                type="text" 
                value={month}
                onChange={e => setMonth(e.target.value)}`,
  `<input 
                type="month" 
                value={month}
                onChange={e => setMonth(e.target.value)}`
);

// 6. Replace Amount input with Breakdown UI
content = content.replace(
  `<div>
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Base Amount (Adjust for Overtime 1.5x)</label>
              <input 
                type="text" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
                required
              />
            </div>`,
  `
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
            </div>`
);


// 7. Update Payslip preview modal (table rows)
const previewTableRows = `                  <tr className="border-b border-zinc-100">
                    <td className="py-2 text-zinc-800 text-xs">Base Salary & Allowances</td>
                    <td className="py-2 text-right font-medium text-zinc-950 text-xs">{selectedPayslip.amount}</td>
                  </tr>`;

const newPreviewTableRows = `                  <tr className="border-b border-zinc-100">
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
                  </tr>`;

content = content.replace(previewTableRows, newPreviewTableRows);

// 8. Update Download HTML string
const htmlTableRows = `      <tr>
        <td>Base Salary & Allowances</td>
        <td style="text-align: right;">\${slip.amount}</td>
      </tr>`;
      
const newHtmlTableRows = `      <tr>
        <td>Basic Salary</td>
        <td style="text-align: right;">৳ \${(slip.basic || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>House Allowance</td>
        <td style="text-align: right;">৳ \${(slip.houseAllowance || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Medical Allowance</td>
        <td style="text-align: right;">৳ \${(slip.medical || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>TA / DA</td>
        <td style="text-align: right;">৳ \${(slip.tada || 0).toLocaleString()}</td>
      </tr>
      <tr>
        <td>Overtime Allowance</td>
        <td style="text-align: right;">৳ \${(slip.overtimeAmount || 0).toLocaleString()}</td>
      </tr>`;
content = content.replace(htmlTableRows, newHtmlTableRows);

fs.writeFileSync('src/views/PayrollView.tsx', content, 'utf-8');
console.log('Done rewriting PayrollView');
