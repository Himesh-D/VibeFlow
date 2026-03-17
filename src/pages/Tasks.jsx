import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, query, where, addDoc, doc, updateDoc, firestoreDeleteDoc } from '../config/firebase';
import { Plus, Search, Filter, Trash2, CheckCircle2, Circle, AlertCircle, Calendar, ArrowUp, ArrowDown, Minus, Clock, Layout as LayoutIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomDropdown from '../components/CustomDropdown';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium'
  });

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        user_id: user.uid,
        status: 'pending',
        created_at: new Date().toISOString()
      });
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium' });
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        status: currentStatus === 'completed' ? 'pending' : 'completed'
      });
      fetchTasks();
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await firestoreDeleteDoc(doc(db, 'tasks', id));
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="input-field pl-12"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CustomDropdown 
            className="w-48"
            options={[
              { value: 'all', label: 'All Tasks', icon: LayoutIcon },
              { value: 'pending', label: 'Pending', icon: Clock },
              { value: 'completed', label: 'Completed', icon: CheckCircle2 }
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass-card p-5 flex items-center gap-4 group ${task.status === 'completed' ? 'opacity-60' : ''}`}
              >
                <button 
                  onClick={() => toggleTask(task.id, task.status)}
                  className={`transition-colors ${task.status === 'completed' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                >
                  {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-lg truncate ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    {task.due_date && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} /> {task.due_date}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      task.priority === 'high' ? 'bg-red-500/10 text-red-500' : 
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="glass-card p-16 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-4xl">📋</div>
            <div>
              <h3 className="text-xl font-bold text-white">No tasks found</h3>
              <p className="text-slate-500 mt-2">Ready to start something new? Create your first task!</p>
            </div>
          </div>
        )}
      </div>

      {/* New Task Modal */}
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
              className="glass-card w-full max-w-lg p-8 relative z-10"
            >
              <h3 className="text-2xl font-bold mb-6">Create New Task</h3>
              <form onSubmit={handleAddTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Task Title</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="E.g., Complete project proposal"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description (Optional)</label>
                  <textarea
                    className="input-field h-24 resize-none"
                    placeholder="Add more details..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Due Date</label>
                    <input
                      type="date"
                      className="input-field [color-scheme:dark]"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                  <CustomDropdown
                    label="Priority"
                    className="flex-1"
                    options={[
                      { value: 'low', label: 'Low', icon: ArrowDown },
                      { value: 'medium', label: 'Medium', icon: Minus },
                      { value: 'high', label: 'High', icon: ArrowUp }
                    ]}
                    value={newTask.priority}
                    onChange={(val) => setNewTask({ ...newTask, priority: val })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
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
                    Create Task
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

export default Tasks;
