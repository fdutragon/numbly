import React, { useState } from 'react';
import { Block, BlockType } from './types';
import { BlockControls } from './BlockControls';

interface BlockRendererProps {
  block: Block;
  onUpdate: (block: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onChangeType: (type: BlockType) => void;
  autoFocus?: boolean;
}

export function BlockRenderer({ block, onUpdate, onDelete, onDuplicate, onChangeType, autoFocus }: BlockRendererProps) {
  const [editing, setEditing] = useState(false);

  // Escape HTML para evitar XSS
  const escapeHtml = (unsafe: string) => unsafe.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  if (block.type === 'text') {
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
