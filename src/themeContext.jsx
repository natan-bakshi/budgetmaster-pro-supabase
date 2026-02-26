import React, { createContext, useContext, useEffect, useState } from 'react';

// theme: 'light' | 'dark' | 'system'
const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('bm-theme') || 'system'
  );

  const getResolved = (t) => {
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  };

  const [resolvedTheme, setResolvedTheme] = useState(() => getResolved(theme));

  // Apply / remove .dark class on <html>
  useEffect(() => {
    const apply = (t) => {
      const resolved = getResolved(t);
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    apply(theme);

    // Watch system preference when theme === 'system'
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') apply('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t) => {
    localStorage.setItem('bm-theme', t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
