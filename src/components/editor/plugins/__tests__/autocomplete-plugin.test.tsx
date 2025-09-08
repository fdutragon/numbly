import React from 'react';
import { render } from '@testing-library/react';

// Mock dos contextos e utils
jest.mock('@lexical/react/LexicalComposerContext');
jest.mock('../../context/shared-autocomplete-context', () => ({
  useSharedAutocompleteContext: jest.fn()
}));

// Mock do swipe utils
jest.mock('../../utils/swipe', () => ({
  addSwipeRightListener: jest.fn(() => () => {})
}));

// Mock do AutocompleteNode
jest.mock('../../nodes/autocomplete-node', () => ({
  AutocompleteNode: class MockAutocompleteNode {},
  $createAutocompleteNode: jest.fn()
}));

import { AutocompletePlugin } from '../autocomplete-plugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useSharedAutocompleteContext } from '../../context/shared-autocomplete-context';

const mockUseLexicalComposerContext = useLexicalComposerContext as jest.MockedFunction<typeof useLexicalComposerContext>;
const mockUseSharedAutocompleteContext = useSharedAutocompleteContext as jest.MockedFunction<typeof useSharedAutocompleteContext>;

describe('AutocompletePlugin', () => {
  it('should import without errors', () => {
    expect(AutocompletePlugin).toBeDefined();
    expect(typeof AutocompletePlugin).toBe('function');
  });

  it('should be a valid React component', () => {
    expect(AutocompletePlugin.name).toBe('AutocompletePlugin');
  });
});