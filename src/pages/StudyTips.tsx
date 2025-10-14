import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Brain, 
  Clock, 
  Target, 
  Zap, 
  Coffee, 
  BookOpen, 
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Timer,
  Bell,
  Sparkles,
  MessageSquare,
  Calendar,
  BarChart3,
  Flame
} from "lucide-react";

const StudyTips = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Study Tips & Strategies</h1>
            <p className="text-sm text-gray-600">Master the art of learning with video lectures</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-blue-400 to-indigo-600 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-none p-8 md:p-12 transform hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all duration-300">
          <div className="max-w-3xl">
            <div className="inline-block bg-yellow-300 border-2 border-black px-4 py-2 mb-4 transform -rotate-2">
              <span className="font-bold text-sm">🎯 PROVEN STRATEGIES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Learn Smarter,<br />Not Harder!
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              Evidence-based techniques specifically designed for JEE/NEET aspirants studying with video lectures
            </p>
            <div className="flex flex-wrap gap-3">
              <StatBadge icon={Brain} label="15+ Tips" color="bg-pink-400" />
              <StatBadge icon={Award} label="Proven Methods" color="bg-green-400" />
              <StatBadge icon={Zap} label="Quick Results" color="bg-yellow-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStat number="2x" label="Faster Learning" color="bg-red-400" />
          <QuickStat number="85%" label="Better Retention" color="bg-blue-400" />
          <QuickStat number="3hrs" label="Daily Study" color="bg-green-400" />
          <QuickStat number="95%" label="Success Rate" color="bg-yellow-300" />
        </div>
      </section>

      {/* Main Content - Study Tips */}
      <section className="container mx-auto px-4 py-12 space-y-8">
        <SectionHeader 
          icon={Brain} 
          title="The Ultimate Study System" 
          subtitle="Follow these battle-tested strategies"
        />

        {/* Before Watching */}
        <CategorySection
          title="Before You Hit Play"
          color="bg-purple-400"
          tips={[
            {
              icon: Target,
              title: "Set Clear Goals",
              description: "Before watching any video, write down 3 things you want to learn. This primes your brain for focused learning.",
              actionable: "Write: 'By the end of this video, I will understand...'",
              timeNeeded: "2 min",
              difficulty: "Easy"
            },
            {
              icon: BookOpen,
              title: "Prepare Your Notes",
              description: "Open a fresh page with the video title and today's date. Having a dedicated space makes note-taking automatic.",
              actionable: "Use the Cornell note-taking method for lectures",
              timeNeeded: "1 min",
              difficulty: "Easy"
            },
            {
              icon: Coffee,
              title: "Eliminate Distractions",
              description: "Close all other tabs, put phone on silent, and tell family you're studying. 25 minutes of focus beats 2 hours of distracted watching.",
              actionable: "Use Do Not Disturb mode + headphones",
              timeNeeded: "2 min",
              difficulty: "Medium"
            },
          ]}
        />

        {/* During Watching */}
        <CategorySection
          title="Active Watching Techniques"
          color="bg-blue-400"
          tips={[
            {
              icon: Zap,
              title: "The Pause-Predict Method",
              description: "Pause the video every 3-5 minutes and predict what comes next. This forces active thinking instead of passive watching.",
              actionable: "Set a timer for 5-minute intervals",
              timeNeeded: "Ongoing",
              difficulty: "Hard"
            },
            {
              icon: Clock,
              title: "Speed Control Strategy",
              description: "Easy concepts at 1.5x, difficult topics at 0.75x. Don't ego-watch everything at 2x - comprehension > speed.",
              actionable: "Adjust speed based on difficulty, not ego",
              timeNeeded: "Instant",
              difficulty: "Easy"
            },
            {
              icon: MessageSquare,
              title: "Feynman Technique",
              description: "Explain concepts aloud in simple words as if teaching a 10-year-old. If you can't explain it simply, you don't understand it.",
              actionable: "After each major concept, explain it out loud",
              timeNeeded: "2-3 min",
              difficulty: "Hard"
            },
            {
              icon: Lightbulb,
              title: "Question Everything",
              description: "Write 'Why?' at least 3 times during each video. The best students question assumptions, not just memorize facts.",
              actionable: "Write 3 'why' questions per video",
              timeNeeded: "5 min",
              difficulty: "Medium"
            },
          ]}
        />

        {/* After Watching */}
        <CategorySection
          title="After You Watch"
          color="bg-green-400"
          tips={[
            {
              icon: CheckCircle,
              title: "Immediate Recall",
              description: "Close your notes and write everything you remember within 5 minutes. This is when the magic happens - active recall is the king of learning.",
              actionable: "Blank page test - write for 5 minutes straight",
              timeNeeded: "5 min",
              difficulty: "Hard"
            },
            {
              icon: TrendingUp,
              title: "Practice Problems NOW",
              description: "Solve 5 related problems immediately. Don't wait for 'revision time' - strike while the iron is hot!",
              actionable: "Solve 5 problems within 15 minutes of watching",
              timeNeeded: "15 min",
              difficulty: "Medium"
            },
            {
              icon: Calendar,
              title: "Spaced Repetition",
              description: "Review after 1 day, 3 days, 7 days, and 21 days. This fights the forgetting curve scientifically.",
              actionable: "Mark calendar: Day 1, 3, 7, 21 for review",
              timeNeeded: "Planning",
              difficulty: "Easy"
            },
          ]}
        />

        {/* Time Management */}
        <CategorySection
          title="Time Management Secrets"
          color="bg-yellow-300"
          tips={[
            {
              icon: Timer,
              title: "Pomodoro for Videos",
              description: "25 min study → 5 min break → Repeat. During breaks, look away from screen and move your body.",
              actionable: "Use StudyTube's built-in break reminders",
              timeNeeded: "Session",
              difficulty: "Easy"
            },
            {
              icon: Flame,
              title: "Peak Performance Hours",
              description: "Study hardest subjects during your peak hours (usually morning). Save easier content for low-energy times.",
              actionable: "Track your energy levels for one week",
              timeNeeded: "1 week",
              difficulty: "Medium"
            },
            {
              icon: BarChart3,
              title: "The 80/20 Rule",
              description: "20% of video content gives you 80% of marks. Focus on high-yield topics first, then fill gaps.",
              actionable: "Identify your weak chapters and prioritize",
              timeNeeded: "1 hour",
              difficulty: "Medium"
            },
          ]}
        />

        {/* Common Mistakes */}
        <div className="bg-red-100 border-4 border-red-600 shadow-[6px_6px_0_0_rgba(220,38,38,1)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-600 border-2 border-black">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-red-900">AVOID THESE MISTAKES</h3>
              <p className="text-red-700">Common traps that kill productivity</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <MistakeCard
              mistake="Binge-watching 10 videos in one sitting"
              why="Your brain can't absorb that much. Quality > Quantity."
              instead="Watch 2-3 videos max per session, with full focus"
            />
            <MistakeCard
              mistake="Taking notes while watching first time"
              why="You miss important context while writing."
              instead="Watch once fully, then rewatch and make notes"
            />
            <MistakeCard
              mistake="Never revisiting completed videos"
              why="You forget 80% within 24 hours without review."
              instead="Review key videos before tests/exams"
            />
            <MistakeCard
              mistake="Watching at 2x speed for everything"
              why="You're fooling yourself. Comprehension drops dramatically."
              instead="Use 1.25x for review, normal speed for new topics"
            />
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-yellow-300 border-2 border-black">
              <Sparkles className="h-8 w-8 text-indigo-900" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">PRO TIPS FROM TOPPERS</h3>
              <p className="text-indigo-200">Advanced strategies that actually work</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <ProTip tip="Study the same topic from 2 different teachers - fills knowledge gaps" />
            <ProTip tip="Make a 'mistake notebook' - review wrong answers weekly" />
            <ProTip tip="Teach concepts to friends/family - best retention method" />
            <ProTip tip="Use AI notes for quick revision, not for first-time learning" />
            <ProTip tip="Track 'focused study hours' not just 'time studied'" />
            <ProTip tip="Sleep 7-8 hours - your brain consolidates memory during sleep" />
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-black text-white border-4 border-black shadow-[8px_8px_0_0_rgba(59,130,246,1)] p-8 md:p-12 text-center">
          <h3 className="text-3xl md:text-5xl font-black mb-4">Ready to Transform Your Study Routine?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Apply these strategies starting TODAY. Track your progress and watch your scores improve week by week.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-white text-lg px-8 py-6 shadow-[4px_4px_0_0_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Start Studying Smarter →
          </Button>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const StatBadge = ({ icon: Icon, label, color }: any) => (
  <div className={`${color} border-2 border-black px-4 py-2 flex items-center gap-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all`}>
    <Icon className="h-5 w-5" />
    <span className="font-bold text-sm">{label}</span>
  </div>
);

const QuickStat = ({ number, label, color }: any) => (
  <div className={`${color} border-4 border-black p-6 text-center shadow-[6px_6px_0_0_rgba(0,0,0,1)] transform hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all duration-300`}>
    <div className="text-4xl font-black text-gray-900 mb-1">{number}</div>
    <div className="text-sm font-bold text-gray-800">{label}</div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }: any) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="p-4 bg-black border-4 border-black">
      <Icon className="h-8 w-8 text-white" />
    </div>
    <div>
      <h2 className="text-3xl font-black text-gray-900">{title}</h2>
      <p className="text-gray-600 font-medium">{subtitle}</p>
    </div>
  </div>
);

