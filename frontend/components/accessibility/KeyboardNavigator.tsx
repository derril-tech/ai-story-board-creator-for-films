import React, { useEffect, useRef, useState } from 'react';

interface KeyboardNavigatorProps {
  children: React.ReactNode;
  onNavigate?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onSelect?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export const KeyboardNavigator: React.FC<KeyboardNavigatorProps> = ({
  children,
  onNavigate,
  onSelect,
  onEscape,
  enabled = true
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          onNavigate?.('left');
          setIsNavigating(true);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onNavigate?.('right');
          setIsNavigating(true);
          break;
        case 'ArrowUp':
          event.preventDefault();
          onNavigate?.('up');
          setIsNavigating(true);
          break;
        case 'ArrowDown':
          event.preventDefault();
          onNavigate?.('down');
          setIsNavigating(true);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.();
          break;
        case 'Escape':
          event.preventDefault();
          onEscape?.();
          break;
      }
    };

    const handleKeyUp = () => {
      setIsNavigating(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onNavigate, onSelect, onEscape]);

  return (
    <div
      ref={containerRef}
      className={`keyboard-navigator ${isNavigating ? 'navigating' : ''}`}
      tabIndex={enabled ? 0 : -1}
      role="application"
      aria-label="Timeline navigation"
    >
      {children}
    </div>
  );
};

interface FocusableItemProps {
  children: React.ReactNode;
  onFocus?: () => void;
  onSelect?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const FocusableItem: React.FC<FocusableItemProps> = ({
  children,
  onFocus,
  onSelect,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };

  return (
    <div
      className={`focusable-item ${disabled ? 'disabled' : ''} ${className}`}
      tabIndex={disabled ? -1 : 0}
      onFocus={onFocus}
      onKeyDown={handleKeyDown}
      onClick={disabled ? undefined : onSelect}
      role="button"
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {children}
    </div>
  );
};

interface TimelineNavigatorProps {
  items: Array<{ id: string; label: string; disabled?: boolean }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSelect: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const TimelineNavigator: React.FC<TimelineNavigatorProps> = ({
  items,
  currentIndex,
  onNavigate,
  onSelect,
  orientation = 'horizontal'
}) => {
  const handleNavigate = (direction: 'left' | 'right' | 'up' | 'down') => {
    const isHorizontal = orientation === 'horizontal';
    const isForward = direction === 'right' || direction === 'down';
    
    let newIndex = currentIndex;
    
    if (isForward) {
      newIndex = Math.min(currentIndex + 1, items.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    // Skip disabled items
    while (newIndex !== currentIndex && items[newIndex]?.disabled) {
      if (isForward) {
        newIndex = Math.min(newIndex + 1, items.length - 1);
      } else {
        newIndex = Math.max(newIndex - 1, 0);
      }
    }
    
    onNavigate(newIndex);
  };

  const handleSelect = () => {
    const currentItem = items[currentIndex];
    if (currentItem && !currentItem.disabled) {
      onSelect(currentItem.id);
    }
  };

  return (
    <KeyboardNavigator
      onNavigate={handleNavigate}
      onSelect={handleSelect}
      className={`timeline-navigator ${orientation}`}
    >
      <div className="timeline-items">
        {items.map((item, index) => (
          <FocusableItem
            key={item.id}
            onFocus={() => onNavigate(index)}
            onSelect={() => onSelect(item.id)}
            disabled={item.disabled}
            className={`timeline-item ${index === currentIndex ? 'current' : ''}`}
            aria-label={`${item.label}${index === currentIndex ? ', current item' : ''}`}
          >
            {item.label}
          </FocusableItem>
        ))}
      </div>
      
      <div className="timeline-controls" role="group" aria-label="Timeline controls">
        <button
          onClick={() => handleNavigate('left')}
          disabled={currentIndex === 0}
          aria-label="Previous item"
          className="nav-button prev"
        >
          ←
        </button>
        <span className="current-position" aria-live="polite">
          {currentIndex + 1} of {items.length}
        </span>
        <button
          onClick={() => handleNavigate('right')}
          disabled={currentIndex === items.length - 1}
          aria-label="Next item"
          className="nav-button next"
        >
          →
        </button>
      </div>
    </KeyboardNavigator>
  );
};
