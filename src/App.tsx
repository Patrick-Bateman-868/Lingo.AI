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
      const data = await res.json();
      setUser(data);
      localStorage.setItem('lingo_user', name);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLevelComplete = async () => {
    if (!user || !selectedLevel) return;
    
    const nextLevel = Math.max(user.current_level, selectedLevel.id + 1);
    const res = await fetch('/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, level: nextLevel, stars: 10 })
    });
    
    if (res.ok) {
      fetchUser(user.username);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/20"
        >
          <div className="w-20 h-20 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icons.Globe size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">SpeakEasyAI</h1>
          <p className="text-gray-500 mb-8">Master English through immersive AI conversations.</p>
          
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-sky-500 focus:ring-0 outline-none transition-all"
            />
            <button
              onClick={() => username && fetchUser(username)}
              disabled={!username || isLoggingIn}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-2xl font-bold hover:from-sky-600 hover:to-teal-600 transition-all shadow-lg shadow-sky-200 disabled:opacity-50"
            >
              {isLoggingIn ? 'Joining...' : 'Start Adventure'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-teal-50 text-gray-900 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
              <Icons.User size={24} />
            </div>
            <div>
              <h2 className="font-bold text-xl">Hi, {user.username}!</h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-yellow-600 font-bold">
                  <Icons.Star size={14} fill="currentColor" /> {user.stars}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-sky-600 font-bold">Level {user.current_level}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('lingo_user'); setUser(null); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Icons.LogOut size={20} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          {!selectedLevel ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="md:col-span-2 mb-4">
                <h3 className="text-2xl font-black mb-2">Your Journey</h3>
                <p className="text-gray-500">Complete levels to unlock new conversation challenges.</p>
              </div>
              {LEVELS.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  isLocked={level.id > user.current_level}
                  isCompleted={level.id < user.current_level}
                  onClick={() => setSelectedLevel(level)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[calc(100vh-200px)] min-h-[600px]"
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
