import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: 'cyan' | 'purple' | 'green' | 'orange' | 'red';
  onClick?: () => void;
  hoverable?: boolean;
}

const accentColors = {
  cyan: '#00d4ff',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
};

export default function Card({ 
  children, 
  className = '', 
  accentColor = 'cyan',
  onClick,
  hoverable = true
}: CardProps) {
  const borderTopColor = accentColors[accentColor];
  
  return (
    <div
      className={`
        bg-[#12121a]/95 
        rounded-xl 
        border border-white/5 
        p-5 
        shadow-[0_4px_16px_rgba(0,0,0,0.3)]
        ${hoverable ? 'transition-all duration-300 hover:shadow-[0_6px_24px_rgba(0,212,255,0.15)] hover:-translate-y-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        borderTop: `2px solid ${borderTopColor}`,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
