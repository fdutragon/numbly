'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';

// Removidos utilitários e lógicas de viewport/dispositivo antigo

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onFocus?: () => void;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function ChatInput({
  onSend,
  isLoading = false,
  disabled = false,
  inputRef,
  onFocus,
  value,
  onChange,
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [animationDone, setAnimationDone] = useState(false);
  const controlled =
    typeof value === 'string' && typeof onChange === 'function';
  const textareaValue = controlled ? value : internalValue;
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef || internalRef;

  useEffect(() => {
    if (textareaRef.current) {
      try {
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.rows = 1;
        textarea.style.overflowY = 'hidden';
        requestAnimationFrame(() => {
          if (textarea.scrollHeight > 0) {
            textarea.style.height = `${textarea.scrollHeight}px`;
          }
        });
      } catch (error) {
        console.warn('Height adjustment failed:', error);
      }
    }
  }, [textareaValue, textareaRef]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textareaValue.trim() || isLoading || disabled) return;
    onSend(textareaValue.trim());
    if (!controlled) setInternalValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (controlled && onChange) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  }

  function handleTextareaFocus() {
    if (onFocus) onFocus();
    // Garante scroll até o final ao focar
    try {
      const container = document.querySelector('[data-chat-scroll-container]');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch {}
  }

  const canSend = textareaValue.trim() && !isLoading && !disabled;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setAnimationDone(true)}
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-indigo-500 dark:focus-within:border-indigo-400">
          <textarea
            ref={textareaRef}
            value={textareaValue}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onFocus={handleTextareaFocus}
            placeholder={
              isLoading ? 'Clara está pensando...' : 'Digite sua mensagem...'
            }
            disabled={isLoading || disabled || !animationDone}
            className="flex-1 bg-transparent border-0 outline-none resize-none px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm leading-relaxed min-h-[44px] max-h-[120px]"
            rows={1}
            style={{ height: 'auto', overflowY: 'hidden' }}
          />

          <div className="flex items-end p-2">
            <Button
              type="submit"
              size="sm"
              disabled={!canSend || !animationDone}
              className={`h-8 w-8 rounded-xl p-0 transition-all duration-200 ${
                canSend && animationDone
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm hover:shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-2 px-1">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            💡 Dica: Pergunte{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              valores
            </kbd>{' '}
            para saber o preço.{' '}
          </p>
        </div>
      </form>
    </motion.div>
  );
}
