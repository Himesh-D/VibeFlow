import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword, updateProfile, db, doc, setDoc } from '../config/firebase';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      
      // Create Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        bio: '',
        created_at: new Date().toISOString()
      });

      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-6 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full animate-pulse delay-1000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20 mb-4">
            ⚡
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Join Us</h1>
          <p className="text-slate-400 mt-2">Start your productivity journey today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                className="input-field pl-12"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="input-field pl-12"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="input-field pl-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
