import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useHighContrast = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
};

interface HighContrastProviderProps {
  children: React.ReactNode;
}

export const HighContrastProvider: React.FC<HighContrastProviderProps> = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem('highContrast');
    if (saved) {
      setIsHighContrast(JSON.parse(saved));
    }

    // Check for system preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    if (mediaQuery.matches) {
      setIsHighContrast(true);
    }

    // Listen for system preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Save preference
    localStorage.setItem('highContrast', JSON.stringify(isHighContrast));
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
  };

  const setHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
  };

  return (
    <ThemeContext.Provider value={{ isHighContrast, toggleHighContrast, setHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
};

interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const HighContrastToggle: React.FC<HighContrastToggleProps> = ({
  className = '',
  showLabel = true
}) => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
    <button
      onClick={toggleHighContrast}
      className={`high-contrast-toggle ${className}`}
      aria-pressed={isHighContrast}
      aria-label={showLabel ? undefined : 'Toggle high contrast mode'}
    >
      {showLabel && (
        <span className="toggle-label">
          {isHighContrast ? 'High Contrast' : 'Normal Contrast'}
        </span>
      )}
      <div className="toggle-icon">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
    </button>
  );
};

interface HighContrastStylesProps {
  children: React.ReactNode;
}

export const HighContrastStyles: React.FC<HighContrastStylesProps> = ({ children }) => {
  return (
    <style jsx global>{`
      /* High Contrast Theme Styles */
      .high-contrast {
        /* Background colors */
        --bg-primary: #000000;
        --bg-secondary: #1a1a1a;
        --bg-tertiary: #2a2a2a;
        --bg-elevated: #333333;
        
        /* Text colors */
        --text-primary: #ffffff;
        --text-secondary: #e0e0e0;
        --text-tertiary: #cccccc;
        --text-inverse: #000000;
        
        /* Border colors */
        --border-primary: #ffffff;
        --border-secondary: #cccccc;
        --border-focus: #ffff00;
        
        /* Accent colors */
        --accent-primary: #ffff00;
        --accent-secondary: #00ffff;
        --accent-success: #00ff00;
        --accent-warning: #ffaa00;
        --accent-error: #ff0000;
        
        /* Interactive elements */
        --button-bg: #ffffff;
        --button-text: #000000;
        --button-border: #ffffff;
        --button-hover: #ffff00;
        --button-active: #cccccc;
        
        /* Focus indicators */
        --focus-ring: 3px solid #ffff00;
        --focus-offset: 2px;
        
        /* Shadows */
        --shadow-sm: 0 1px 2px rgba(255, 255, 255, 0.1);
        --shadow-md: 0 4px 6px rgba(255, 255, 255, 0.1);
        --shadow-lg: 0 10px 15px rgba(255, 255, 255, 0.1);
      }

      /* High contrast specific component styles */
      .high-contrast .btn-primary {
        background-color: var(--button-bg);
        color: var(--button-text);
        border: 2px solid var(--button-border);
      }

      .high-contrast .btn-primary:hover {
        background-color: var(--button-hover);
        color: var(--text-inverse);
      }

      .high-contrast .btn-primary:focus {
        outline: var(--focus-ring);
        outline-offset: var(--focus-offset);
      }

      .high-contrast .card {
        background-color: var(--bg-elevated);
        border: 2px solid var(--border-primary);
        color: var(--text-primary);
      }

      .high-contrast .input {
        background-color: var(--bg-primary);
        border: 2px solid var(--border-primary);
        color: var(--text-primary);
      }

      .high-contrast .input:focus {
        border-color: var(--border-focus);
        outline: var(--focus-ring);
        outline-offset: var(--focus-offset);
      }

      .high-contrast .modal {
        background-color: var(--bg-elevated);
        border: 3px solid var(--border-primary);
      }

      .high-contrast .modal-header {
        border-bottom: 2px solid var(--border-primary);
      }

      .high-contrast .timeline-item {
        border: 2px solid var(--border-primary);
        background-color: var(--bg-secondary);
      }

      .high-contrast .timeline-item.current {
        border-color: var(--accent-primary);
        background-color: var(--accent-primary);
        color: var(--text-inverse);
      }

      .high-contrast .frame-viewer {
        border: 3px solid var(--border-primary);
        background-color: var(--bg-primary);
      }

      .high-contrast .frame-overlay {
        border: 2px solid var(--accent-secondary);
      }

      .high-contrast .progress-bar {
        background-color: var(--bg-tertiary);
        border: 2px solid var(--border-primary);
      }

      .high-contrast .progress-fill {
        background-color: var(--accent-primary);
      }

      .high-contrast .status-indicator {
        border: 2px solid var(--border-primary);
      }

      .high-contrast .status-indicator.completed {
        background-color: var(--accent-success);
        color: var(--text-inverse);
      }

      .high-contrast .status-indicator.processing {
        background-color: var(--accent-warning);
        color: var(--text-inverse);
      }

      .high-contrast .status-indicator.error {
        background-color: var(--accent-error);
        color: var(--text-inverse);
      }

      /* High contrast toggle button */
      .high-contrast-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: var(--button-bg);
        color: var(--button-text);
        border: 2px solid var(--button-border);
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .high-contrast-toggle:hover {
        background-color: var(--button-hover);
        color: var(--text-inverse);
      }

      .high-contrast-toggle:focus {
        outline: var(--focus-ring);
        outline-offset: var(--focus-offset);
      }

      .high-contrast-toggle .toggle-icon {
        width: 1.5rem;
        height: 1.5rem;
      }

      /* Ensure all interactive elements have proper focus indicators */
      .high-contrast button:focus,
      .high-contrast input:focus,
      .high-contrast select:focus,
      .high-contrast textarea:focus,
      .high-contrast a:focus,
      .high-contrast [tabindex]:focus {
        outline: var(--focus-ring);
        outline-offset: var(--focus-offset);
      }

      /* Ensure sufficient color contrast for all text */
      .high-contrast * {
        color-scheme: dark;
      }

      /* Hide decorative elements in high contrast mode */
      .high-contrast .decorative {
        display: none;
      }

      /* Ensure images have proper alt text indicators */
      .high-contrast img:not([alt]) {
        border: 2px dashed var(--accent-error);
      }

      /* Ensure form validation is clearly visible */
      .high-contrast .error-message {
        background-color: var(--accent-error);
        color: var(--text-inverse);
        border: 2px solid var(--border-primary);
        padding: 0.5rem;
        margin: 0.5rem 0;
      }

      .high-contrast .success-message {
        background-color: var(--accent-success);
        color: var(--text-inverse);
        border: 2px solid var(--border-primary);
        padding: 0.5rem;
        margin: 0.5rem 0;
      }
    `}</style>
  );
};
