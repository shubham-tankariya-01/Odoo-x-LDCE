import React, { useState } from 'react';

export function Input({ label, error, helperText, ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
      {label && <label style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>{label}</label>}
      
      <input 
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: props.disabled ? 'var(--color-bg-surface-alt)' : 'var(--color-bg-surface)',
          color: props.disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          border: error 
            ? '1px solid var(--color-danger)' 
            : isFocused 
              ? '2px solid var(--color-border-strong)' 
              : '1px solid var(--color-border)',
          outline: 'none',
          width: '100%'
        }}
        {...props}
      />
      
      {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</span>}
      {!error && helperText && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{helperText}</span>}
    </div>
  );
}
