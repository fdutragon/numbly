# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Context

This is **Numbly** - a legal document editor with AI capabilities built on Next.js 15, React 19, and Lexical editor. The project is primarily in Portuguese and focuses on creating and editing legal contracts with AI assistance, offline-first persistence, and compliance checking.

### Technology Stack
- **Frontend**: Next.js 15 with React 19, TypeScript
- **Editor**: Lexical (Facebook's rich text editor)
- **UI**: shadcn/ui components with Radix UI primitives and Tailwind CSS
- **Database**: IndexedDB (via Dexie.js) for local-first storage
- **Backend**: Supabase for authentication and sync
- **AI**: OpenAI for autocomplete, content generation, and chat
- **Styling**: Tailwind CSS v4 with custom theme support
- **Build**: Uses Turbopack for faster builds

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm run start

# Lint with ESLint
npm run lint

# AI-powered git commit
npm run commit
```

### Running Tests
While test scripts aren't currently configured, the project architecture anticipates:
- Unit tests with Vitest
- Integration tests with Dexie mocked
- E2E tests with Playwright

### Single Test Execution
When implementing tests, follow these patterns:
```bash
# Run specific test file
npx vitest run src/data/dao.test.ts

# Run tests for specific component
npx vitest run src/components/editor

# Run E2E tests for specific flow
npx playwright test tests/editor-flow.spec.ts
```

## High-Level Architecture

### Application Structure
The app follows a local-first architecture with offline capabilities:

```
src/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx           # Main editor interface (3-column layout)
│   ├── layout.tsx         # Root layout with theme provider
│   └── editor-x/          # Standalone editor page for testing
├── components/
│   ├── blocks/            # Main editor components
│   │   └── editor-x/      # Lexical editor implementation
│   ├── editor/            # Editor plugins, contexts, hooks
│   └── ui/                # shadcn/ui components
├── lib/
│   └── utils.ts           # Utility functions (cn, etc.)
└── scripts/               # Build and automation scripts
```

### Data Flow Architecture

1. **Editor State**: Managed by Lexical with SerializedEditorState
2. **Local Storage**: IndexedDB via Dexie for offline-first persistence
3. **Synchronization**: Incremental sync with Supabase based on updated_at timestamps
4. **AI Integration**: OpenAI for ghost suggestions, content improvement, and chat

### Key Components

- **Editor**: Memoized Lexical composer with plugin architecture
- **Three-Column Layout**: Console (left) + Editor (center) + Chat (right)
- **Theme System**: Custom themes with next-themes integration
- **Debounced State Management**: 300ms debounce for editor state changes

### Planned Database Schema (IndexedDB)
The codebase is designed around this IndexedDB schema via Dexie:
- `documents`: Document metadata and status
- `clauses`: Individual contract clauses with order indexing
- `clause_index`: AI context indexing for minimal token usage
- `ai_edits`: Track AI modifications with diffs
- `chat_messages`: Contextual AI chat history
- `autocomplete_cache`: Ghost suggestions cache
- `flags`: Usage tracking and paywall enforcement
- `outbox`: Offline sync queue for Supabase

### AI and Paywall Strategy
- **Ghost Autocomplete**: IDE-like suggestions as users type
- **One Free Edit**: Users get 1 free AI edit, then paywall
- **Contextual Chat**: AI chat uses clause_index for minimal token usage
- **Read-only Mode**: Generated contracts are read-only until paywall passed

### Security and Performance
- **Read-only Locks**: Disable copy/paste/context menu in read-only mode
- **Lazy Loading**: Components and plugins are lazy-loaded
- **Web Workers**: Validation and heavy processing in workers
- **Debounced Saves**: Prevent excessive I/O operations

## Key Patterns to Follow

### Component Architecture
- Use `memo()` for expensive components (especially editor-related)
- Implement lazy loading for non-critical components
- Follow the plugin pattern for Lexical extensions
- Use Suspense boundaries for better UX

### State Management
- Debounce editor state changes (300ms default)
- Use refs for timeout management to prevent memory leaks
- SerializedEditorState for persistence and synchronization
- Local-first approach with background sync

### Error Handling
- Console.error for development debugging
- Graceful fallbacks for AI services
- Offline-first mentality with sync resolution

### Performance Considerations
- Turbopack for faster builds and dev server
- React 19 concurrent features
- Memoization for list components
- Background processing in web workers

## Important Files to Understand

- `codex.md`: Comprehensive technical specification and implementation plan
- `.trae/rules/project_rules.md`: Detailed MVP requirements and constraints
- `scripts/auto-commit-groq.js`: AI-powered git commit message generation
- `src/app/page.tsx`: Main application with three-column layout
- `src/components/blocks/editor-x/`: Core Lexical editor implementation

## Environment Variables Expected

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_OPENAI_KEY=
GROQ_API_KEY=
GEMINI_API_KEY=
```

## Portuguese Context
The application and documentation are primarily in Portuguese (Brazilian). Key terminology:
- "cláusula" = clause
- "contrato" = contract
- "conformidade" = compliance
- "rascunho" = draft
- "somente leitura" = read-only

When working with this codebase, maintain Portuguese naming for domain-specific terms while keeping technical terms in English.
