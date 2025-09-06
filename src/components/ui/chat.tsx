import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  className?: string;
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ className, messages = [], onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou sua IA contextual. Como posso ajudar com o documento?',
      timestamp: new Date()
    },
    {
      id: '2',
      role: 'user',
      content: 'Preciso melhorar a cláusula de rescisão',
      timestamp: new Date()
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Analisando a cláusula de rescisão... Sugiro adicionar mais detalhes sobre prazos e penalidades.',
      timestamp: new Date()
    }
  ];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const getMessageIcon = (role: ChatMessage['role']) => {
    return role === 'user' ? (
      <User className="w-4 h-4" aria-hidden="true" />
    ) : (
      <Bot className="w-4 h-4" aria-hidden="true" />
    );
  };

  return (
    <div 
      className={cn(
        'flex flex-col h-full bg-card border-l border-border',
        className
      )}
      role="complementary"
      aria-label="Chat com IA"
    >
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Chat IA</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Assistente contextual
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {displayMessages.map((message) => (
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
                  {message.timestamp.toLocaleTimeString()}
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
};

export default Chat;