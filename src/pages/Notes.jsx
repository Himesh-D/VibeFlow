import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where, addDoc, doc, updateDoc, firestoreDeleteDoc } from '../config/firebase';
import { summarizeText } from '../utils/ai';
import { StickyNote, Plus, Search, Trash2, Edit2, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [noteData, setNoteData] = useState({ title: '', content: '' });

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'notes'), where('user_id', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotes(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const summary = summarizeText(noteData.content);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'notes', editingId), { 
          ...noteData, 
          summary,
          updated_at: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          ...noteData,
          summary,
          user_id: user.uid,
          created_at: new Date().toISOString()
        });
      }
      setShowModal(false);
      setEditingId(null);
      setNoteData({ title: '', content: '' });
      fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await firestoreDeleteDoc(doc(db, 'notes', id));
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const openEdit = (note) => {
    setEditingId(note.id);
    setNoteData({ title: note.title, content: note.content });
    setShowModal(true);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search your notes..."
            className="input-field pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setEditingId(null); setNoteData({ title: '', content: '' }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>New Note</span>
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
             <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredNotes.length > 0 ? (
          <AnimatePresence>
            {filteredNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col group h-[320px]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                    <StickyNote size={20} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(note)} className="p-2 text-slate-500 hover:text-white"><Edit2 size={16} /></button>
                    <button onClick={() => deleteNote(note.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>

                <h4 className="font-bold text-lg text-white mb-2 truncate">{note.title}</h4>
                <p className="text-sm text-slate-400 line-clamp-3 mb-4">{note.content}</p>
                
                {note.summary && (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-2">
                       <Sparkles size={12} className="text-emerald-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Summary</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed italic">"{note.summary}"</p>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 mt-4 flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-6xl mb-4">✍️</div>
            <h3 className="text-xl font-bold text-white">No notes yet</h3>
            <p className="text-slate-500">Capture your thoughts. We'll handle the summaries.</p>
          </div>
        )}
      </div>

      {/* Note Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl p-8 relative z-10"
            >
              <h3 className="text-2xl font-bold mb-6">{editingId ? 'Edit Note' : 'Create New Note'}</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Enter note title..."
                    value={noteData.title}
                    onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Content</label>
                  <textarea
                    required
                    className="input-field h-64 resize-none leading-relaxed"
                    placeholder="Start typing your thoughts here..."
                    value={noteData.content}
                    onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingId ? 'Save Changes' : 'Create Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notes;
