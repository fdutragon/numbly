import React, {
  useState,
  memo,
  useCallback,
  useEffect,
} from 'react';
import { Send, Bot, User, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type ChatMsg } from '@/data/db';
import { getChatMessages, addChatMessage } from '@/data/dao';
interface ChatProps {
  documentId?: string;
  className?: string;
  onSendMessage?: (message: string) => void;
}

function ChatComponent({ documentId = 'default-document', className, onSendMessage }: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  useEffect(() => {
    async function load() {
      const existing = await getChatMessages(documentId);
      if (existing.length === 0) {
        const greeting: ChatMsg = {
          id: crypto.randomUUID(),
          document_id: documentId,
          role: 'assistant',
          content:
            'Olá! Sou sua IA contextual. Como posso ajudar com o documento?',
          created_at: new Date().toISOString(),
        };
        setMessages([greeting]);
        addChatMessage(greeting);
      } else {
        setMessages(existing);
      }
    }
    void load();
  }, [documentId]);

  const handleSend = useCallback(() => {
    const content = inputValue.trim();
    if (!content) return;
    const message: ChatMsg = {
      id: crypto.randomUUID(),
      document_id: documentId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, message]);
    addChatMessage(message);
    setInputValue('');
    
    // Call the external onSendMessage handler if provided
    if (onSendMessage) {
      onSendMessage(content);
    }
  }, [inputValue, documentId, onSendMessage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const getMessageIcon = (role: ChatMsg['role']) => {
    return role === 'user' ? (
      <User className="w-4 h-4" aria-hidden="true" />
    ) : (
      <Bot className="w-4 h-4" aria-hidden="true" />
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-sidebar-primary" />
          </div>
          <h2 className="text-base font-semibold text-sidebar-foreground">Chat</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-4 w-full',
              message.role === 'user' ? 'justify-end flex-row-reverse' : 'justify-start'
            )}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              {message.role === 'assistant' ? (
                <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-sidebar-primary" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <User className="w-4 h-4 text-sidebar-accent-foreground" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                  message.role === 'user'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground ml-auto'
                    : 'bg-sidebar-muted text-sidebar-foreground border border-sidebar-border/50'
                )}
              >
                {message.content}
              </div>
              <div className={cn(
                'text-xs text-sidebar-foreground/50 px-2',
                message.role === 'user' ? 'text-right' : 'text-left'
              )}>
                {new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {false && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-sidebar-primary" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="bg-sidebar-muted rounded-2xl px-4 py-3 text-sm border border-sidebar-border/50 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-sidebar-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="px-6 py-4 border-t border-sidebar-border/50">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={false}
              className="w-full h-11 px-4 py-3 bg-sidebar-muted border border-sidebar-border rounded-xl text-sm placeholder:text-sidebar-foreground/50 focus:ring-2 focus:ring-sidebar-primary focus:border-transparent transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={false || !inputValue.trim()}
            className="h-11 w-11 p-0 rounded-xl bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

const Chat = memo(ChatComponent);
Chat.displayName = 'Chat';

export default Chat;