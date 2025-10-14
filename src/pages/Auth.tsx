import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Loader2, Sparkles, BookOpen, Award, TrendingUp, Users, Check } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Signup state
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    fullName: "",
    examType: "",
    targetYear: new Date().getFullYear() + 1,
  });

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.fullName || !signupData.examType) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
            exam_type: signupData.examType,
            target_year: signupData.targetYear,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created successfully! 🎉");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Welcome back! 🚀");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
        {/* Animated gradient orbs */}
        <div 
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
          style={{
            transform: `translate(${mousePosition.x / 10}px, ${mousePosition.y / 10}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div 
          className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
          style={{
            transform: `translate(-${mousePosition.x / 15}px, ${mousePosition.y / 15}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div 
          className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"
          style={{
            transform: `translate(-50%, ${mousePosition.y / 20}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between text-white">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                StudyTube
              </h1>
            </div>
            <p className="text-indigo-200 text-lg">Transform YouTube into your personal learning platform</p>
          </div>

          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold leading-tight">
                Master JEE with
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-pink-300">
                  Smart Learning
                </span>
              </h2>
              <p className="text-xl text-indigo-200">
                Track progress, take notes, and ace your exams with AI-powered insights
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                { icon: BookOpen, text: "Organize YouTube playlists effortlessly" },
                { icon: TrendingUp, text: "Track your learning progress in real-time" },
                { icon: Award, text: "AI-generated notes and summaries" },
                { icon: Users, text: "Join 10,000+ JEE aspirants" }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                  style={{
                    animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`
                  }}
                >
                  <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-indigo-300" />
                  </div>
                  <span className="text-lg">{feature.text}</span>
                  <Check className="ml-auto h-5 w-5 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              {[
                { value: "10K+", label: "Students" },
                { value: "50K+", label: "Videos Watched" },
                { value: "95%", label: "Success Rate" }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-1">
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-indigo-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-indigo-300">
            © 2025 StudyTube. Built for JEE aspirants, by JEE aspirants.
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">StudyTube</h1>
              </div>
              <p className="text-indigo-200">Your JEE preparation companion</p>
            </div>

            <Card className="shadow-2xl border-white/20 bg-white/95 backdrop-blur-xl animate-fadeIn">
              <CardHeader className="space-y-1 text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                    <div className="relative p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {activeTab === "signup" ? "Start Your Journey" : "Welcome Back"}
                </CardTitle>
                <CardDescription className="text-base">
                  {activeTab === "signup" 
                    ? "Join thousands of successful JEE aspirants" 
                    : "Continue your learning journey"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
                    <TabsTrigger 
                      value="signup" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      Sign Up
                    </TabsTrigger>
                    <TabsTrigger 
                      value="login"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      Login
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signup" className="space-y-4 animate-fadeIn">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="Rahul Sharma"
                          value={signupData.fullName}
                          onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                          disabled={isLoading}
                          className="h-11 transition-all focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="rahul@example.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          disabled={isLoading}
                          className="h-11 transition-all focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          disabled={isLoading}
                          className="h-11 transition-all focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="exam-type" className="text-sm font-medium">Exam</Label>
                          <Select
                            value={signupData.examType}
                            onValueChange={(value) => setSignupData({ ...signupData, examType: value })}
                            disabled={isLoading}
                          >
                            <SelectTrigger id="exam-type" className="h-11">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="JEE">JEE</SelectItem>
                              <SelectItem value="NEET">NEET</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="target-year" className="text-sm font-medium">Target Year</Label>
                          <Input
                            id="target-year"
                            type="number"
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 10}
                            value={signupData.targetYear}
                            onChange={(e) => setSignupData({ ...signupData, targetYear: parseInt(e.target.value) })}
                            disabled={isLoading}
                            className="h-11"
                            required
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Create Account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="login" className="space-y-4 animate-fadeIn">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          disabled={isLoading}
                          className="h-11 transition-all focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="px-0 text-xs text-indigo-600 hover:text-indigo-700"
                            onClick={() => toast.info("Password reset coming soon!")}
                          >
                            Forgot password?
                          </Button>
                        </div>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          disabled={isLoading}
                          className="h-11 transition-all focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]" 
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login to Dashboard"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Social Proof */}
                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-sm text-muted-foreground mb-3">Trusted by top JEE rankers</p>
                  <div className="flex justify-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-float {
          animation: float infinite ease-in-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .bg-grid-white\/\[0\.02\] {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
};

export default Auth;
