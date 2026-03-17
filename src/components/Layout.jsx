import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, ClipboardList, FileText, StickyNote, Brain, MessageSquare, LogOut, Menu, Search, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown from './CustomDropdown';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'tasks', label: 'Task Manager', icon: ClipboardList, path: '/tasks' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/documents' },
    { id: 'notes', label: 'Notes', icon: StickyNote, path: '/notes' },
    { id: 'knowledge', label: 'Knowledge Hub', icon: Brain, path: '/knowledge' },
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare, path: '/chat' },
  ];

  return (
    <div className="flex min-h-screen bg-dark overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-darker/50 backdrop-blur-2xl border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              ⚡
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VibeFlow
            </span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Main Menu</div>
            {navItems.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`nav-item w-full ${activeSection === item.id ? 'nav-item-active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-primary px-2 py-0.5 rounded-full text-[10px] text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mt-8 mb-4">AI Features</div>
            {navItems.slice(4).map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`nav-item w-full ${activeSection === item.id ? 'nav-item-active' : ''}`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-6 mt-auto">
            <div className="glass-card p-4 bg-indigo-500/5 border-indigo-500/10">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Pro Tip</div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Use <kbd className="bg-white/5 px-1 rounded text-slate-400">Ctrl + K</kbd> to search everything instantly.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-dark/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold capitalize">{activeSection.replace('-', ' ')}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 rounded-full px-4 py-2 w-80 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all duration-300">
              <Search size={18} className="text-slate-500" />
              <input
                type="text"
                placeholder="Search everything..."
                className="bg-transparent border-none outline-none text-sm text-white w-full"
              />
            </div>
            
            <CustomDropdown
              className="w-48"
              options={[
                { value: 'profile', label: 'My Profile', icon: User },
                { value: 'signout', label: 'Sign Out', icon: LogOut }
              ]}
              value=""
              onChange={(val) => {
                if (val === 'profile') navigate('/profile');
                if (val === 'signout') logout();
              }}
              // This specialized dropdown trigger for the header
              renderTrigger={() => (
                <button className="flex items-center gap-3 p-1 pr-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all group">
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-lg group-hover:scale-105 transition-transform">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-300 hidden sm:inline">{user?.displayName || 'Account'}</span>
                  <ChevronDown size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              )}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -ml-64 -mb-64 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto relative">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