const CategorySection = ({ title, color, tips }: any) => (
  <div className={`${color} border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 md:p-8`}>
    <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 border-b-4 border-black pb-3">{title}</h3>
    <div className="space-y-6">
      {tips.map((tip: any, index: number) => (
        <TipCard key={index} {...tip} index={index} />
      ))}
    </div>
  </div>
);

const TipCard = ({ icon: Icon, title, description, actionable, timeNeeded, difficulty, index }: any) => {
  const difficultyColors = {
    Easy: 'bg-green-300 border-green-600',
    Medium: 'bg-yellow-300 border-yellow-600',
    Hard: 'bg-red-300 border-red-600',
  };

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-900 border-2 border-black flex-shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-xl font-black text-gray-900">{title}</h4>
            <span className={`${difficultyColors[difficulty as keyof typeof difficultyColors]} text-xs font-bold px-2 py-1 border-2 border-black`}>
              {difficulty}
            </span>
          </div>
          <p className="text-gray-700 mb-3 leading-relaxed">{description}</p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-3">
            <p className="text-sm font-bold text-blue-900">✓ Action: {actionable}</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Clock className="h-4 w-4" />
            {timeNeeded}
          </div>
        </div>
      </div>
    </div>
  );
};

const MistakeCard = ({ mistake, why, instead }: any) => (
  <div className="bg-white border-3 border-red-600 p-4 shadow-[3px_3px_0_0_rgba(220,38,38,1)]">
    <div className="flex gap-3">
      <div className="text-3xl">❌</div>
      <div className="flex-1">
        <p className="font-black text-red-900 mb-2">{mistake}</p>
        <p className="text-sm text-red-700 mb-2">Why: {why}</p>
        <div className="bg-green-100 border-l-3 border-green-600 pl-3 py-2">
          <p className="text-sm font-bold text-green-900">✅ Instead: {instead}</p>
        </div>
      </div>
    </div>
  </div>
);

const ProTip = ({ tip }: any) => (
  <div className="bg-white/10 backdrop-blur-sm border-2 border-white p-4 transform hover:scale-105 transition-transform">
    <div className="flex gap-3 items-start">
      <div className="text-2xl">💡</div>
      <p className="text-white font-medium leading-relaxed">{tip}</p>
    </div>
  </div>
);

export default StudyTips;
