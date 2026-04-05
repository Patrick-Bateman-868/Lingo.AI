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
    const res = await fetch(`/api/messages/${user.username}/${level.id}`);
    const data = await res.json();
    setMessages(data);
    
    if (data.length === 0 && !greetingSentRef.current) {
      greetingSentRef.current = true;
      // Initial greeting
      handleAISend(`Hello, ${user.username}! I'm Speak Easy AI - your personal coach. I will help you to speak English fluently and confidently. ` + (level.id === 1 ? "Don't be nervous, we'll start with very simple topics and speak slowly. How are you feeling today?" : "Are you ready to practice? Let's begin!"));
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
      handleAISend(aiText);

      // Simple completion logic: after 5 exchanges
      if (messages.length >= 8) {
        onComplete();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAISend = async (text: string) => {
    const aiMsg: Message = { role: 'model', content: text, level: level.id };
    setMessages(prev => [...prev, aiMsg]);
    setIsAITyping(false);

    // Save AI message
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...aiMsg, username: user.username })
    });

    // Generate and play speech
    const audio = await generateSpeech(text, level);
    if (audio) {
      playPCM(audio);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-sky-50 to-teal-50 rounded-3xl overflow-hidden shadow-xl border border-white/50 backdrop-blur-sm">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-sky-100 rounded-full transition-colors text-sky-600">
            <Icons.ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-gray-900">{level.title}</h2>
            <p className="text-xs text-gray-500">Level {level.id} • {level.voiceName} Voice</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-sky-100 px-3 py-1 rounded-full">
          <Icons.Trophy size={14} className="text-sky-600" />
          <span className="text-xs font-bold text-sky-700">{Math.floor(messages.length / 2)} / 5 Steps</span>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl relative group ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-tr-none shadow-lg shadow-sky-100' 
                  : 'bg-white text-gray-800 shadow-sm border border-white rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.role === 'model' && (
                  <button
                    onClick={() => handleTranslate(msg.content)}
                    className="absolute -right-8 top-0 p-1 text-gray-300 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Translate to Russian"
                  >
                    <Icons.Languages size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isAITyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Translation Overlay */}
      <AnimatePresence>
        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-24 left-4 right-4 bg-white border-2 border-blue-100 rounded-2xl p-4 shadow-2xl z-50"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Translation</h4>
              <button onClick={() => setTranslation(null)} className="text-gray-400 hover:text-gray-600">
                <Icons.X size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
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
            className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-50"
          >
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Icons.Loader2 className="animate-spin text-blue-600" size={20} />
              <span className="text-sm font-medium">Translating...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          <button
            onMouseDown={startListening}
            onMouseUp={stopListening}
            className={`p-4 rounded-full transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icons.Mic size={24} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="p-4 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-full hover:from-sky-600 hover:to-teal-600 disabled:opacity-50 transition-colors shadow-lg shadow-sky-100"
          >
            <Icons.Send size={24} />
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 mt-2">
          {isListening ? 'Listening...' : 'Hold the mic to speak or type your message'}
        </p>
      </div>
    </div>
  );
}
