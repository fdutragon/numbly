import React, { useState } from 'react';
import { SidebarNavigation } from './SidebarNavigation';
import { BlockRenderer } from './BlockRenderer';
import { Block, BlockType } from './types';
import { v4 as uuidv4 } from 'uuid';

const initialBlocks: Block[] = [
  { id: uuidv4(), type: 'heading', content: 'Minha Página Notion', level: 1 },
  { id: uuidv4(), type: 'text', content: 'Bem-vindo ao editor Notion-like! Clique para editar.' },
  { id: uuidv4(), type: 'list', items: ['Primeiro item', 'Segundo item'] },
  { id: uuidv4(), type: 'divider' },
  { id: uuidv4(), type: 'code', code: 'console.log("Hello World")', language: 'javascript' },
  { id: uuidv4(), type: 'image', url: 'https://placekitten.com/300/200', alt: 'Gatinho' }
];

const initialPages = [
  { id: '1', title: 'Página Inicial' },
  { id: '2', title: 'Projetos' },
  { id: '3', title: 'Notas' }
];

export function NotionEditor() {
  const [pages] = useState(initialPages);
  const [currentPageId, setCurrentPageId] = useState('1');
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);

  // Manipulação de blocos
  const updateBlock = (id: string, newBlock: Block) => {
    setBlocks(blocks => blocks.map(b => b.id === id ? newBlock : b));
  };
  const deleteBlock = (id: string) => {
    setBlocks(blocks => blocks.filter(b => b.id !== id));
  };
  const duplicateBlock = (id: string) => {
    setBlocks(blocks => {
      const idx = blocks.findIndex(b => b.id === id);
      if (idx === -1) return blocks;
      const block = blocks[idx];
      const newBlock = { ...block, id: uuidv4() };
      return [...blocks.slice(0, idx + 1), newBlock, ...blocks.slice(idx + 1)];
    });
  };
  const changeBlockType = (id: string, type: BlockType) => {
    setBlocks(blocks => blocks.map(b => b.id === id ? { ...b, type } as Block : b));
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <SidebarNavigation
        pages={pages}
        currentPageId={currentPageId}
        onSelect={setCurrentPageId}
      />
      <main className="flex-1 flex flex-col items-center overflow-y-auto p-8">
        <div className="w-full max-w-2xl space-y-2">
          {blocks.map((block, idx) => (
            <BlockRenderer
              key={block.id}
              block={block}
              onUpdate={b => updateBlock(block.id, b)}
              onDelete={() => deleteBlock(block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onChangeType={type => changeBlockType(block.id, type)}
              autoFocus={idx === blocks.length - 1}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
