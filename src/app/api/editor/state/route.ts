import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      guest_id, 
      document_id, 
      editor_state, 
      cursor_position, 
      selection_state, 
      viewport_state,
      undo_stack,
      redo_stack
    } = body;

    // Validação básica
    if (!guest_id || !document_id) {
      return NextResponse.json(
        { error: 'Guest ID e Document ID são obrigatórios' },
        { status: 400 }
      );
    }

    if (!editor_state) {
      return NextResponse.json(
        { error: 'Estado do editor é obrigatório' },
        { status: 400 }
      );
    }

    // Salvar estado do editor no Supabase
    const { data, error } = await supabase
      .from('editor_states')
      .upsert({
        guest_id,
        document_id,
        editor_state: JSON.stringify(editor_state),
        cursor_position: cursor_position || null,
        selection_state: selection_state ? JSON.stringify(selection_state) : null,
        viewport_state: viewport_state ? JSON.stringify(viewport_state) : null,
        undo_stack: undo_stack ? JSON.stringify(undo_stack) : null,
        redo_stack: redo_stack ? JSON.stringify(redo_stack) : null,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Erro ao salvar estado do editor:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar estado do editor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Estado do editor salvo com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint de estado do editor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guest_id');
    const documentId = searchParams.get('document_id');

    if (!guestId || !documentId) {
      return NextResponse.json(
        { error: 'Guest ID e Document ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar estado do editor
    const { data, error } = await supabase
      .from('editor_states')
      .select('*')
      .eq('guest_id', guestId)
      .eq('document_id', documentId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Erro ao buscar estado do editor:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar estado do editor' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Nenhum estado encontrado para este documento'
      });
    }

    const editorState = data[0];
    
    // Parse dos campos JSON
    const parsedState = {
      ...editorState,
      editor_state: editorState.editor_state ? JSON.parse(editorState.editor_state) : null,
      selection_state: editorState.selection_state ? JSON.parse(editorState.selection_state) : null,
      viewport_state: editorState.viewport_state ? JSON.parse(editorState.viewport_state) : null,
      undo_stack: editorState.undo_stack ? JSON.parse(editorState.undo_stack) : null,
      redo_stack: editorState.redo_stack ? JSON.parse(editorState.redo_stack) : null
    };

    return NextResponse.json({
      success: true,
      data: parsedState,
      message: 'Estado do editor recuperado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao recuperar estado do editor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guest_id');
    const documentId = searchParams.get('document_id');

    if (!guestId || !documentId) {
      return NextResponse.json(
        { error: 'Guest ID e Document ID são obrigatórios' },
        { status: 400 }
      );
    }

    // Deletar estado do editor
    const { error } = await supabase
      .from('editor_states')
      .delete()
      .eq('guest_id', guestId)
      .eq('document_id', documentId);

    if (error) {
      console.error('Erro ao deletar estado do editor:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar estado do editor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Estado do editor deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar estado do editor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para limpar estados antigos (cleanup)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { guest_id, days_old = 30 } = body;

    if (!guest_id) {
      return NextResponse.json(
        { error: 'Guest ID é obrigatório' },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days_old);

    // Deletar estados antigos
    const { error } = await supabase
      .from('editor_states')
      .delete()
      .eq('guest_id', guest_id)
      .lt('updated_at', cutoffDate.toISOString());

    if (error) {
      console.error('Erro ao limpar estados antigos:', error);
      return NextResponse.json(
        { error: 'Erro ao limpar estados antigos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Estados com mais de ${days_old} dias foram removidos`
    });

  } catch (error) {
    console.error('Erro na limpeza de estados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}