import React, { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'blue';
  onClick?: () => void;
  hoverable?: boolean;
  noPadding?: boolean;
}

const accentColors = {
  cyan: '#00d4ff',
  purple: '#8b5cf6',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
};

export default function Card({ 
  children, 
  className = '', 
  accentColor = 'cyan',
  onClick,
  hoverable = true,
  noPadding = false
}: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const accentColorValue = accentColors[accentColor];
  
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: hoverable && isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hoverable && isHovered 
          ? `0 8px 24px ${accentColorValue}40`
          : '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}
      onClick={onClick}
      onMouseEnter={() => hoverable && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient accent bar at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${accentColorValue}, transparent)`,
        zIndex: 10,
      }} />
      
      {noPadding ? children : (
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
