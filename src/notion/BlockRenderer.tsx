import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockType, TextBlock, HeadingBlock, ListBlock, CodeBlock, ImageBlock } from './types';
import { BlockControls } from './BlockControls';
import { cn } from '@/lib/utils';

interface BlockRendererProps {
  block: Block;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChangeType: (type: BlockType) => void;
  autoFocus?: boolean;
}

export function BlockRenderer({ 
  block, 
  onUpdate, 
  onDelete, 
  onDuplicate, 
  onChangeType, 
  autoFocus 
}: BlockRendererProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && !editing) {
      setEditing(true);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (editing) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }
  }, [editing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setEditing(false);
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  // Base classes para consistência visual (seguindo Design System)
  const baseBlockClass = cn(
    "group relative py-3 px-4 -mx-4 rounded-xl transition-all duration-200",
    "hover:bg-muted/20 focus-within:bg-muted/10"
  );
  const baseInputClass = cn(
    "w-full bg-transparent border-0 outline-none resize-none",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none focus:ring-0"
  );
  const baseTextClass = cn(
    "text-foreground cursor-text min-h-[1.75rem] leading-relaxed",
    "transition-colors duration-150"
  );
  const controlsClass = cn(
    "absolute top-2 right-2 opacity-0 group-hover:opacity-100",
    "transition-opacity duration-200"
  );

  if (block.type === 'text') {
    const textBlock = block as TextBlock;
    return (
      <div className={baseBlockClass}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className={cn(baseInputClass, "text-sm leading-6")}
              value={textBlock.content || ''}
              placeholder="Digite / para comandos…"
              onBlur={() => setEditing(false)}
              onChange={(e) => onUpdate({ ...textBlock, content: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div
              className={cn(baseTextClass, "text-sm leading-6")}
              onClick={() => setEditing(true)}
            >
              {textBlock.content || (
                <span className="text-muted-foreground italic">
                  Digite / para comandos…
                </span>
              )}
            </div>
          )}
        </div>
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'heading') {
    const headingBlock = block as HeadingBlock;
    const headingClasses = {
      1: "text-3xl font-bold leading-tight",
      2: "text-2xl font-semibold leading-snug", 
      3: "text-xl font-medium leading-normal"
    };
    
    return (
      <div className={baseBlockClass}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              className={cn(baseInputClass, headingClasses[headingBlock.level])}
              value={headingBlock.content || ''}
              placeholder="Título…"
              onBlur={() => setEditing(false)}
              onChange={(e) => onUpdate({ ...headingBlock, content: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <div
              className={cn(baseTextClass, headingClasses[headingBlock.level])}
              onClick={() => setEditing(true)}
            >
              {headingBlock.content || (
                <span className="text-muted-foreground italic font-normal">
                  Título…
                </span>
              )}
            </div>
          )}
        </div>
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'list') {
    const listBlock = block as ListBlock;
    return (
      <div className={baseBlockClass}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              ref={textareaRef}
              className={cn(baseInputClass, "text-sm leading-6 min-h-[2.5rem]")}
              value={listBlock.items?.join('\n') || ''}
              placeholder="• Item da lista"
              rows={Math.max(2, (listBlock.items?.length || 1) + 1)}
              onBlur={() => setEditing(false)}
              onChange={(e) => {
                const items = e.target.value.split('\n').filter(Boolean);
                onUpdate({ ...listBlock, items });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) return;
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setEditing(false);
                }
                if (e.key === 'Escape') setEditing(false);
              }}
            />
          ) : (
            <ul 
              className={cn(
                "list-disc pl-6 space-y-1 cursor-text min-h-[1.75rem]",
                "marker:text-muted-foreground"
              )}
              onClick={() => setEditing(true)}
            >
              {listBlock.items?.length ? (
                listBlock.items.map((item, idx) => (
                  <li key={idx} className="text-foreground text-sm leading-6">
                    {item}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground italic list-none -ml-6">
                  • Item da lista
                </li>
              )}
            </ul>
          )}
        </div>
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'code') {
    const codeBlock = block as CodeBlock;
    return (
      <div className={cn(baseBlockClass, "bg-muted/50")}>
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea
              ref={textareaRef}
              className={cn(
                "w-full bg-secondary/80 backdrop-blur-sm rounded-lg p-4",
                "text-sm font-mono text-secondary-foreground outline-none resize-none",
                "placeholder:text-muted-foreground border border-border/50"
              )}
              value={codeBlock.code || ''}
              placeholder="// Seu código aqui"
              rows={Math.max(3, (codeBlock.code?.split('\n').length || 1) + 1)}
              onBlur={() => setEditing(false)}
              onChange={(e) => onUpdate({ ...codeBlock, code: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const value = e.currentTarget.value;
                  e.currentTarget.value = value.substring(0, start) + '  ' + value.substring(end);
                  e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                }
                if (e.key === 'Escape') setEditing(false);
              }}
            />
          ) : (
            <pre
              className={cn(
                "bg-secondary/80 backdrop-blur-sm rounded-lg p-4 text-sm font-mono",
                "text-secondary-foreground overflow-x-auto cursor-text min-h-[3rem]",
                "border border-border/50 flex items-start"
              )}
              onClick={() => setEditing(true)}
            >
              {codeBlock.code || (
                <span className="text-muted-foreground italic">
                  // Seu código aqui
                </span>
              )}
            </pre>
          )}
        </div>
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'image') {
    const imageBlock = block as ImageBlock;
    return (
      <div className={cn(baseBlockClass, "py-4")}>
        <div className="flex flex-col gap-3">
          {imageBlock.url ? (
            <img 
              src={imageBlock.url} 
              alt={imageBlock.alt || 'Imagem'} 
              className={cn(
                "max-w-full h-auto rounded-xl shadow-sm border border-border/50",
                "transition-all duration-200 hover:shadow-md"
              )}
              loading="lazy"
            />
          ) : (
            <div className={cn(
              "w-full h-32 bg-muted/50 rounded-xl flex items-center justify-center",
              "border-2 border-dashed border-border cursor-pointer",
              "transition-colors hover:bg-muted/70"
            )}>
              <span className="text-muted-foreground italic text-sm">
                Clique para adicionar imagem
              </span>
            </div>
          )}
          
          {editing && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <input
                className={cn(
                  "w-full bg-background border border-border rounded-md px-3 py-2",
                  "text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "placeholder:text-muted-foreground"
                )}
                placeholder="URL da imagem"
                value={imageBlock.url || ''}
                onChange={(e) => onUpdate({ ...imageBlock, url: e.target.value })}
              />
              <input
                className={cn(
                  "w-full bg-background border border-border rounded-md px-3 py-2",
                  "text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "placeholder:text-muted-foreground"
                )}
                placeholder="Texto alternativo (opcional)"
                value={imageBlock.alt || ''}
                onChange={(e) => onUpdate({ ...imageBlock, alt: e.target.value })}
              />
              <div className="flex gap-2">
                <button
                  className={cn(
                    "px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm",
                    "hover:bg-primary/90 transition-colors font-medium"
                  )}
                  onClick={() => setEditing(false)}
                >
                  Salvar
                </button>
                <button
                  className={cn(
                    "px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm",
                    "hover:bg-secondary/80 transition-colors"
                  )}
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  if (block.type === 'divider') {
    return (
      <div className={cn(baseBlockClass, "py-6")}>
        <hr className="border-border" />
        <div className={controlsClass}>
          <BlockControls
            onChangeType={onChangeType}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  return null;
}
