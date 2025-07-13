'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import { Message } from '@/lib/chat-store';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={cn(
        'px-4 py-2 rounded-lg max-w-[80%]',
        isUser ? 'bg-violet-500 text-white' : 'bg-muted'
      )}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}
