import React from 'react';

interface NeonTextProps {
  variant?: 'hero' | 'title' | 'subtitle' | 'body';
  glow?: 'cyan' | 'orange' | 'purple' | 'multi';
  animate?: 'pulse' | 'glitch' | 'gradient' | 'none';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  children: React.ReactNode;
}

export const NeonText: React.FC<NeonTextProps> = ({
  variant = 'body',
  glow = 'cyan',
  animate = 'none',
  as = 'span',
  className = '',
  children
}) => {
  const Component = as;
  
  const variantClasses = {
    hero: 'text-6xl md:text-7xl lg:text-8xl font-black',
    title: 'text-3xl md:text-4xl lg:text-5xl font-bold',
    subtitle: 'text-xl md:text-2xl font-semibold',
    body: 'text-base md:text-lg'
  };
  
  const glowClasses = {
    cyan: 'neon-glow-cyan',
    orange: 'neon-glow-orange',
    purple: 'text-purple-400',
    multi: 'holographic'
  };
  
  const animateClasses = {
    pulse: 'animate-pulse',
    glitch: 'glitch-text',
    gradient: 'heading-hero',
    none: ''
  };
  
  const classes = `
    ${variantClasses[variant]}
    ${glowClasses[glow]}
    ${animateClasses[animate]}
    ${className}
  `.trim();
  
  // Add data-text attribute for glitch effect
  const props = animate === 'glitch' ? { 'data-text': children } : {};
  
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};