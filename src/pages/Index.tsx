import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, BarChart3, Shield, Zap, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Transform YouTube into Your Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Study Smarter with
              <span className="bg-gradient-primary bg-clip-text text-transparent"> StudyTube</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Remove distractions, track progress, and ace your JEE/NEET prep with AI-powered notes
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-lg h-14 px-8"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg h-14 px-8"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Why Students Love StudyTube</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to turn YouTube playlists into focused learning sessions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Shield}
              title="Distraction-Free"
              description="Watch videos without recommendations, comments, or any distractions"
            />
            <FeatureCard
              icon={BarChart3}
              title="Progress Tracking"
              description="Track your streaks, watch time, and completion percentage"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI Notes"
              description="Generate smart summaries and key points from video transcripts"
            />
            <FeatureCard
              icon={BookOpen}
              title="Playlist Management"
              description="Import and organize all your YouTube playlists in one place"
            />
            <FeatureCard
              icon={Target}
              title="Exam Focused"
              description="Designed specifically for JEE, NEET, and competitive exam prep"
            />
            <FeatureCard
              icon={Zap}
              title="Auto Resume"
              description="Pick up exactly where you left off on any device"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8 bg-gradient-primary rounded-3xl p-12 text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg opacity-90">
              Join thousands of students using StudyTube to ace their competitive exams
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg h-14 px-8"
              onClick={() => navigate("/auth")}
            >
              Start Learning Today
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
  <div className="bg-card p-6 rounded-xl border hover:shadow-md transition-shadow">
    <div className="p-3 bg-primary/10 text-primary rounded-lg w-fit mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
