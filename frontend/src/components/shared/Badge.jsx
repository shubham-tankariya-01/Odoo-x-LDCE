import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function Badge({ family = 'status', type, label, style, ...props }) {
  const getStyles = () => {
    if (family === 'status') {
      switch (type) {
        case 'ongoing':
          return { backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' };
        case 'upcoming':
          return { backgroundColor: 'var(--color-bg-surface-alt)', color: 'var(--color-text-secondary)' };
        case 'completed':
        default:
          return { backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)' };
      }
    } else if (family === 'budget') {
      switch (type) {
        case 'under':
          return { backgroundColor: 'rgba(21, 128, 61, 0.12)', color: 'var(--color-success)' }; // 12% opacity of success
        case 'approaching':
          return { backgroundColor: 'rgba(183, 121, 31, 0.12)', color: 'var(--color-warning)' }; // 12% opacity of warning
        case 'over':
        default:
          return { backgroundColor: 'rgba(194, 44, 31, 0.12)', color: 'var(--color-danger)' }; // 12% opacity of danger
      }
    }
    return {};
  };

  const badgeStyles = getStyles();

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      padding: '4px 10px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: '600',
      ...badgeStyles,
      ...style
    }} {...props}>
      {family === 'budget' && type === 'over' && <AlertTriangle size={14} />}
      {label}
    </span>
  );
}
