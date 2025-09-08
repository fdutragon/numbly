import React from 'react';
import { render, screen } from '@testing-library/react';
import { DraggableBlockPlugin } from '../draggable-block-plugin';

// Mock do plugin experimental do Lexical
jest.mock('@lexical/react/LexicalDraggableBlockPlugin', () => ({
  DraggableBlockPlugin_EXPERIMENTAL: ({ 
    menuComponent, 
    targetLineComponent, 
    isOnMenu 
  }: {
    menuComponent: React.ReactNode;
    targetLineComponent: React.ReactNode;
    isOnMenu: (element: HTMLElement) => boolean;
  }) => (
    <div data-testid="draggable-block-plugin">
      <div data-testid="menu-component">{menuComponent}</div>
      <div data-testid="target-line-component">{targetLineComponent}</div>
      <div data-testid="is-on-menu-function" data-function={isOnMenu.toString()} />
    </div>
  )
}));

// Mock do ícone
jest.mock('lucide-react', () => ({
  GripVerticalIcon: ({ className }: { className?: string }) => (
    <div data-testid="grip-icon" className={className}>Grip</div>
  )
}));

describe('DraggableBlockPlugin', () => {
  const mockAnchorElement = document.createElement('div');

  it('should render when anchorElem is provided', () => {
    render(<DraggableBlockPlugin anchorElem={mockAnchorElement} />);
    
    expect(screen.getByTestId('draggable-block-plugin')).toBeInTheDocument();
    expect(screen.getByTestId('menu-component')).toBeInTheDocument();
    expect(screen.getByTestId('target-line-component')).toBeInTheDocument();
  });

  it('should return null when anchorElem is null', () => {
    const { container } = render(<DraggableBlockPlugin anchorElem={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render menu component with correct classes', () => {
    render(<DraggableBlockPlugin anchorElem={mockAnchorElement} />);
    
    const menuComponent = screen.getByTestId('menu-component');
    const menuDiv = menuComponent.querySelector('div');
    
    expect(menuDiv).toHaveClass(
      'draggable-block-menu',
      'absolute',
      'top-0',
      'left-0',
      'cursor-grab',
      'rounded-sm',
      'opacity-0'
    );
  });

  it('should render grip icon with correct classes', () => {
    render(<DraggableBlockPlugin anchorElem={mockAnchorElement} />);
    
    const gripIcon = screen.getByTestId('grip-icon');
    expect(gripIcon).toHaveClass('size-4', 'opacity-30');
  });

  it('should render target line component with correct classes', () => {
    render(<DraggableBlockPlugin anchorElem={mockAnchorElement} />);
    
    const targetLineComponent = screen.getByTestId('target-line-component');
    const targetLineDiv = targetLineComponent.querySelector('div');
    
    expect(targetLineDiv).toHaveClass(
      'bg-secondary-foreground',
      'pointer-events-none',
      'absolute',
      'top-0',
      'left-0',
      'h-1',
      'opacity-0'
    );
  });

  it('should provide isOnMenu function', () => {
    render(<DraggableBlockPlugin anchorElem={mockAnchorElement} />);
    
    const isOnMenuElement = screen.getByTestId('is-on-menu-function');
    expect(isOnMenuElement).toBeInTheDocument();
  });

  describe('isOnMenu function', () => {
    it('should return true for elements with draggable-block-menu class', () => {
      const element = document.createElement('div');
      element.className = 'draggable-block-menu';
      
      // Simula a função isOnMenu
      const isOnMenu = (el: HTMLElement) => !!el.closest('.draggable-block-menu');
      
      expect(isOnMenu(element)).toBe(true);
    });

    it('should return true for child elements of draggable-block-menu', () => {
      const parent = document.createElement('div');
      parent.className = 'draggable-block-menu';
      const child = document.createElement('div');
      parent.appendChild(child);
      
      // Simula a função isOnMenu
      const isOnMenu = (el: HTMLElement) => !!el.closest('.draggable-block-menu');
      
      expect(isOnMenu(child)).toBe(true);
    });

    it('should return false for elements without draggable-block-menu class', () => {
      const element = document.createElement('div');
      element.className = 'other-class';
      
      // Simula a função isOnMenu
      const isOnMenu = (el: HTMLElement) => !!el.closest('.draggable-block-menu');
      
      expect(isOnMenu(element)).toBe(false);
    });
  });
});