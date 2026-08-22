import React from 'react';

export function Skeleton({ width, height, style, borderRadius = 'var(--radius-md)' }) {
  return (
    <div style={{
      width: width || '100%',
      height: height || '20px',
      backgroundColor: 'var(--color-bg-surface-alt)',
      borderRadius: borderRadius,
      ...style
    }} />
  );
}
