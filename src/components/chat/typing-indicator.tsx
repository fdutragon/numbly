'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-start gap-3 px-4 py-2"
    >
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="inline-flex items-center gap-1 px-3 py-2 bg-muted rounded-2xl rounded-bl-md">
          <span className="text-sm text-muted-foreground">
            Clara está pensando
          </span>
          <div className="flex items-center gap-1 ml-1">
            <motion.div
              className="w-1 h-1 bg-violet-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1 h-1 bg-violet-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-1 h-1 bg-violet-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
