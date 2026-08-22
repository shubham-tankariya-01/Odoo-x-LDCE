import React, { useState } from 'react';
import { Search, Filter, SortAsc, LayoutGrid } from 'lucide-react';
import { Button } from './Button';

export function SearchFilterBar({ 
  searchPlaceholder = 'Search...',
  onSearchChange,
  searchValue,
  showGroupBy = true,
  showFilter = true,
  showSortBy = true
}) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const buttonStyle = { height: '40px', padding: '0 12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
      {/* Desktop & Main Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              padding: '0 12px 0 38px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-surface)',
              outline: 'none',
              fontSize: 'var(--text-sm)'
            }}
            onFocus={(e) => e.target.style.border = '2px solid var(--color-border-strong)'}
            onBlur={(e) => e.target.style.border = '1px solid var(--color-border)'}
          />
        </div>

        {/* Desktop Controls (hidden on very small screens via CSS in a real app, but stubbed here) */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }} className="desktop-filters">
          {showGroupBy && (
            <Button variant="secondary" style={buttonStyle}>
              <LayoutGrid size={16} /> <span style={{ marginLeft: 'var(--space-2)' }}>Group</span>
            </Button>
          )}
          {showFilter && (
            <Button variant="secondary" style={buttonStyle}>
              <Filter size={16} /> <span style={{ marginLeft: 'var(--space-2)' }}>Filter</span>
            </Button>
          )}
          {showSortBy && (
            <Button variant="secondary" style={buttonStyle}>
              <SortAsc size={16} /> <span style={{ marginLeft: 'var(--space-2)' }}>Sort</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
