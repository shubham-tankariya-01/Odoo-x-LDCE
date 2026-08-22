import React from 'react';
import { Button } from './Button';
import { FileQuestion } from 'lucide-react';

export function EmptyState({ icon: Icon = FileQuestion, message, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-12) var(--space-4)',
      textAlign: 'center'
    }}>
      <div style={{
        color: 'var(--color-text-muted)',
        marginBottom: 'var(--space-4)'
      }}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      
      <p style={{
        fontSize: 'var(--text-lg)',
        fontWeight: '600',
        color: 'var(--color-text-primary)',
        marginBottom: actionLabel ? 'var(--space-6)' : 0
      }}>
        {message}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
