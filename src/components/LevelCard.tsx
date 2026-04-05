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
      whileHover={!isLocked ? { scale: 1.02 } : {}}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "relative p-6 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
        isLocked 
          ? "bg-gray-50 border-gray-200 opacity-60 grayscale cursor-not-allowed" 
          : "bg-white border-blue-100 hover:border-blue-400 shadow-sm hover:shadow-md",
        isCompleted && "border-green-400 bg-green-50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-xl",
          isLocked ? "bg-gray-200" : "bg-blue-100 text-blue-600"
        )}>
          <Icon size={24} />
        </div>
        {isLocked ? (
          <Icons.Lock size={20} className="text-gray-400" />
        ) : isCompleted ? (
          <Icons.CheckCircle size={20} className="text-green-500" />
        ) : (
          <Icons.ChevronRight size={20} className="text-blue-400" />
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1">
        Level {level.id}: {level.title}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {level.description}
      </p>

      {isCompleted && (
        <div className="mt-4 flex items-center gap-1 text-yellow-500">
          <Icons.Star size={16} fill="currentColor" />
          <span className="text-xs font-bold">Mastered</span>
        </div>
      )}
    </motion.div>
  );
}
