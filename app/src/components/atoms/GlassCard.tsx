// ---------------------------------------------------------------------------
// GlassCard — Enhanced card with glassmorphism and 3D effects
// ---------------------------------------------------------------------------
'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  onClick?: () => void;
}

const gradients = {
  cyan: 'from-cyan-500/20 to-blue-500/20',
  purple: 'from-purple-500/20 to-pink-500/20',
  amber: 'from-amber-500/20 to-orange-500/20',
  emerald: 'from-emerald-500/20 to-green-500/20',
  rose: 'from-rose-500/20 to-pink-500/20',
};

const glowColors = {
  cyan: 'shadow-cyan-500/50',
  purple: 'shadow-purple-500/50',
  amber: 'shadow-amber-500/50',
  emerald: 'shadow-emerald-500/50',
  rose: 'shadow-rose-500/50',
};

export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  gradient = 'cyan',
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br ${gradients[gradient]}
        backdrop-blur-xl
        border border-white/10
        ${glow ? `shadow-2xl ${glowColors[gradient]}` : 'shadow-xl shadow-black/50'}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(transparent 40%, rgba(0, 212, 255, 0.05) 50%, transparent 60%)',
        }}
        animate={{
          y: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
