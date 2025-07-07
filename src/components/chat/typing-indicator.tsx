'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3"
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg"
      >
        <Bot className="w-4 h-4 text-white" />
      </motion.div>
      {/* Bubble Clara está pensando */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Clara está pensando</span>
        <span className="ml-1 animate-pulse text-violet-500 text-lg">...</span>
      </motion.div>
    </motion.div>
  );
}
