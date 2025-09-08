import '@testing-library/jest-dom'

// Mock IndexedDB
require('fake-indexeddb/auto')

// Polyfill for structuredClone (required by fake-indexeddb)
if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj))
  }
}

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock fetch for API calls
global.fetch = jest.fn()

// Polyfills para TextEncoder/TextDecoder usados por algumas libs (ex: OpenAI SDK)
// Apenas define se ainda não existirem
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  const { TextDecoder } = require('util');
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})