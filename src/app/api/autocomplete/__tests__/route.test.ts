// Mock do Next.js
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  },
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    method: options?.method || 'GET',
    json: jest.fn().mockImplementation(() => {
      try {
        return Promise.resolve(JSON.parse(options?.body || '{}'))
      } catch {
        return Promise.reject(new SyntaxError('Invalid JSON'))
      }
    }),
    text: jest.fn().mockResolvedValue(options?.body || '')
  }))
}))

// Mock do OpenAI

jest.mock('openai', () => {
  const mockCreateFn = jest.fn()
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateFn
        }
      }
    })),
    mockCreate: mockCreateFn
  }
})

import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock das variáveis de ambiente
const originalEnv = process.env

// Get the mocked create function
let mockCreateFn: jest.Mock

describe('/api/autocomplete', () => {
  beforeAll(() => {
    const openaiMock = require('openai')
    mockCreateFn = openaiMock.mockCreate
  })

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
    
    // Reset all mocks
    jest.clearAllMocks()
    mockCreateFn.mockClear()
  })

  it('should return error when API key is not configured', async () => {
    // Mock missing API key
    const originalEnv = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text',
        context: 'Legal document'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toContain('OpenAI API key not configured')
    expect(data.suggestion).toBeNull()
    expect(data.fallback).toBe(true)

    // Restore original env
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv
    }
  })

  it('should return error when API key is placeholder', async () => {
    // Mock placeholder API key
    const originalEnv = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = 'your_openai_api_key_here'

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text',
        context: 'Legal document'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toContain('OpenAI API key not configured')
    expect(data.suggestion).toBeNull()
    expect(data.fallback).toBe(true)

    // Restore original env
    if (originalEnv) {
      process.env.OPENAI_API_KEY = originalEnv
    } else {
      delete process.env.OPENAI_API_KEY
    }
  })

  it('should return error when text is empty', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: '',
        context: 'Legal document'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Text is required')
  })

  it('should return error when text is only whitespace', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: '   \n\t   ',
        context: 'Legal document'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Text is required')
  })

  it('should call OpenAI with correct parameters and return stream', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    // Mock async iterator for streaming response
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [{
            delta: { content: 'que estabelece' }
          }]
        }
        yield {
          choices: [{
            delta: { content: ' os direitos' }
          }]
        }
      }
    }

    mockCreateFn.mockResolvedValue(mockStream)

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Este contrato',
        context: 'Contrato de prestação de serviços'
      })
    })

    const response = await POST(request)

    expect(response.status).toBe(200)

    expect(mockCreateFn).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Brazilian legal writing assistant. Provide natural, contextually appropriate completions for legal documents in Portuguese.'
        },
        {
          role: 'user',
          content: expect.stringContaining('Este contrato')
        }
      ],
      max_tokens: 100,
      temperature: 0.3,
      stream: true
    })
  })

  it('should handle OpenAI API errors', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    // Mock OpenAI error
    mockCreateFn.mockRejectedValue(new Error('OpenAI API Error'))

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text',
        context: 'Legal document'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe('Autocomplete temporarily unavailable')
    expect(data.fallback).toBe(true)
  })

  it('should use default context when not provided', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    mockCreateFn.mockResolvedValue({
      choices: [{
        message: {
          content: 'completion text'
        }
      }]
    })

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Test text'
        // No context provided
      })
    })

    await POST(request)

    const callArgs = mockCreateFn.mock.calls[0][0]
    const userMessage = callArgs.messages[1].content

    expect(userMessage).toContain('Context: Legal document')
  })

  it('should handle malformed JSON request', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: 'invalid json'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.error).toBe('Autocomplete temporarily unavailable')
    expect(data.fallback).toBe(true)
  })

  it('should handle text with whitespace', async () => {
    process.env.OPENAI_API_KEY = 'test-api-key'

    mockCreateFn.mockResolvedValue({
      choices: [{
        message: {
          content: 'Test suggestion'
        }
      }]
    })

    const request = new NextRequest('http://localhost:3000/api/autocomplete', {
      method: 'POST',
      body: JSON.stringify({
        text: '  Test text with spaces  '
      })
    })

    await POST(request)

    expect(mockCreateFn).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          content: expect.stringContaining('  Test text with spaces  ')
        })
      ])
    }))
  })
})