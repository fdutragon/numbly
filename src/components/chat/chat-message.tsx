'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TypewriterText } from '@/components/ui/typewriter';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { Bot, User } from 'lucide-react';
import type { Message } from '@/lib/chat-store';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3,
        ease: 'easeOut'
      }}
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Bot className="w-3 h-3" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[75%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-3 py-2 rounded-xl text-sm ${
            isUser
              ? 'bg-violet-500 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
          {isAssistant && message.isTyping && !message.content ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Clara está pensando...</span>
            </div>
          ) : isAssistant && isLatest && message.isTyping && message.content ? (
            <div className="typewriter-container">
              <TypewriterText 
                text={message.content}
                speed={20}
                className="block"
              />
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        
        <div className={`text-xs text-gray-400 dark:text-gray-500 mt-1 ${
          isUser ? 'text-right' : 'text-left'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <User className="w-3 h-3" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
