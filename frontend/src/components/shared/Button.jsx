import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  variant = 'primary', 
  isLoading = false, 
  disabled = false, 
  children, 
  className,
  style,
  ...props 
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background-color var(--duration-fast), border-color var(--duration-fast)',
    border: '1px solid transparent',
    outline: 'none',
    gap: 'var(--space-2)',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-surface)',
      color: 'var(--color-text-primary)',
      borderColor: 'var(--color-border)',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'white',
    },
    warning: {
      backgroundColor: 'var(--color-warning)',
      color: 'white',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: 'white',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    }
  };

  // Note: Hover/active states are usually handled via CSS classes.
  // For this stub, we rely on basic inline styles. In a real app with Shadcn, 
  // you'd use Tailwind or a CSS module for the :hover and :active pseudoclasses.

  return (
    <button 
      disabled={disabled || isLoading}
      style={{ ...baseStyle, ...variants[variant] }}
      {...props}
    >
      {isLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : children}
    </button>
  );
}
