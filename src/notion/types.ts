// Tipos de bloco para o editor Notion-like

export type BlockType = 'text' | 'heading' | 'list' | 'code' | 'image' | 'divider';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  code: string;
  language?: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export type Block = TextBlock | HeadingBlock | ListBlock | CodeBlock | ImageBlock | DividerBlock;
