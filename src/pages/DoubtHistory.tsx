import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Bot, 
  User, 
  Clock, 
  BookOpen,
  MessageSquare,
  Calendar,
  Tag,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface DoubtQuestion {
  id: string;
  question_text: string;
  question_image_url?: string;
  question_type: 'text' | 'image' | 'screenshot';
  timestamp_seconds: number;
  created_at: string;
  video: {
    title: string;
    youtube_video_id: string;
  };
  playlist: {
    title: string;
  };
  doubt_responses: {
    response_text: string;
    response_data: any;
    model_used: string;
    related_timestamps: number[];
    created_at: string;
  }[];
}

const DoubtHistory = () => {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<DoubtQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'screenshot'>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  useEffect(() => {
    loadDoubts();
  }, []);

  const loadDoubts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('doubt_questions')
        .select(`
          *,
          videos(title, youtube_video_id),
          playlists(title),
          doubt_responses(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoubts(data || []);
    } catch (error) {
      console.error('Error loading doubts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDoubts = doubts.filter(doubt => {
    const matchesSearch = doubt.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doubt.video.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || doubt.question_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return '📷';
      case 'screenshot':
        return '📸';
      default:
        return '💬';
    }
  };

  const getSubjectFromTitle = (title: string) => {
    if (title.toLowerCase().includes('physics')) return 'Physics';
    if (title.toLowerCase().includes('chemistry')) return 'Chemistry';
    if (title.toLowerCase().includes('math')) return 'Mathematics';
    return 'General';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-muted-foreground">Loading your doubt history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl p-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-xl">Doubt History</h1>
            <p className="text-sm text-muted-foreground">All your AI study assistant conversations</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doubts, videos, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="screenshot">Screenshot</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{doubts.length}</div>
              <div className="text-sm text-muted-foreground">Total Doubts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {doubts.filter(d => d.doubt_responses.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Answered</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {new Set(doubts.map(d => d.playlist.title)).size}
              </div>
              <div className="text-sm text-muted-foreground">Playlists</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(doubts.map(d => getSubjectFromTitle(d.video.title))).size}
              </div>
              <div className="text-sm text-muted-foreground">Subjects</div>
            </CardContent>
          </Card>
        </div>

        {/* Doubts List */}
        <div className="space-y-4">
          {filteredDoubts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No doubts found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start asking questions in the video player to see them here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDoubts.map((doubt) => (
              <Card key={doubt.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getQuestionTypeIcon(doubt.question_type)}</span>
                        <Badge variant="outline" className="text-xs">
                          {doubt.question_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getSubjectFromTitle(doubt.video.title)}
                        </Badge>
                      </div>
                      
                      <CardTitle className="text-lg line-clamp-2">
                        {doubt.question_text}
                      </CardTitle>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {doubt.playlist.title}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(doubt.timestamp_seconds)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(doubt.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/player/${doubt.playlist.id}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Video
                    </Button>
                  </div>
                </CardHeader>

                {doubt.question_image_url && (
                  <div className="px-6 pb-4">
                    <img 
                      src={doubt.question_image_url} 
                      alt="Question image" 
                      className="max-w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {doubt.doubt_responses.length > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">AI Response</span>
                        <Badge variant="outline" className="text-xs">
                          {doubt.doubt_responses[0].model_used}
                        </Badge>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="whitespace-pre-wrap text-sm">
                          {doubt.doubt_responses[0].response_text}
                        </div>
                      </div>

                      {doubt.doubt_responses[0].related_timestamps && doubt.doubt_responses[0].related_timestamps.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Suggested Timestamps:</p>
                          <div className="flex flex-wrap gap-2">
                            {doubt.doubt_responses[0].related_timestamps.map((timestamp, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {formatTime(timestamp)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {doubt.doubt_responses[0].response_data?.concepts && (
                        <div>
                          <p className="text-sm font-medium mb-2">Related Concepts:</p>
                          <div className="flex flex-wrap gap-2">
                            {doubt.doubt_responses[0].response_data.concepts.map((concept: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {concept}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default DoubtHistory;


