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

    const { videoId, youtubeVideoId, videoTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key not configured');
    }

    console.log('Generating notes for video:', youtubeVideoId);

    // Fetch transcript from YouTube
    let transcript = '';
    let transcriptAvailable = false;
    try {
      const transcriptResponse = await fetch(
        `https://www.youtube.com/api/timedtext?lang=en&v=${youtubeVideoId}`
      );
      
      if (transcriptResponse.ok) {
        const transcriptText = await transcriptResponse.text();
        // Basic XML parsing to extract text
        transcript = transcriptText
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Only use transcript if it's substantial
        if (transcript.length > 100) {
          transcriptAvailable = true;
          console.log(`Transcript fetched successfully: ${transcript.length} characters`);
        }
      }
    } catch (e) {
      console.log('Could not fetch transcript, will use video title:', e);
    }

    // If no transcript, use video title
    const contentToAnalyze = transcript || `Video title: ${videoTitle}`;
    
    // Use more powerful model for longer transcripts
    const model = transcript.length > 10000 ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';

    // Generate comprehensive notes using Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert AI study assistant helping students create comprehensive, detailed study notes from educational videos. 

Your notes should be:
- Extensive and thorough, covering all major topics
- Well-structured with clear sections
- Include specific examples, formulas, and concepts mentioned
- Written in a student-friendly, clear manner
- Comprehensive enough that students can study from the notes alone

Respond ONLY with valid JSON in this exact format:
{
  "summary": "A comprehensive 3-5 sentence overview of the entire video content, highlighting the main educational objectives and key themes covered",
  "key_points": [
    "Detailed point 1 with explanation and context",
    "Detailed point 2 with formulas or specific details if applicable",
    "Detailed point 3 with examples",
    "...continue with 15-25 detailed points covering all major topics"
  ]
}

Make the key_points array extensive (15-25 points minimum) to ensure students get thorough coverage of all content.`
          },
          {
            role: 'user',
            content: transcriptAvailable 
              ? `Create comprehensive, detailed study notes from this educational video transcript. Extract ALL important concepts, formulas, examples, and explanations. The notes should be thorough enough for exam preparation:\n\n${contentToAnalyze}\n\nProvide a comprehensive summary and 15-25+ detailed key learning points covering ALL major topics discussed.`
              : `Create study notes for this educational video: "${videoTitle}"\n\nBased on the video title, generate useful study points about this topic. Provide a comprehensive summary and 10-15 key learning points about this subject.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate notes');
    }

    const aiData = await aiResponse.json();
    const notesText = aiData.choices[0].message.content;
    
    // Parse JSON response
    let notes;
    try {
      // Try to extract JSON from the response
      const jsonMatch = notesText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        notes = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', notesText);
      // Fallback notes
      notes = {
        summary: 'Unable to generate detailed notes. Please watch the video for full content.',
        key_points: [
          'Video content analysis in progress',
          'Check back later for detailed notes',
        ],
      };
    }

    // Save to database
    const { error: insertError } = await supabaseClient
      .from('ai_notes')
      .insert({
        user_id: user.id,
        video_id: videoId,
        video_title: videoTitle,
        summary: notes.summary,
        key_points: notes.key_points,
      });

    if (insertError) {
      console.error('Error saving notes:', insertError);
      // Don't throw, notes were generated successfully
    }

    // Update video progress
    const { error: progressError } = await supabaseClient
      .from('video_progress')
      .update({ notes_generated: true })
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    if (progressError) {
      console.log('Could not update progress:', progressError);
    }

    console.log('Successfully generated notes');

    return new Response(JSON.stringify({ success: true, notes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating notes:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
