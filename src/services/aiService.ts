interface AIModel {
  text: string;
  vision: string;
  math: string;
  chemistry: string;
}

interface AIResponse {
  response: string;
  model: string;
  relatedTimestamps?: number[];
  practiceProblems?: string[];
  concepts?: string[];
}

interface DoubtContext {
  videoTitle: string;
  videoTopic: string;
  timestamp: number;
  transcript?: string;
  question: string;
  hasImage: boolean;
}

class AIService {
  private models: AIModel = {
    text: 'deepseek/deepseek-chat',
    vision: 'openai/gpt-4o-mini',
    math: 'deepseek/deepseek-math',
    chemistry: 'deepseek/deepseek-chat'
  };

  private openRouterApiKey: string;

  constructor() {
    this.openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  }

  private selectModel(questionType: string, hasImage: boolean): string {
    if (hasImage) return this.models.vision;
    if (questionType.includes('math') || questionType.includes('calculate') || questionType.includes('solve')) {
      return this.models.math;
    }
    if (questionType.includes('chemistry') || questionType.includes('organic') || questionType.includes('inorganic')) {
      return this.models.chemistry;
    }
    return this.models.text;
  }

  private buildContextPrompt(context: DoubtContext): string {
    const basePrompt = `You are an expert JEE/NEET study assistant. You help students understand concepts, solve problems, and provide step-by-step solutions.

Current Context:
- Video: "${context.videoTitle}"
- Topic: "${context.videoTopic}"
- Current Timestamp: ${Math.floor(context.timestamp / 60)}:${(context.timestamp % 60).toString().padStart(2, '0')}
${context.transcript ? `- Video Transcript: ${context.transcript.substring(0, 1000)}...` : ''}

Student's Question: ${context.question}

Please provide a comprehensive response that includes:
1. Clear, step-by-step explanation
2. Related concepts and connections
3. Practice problems if applicable
4. Suggested video timestamps for better understanding
5. Mathematical equations in proper LaTeX format
6. Chemical structures if relevant

Format your response in a structured way that's easy to read and understand.`;

    return basePrompt;
  }

  async generateResponse(context: DoubtContext, imageUrl?: string): Promise<AIResponse> {
    try {
      const model = this.selectModel(context.question, context.hasImage);
      const prompt = this.buildContextPrompt(context);

      const requestBody: any = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert JEE/NEET study assistant. Provide clear, step-by-step explanations with mathematical equations in LaTeX format and chemical structures when relevant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      };

      // Add image if provided
      if (imageUrl && context.hasImage) {
        requestBody.messages[1].content = [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          }
        ];
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'StudyTube AI Assistant'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Extract related timestamps and concepts from response
      const relatedTimestamps = this.extractTimestamps(aiResponse);
      const practiceProblems = this.extractPracticeProblems(aiResponse);
      const concepts = this.extractConcepts(aiResponse);

      return {
        response: aiResponse,
        model,
        relatedTimestamps,
        practiceProblems,
        concepts
      };
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  private extractTimestamps(response: string): number[] {
    const timestampRegex = /(\d+):(\d+)/g;
    const timestamps: number[] = [];
    let match;

    while ((match = timestampRegex.exec(response)) !== null) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      timestamps.push(minutes * 60 + seconds);
    }

    return [...new Set(timestamps)]; // Remove duplicates
  }

  private extractPracticeProblems(response: string): string[] {
    const problemRegex = /(?:Problem|Question|Practice):\s*(.+?)(?:\n|$)/g;
    const problems: string[] = [];
    let match;

    while ((match = problemRegex.exec(response)) !== null) {
      problems.push(match[1].trim());
    }

    return problems;
  }

  private extractConcepts(response: string): string[] {
    const conceptRegex = /(?:Concept|Topic|Key Point):\s*(.+?)(?:\n|$)/g;
    const concepts: string[] = [];
    let match;

    while ((match = conceptRegex.exec(response)) !== null) {
      concepts.push(match[1].trim());
    }

    return concepts;
  }

  // Method to get video transcript
  async getVideoTranscript(videoId: string): Promise<string | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase
        .from('video_transcripts')
        .select('transcript_text')
        .eq('video_id', videoId)
        .single();

      return data?.transcript_text || null;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  }

  // Method to save doubt and response to database
  async saveDoubtAndResponse(
    userId: string,
    videoId: string,
    playlistId: string,
    timestamp: number,
    question: string,
    questionType: 'text' | 'image' | 'screenshot',
    imageUrl?: string,
    aiResponse?: AIResponse
  ) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Save doubt question
      const { data: questionData, error: questionError } = await supabase
        .from('doubt_questions')
        .insert({
          user_id: userId,
          video_id: videoId,
          playlist_id: playlistId,
          timestamp_seconds: timestamp,
          question_text: question,
          question_image_url: imageUrl,
          question_type: questionType
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Save AI response if provided
      if (aiResponse) {
        const { error: responseError } = await supabase
          .from('doubt_responses')
          .insert({
            question_id: questionData.id,
            response_text: aiResponse.response,
            response_data: {
              practiceProblems: aiResponse.practiceProblems,
              concepts: aiResponse.concepts
            },
            model_used: aiResponse.model,
            related_timestamps: aiResponse.relatedTimestamps
          });

        if (responseError) throw responseError;
      }

      return questionData;
    } catch (error) {
      console.error('Error saving doubt and response:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export type { AIResponse, DoubtContext };


