import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PaywallStatus {
  canUseAI: boolean;
  freeEditUsed: boolean;
  isPremium: boolean;
  remainingFreeEdits: number;
  subscriptionStatus?: 'active' | 'inactive' | 'trial';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const userId = searchParams.get('userId');

    // Se não tem nem guestId nem userId, criar novo guest
    if (!guestId && !userId) {
      const newGuestId = crypto.randomUUID();
      
      // Criar registro de guest no Supabase
      const { error } = await supabase
        .from('guest_usage')
        .insert({
          guest_id: newGuestId,
          free_ai_edits_used: 0,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating guest record:', error);
      }

      const status: PaywallStatus = {
        canUseAI: true,
        freeEditUsed: false,
        isPremium: false,
        remainingFreeEdits: 1
      };

      return NextResponse.json({ 
        ...status, 
        guestId: newGuestId 
      });
    }

    // Verificar status para usuário autenticado
    if (userId) {
      const { data: userSubscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user subscription:', error);
        return NextResponse.json(
          { error: 'Failed to check subscription status' },
          { status: 500 }
        );
      }

      const isPremium = userSubscription?.status === 'active';
      
      const status: PaywallStatus = {
        canUseAI: isPremium,
        freeEditUsed: true, // Usuários autenticados já usaram o free edit
        isPremium,
        remainingFreeEdits: isPremium ? -1 : 0, // -1 = unlimited
        subscriptionStatus: userSubscription?.status || 'inactive'
      };

      return NextResponse.json(status);
    }

    // Verificar status para guest
    if (guestId) {
      const { data: guestUsage, error } = await supabase
        .from('guest_usage')
        .select('*')
        .eq('guest_id', guestId)
        .single();

      if (error) {
        // Se guest não existe, criar novo
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('guest_usage')
            .insert({
              guest_id: guestId,
              free_ai_edits_used: 0,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error creating guest record:', insertError);
          }

          const status: PaywallStatus = {
            canUseAI: true,
            freeEditUsed: false,
            isPremium: false,
            remainingFreeEdits: 1
          };

          return NextResponse.json(status);
        }

        console.error('Error fetching guest usage:', error);
        return NextResponse.json(
          { error: 'Failed to check usage status' },
          { status: 500 }
        );
      }

      const freeEditUsed = guestUsage.free_ai_edits_used >= 1;
      
      const status: PaywallStatus = {
        canUseAI: !freeEditUsed,
        freeEditUsed,
        isPremium: false,
        remainingFreeEdits: Math.max(0, 1 - guestUsage.free_ai_edits_used)
      };

      return NextResponse.json(status);
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing paywall check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST para marcar uso da edição gratuita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, userId, action } = body;

    if (action === 'use_free_edit') {
      if (guestId) {
        // Incrementar uso para guest
        const { error } = await supabase
          .from('guest_usage')
          .update({ 
            free_ai_edits_used: 1,
            updated_at: new Date().toISOString()
          })
          .eq('guest_id', guestId);

        if (error) {
          console.error('Error updating guest usage:', error);
          return NextResponse.json(
            { error: 'Failed to update usage' },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      if (userId) {
        // Para usuários autenticados, apenas log (eles já têm premium ou não podem usar)
        console.log(`User ${userId} attempted to use free edit`);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing paywall action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}