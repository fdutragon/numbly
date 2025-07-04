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

  const handleUpdate = (updates: Partial<Block>) => {
    onUpdate({ ...block, ...updates });
  };

  // Type guards para verificação de tipo
  const isTextBlock = (block: Block): block is TextBlock => block.type === 'text';
  const isHeadingBlock = (block: Block): block is HeadingBlock => block.type === 'heading';
  const isListBlock = (block: Block): block is ListBlock => block.type === 'list';
  const isCodeBlock = (block: Block): block is CodeBlock => block.type === 'code';
  const isImageBlock = (block: Block): block is ImageBlock => block.type === 'image';

  // Base classes para consistência visual
  const baseBlockClass = "group relative py-3 px-4 -mx-4 rounded-xl transition-all duration-200 hover:bg-muted/30";
  const baseInputClass = "w-full bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-muted-foreground focus:outline-none";
  const baseTextClass = "text-foreground cursor-text min-h-[1.75rem] leading-relaxed";
  const controlsClass = "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200";

  if (isTextBlock(block)) {
    return (
      <div className="group flex items-start gap-2 py-1">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-transparent outline-none text-base text-gray-100"
              value={block.content}
              autoFocus={autoFocus}
              onBlur={() => setEditing(false)}
              onChange={e => onUpdate({ ...block, content: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') setEditing(false);
              }}
            />
          ) : (
            <div
              className="cursor-text text-base text-gray-100 min-h-[1.5em]"
              onClick={() => setEditing(true)}
              dangerouslySetInnerHTML={{ __html: escapeHtml(block.content ?? '') || '<span class=\'text-gray-500\'>Digite / para comandos…</span>' }}
            />
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
    return (
      <div className="group flex items-start gap-2 py-1">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-transparent outline-none font-bold text-xl text-gray-100"
              value={block.content}
              autoFocus={autoFocus}
              onBlur={() => setEditing(false)}
              onChange={e => onUpdate({ ...block, content: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') setEditing(false);
              }}
            />
          ) : (
            <div
              className="cursor-text font-bold text-xl text-gray-100 min-h-[1.5em]"
              onClick={() => setEditing(true)}
              dangerouslySetInnerHTML={{ __html: escapeHtml(block.content ?? '') || '<span class=\'text-gray-500\'>Título…</span>' }}
            />
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
    return (
      <div className="group flex items-start gap-2 py-1">
        <ul className="flex-1 min-w-0 list-disc pl-6 text-gray-100">
          {block.items.map((item, idx) => (
            <li key={idx} className="min-h-[1.5em] cursor-text" onClick={() => setEditing(true)}>{escapeHtml(item ?? '')}</li>
          ))}
        </ul>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
    return (
      <div className="group flex items-start gap-2 py-1">
        <pre className="flex-1 min-w-0 bg-gray-800 rounded p-2 text-sm text-gray-100 overflow-x-auto cursor-text" onClick={() => setEditing(true)}>{block.code}</pre>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
    return (
      <div className="group flex items-start gap-2 py-1">
        <img src={block.url} alt={block.alt || ''} className="max-w-xs rounded shadow" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
    return <hr className="my-4 border-gray-700" />;
  }
  return null;
}
