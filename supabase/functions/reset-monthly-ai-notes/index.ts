import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Reset AI notes counter for all users who haven't been reset this month
    const { error, count } = await supabaseClient
      .from('profiles')
      .update({
        ai_notes_used_this_month: 0,
        ai_notes_reset_date: today,
      })
      .neq('ai_notes_reset_date', today);

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'AI notes counter reset successfully',
        updated_count: count || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});