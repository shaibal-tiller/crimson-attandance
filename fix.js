const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace('<LogOut,\n  Clock className="w-4 h-4" />', '<LogOut className="w-4 h-4" />');
fs.writeFileSync('src/App.tsx', code);
