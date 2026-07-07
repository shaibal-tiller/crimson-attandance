import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User as UserIcon, Loader2, Plus, MessageSquare, Trash2, Edit2, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useUser } from '../context/UserContext';

function MessageRenderer({ content }: { content: string }) {
  const parts = content.split(/(```chart\n[\s\S]*?\n```)/);
  
  return (
    <div className="space-y-4">
      {parts.map((part, idx) => {
        if (part.startsWith('```chart')) {
          try {
            const jsonStr = part.replace(/```chart\n/, '').replace(/\n```$/, '');
            const data = JSON.parse(jsonStr);
            return (
              <div key={idx} className="h-64 w-full bg-black/20 rounded-xl p-4 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0a0a0" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff'}} />
                    <Bar dataKey="value" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          } catch(e) {
            return <div key={idx} className="text-red-400 text-xs">Error parsing chart data.</div>;
          }
        }
        return <span key={idx}>{part}</span>;
      })}
    </div>
  );
}

export default function AIChatView() {
  const { user } = useUser();
  if (!user) return null;
  const [showUsage, setShowUsage] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions', user.id],
    queryFn: async () => {
      const res = await axios.get(`/api/chat/sessions?userId=${user.id}`);
      return res.data.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  });

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await axios.get(`/api/chat/sessions/${sessionId}/messages`);
      const msgs = res.data.map((m: any) => ({ role: m.role, content: m.content }));
      setMessages(msgs);
    } catch(e) { console.error(e); }
  };

  const { data: usageLogs = [], refetch: refetchUsage } = useQuery({
    queryKey: ['chat-usage', user.id],
    queryFn: async () => {
      const res = await axios.get(`/api/chat/usage?userId=${user.id}`);
      return res.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: false // Only fetch when usage modal is opened
  });

  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    } else {
      setMessages([{ role: 'model', content: `Hello ${user.name}, I am your Crimson Cup AI Assistant. How can I help you analyze attendance, inventory, or roster data today?` }]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
  };

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string, title: string }) => axios.put(`/api/chat/sessions/${id}`, { title }),
    onSuccess: () => {
      setEditingSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', user.id] });
    },
    onError: (e) => console.error(e)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/chat/sessions/${id}`),
    onSuccess: (_, id) => {
      if (currentSessionId === id) setCurrentSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions', user.id] });
    },
    onError: (e) => console.error(e)
  });

  const handleRename = (id: string, title: string) => renameMutation.mutate({ id, title });
  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    let targetSessionId = currentSessionId;
    
    // Create new session if none exists
    if (!targetSessionId) {
      try {
        const title = input.length > 20 ? input.substring(0, 20) + '...' : input;
        const res = await axios.post('/api/chat/sessions', { userId: user.id, title });
        targetSessionId = res.data.id;
        setCurrentSessionId(targetSessionId);
        queryClient.invalidateQueries({ queryKey: ['chat-sessions', user.id] }); // Refresh sidebar
      } catch(e) {
        console.error("Failed to create session", e);
        return;
      }
    }

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', { 
        message: userMessage.content, 
        history: messages,
        user: { id: user.id, uid: user.id, role: user.role, branchId: user.branchId },
        sessionId: targetSessionId
      });
      const data = response.data;
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
        queryClient.invalidateQueries({ queryKey: ['chat-sessions', user.id] }); // Update sort order in sidebar
      } else {
        throw new Error("No reply from AI");
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error connecting to the intelligence server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full glass-panel rounded-2xl overflow-hidden relative">
      
      {/* Chat Sidebar - hidden on mobile, toggle via button */}
      <div className={cn(
        "w-64 border-r border-glass-border-light bg-glass-item flex flex-col shrink-0 transition-all duration-300",
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:rounded-none max-md:w-72",
        showSidebar ? "max-md:translate-x-0" : "max-md:-translate-x-full"
      )}>
        <div className="p-4 border-b border-glass-border-light">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-glass-panel border border-glass-border rounded-xl text-glass-text hover:bg-glass-panel-hover transition shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <div 
              key={s.id} 
              className={cn(
                "group flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-sm",
                currentSessionId === s.id ? "bg-glass-accent-light text-glass-accent" : "text-glass-text hover:bg-glass-panel"
              )}
              onClick={() => { if (editingSessionId !== s.id) { setCurrentSessionId(s.id); setShowSidebar(false); } }}
            >
              {editingSessionId === s.id ? (
                <input 
                  autoFocus
                  className="bg-black/30 border border-glass-accent/30 rounded px-2 py-1 text-xs w-full text-white focus:outline-none"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => handleRename(s.id, editTitle)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(s.id, editTitle); if (e.key === 'Escape') setEditingSessionId(null); }}
                />
              ) : (
                <div className="flex items-center space-x-2 overflow-hidden">
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate">{s.title}</span>
                </div>
              )}
              
              {!editingSessionId && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditTitle(s.title); setEditingSessionId(s.id); }} className="p-1 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-1 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-glass-border-light">
          <button 
            onClick={() => { refetchUsage(); setShowUsage(true); }}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-black/20 rounded-xl text-glass-text-muted hover:text-glass-text hover:bg-black/30 transition"
          >
            <Activity className="w-4 h-4" />
            <span className="font-medium text-xs">View Usage Stats</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-glass-border-light bg-glass-item flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowSidebar(true)} className="md:hidden p-1.5 -ml-1 rounded-lg text-glass-text-muted hover:text-glass-text active:bg-white/10 transition">
              <MessageSquare className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-glass-text">
                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title || 'Chat' : 'New Chat'}
              </h2>
              <p className="text-[10px] sm:text-xs text-glass-text-muted">Gemini Powered AI</p>
            </div>
          </div>
          <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-glass-accent" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn("flex max-w-[80%] items-start space-x-3", msg.role === 'user' ? "flex-row-reverse space-x-reverse" : "flex-row")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-glass-border-light",
                  msg.role === 'user' ? "bg-glass-panel text-glass-text" : "bg-glass-accent-light text-glass-accent"
                )}>
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm shadow-sm whitespace-pre-wrap border border-glass-border w-full min-w-0 overflow-x-auto",
                  msg.role === 'user' ? "bg-glass-panel text-glass-text rounded-tr-none" : "bg-glass-item text-glass-text rounded-tl-none"
                )}>
                  <MessageRenderer content={msg.content} />
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 text-glass-text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-medium">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-glass-border bg-glass-item shrink-0">
          <form onSubmit={handleSend} className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="✨ Ask AI for insights or reports..."
              className="flex-1 px-4 py-3 bg-black/30 border border-glass-accent/30 rounded-xl focus:outline-none focus:border-glass-accent focus:bg-black/50 transition text-sm text-glass-text placeholder-glass-text-muted"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-glass-accent text-white rounded-xl hover:bg-[#a00f1a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm"
            >
              Send <Send className="w-4 h-4 ml-2" />
            </button>
          </form>
        </div>
      </div>

      {/* Usage Modal */}
      {showUsage && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#111] border border-glass-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
            <div className="p-4 border-b border-glass-border-light flex justify-between items-center bg-[#1a1a1a]">
              <h3 className="text-lg font-semibold text-white flex items-center"><Activity className="w-5 h-5 mr-2 text-glass-accent" /> AI Usage History</h3>
              <button onClick={() => setShowUsage(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {usageLogs.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No AI usage recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="bg-glass-accent/10 border border-glass-accent/20 rounded-lg p-4 mb-4">
                    <p className="text-glass-accent text-sm font-medium">Total Lifetime Queries: {usageLogs.length}</p>
                  </div>
                  {usageLogs.slice(0, 50).map(log => (
                    <div key={log.id} className="flex justify-between items-center p-3 rounded bg-black/40 border border-glass-border-light">
                      <span className="text-sm text-gray-300 font-medium">Chat Query</span>
                      <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  {usageLogs.length > 50 && <p className="text-xs text-center text-gray-500 pt-2">Showing last 50 queries</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
