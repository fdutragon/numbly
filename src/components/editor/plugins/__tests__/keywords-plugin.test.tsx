import React from 'react';
import { render } from '@testing-library/react';
import { KeywordsPlugin } from '../keywords-plugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalTextEntity } from '@lexical/react/useLexicalTextEntity';
// Mock dos hooks do Lexical
jest.mock('@lexical/react/LexicalComposerContext');
jest.mock('@lexical/react/useLexicalTextEntity');
jest.mock('../../nodes/keyword-node', () => ({
  KeywordNode: class MockKeywordNode {},
  $createKeywordNode: jest.fn((text: string) => ({ type: 'keyword', text }))
}));

import { KeywordNode } from '../../nodes/keyword-node';

const mockUseLexicalComposerContext = useLexicalComposerContext as jest.MockedFunction<typeof useLexicalComposerContext>;
const mockUseLexicalTextEntity = useLexicalTextEntity as jest.MockedFunction<typeof useLexicalTextEntity>;

describe('KeywordsPlugin', () => {
  const mockEditor = {
    hasNodes: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLexicalComposerContext.mockReturnValue([mockEditor as any]);
  });

  it('should render without crashing', () => {
    mockEditor.hasNodes.mockReturnValue(true);
    
    const { container } = render(<KeywordsPlugin />);
    
    expect(container.firstChild).toBeNull(); // Plugin retorna null
  });

  it('should throw error if KeywordNode is not registered', () => {
    mockEditor.hasNodes.mockReturnValue(false);
    
    // Captura o erro do useEffect
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<KeywordsPlugin />);
    }).toThrow('KeywordsPlugin: KeywordNode not registered on editor');
    
    consoleSpy.mockRestore();
  });

  it('should check if KeywordNode is registered on editor', () => {
    mockEditor.hasNodes.mockReturnValue(true);
    
    render(<KeywordsPlugin />);
    
    expect(mockEditor.hasNodes).toHaveBeenCalledWith([KeywordNode]);
  });

  it('should call useLexicalTextEntity with correct parameters', () => {
    mockEditor.hasNodes.mockReturnValue(true);
    
    render(<KeywordsPlugin />);
    
    expect(mockUseLexicalTextEntity).toHaveBeenCalledWith(
      expect.any(Function), // getKeywordMatch
      KeywordNode,
      expect.any(Function)  // $createKeywordNode_
    );
  });

  describe('getKeywordMatch function', () => {
    let getKeywordMatch: (text: string) => any;

    beforeEach(() => {
      mockEditor.hasNodes.mockReturnValue(true);
      render(<KeywordsPlugin />);
      
      // Pega a função getKeywordMatch do primeiro argumento do useLexicalTextEntity
      const calls = mockUseLexicalTextEntity.mock.calls;
      getKeywordMatch = calls[0][0];
    });

    it('should match congratulations keywords', () => {
      const testCases = [
        'congrats',
        'congratulations', 
        'Félicitations',
        'parabéns',
        'gratuluju',
        'おめでとう',
        '축하해',
        'mazel tov'
      ];

      testCases.forEach(keyword => {
        const result = getKeywordMatch(keyword);
        expect(result).not.toBeNull();
        expect(result).toHaveProperty('start');
        expect(result).toHaveProperty('end');
        expect(typeof result.start).toBe('number');
        expect(typeof result.end).toBe('number');
      });
    });

    it('should match keywords with word boundaries', () => {
      const result = getKeywordMatch('Hello congrats there');
      
      expect(result).not.toBeNull();
      expect(result.start).toBe(6); // posição de 'congrats'
      expect(result.end).toBe(14);   // fim de 'congrats'
    });

    it('should not match keywords within other words', () => {
      const result = getKeywordMatch('congratsulation'); // palavra inventada
      
      expect(result).toBeNull();
    });

    it('should return null for non-matching text', () => {
      const testCases = [
        'hello world',
        'random text',
        'no keywords here',
        ''
      ];

      testCases.forEach(text => {
        const result = getKeywordMatch(text);
        expect(result).toBeNull();
      });
    });

    it('should handle case insensitive matching', () => {
      const testCases = [
        'CONGRATS',
        'Congratulations',
        'PARABÉNS',
        'Félicitations'
      ];

      testCases.forEach(keyword => {
        const result = getKeywordMatch(keyword);
        expect(result).not.toBeNull();
      });
    });
  });

  describe('$createKeywordNode_ function', () => {
    let createKeywordNodeFn: (textNode: any) => any;

    beforeEach(() => {
      mockEditor.hasNodes.mockReturnValue(true);
      render(<KeywordsPlugin />);
      
      // Pega a função $createKeywordNode_ do terceiro argumento do useLexicalTextEntity
      const calls = mockUseLexicalTextEntity.mock.calls;
      createKeywordNodeFn = calls[0][2];
    });

    it('should create keyword node from text node', () => {
      const mockTextNode = {
        getTextContent: jest.fn().mockReturnValue('congrats')
      };

      const result = createKeywordNodeFn(mockTextNode);
      
      expect(mockTextNode.getTextContent).toHaveBeenCalled();
      expect(result).toEqual({ type: 'keyword', text: 'congrats' });
    });
  });
});