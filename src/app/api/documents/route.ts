import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory store as a stub for persistence
let currentDocument: unknown | null = null

export async function GET() {
  return NextResponse.json({ document: currentDocument })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!('document' in body)) {
      return NextResponse.json({ error: 'Missing document' }, { status: 400 })
    }
    currentDocument = body.document
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}

