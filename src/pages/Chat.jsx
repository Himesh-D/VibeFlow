import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where } from '../config/firebase';
import { chatResponse } from '../utils/ai';
import { Send, Bot, User, Sparkles, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState({ tasks: 0, docs: 0, notes: 0 });
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const [t, d, n] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('user_id', '==', user.uid))),
        getDocs(query(collection(db, 'documents'), where('user_id', '==', user.uid))),
        getDocs(query(collection(db, 'notes'), where('user_id', '==', user.uid)))
      ]);
      setStats({ tasks: t.size, docs: d.size, notes: n.size });
    };
    fetchStats();

    // Initial message
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `Hello ${user?.displayName || 'there'}! I'm your VibeFlow Assistant. How can I help you today? I can track your tasks, summarize your documents, or even give you productivity tips! 🚀`,
      timestamp: new Date().toISOString()
    }]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const assistantResponse = chatResponse(input, {
        taskCount: stats.tasks,
        docCount: stats.docs,
        noteCount: stats.notes
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const clearChat = () => {
    if (!window.confirm('Clear chat history?')) return;
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: 'Chat cleared. How else can I assist you?',
      timestamp: new Date().toISOString()
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-4xl mx-auto glass-card overflow-hidden">
      {/* Chat Header */}
      <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">🤖</div>
          <div>
            <h3 className="font-bold text-lg text-white">Smart Assistant</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Online & Ready
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/10 text-slate-400'
              }`}>
                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
              </div>
              
              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : ''}`}>
                <div className={`
                    p-5 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'assistant' 
                        ? 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none' 
                        : 'bg-indigo-500 text-white rounded-tr-none shadow-xl shadow-indigo-500/10'}
                `}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-3' : ''}>
                       {line.includes('**') ? (
                         line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-bold">{part}</strong> : part)
                       ) : line}
                    </p>
                  ))}
                  {msg.role === 'assistant' && (
                    <div className="mt-4 flex gap-2">
                       <Sparkles size={14} className="text-indigo-400" />
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">AI Generated</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-600 mt-2 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white"><Bot size={20} /></div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-5 flex gap-2">
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white/5 border-t border-white/5">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            className="w-full bg-dark/50 border border-white/10 rounded-2xl pl-6 pr-20 py-5 text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
            placeholder="Ask me about your tasks or get productivity advice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Send size={18} />
            <span className="font-bold text-sm hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-600 mt-4 font-bold uppercase tracking-widest">
           Experimental AI • May provide inaccurate info
        </p>
      </div>
    </div>
  );
};

export default Chat;
