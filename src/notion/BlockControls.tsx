import React from 'react';
import { MoreVertical, Copy, Trash, Type, Edit3 } from 'lucide-react';
import { BlockType } from './types';
import { cn } from '@/lib/utils';

interface BlockControlsProps {
  onChangeType: (type: BlockType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BlockControls({ onChangeType, onDuplicate, onDelete }: BlockControlsProps) {
  return (
    <div className={cn(
      "flex items-center gap-1 p-1 bg-background/95 backdrop-blur-sm rounded-lg",
      "border border-border/50 shadow-sm"
    )}>
      <button 
        title="Mudar tipo" 
        className={cn(
          "p-2 hover:bg-muted rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onChangeType('text')}
      >
        <Type size={14} />
      </button>
      <button 
        title="Duplicar" 
        className={cn(
          "p-2 hover:bg-muted rounded-md transition-colors",
          "text-muted-foreground hover:text-foreground"
        )}
        onClick={onDuplicate}
      >
        <Copy size={14} />
      </button>
      <button 
        title="Deletar" 
        className={cn(
          "p-2 hover:bg-destructive/10 rounded-md transition-colors",
          "text-muted-foreground hover:text-destructive"
        )}
        onClick={onDelete}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}
