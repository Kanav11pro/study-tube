import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, BarChart3, Shield, Zap, Target, CheckCircle, TrendingUp, Users, Clock, Award, Play } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">StudyTube</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Bold & Clean */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Trusted by 10,000+ JEE & NEET Students
              </div>
              
              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                Turn YouTube Into Your
                <span className="block text-blue-600">Personal Study Platform</span>
              </h1>
              
              {/* Subheading */}
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Track progress, take AI-powered notes, and eliminate distractions. 
                <span className="text-gray-900 font-semibold"> Built for serious JEE/NEET aspirants.</span>
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg h-14 px-10 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate("/auth")}
                >
                  Start Learning Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg h-14 px-10 border-2 hover:bg-gray-50"
                  onClick={() => navigate("/auth")}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Setup in 2 minutes</span>
                </div>
              </div>
            </div>

            {/* Screenshot/Mockup Placeholder */}
            <div className="mt-16 relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-4 border border-gray-700">
                <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm">Product Demo</p>
                  </div>
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-6 -left-6 bg-white rounded-xl shadow-lg p-4 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">+45% Improvement</p>
                    <p className="text-xs text-gray-500">Average score increase</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">10,000+ Students</p>
                    <p className="text-xs text-gray-500">Active learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-gray-400">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-gray-400">Videos Watched</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9/5</div>
              <div className="text-gray-400">Student Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed specifically for competitive exam preparation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={Shield}
              title="Distraction-Free Watching"
              description="Pure focus mode - no recommendations, comments, or sidebar distractions"
              color="blue"
            />
            <FeatureCard
              icon={BarChart3}
              title="Advanced Progress Tracking"
              description="Monitor study hours, completion rates, and maintain daily streaks"
              color="green"
            />
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Smart Notes"
              description="Automatic video summaries, key points extraction, and concept highlights"
              color="purple"
            />
            <FeatureCard
              icon={BookOpen}
              title="Playlist Organization"
              description="Import and manage all your YouTube study playlists in one dashboard"
              color="orange"
            />
            <FeatureCard
              icon={Target}
              title="Exam-Focused Tools"
              description="Custom features for JEE, NEET, and other competitive exams"
              color="red"
            />
            <FeatureCard
              icon={Clock}
              title="Smart Resume & Sync"
              description="Seamlessly continue from where you left off on any device"
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              Transform your study routine in minutes
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-16">
            <StepCard
              number="1"
              title="Import Your Playlists"
              description="Paste any YouTube playlist URL and we'll import all videos instantly"
              align="left"
            />
            <StepCard
              number="2"
              title="Watch & Track Progress"
              description="Study in distraction-free mode while we automatically track your progress"
              align="right"
            />
            <StepCard
              number="3"
              title="Review AI Notes & Analytics"
              description="Get AI-generated summaries and detailed insights on your learning journey"
              align="left"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Loved by Students Everywhere
            </h2>
            <p className="text-xl text-gray-600">
              See how StudyTube helped students ace their exams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <TestimonialCard
              name="Rahul Sharma"
              exam="JEE Main 2025"
              rating={5}
              text="StudyTube helped me stay focused and organized. The AI notes feature saved me hours of manual note-taking!"
            />
            <TestimonialCard
              name="Priya Patel"
              exam="NEET 2025"
              rating={5}
              text="Best study tool ever! Progress tracking kept me motivated throughout my preparation journey."
            />
            <TestimonialCard
              name="Arjun Kumar"
              exam="JEE Advanced 2024"
              rating={5}
              text="Finally, a way to use YouTube productively. No more getting distracted by recommendations!"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Study Routine?
            </h2>
            <p className="text-xl text-blue-100">
              Join thousands of successful students. Start learning smarter today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg h-14 px-10 bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
            </div>
            <p className="text-sm text-blue-200">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">StudyTube</span>
            </div>
            <p className="text-sm">
              © 2025 StudyTube. Built for students, by students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color }: { 
  icon: any; 
  title: string; 
  description: string;
  color: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
      <div className={`w-14 h-14 ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-5`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const StepCard = ({ number, title, description, align }: {
  number: string;
  title: string;
  description: string;
  align: 'left' | 'right';
}) => (
  <div className={`flex items-center gap-8 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
    <div className="flex-shrink-0 w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg">
      {number}
    </div>
    <div className="flex-1 space-y-2">
      <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
      <p className="text-lg text-gray-600">{description}</p>
    </div>
  </div>
);

const TestimonialCard = ({ name, exam, rating, text }: {
  name: string;
  exam: string;
  rating: number;
  text: string;
}) => (
  <div className="bg-white p-8 rounded-2xl shadow-lg">
    <div className="flex gap-1 mb-4">
      {[...Array(rating)].map((_, i) => (
        <Award key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
      ))}
    </div>
    <p className="text-gray-700 mb-6 leading-relaxed">"{text}"</p>
    <div>
      <p className="font-bold text-gray-900">{name}</p>
      <p className="text-sm text-gray-500">{exam}</p>
    </div>
  </div>
);

export default Index;
