import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { User, Level } from './types';
import { LEVELS } from './constants';
import { LevelCard } from './components/LevelCard';
import { Chat } from './components/Chat';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('lingo_user');
    if (savedUser) {
      fetchUser(savedUser);
    }
  }, []);

  const fetchUser = async (name: string) => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(`/api/user/${name}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      setUser(data);
      localStorage.setItem('lingo_user', name);
    } catch (error) {
      console.error("Fetch user error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLevelComplete = async () => {
    if (!user || !selectedLevel) return;
    
    try {
      const nextLevel = Math.max(user.current_level, selectedLevel.id + 1);
      const res = await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, level: nextLevel, stars: 10 })
      });
      
      if (res.ok) {
        await fetchUser(user.username);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-main-gradient flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center relative z-10"
        >
          <div className="w-24 h-24 bg-premium-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <Icons.Languages size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-950 mb-3 tracking-tight">SpeakEasyAI</h1>
          <p className="text-slate-800 mb-10 font-medium">Master English through immersive AI conversations.</p>
          
          <div className="space-y-4">
            <div className="relative group">
              <Icons.User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-600 transition-colors" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-14 pr-6 py-4 bg-white/60 border border-slate-300 rounded-2xl text-slate-950 placeholder:text-slate-500 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-bold"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => username && fetchUser(username)}
              disabled={!username || isLoggingIn}
              className="w-full py-5 bg-premium-gradient text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-sky-200 disabled:opacity-50"
            >
              {isLoggingIn ? 'Preparing Journey...' : 'Start Adventure'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main-gradient text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-16 glass p-4 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-premium-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
              <Icons.User size={28} />
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tight">Hi, {user.username}!</h2>
              <div className="flex items-center gap-4 text-sm mt-0.5">
                <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg">
                  <Icons.Star size={14} fill="currentColor" /> {user.stars} Points
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-lg">Level {user.current_level} Progress</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (confirm("Reset all your progress and messages?")) {
                  localStorage.removeItem('lingo_user');
                  window.location.reload();
                }
              }}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Reset All Progress"
            >
              <Icons.Trash2 size={22} />
            </button>
            <button 
              onClick={() => { localStorage.removeItem('lingo_user'); setUser(null); }}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Logout"
            >
              <Icons.LogOut size={22} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!selectedLevel ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="max-w-2xl">
                <h3 className="text-4xl font-black mb-3 tracking-tight text-slate-900">Your Learning Journey</h3>
                <p className="text-lg text-slate-500 font-medium">Select a conversation partner to practice your English skills in a safe, AI-powered environment.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {LEVELS.map((level) => (
                  <LevelCard
                    key={level.id}
                    level={level}
                    isLocked={level.id > user.current_level}
                    isCompleted={level.id < user.current_level}
                    onClick={() => setSelectedLevel(level)}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-[800px] max-h-[calc(100vh-100px)]"
            >
              <Chat
                level={selectedLevel}
                user={user}
                onBack={() => setSelectedLevel(null)}
                onComplete={handleLevelComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
