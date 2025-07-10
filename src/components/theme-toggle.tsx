'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Só permite interação se montado e tema resolvido
  const isReady = mounted && (theme === 'light' || theme === 'dark' || theme === 'system' || !!resolvedTheme);
  const isDark = (resolvedTheme ?? theme) === 'dark';

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => isReady && setTheme(isDark ? 'light' : 'dark')}
        className="relative w-9 h-9 p-0 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 hover:bg-white/90 dark:hover:bg-zinc-800/90 shadow-sm backdrop-blur-sm"
        disabled={!isReady}
      >
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-zinc-100" />
          ) : (
            <Sun className="h-4 w-4 text-zinc-900" />
          )}
        </motion.div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </motion.div>
  );
}
