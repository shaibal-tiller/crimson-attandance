const fs = require('fs');

let content = fs.readFileSync('src/views/PayrollView.tsx', 'utf-8');

// Replace handleDownload definition and add generatePayslipHTML
content = content.replace(
  "const handleDownload = (slip: any, empName: string) => {",
  `const generatePayslipHTML = (slip: any, empName: string) => {
  return \`
<!DOCTYPE html>
<html>
<head>
<title>Payslip - \${slip.month}</title>
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
  @media print {
    body { padding: 0; background-color: #fff; }
    .invoice-card { border: none; box-shadow: none; max-width: 100%; padding: 0; }
  }
</style>
</head>
<body>
<div class="invoice-card">
  <div class="header">
    <div class="logo">Crimson Cup BD</div>
    <div class="title">
      <h2 style="margin: 0; font-size: 20px;">Payslip Receipt</h2>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #718096;">ID: \${slip.id}</p>
    </div>
  </div>
  
  <div class="meta">
    <div class="meta-item">
      <label>Employee Details</label>
      <p style="font-size: 16px; font-weight: bold; margin-bottom: 2px;">\${empName}</p>
      <p style="font-size: 12px; color: #718096; margin: 0;">ID: \${slip.userId}</p>
    </div>
    <div class="meta-item" style="text-align: right;">
      <label>Statement Month</label>
      <p style="font-size: 16px; font-weight: bold; margin: 0;">\${slip.month}</p>
      <p style="font-size: 12px; color: #718096; margin: 4px 0 0 0;">Issued: \${slip.date}</p>
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
      </tr>
      <tr class="total-row">
        <td>Total Net Pay</td>
        <td style="text-align: right; color: #b91c1c; font-size: 18px;">\${slip.amount}</td>
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
<script>
  if (window.location.search.includes('print=true')) {
    window.onload = function() { window.print(); window.close(); }
  }
</script>
</body>
</html>
\`;
}

const handleDownload = (slip: any, empName: string) => {
  const htmlContent = generatePayslipHTML(slip, empName);`
);

// We need to replace the content of the Print button's onClick
const oldPrintBlock = \`onClick={() => {
                  const printContents = document.getElementById('print-payslip-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(\\\`
                      <html>
                        <head>
                          <title>Print Payslip</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; }
                            #print-payslip-area { background: #white; width: 100%; max-width: 600px; margin: 0 auto; }
                          </style>
                        </head>
                        <body>
                          \${printContents}
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    \\\`);
                    printWindow?.document.close();
                  }
                }}\`;

const newPrintBlock = \`onClick={() => {
                  const html = generatePayslipHTML(selectedPayslip, getUserName(selectedPayslip.userId));
                  const printWindow = window.open('?print=true', '_blank');
                  if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                  }
                }}\`;

// The old text includes escaped backticks in the string, it's safer to use regex or string replace. Let's just use string replace.
content = content.replace(oldPrintBlock, newPrintBlock);

// Wait, the old text had literal backticks in the source code. Let's make sure it matches.
// A better way is to just replace the whole button:
const oldButton = \`<button 
                onClick={() => {
                  const printContents = document.getElementById('print-payslip-area')?.innerHTML;
                  const originalContents = document.body.innerHTML;
                  if (printContents) {
                    const printWindow = window.open('', '_blank');
                    printWindow?.document.write(\\\`
                      <html>
                        <head>
                          <title>Print Payslip</title>
                          <style>
                            body { font-family: sans-serif; padding: 20px; }
                            #print-payslip-area { background: #white; width: 100%; max-width: 600px; margin: 0 auto; }
                          </style>
                        </head>
                        <body>
                          \${printContents}
                          <script>window.onload = function() { window.print(); window.close(); }</script>
                        </body>
                      </html>
                    \\\`);
                    printWindow?.document.close();
                  }
                }}
                className="flex items-center px-4 py-2 bg-glass-accent hover:bg-red-500 text-white rounded-xl text-xs font-bold transition border border-glass-accent/30"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Payslip
              </button>\`;
              
const newButton = \`<button 
                onClick={() => {
                  const html = generatePayslipHTML(selectedPayslip, getUserName(selectedPayslip.userId));
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    
                    // We append a script to auto-print since we removed it from the string above
                    const script = printWindow.document.createElement('script');
                    script.textContent = "window.onload = function() { window.print(); window.close(); }";
                    printWindow.document.body.appendChild(script);
                  }
                }}
                className="flex items-center px-4 py-2 bg-glass-accent hover:bg-red-500 text-white rounded-xl text-xs font-bold transition border border-glass-accent/30"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Payslip
              </button>\`;

// First try replacing the oldButton text
const index = content.indexOf('const printContents = document.getElementById(\\'print-payslip-area\\')?.innerHTML;');
if (index > -1) {
  // It's there, but spacing might differ. Let's do a substring replace.
  const start = content.lastIndexOf('<button', index);
  const end = content.indexOf('</button>', index) + 9;
  
  if (start > -1 && end > -1) {
    content = content.substring(0, start) + newButton + content.substring(end);
  }
}

// Strip out the rest of the old handleDownload HTML string building since we extracted it
content = content.replace(/const htmlContent = \`[\\s\\S]*?  \`;/, '');

fs.writeFileSync('src/views/PayrollView.tsx', content, 'utf-8');
console.log('Fixed Print button');
