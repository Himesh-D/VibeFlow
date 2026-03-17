import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where, addDoc, doc, firestoreDeleteDoc } from '../config/firebase';
import { summarizeText, extractTasks } from '../utils/ai';
import { FileText, Upload, Trash2, Calendar, FileType, Search, ExternalLink, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Documents = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'documents'), where('user_id', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocuments(data.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)));
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      const content = await new Promise((resolve, reject) => {
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        const ext = file.name.split('.').pop().toLowerCase();
        if (['txt', 'md', 'csv', 'json'].includes(ext)) {
          reader.readAsText(file);
        } else {
          resolve(`[Binary file: ${file.name}] - Text extraction limited.`);
        }
      });

      const summary = summarizeText(content);
      const tasks = extractTasks(content);

      const docData = {
        user_id: user.uid,
        original_name: file.name,
        content: content,
        summary: summary,
        extracted_tasks: tasks,
        uploaded_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'documents'), docData);

      // Auto-add tasks
      for (const t of tasks) {
        await addDoc(collection(db, 'tasks'), {
          user_id: user.uid,
          title: t.title,
          description: `Extracted from: ${file.name}`,
          due_date: t.due_date || null,
          priority: t.priority || 'medium',
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await firestoreDeleteDoc(doc(db, 'documents', id));
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.original_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Upload & Search */}
      <div className="flex flex-col md:flex-row gap-6">
        <label className="flex-1">
          <div className={`
            glass-card border-dashed border-2 p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all
            ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-500/50 hover:bg-white/10'}
          `}>
            {uploading ? (
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                <Upload size={32} />
              </div>
            )}
            <h4 className="text-xl font-bold text-white mb-2">
              {uploading ? 'AI is processing your document...' : 'Upload new document'}
            </h4>
            <p className="text-slate-500 text-sm max-w-xs">
              Drop files here or click to browse. We'll automatically summarize and extract tasks.
            </p>
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </div>
        </label>

        <div className="md:w-80 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h4 className="font-bold text-slate-300 uppercase tracking-widest text-xs">Search Documents</h4>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                className="input-field pl-12 text-sm"
                placeholder="Find a file..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <h4 className="font-bold text-indigo-300 flex items-center gap-2 mb-2 text-sm">
              <AlertCircle size={16} /> AI Tip
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload meeting notes or project briefs. Our AI extracts action items and adds them to your task manager automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
             <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredDocs.length > 0 ? (
          <AnimatePresence>
            {filteredDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-6 flex flex-col group h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <button 
                    onClick={() => deleteDocument(doc.id)}
                    className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <h4 className="font-bold text-white mb-2 truncate" title={doc.original_name}>
                  {doc.original_name}
                </h4>
                
                <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                  {doc.summary || 'Summary processing...'}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    <Calendar size={12} />
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded font-bold">
                      {doc.extracted_tasks?.length || 0} TASKS
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-white">No documents found</h3>
            <p className="text-slate-500">Upload your first document to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
