import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Message, Level, User } from '../types';
import { generateAIResponse, generateSpeech, translatePhrase } from '../services/gemini';
import { useSpeech } from '../hooks/useSpeech';
import ReactMarkdown from 'react-markdown';

interface ChatProps {
  level: Level;
  user: User;
  onBack: () => void;
  onComplete: () => void;
}

export function Chat({ level, user, onBack, onComplete }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [translation, setTranslation] = useState<{ text: string; original: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetingSentRef = useRef(false);
  const { isListening, transcript, startListening, stopListening, playPCM } = useSpeech();

  const handleTranslate = async (text: string) => {
    setIsTranslating(true);
    try {
      const result = await translatePhrase(text);
      setTranslation({ text: result, original: text });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [level.id]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
      handleSend(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAITyping]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${user.username}/${level.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
      
      if (data.length === 0 && !greetingSentRef.current) {
        greetingSentRef.current = true;
        // Initial greeting
        await handleAISend(`Hello, ${user.username}! I'm Speak Easy AI - your personal coach. I will help you to speak English fluently and confidently. ` + (level.id === 1 ? "Don't be nervous, we'll start with very simple topics and speak slowly. How are you feeling today?" : "Are you ready to practice? Let's begin!"));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', content: text, level: level.id };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsAITyping(true);

    try {
      // Save user message
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userMsg, username: user.username })
      });

      const aiText = await generateAIResponse(level, messages, text);
      await handleAISend(aiText);

      // Simple completion logic: after 5 exchanges
      if (messages.length >= 8 && !isCompleted) {
        setIsCompleted(true);
        onComplete();
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
    } finally {
      setIsLoading(false);
      setIsAITyping(false);
    }
  };

  const handleAISend = async (text: string) => {
    try {
      const aiMsg: Message = { role: 'model', content: text, level: level.id };
      setMessages(prev => [...prev, aiMsg]);
      setIsAITyping(false);

      // Parallelize DB save and speech generation for speed
      const savePromise = fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiMsg, username: user.username })
      });

      const speechPromise = generateSpeech(text, level);
      
      const [_, audio] = await Promise.all([savePromise, speechPromise]);
      
      if (audio) {
        await playPCM(audio);
      }
    } catch (error) {
      console.error("Error in handleAISend:", error);
      setIsAITyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/50 relative">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-xl p-6 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-3 hover:bg-white/80 rounded-2xl transition-all text-slate-600 shadow-sm hover:shadow-md active:scale-95"
          >
            <Icons.ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="font-black text-xl text-slate-900 tracking-tight">{level.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Level {level.id} • {level.voiceName} Voice</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-white/40">
          <div className="flex -space-x-2">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-6 rounded-full border-2 border-white ${
                  i < Math.floor(messages.length / 2) ? 'bg-sky-500' : 'bg-slate-200'
                }`} 
              />
            ))}
          </div>
          <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">Progress</span>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] relative group ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`p-5 rounded-[2rem] shadow-sm transition-all duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-sky-600 text-white rounded-tr-none shadow-sky-100' 
                    : 'bg-white text-slate-950 rounded-tl-none border border-white/50'
                }`}>
                  <div className={`prose prose-sm max-w-none leading-relaxed font-medium ${
                    msg.role === 'user' ? 'prose-invert text-white' : 'prose-slate text-slate-900'
                  }`}>
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                {msg.role === 'model' && (
                  <div className="absolute -right-12 top-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => handleTranslate(msg.content)}
                      className="p-2 bg-white rounded-xl text-slate-400 hover:text-sky-500 shadow-sm border border-slate-100 hover:border-sky-200 transition-all"
                      title="Translate to Russian"
                    >
                      <Icons.Languages size={18} />
                    </button>
                  </div>
                )}
                
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${
                  msg.role === 'user' ? 'text-right text-slate-400' : 'text-left text-slate-400'
                }`}>
                  {msg.role === 'user' ? user.username : 'SpeakEasy AI'}
                </p>
              </div>
            </motion.div>
          ))}
          
          {isAITyping && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="flex justify-start"
            >
              <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] rounded-tl-none border border-slate-100 flex items-center gap-2 shadow-sm">
                <div className="flex gap-1">
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }} 
                    className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
                    className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
                  />
                  <motion.span 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
                    className="w-1.5 h-1.5 bg-sky-400 rounded-full" 
                  />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">AI is thinking</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Translation Overlay */}
      <AnimatePresence>
        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-32 left-8 right-8 glass p-6 rounded-3xl shadow-2xl z-50 border-sky-100"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 rounded-lg text-sky-600">
                  <Icons.Languages size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Translation Insight</h4>
              </div>
              <button 
                onClick={() => setTranslation(null)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <Icons.X size={18} />
              </button>
            </div>
            <div className="text-slate-700 leading-relaxed">
              <ReactMarkdown>{translation.text}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Translation Overlay */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-50"
          >
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-slate-100">
              <Icons.Loader2 className="animate-spin text-sky-500" size={24} />
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Analyzing Context...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-8 bg-white/60 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={startListening}
            onMouseUp={stopListening}
            className={`p-5 rounded-2xl transition-all shadow-lg ${
              isListening 
                ? 'bg-red-500 text-white shadow-red-200 ring-4 ring-red-100' 
                : 'bg-white/80 text-slate-600 hover:bg-white shadow-sky-100'
            }`}
          >
            <Icons.Mic size={28} />
          </motion.button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder="Type your response here..."
              className="w-full bg-white/80 border-2 border-transparent rounded-2xl px-6 py-5 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-500/5 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-5 bg-premium-gradient text-white rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-sky-100"
          >
            <Icons.Send size={28} />
          </motion.button>
        </div>
        <div className="flex justify-center mt-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {isListening ? 'Voice Input Active' : 'Hold Mic to Speak • Enter to Send'}
          </p>
        </div>
      </div>
    </div>
  );
}
