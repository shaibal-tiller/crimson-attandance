import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, ScanFace, Fingerprint, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function AttendanceView() {
  const { user } = useUser();
  if (!user) return null;
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchLogs = () => {
    Promise.all([
      axios.get('/api/attendance'),
      axios.get('/api/leave')
    ]).then(([attRes, leaveRes]) => {
      const data = attRes.data || [];
      const lData = leaveRes.data || [];
      
      const userLogs = data.filter((l: any) => l.userId === user.id);
      const userLeaves = lData.filter((l: any) => l.userId === user.id);
      setLogs(userLogs);
      setLeaves(userLeaves);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const handleCheckInOut = (type: string) => {
    setCheckingIn(true);
    const endpoint = checkedIn ? '/api/attendance/check-out' : '/api/attendance/check-in';
    
    axios.post(endpoint, { userId: user.id, branchId: user.branchId, type })
    .then(res => {
      setCheckingIn(false);
      if(res.data.success) {
        setCheckedIn(!checkedIn);
        fetchLogs();
      }
    })
    .catch(err => {
      console.error(err);
      setCheckingIn(false);
    });
  };

  // Calendar Helpers
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const renderCalendar = () => {
    const days = [];
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-indexed

    // Padding for first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-glass-border-light bg-glass-item/30 opacity-30 min-h-[80px]" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      
      const dayLog = logs.find(l => l.date === dateStr);
      const dayLeave = leaves.find(l => {
        // Leave is startDate to endDate
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        const current = new Date(dateStr);
        return current >= start && current <= end && l.status === 'Approved';
      });

      let statusUi = null;
      let bgColor = 'bg-glass-item';

      if (dayLeave) {
        bgColor = 'bg-yellow-900/30';
        statusUi = (
          <div className="flex flex-col items-center mt-1 text-yellow-500">
            <AlertCircle className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-medium leading-tight text-center">On Leave</span>
          </div>
        );
      } else if (dayLog) {
        if (dayLog.status === 'Present') {
          bgColor = 'bg-[#2D6A4F]/20';
          statusUi = (
            <div className="flex flex-col items-center mt-1 text-[#2D6A4F]">
              <CheckCircle2 className="w-4 h-4 mb-1" />
              <span className="text-[10px] font-medium leading-tight text-center whitespace-nowrap">
                {dayLog.checkIn} <br/> {dayLog.checkOut || '-'}
              </span>
            </div>
          );
        } else {
           // Late or Absent
           bgColor = 'bg-red-900/20';
           statusUi = (
             <div className="flex flex-col items-center mt-1 text-red-500">
               <XCircle className="w-4 h-4 mb-1" />
               <span className="text-[10px] font-medium leading-tight text-center">{dayLog.status}</span>
             </div>
           );
        }
      }

      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <div key={d} className={`p-2 border border-glass-border-light min-h-[80px] flex flex-col items-center relative ${bgColor} transition-colors hover:bg-glass-panel-hover`}>
          <span className={`text-xs font-semibold ${isToday ? 'bg-glass-accent text-white px-2 py-0.5 rounded-full' : 'text-glass-text'}`}>{d}</span>
          {statusUi}
        </div>
      );
    }

    return (
      <div className="flex-1 w-full">
        <div className="flex justify-between items-center mb-4 px-2">
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-glass-item border border-transparent hover:border-glass-border text-glass-text transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-glass-text">{monthName}</h3>
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-glass-item border border-transparent hover:border-glass-border text-glass-text transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-medium text-glass-text-muted uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t border-l border-glass-border-light rounded-xl overflow-hidden">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-glass-text">Attendance & Leave Calendar</h1>
        <p className="text-sm text-glass-text-muted">Log your daily attendance and view history visually.</p>
      </div>

      {(user.role === 'Employee' || user.role === 'Supervisor' || user.role === 'Manager') && (
        <div className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 w-full">
            <h2 className="text-lg font-semibold text-glass-text mb-2">Current Status: {checkedIn ? 'Checked In' : 'Not Checked In'}</h2>
            <p className="text-sm text-glass-text-muted mb-4">Location: {user.branchName} (Geofence Active)</p>
            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={() => handleCheckInOut('App')}
                disabled={checkingIn}
                className={`flex-1 md:flex-none py-3 px-6 rounded-lg font-medium flex items-center justify-center transition-colors ${
                  checkedIn 
                    ? 'bg-glass-accent text-white hover:bg-[#a00f1a]' 
                    : 'bg-glass-item border border-glass-border text-glass-text hover:bg-glass-panel-hover'
                }`}
              >
                {checkingIn ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    {checkedIn ? 'Check Out (App)' : 'Check In (App)'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-center justify-center px-8 border-l border-glass-border-light space-y-4">
            <p className="text-sm font-medium text-glass-text-muted text-center">Hardware Simulators</p>
            <div className="flex gap-4">
              <button onClick={() => handleCheckInOut('Fingerprint')} className="p-4 rounded-full bg-glass-item border border-glass-border text-glass-text-muted hover:bg-glass-panel-hover hover:text-white transition" title="Simulate Fingerprint Scan">
                <Fingerprint className="w-8 h-8" />
              </button>
              <button onClick={() => handleCheckInOut('Face')} className="p-4 rounded-full bg-glass-item border border-glass-border text-glass-text-muted hover:bg-glass-panel-hover hover:text-white transition" title="Simulate Face Scan">
                <ScanFace className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden p-6 w-full overflow-x-auto custom-scrollbar">
        {renderCalendar()}
      </div>
    </div>
  );
}
