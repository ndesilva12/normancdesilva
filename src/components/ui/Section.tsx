import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  gradientColor?: 'cyan' | 'purple' | 'green' | 'blue' | 'orange' | 'none';
}

const gradients = {
  cyan: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05) 0%, rgba(0, 212, 255, 0.01) 100%)',
  purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)',
  green: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)',
  blue: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.01) 100%)',
  orange: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.01) 100%)',
  none: 'transparent',
};

export default function Section({ 
  children, 
  className = '', 
  gradientColor = 'cyan' 
}: SectionProps) {
  return (
    <div
      className={className}
      style={{
        background: gradients[gradientColor],
        borderRadius: '16px',
        padding: '24px',
      }}
    >
      {children}
    </div>
  );
}
