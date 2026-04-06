import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Level } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LevelCardProps {
  level: Level;
  isLocked: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

export function LevelCard({ level, isLocked, isCompleted, onClick }: LevelCardProps) {
  const Icon = (Icons as any)[level.icon] || Icons.HelpCircle;

  return (
    <motion.div
      whileHover={!isLocked ? { y: -8, scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer overflow-hidden group",
        isLocked 
          ? "bg-white/30 border-slate-200/50 opacity-60 grayscale cursor-not-allowed" 
          : "bg-white/80 backdrop-blur-sm border-white/50 hover:border-sky-400 shadow-sm hover:shadow-2xl hover:shadow-sky-100/50",
        isCompleted && "border-emerald-400 bg-emerald-50/30"
      )}
    >
      {/* Background Accent */}
      {!isLocked && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors" />
      )}

      <div className="flex items-start justify-between mb-8">
        <div className={cn(
          "p-4 rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-500",
          isLocked ? "bg-slate-200 text-slate-400" : "bg-sky-100 text-sky-600 shadow-sky-100"
        )}>
          <Icon size={32} strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="bg-slate-200 p-2 rounded-xl">
              <Icons.Lock size={18} className="text-slate-500" />
            </div>
          ) : isCompleted ? (
            <div className="bg-emerald-100 p-2 rounded-xl">
              <Icons.CheckCircle size={18} className="text-emerald-600" />
            </div>
          ) : (
            <div className="bg-sky-50 p-2 rounded-xl group-hover:bg-sky-500 group-hover:text-white transition-all">
              <Icons.ChevronRight size={18} className="text-sky-500 group-hover:text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em] mb-1">Level {level.id}</p>
          <h3 className="text-2xl font-black text-slate-950 tracking-tight">
            {level.title}
          </h3>
        </div>
        <p className="text-slate-800 font-medium leading-relaxed">
          {level.description}
        </p>
      </div>

      <div className="mt-8 pt-6 border-t border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-sky-400 rounded-full" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{level.voiceName} Voice</span>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
            <Icons.Star size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-wider">Mastered</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
