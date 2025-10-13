import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { playlistId } = await req.json();
    
    // Note: YouTube API integration will be added in next version
    // For now, create placeholder playlist
    const { data: playlist, error } = await supabaseClient
      .from('playlists')
      .insert({
        user_id: user.id,
        youtube_playlist_id: playlistId,
        title: 'Sample Playlist',
        description: 'YouTube API integration coming soon',
        channel_name: 'Sample Channel',
        total_videos: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, playlist }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});