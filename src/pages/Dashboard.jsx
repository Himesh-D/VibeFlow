import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where } from '../config/firebase';
import { ClipboardList, FileText, StickyNote, Clock, ChevronRight, Plus, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, docs: 0, notes: 0, deadlines: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const qTasks = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
        const qDocs = query(collection(db, 'documents'), where('user_id', '==', user.uid));
        const qNotes = query(collection(db, 'notes'), where('user_id', '==', user.uid));

        const [tasksSnap, docsSnap, notesSnap] = await Promise.all([
          getDocs(qTasks),
          getDocs(qDocs),
          getDocs(qNotes)
        ]);

        const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        const deadlines = tasks.filter(t => t.due_date && t.status !== 'completed');

        setStats({
          tasks: pendingTasks.length,
          docs: docsSnap.size,
          notes: notesSnap.size,
          deadlines: deadlines.length
        });

        setRecentTasks(tasks.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Pending Tasks', value: stats.tasks, icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Documents', value: stats.docs, icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Saved Notes', value: stats.notes, icon: StickyNote, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Upcoming Deadlines', value: stats.deadlines, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">
          Good Morning, <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.displayName || 'User'}</span>
        </h2>
        <p className="text-slate-400 mt-1">Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex items-center gap-5 group cursor-pointer"
          >
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
              <stat.icon size={28} />
            </div>
            <div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList size={22} className="text-indigo-400" />
              Focus for Today
            </h3>
            <button className="text-sm text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card glass-card-hover p-4 flex items-center gap-4"
                >
                  <input 
                    type="checkbox" 
                    readOnly 
                    checked={task.status === 'completed'}
                    className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-primary focus:ring-primary/20" 
                  />
                  <div className="flex-1">
                    <div className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </div>
                    {task.due_date && (
                      <div className="text-xs text-slate-500 mt-0.5">📅 {task.due_date}</div>
                    )}
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5 ${
                    task.priority === 'high' ? 'text-red-400' : 
                    task.priority === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {task.priority}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="glass-card p-10 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-3xl">📋</div>
                <div>
                  <div className="text-lg font-bold">No tasks today</div>
                  <p className="text-slate-500">Take a breath, or start planning</p>
                </div>
                <button className="btn-primary flex items-center gap-2 mx-auto scale-90">
                  <Plus size={20} /> New Task
                </button>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights & Quick Chat */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Brain size={22} className="text-purple-400" />
            AI Assistant
          </h3>
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">🤖</div>
              <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 text-sm text-slate-300 leading-relaxed">
                Welcome back! You have <strong>{stats.tasks}</strong> pending tasks for today. Would you like me to prioritize them for you?
              </div>
            </div>
            <div className="pt-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ask me anything..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                />
                <button className="absolute right-2 top-2 w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xs shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform">
                  ➔
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-semibold">
                <FileText size={20} className="text-cyan-400" /> Upload
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-xs font-semibold">
                <StickyNote size={20} className="text-emerald-400" /> Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
