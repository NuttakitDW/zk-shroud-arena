import React from 'react';

interface GlassPanelProps {
  variant?: 'default' | 'elevated' | 'inset';
  glow?: 'cyan' | 'orange' | 'purple' | 'green' | 'none';
  padding?: 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'default',
  glow = 'none',
  padding = 'md',
  borderRadius = 'md',
  interactive = false,
  className = '',
  children,
  onClick
}) => {
  const baseClasses = 'glass-panel relative overflow-hidden transition-all duration-300';
  
  const variantClasses = {
    default: '',
    elevated: 'shadow-2xl',
    inset: 'shadow-inner'
  };
  
  const glowClasses = {
    cyan: 'border-cyan-400/30 shadow-cyan-400/20',
    orange: 'border-orange-500/30 shadow-orange-500/20',
    purple: 'border-purple-500/30 shadow-purple-500/20',
    green: 'border-green-500/30 shadow-green-500/20',
    none: ''
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const radiusClasses = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl'
  };
  
  const interactiveClasses = interactive ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : '';
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${glowClasses[glow]}
    ${paddingClasses[padding]}
    ${radiusClasses[borderRadius]}
    ${interactiveClasses}
    ${className}
  `.trim();
  
  return (
    <div className={classes} onClick={onClick}>
      {glow !== 'none' && (
        <div 
          className={`absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100`}
          style={{
            background: `radial-gradient(circle at center, ${
              glow === 'cyan' ? 'rgba(0, 217, 255, 0.1)' :
              glow === 'orange' ? 'rgba(255, 107, 26, 0.1)' :
              glow === 'purple' ? 'rgba(139, 92, 246, 0.1)' :
              'rgba(16, 185, 129, 0.1)'
            } 0%, transparent 70%)`
          }}
        />
      )}
      {children}
    </div>
  );
};