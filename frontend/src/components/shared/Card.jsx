import React, { useState } from 'react';

export function Card({ children, interactive = false, style, ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      style={{
        backgroundColor: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        boxShadow: isHovered ? 'var(--shadow-sm)' : 'none',
        transition: 'box-shadow var(--duration-base) var(--ease-standard)',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
