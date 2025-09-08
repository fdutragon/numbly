import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Editor } from '../editor';
import { SerializedEditorState } from 'lexical';

// Mock dos plugins para evitar dependências complexas
jest.mock('../plugins', () => ({
  Plugins: () => <div data-testid="plugins">Plugins</div>
}));

// Mock do tema do editor
jest.mock('@/components/editor/themes/editor-theme', () => ({
  editorTheme: {}
}));

// Mock dos nós
jest.mock('../nodes', () => ({
  nodes: []
}));

// Mock dos contextos
jest.mock('@/components/editor/context/floating-link-context', () => ({
  FloatingLinkContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

jest.mock('@/components/editor/context/shared-autocomplete-context', () => ({
  SharedAutocompleteContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock do TooltipProvider
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock do LexicalComposer e OnChangePlugin
jest.mock('@lexical/react/LexicalComposer', () => ({
  LexicalComposer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="lexical-composer">{children}</div>
  )
}));

jest.mock('@lexical/react/LexicalOnChangePlugin', () => ({
  OnChangePlugin: ({ onChange }: { onChange: (editorState: any) => void }) => {
    // Simula uma mudança no editor
    React.useEffect(() => {
      const mockEditorState = {
        toJSON: () => ({ root: { children: [] } })
      };
      onChange?.(mockEditorState);
    }, [onChange]);
    return <div data-testid="on-change-plugin" />;
  }
}));

describe('Editor Component', () => {
  it('should render without crashing', () => {
    render(<Editor />);
    
    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument();
    expect(screen.getByTestId('plugins')).toBeInTheDocument();
    expect(screen.getByTestId('on-change-plugin')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Editor className="custom-class" />);
    
    const editorDiv = container.firstChild as HTMLElement;
    expect(editorDiv).toHaveClass('custom-class');
  });

  it('should call onChange when editor state changes', async () => {
    const mockOnChange = jest.fn();
    
    render(<Editor onChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith({ root: { children: [] } });
    });
  });

  it('should call onSerializedChange when editor state changes', async () => {
    const mockOnSerializedChange = jest.fn();
    
    render(<Editor onSerializedChange={mockOnSerializedChange} />);
    
    await waitFor(() => {
      expect(mockOnSerializedChange).toHaveBeenCalledWith({ root: { children: [] } });
    });
  });

  it('should handle initial value prop', () => {
    const initialValue: SerializedEditorState = {
      root: {
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            text: 'Initial content'
          }]
        }]
      }
    };
    
    render(<Editor initialValue={initialValue} />);
    
    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument();
  });

  it('should handle editorSerializedState prop', () => {
    const editorSerializedState: SerializedEditorState = {
      root: {
        children: [{
          type: 'paragraph',
          children: [{
            type: 'text',
            text: 'Serialized content'
          }]
        }]
      }
    };
    
    render(<Editor editorSerializedState={editorSerializedState} />);
    
    expect(screen.getByTestId('lexical-composer')).toBeInTheDocument();
  });

  it('should have correct display name', () => {
    expect(Editor.displayName).toBe('Editor');
  });

  it('should render with default background class', () => {
    const { container } = render(<Editor />);
    
    const editorDiv = container.firstChild as HTMLElement;
    expect(editorDiv).toHaveClass('bg-background', 'overflow-hidden');
  });
});