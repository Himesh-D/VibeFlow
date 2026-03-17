import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, getDoc, setDoc, auth, updateProfile } from '../config/firebase';
import { User, Mail, Calendar, Shield, Camera, Save, CheckCircle, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: '',
    joinDate: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Update Firebase Auth profile
      if (profileData.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: profileData.displayName
        });
      }

      // Update Firestore user document
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        displayName: profileData.displayName,
        bio: profileData.bio,
        updated_at: new Date().toISOString()
      }, { merge: true });

      setMessage('Profile updated successfully! ✨');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update failed:', err);
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header Card */}
      <div className="glass-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
           <div className="absolute inset-0 bg-dark/20 backdrop-blur-sm"></div>
        </div>
        <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative">
          <div className="group relative">
            <div className="w-32 h-32 rounded-3xl bg-dark border-4 border-indigo-500 flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-indigo-400">
                  {profileData.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
              </div>
            </div>
          </div>
          <div className="text-center mt-4">
            <h2 className="text-3xl font-bold text-white mb-1">{profileData.displayName || 'User'}</h2>
            <p className="text-slate-500 font-medium">{profileData.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Stats Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-indigo-500/20">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 size={14} /> Account Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <span className="text-sm text-slate-300">Tasks Completed</span>
                </div>
                <span className="font-bold text-white text-lg">24</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Award size={18} className="text-amber-400" />
                  <span className="text-sm text-slate-300">AI Tokens Used</span>
                </div>
                <span className="font-bold text-white text-lg">1.2k</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Quick Info</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Calendar size={16} /> 
                <span>Joined {profileData.joinDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Shield size={16} />
                <span>Basic Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="glass-card p-8 space-y-6">
            <h3 className="text-xl font-bold text-white mb-6">Edit Profile Settings</h3>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl flex items-center gap-3 ${message.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                <CheckCircle size={18} />
                <span className="text-sm font-medium">{message}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    className="input-field pl-12"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 opacity-60 cursor-not-allowed">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    disabled
                    className="input-field pl-12 bg-dark/20"
                    value={profileData.email}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Profile Bio</label>
              <textarea
                className="input-field h-32 resize-none pt-4"
                placeholder="Tell us about yourself..."
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={loading}
                className={`
                  btn-primary px-10 flex items-center gap-2
                  ${loading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
