import React from 'react';
import { MoreVertical, Copy, Trash, Type } from 'lucide-react';
import { BlockType } from './types';

interface BlockControlsProps {
  onChangeType: (type: BlockType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function BlockControls({ onChangeType, onDuplicate, onDelete }: BlockControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button title="Mudar tipo" className="p-1 hover:bg-gray-200 rounded" onClick={() => onChangeType('text')}><Type size={16} /></button>
      <button title="Duplicar" className="p-1 hover:bg-gray-200 rounded" onClick={onDuplicate}><Copy size={16} /></button>
      <button title="Deletar" className="p-1 hover:bg-gray-200 rounded" onClick={onDelete}><Trash size={16} /></button>
    </div>
  );
}
