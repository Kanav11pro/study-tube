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
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    console.log('Fetching playlist:', playlistId);
    
    // Fetch playlist details
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!playlistResponse.ok) {
      throw new Error('Failed to fetch playlist details');
    }
    
    const playlistData = await playlistResponse.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      throw new Error('Playlist not found');
    }
    
    const playlistInfo = playlistData.items[0].snippet;
    
    // Fetch playlist items (videos)
    let allVideos: any[] = [];
    let nextPageToken = '';
    
    do {
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!videosResponse.ok) {
        throw new Error('Failed to fetch playlist videos');
      }
      
      const videosData = await videosResponse.json();
      allVideos = [...allVideos, ...videosData.items];
      nextPageToken = videosData.nextPageToken || '';
    } while (nextPageToken);
    
    // Get video durations
    const videoIds = allVideos.map(v => v.contentDetails.videoId).join(',');
    const durationsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    const durationsData = await durationsResponse.json();
    const durationMap = new Map();
    
    durationsData.items?.forEach((item: any) => {
      durationMap.set(item.id, item.contentDetails.duration);
    });
    
    // Convert ISO 8601 duration to seconds
    const parseDuration = (duration: string): number => {
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return hours * 3600 + minutes * 60 + seconds;
    };
    
    // Insert playlist
    const { data: playlist, error: playlistError } = await supabaseClient
      .from('playlists')
      .insert({
        user_id: user.id,
        youtube_playlist_id: playlistId,
        title: playlistInfo.title,
        description: playlistInfo.description || '',
        channel_name: playlistInfo.channelTitle,
        thumbnail_url: playlistInfo.thumbnails?.medium?.url || playlistInfo.thumbnails?.default?.url,
        total_videos: allVideos.length,
      })
      .select()
      .single();

    if (playlistError) throw playlistError;

    // Insert videos
    const videosToInsert = allVideos.map((video, index) => ({
      playlist_id: playlist.id,
      youtube_video_id: video.contentDetails.videoId,
      title: video.snippet.title,
      thumbnail_url: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      position_order: index,
      duration_seconds: parseDuration(durationMap.get(video.contentDetails.videoId) || 'PT0S'),
    }));

    const { error: videosError } = await supabaseClient
      .from('videos')
      .insert(videosToInsert);

    if (videosError) {
      console.error('Error inserting videos:', videosError);
      // Don't throw, playlist was created successfully
    }

    console.log('Successfully imported playlist with', allVideos.length, 'videos');

    return new Response(JSON.stringify({ success: true, playlist }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error importing playlist:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});