import React, {
  useState,
  memo,
  useCallback,
  useEffect,
} from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type ChatMsg } from '@/data/db';
import { listChatMessages, addChatMessage } from '@/data/dao';
interface ChatProps {
  documentId: string;
  className?: string;
}

function ChatComponent({ documentId, className }: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  useEffect(() => {
    async function load() {
      const existing = await listChatMessages(documentId);
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
  }, [inputValue, documentId]);

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
    <div 
      className={cn(
        'flex flex-col h-full bg-card',
        className
      )}
      role="complementary"
      aria-label="Chat com IA"
    >
      <div className="px-4 h-16 border-b border-border flex flex-col justify-center">
        <h2 className="text-sm font-semibold text-foreground">Chat IA</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Assistente contextual
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 p-3 rounded-lg',
                message.role === 'user' 
                  ? 'bg-primary/10 ml-4' 
                  : 'bg-muted/50 mr-4'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0',
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {getMessageIcon(message.role)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-relaxed">
                  {message.content}
                </p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {typeof window === 'undefined'
                      ? ''
                      : new Date(message.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                  </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1"
            aria-label="Mensagem para IA"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="sm"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const Chat = memo(ChatComponent);
Chat.displayName = 'Chat';

export default Chat;