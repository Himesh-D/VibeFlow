import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where } from '../config/firebase';
import { Brain, Search, FileText, StickyNote, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Knowledge = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchKnowledge = async () => {
    if (!user) return;
    try {
      const qDocs = query(collection(db, 'documents'), where('user_id', '==', user.uid));
      const qNotes = query(collection(db, 'notes'), where('user_id', '==', user.uid));

      const [docsSnap, notesSnap] = await Promise.all([
        getDocs(qDocs),
        getDocs(qNotes)
      ]);

      const data = [
        ...docsSnap.docs.map(d => ({ 
          id: d.id, 
          type: 'document',
          title: d.data().original_name,
          summary: d.data().summary,
          date: d.data().uploaded_at,
          icon: FileText,
          color: 'text-indigo-400'
        })),
        ...notesSnap.docs.map(d => ({
          id: d.id,
          type: 'note',
          title: d.data().title,
          summary: d.data().summary,
          date: d.data().created_at,
          icon: StickyNote,
          color: 'text-emerald-400'
        }))
      ].filter(item => item.summary);

      setItems(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error('Error fetching knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [user]);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto space-y-6 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Brain size={40} />
        </div>
        <h2 className="text-4xl font-bold text-white">Knowledge Hub</h2>
        <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
          Your centralized intelligence center. Every document you upload and note you write is processed into searchable, actionable knowledge.
        </p>
        <div className="relative max-w-2xl mx-auto mt-10">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
          <input
            type="text"
            placeholder="Search through your collective intelligence..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-6 text-lg text-white outline-none focus:bg-white/10 focus:border-indigo-500/50 shadow-2xl transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Knowledge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
             <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <AnimatePresence>
            {filteredItems.map((item, i) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-8 flex flex-col group cursor-pointer border-indigo-500/5"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`p-3 bg-white/5 ${item.color} rounded-xl`}>
                    <item.icon size={24} />
                  </div>
                  <Sparkles className="text-indigo-400/20 group-hover:text-indigo-400 transition-colors" size={20} />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <span>{item.type} source</span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-4 italic">
                    "{item.summary}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mt-8 group-hover:gap-3 transition-all">
                  Read Original <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-24 text-center glass-card border-dashed">
             <div className="text-6xl mb-6 grayscale opacity-30">🧠</div>
             <h3 className="text-2xl font-bold text-white">No knowledge items found</h3>
             <p className="text-slate-500 mt-2 max-w-md mx-auto">
               Once you upload documents or save notes, our AI will extract key insights and populate your hub!
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;
