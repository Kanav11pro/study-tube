import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Image, 
  Camera, 
  Loader2, 
  Bot, 
  User, 
  Clock, 
  BookOpen,
  Lightbulb,
  Calculator,
  Zap
} from 'lucide-react';
import { aiService, type AIResponse, type DoubtContext } from '@/services/aiService';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  imageUrl?: string;
  aiResponse?: AIResponse;
}

interface AIDoubtChatProps {
  videoId: string;
  playlistId: string;
  videoTitle: string;
  videoTopic: string;
  currentTimestamp: number;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export const AIDoubtChat = ({
  videoId,
  playlistId,
  videoTitle,
  videoTopic,
  currentTimestamp,
  onMaximize,
  isMaximized = false
}: AIDoubtChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshot = async () => {
    try {
      // This would capture the current video frame
      // For now, we'll use a placeholder
      toast.info('Screenshot feature coming soon!');
    } catch (error) {
      toast.error('Failed to capture screenshot');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: currentTimestamp,
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setImagePreview(null);
    setIsLoading(true);

    try {
      const context: DoubtContext = {
        videoTitle,
        videoTopic,
        timestamp: currentTimestamp,
        question: inputValue,
        hasImage: !!selectedImage
      };

      const transcript = await aiService.getVideoTranscript(videoId);
      if (transcript) {
        context.transcript = transcript;
      }

      const aiResponse = await aiService.generateResponse(context, imagePreview || undefined);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.response,
        timestamp: currentTimestamp,
        aiResponse
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database
      const { data: { user } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
      if (user) {
        await aiService.saveDoubtAndResponse(
          user.id,
          videoId,
          playlistId,
          currentTimestamp,
          inputValue,
          selectedImage ? 'image' : 'text',
          imagePreview || undefined,
          aiResponse
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Explain this concept', icon: Lightbulb, action: () => setInputValue('Explain this concept') },
    { label: 'Solve this problem', icon: Calculator, action: () => setInputValue('Solve this problem step by step') },
    { label: 'Connect topics', icon: BookOpen, action: () => setInputValue('How does this connect to previous topics?') },
    { label: 'Give practice', icon: Zap, action: () => setInputValue('Give me similar practice problems') }
  ];

  return (
    <Card className={`h-full flex flex-col ${isMaximized ? 'w-full' : 'w-full'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">AI Study Assistant</CardTitle>
          </div>
          {onMaximize && (
            <Button variant="ghost" size="sm" onClick={onMaximize}>
              {isMaximized ? 'Minimize' : 'Maximize'}
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.floor(currentTimestamp / 60)}:{(currentTimestamp % 60).toString().padStart(2, '0')}
          </div>
          <div className="truncate">{videoTitle}</div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-medium">Ask me anything!</p>
                <p className="text-sm">I can help explain concepts, solve problems, and provide practice questions.</p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'ai' ? (
                      <Bot className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {message.type === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                  </div>
                  
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-muted'
                  }`}>
                    {message.imageUrl && (
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded" 
                        className="max-w-full h-auto rounded mb-2"
                      />
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.aiResponse && (
                      <div className="mt-3 space-y-2">
                        {message.aiResponse.concepts && message.aiResponse.concepts.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Related Concepts:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.aiResponse.concepts.map((concept, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {message.aiResponse.relatedTimestamps && message.aiResponse.relatedTimestamps.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Suggested Timestamps:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.aiResponse.relatedTimestamps.map((timestamp, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {Math.floor(timestamp / 60)}:{(timestamp % 60).toString().padStart(2, '0')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="p-4 border-t">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.action}
                className="text-xs h-8"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-full h-32 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                >
                  ×
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask your doubt..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0"
              >
                <Image className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleScreenshot}
                className="shrink-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


