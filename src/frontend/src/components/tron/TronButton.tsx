import React from 'react';
import { Loader } from 'lucide-react';

interface TronButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export const TronButton: React.FC<TronButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  href,
  children,
  className = ''
}) => {
  const baseClasses = 'btn-tron font-orbitron font-medium uppercase tracking-wider transition-all relative overflow-hidden';
  
  const variantClasses = {
    primary: 'btn-tron-primary',
    secondary: 'btn-tron-secondary',
    danger: 'bg-gradient-to-r from-orange-600 to-red-600 border-orange-500 text-white hover:from-orange-700 hover:to-red-700',
    ghost: 'bg-transparent border-transparent text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base'
  };
  
  const classes = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();
  
  const content = (
    <>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Loader className="w-4 h-4 animate-spin" />
        </div>
      )}
      <span className={`flex items-center justify-center gap-2 ${loading ? 'invisible' : ''}`}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>
    </>
  );
  
  if (href && !disabled && !loading) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
};