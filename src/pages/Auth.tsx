import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Loader2, TrendingUp, Award, BookOpen, Users } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

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

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.fullName || !signupData.examType) {
      toast.error("Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(signupData.password);
    if (passwordError) {
      toast.error(passwordError);
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
        toast.success("Account created successfully!");
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
        toast.success("Welcome back!");
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
    <div className="min-h-screen bg-[#0A1929] flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">StudyTube</h1>
              <p className="text-sm text-blue-200">JEE Preparation Platform</p>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Your Complete<br />
                <span className="text-blue-400">JEE Study Solution</span>
              </h2>
              <p className="text-lg text-gray-300">
                Organize, track, and master your exam preparation with powerful analytics and AI-powered insights.
              </p>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              {[
                { icon: BookOpen, title: "Smart Playlists", desc: "Organize YouTube videos" },
                { icon: TrendingUp, title: "Track Progress", desc: "Real-time analytics" },
                { icon: Award, title: "AI Notes", desc: "Auto-generated summaries" },
                { icon: Users, title: "10,000+ Students", desc: "Join the community" }
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
                  <feature.icon className="h-6 w-6 text-blue-400 mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
          {[
            { value: "10K+", label: "Active Students" },
            { value: "50K+", label: "Videos Watched" },
            { value: "95%", label: "Success Rate" }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 bg-[#0A1929] rounded-xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A1929]">StudyTube</h1>
            <p className="text-sm text-gray-600">JEE Preparation Platform</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0A1929] mb-2">
              {activeTab === "signup" ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-600">
              {activeTab === "signup" 
                ? "Start your journey to JEE success" 
                : "Continue your preparation"}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="signup" 
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
              >
                Sign Up
              </TabsTrigger>
              <TabsTrigger 
                value="login"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
              >
                Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    placeholder="Enter your full name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam-type" className="text-sm font-semibold text-gray-700">
                      Exam Type
                    </Label>
                    <Select
                      value={signupData.examType}
                      onValueChange={(value) => setSignupData({ ...signupData, examType: value })}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="exam-type" className="h-12 bg-gray-50 border-gray-200">
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
                    <Label htmlFor="target-year" className="text-sm font-semibold text-gray-700">
                      Target Year
                    </Label>
                    <Input
                      id="target-year"
                      type="number"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 10}
                      value={signupData.targetYear}
                      onChange={(e) => setSignupData({ ...signupData, targetYear: parseInt(e.target.value) })}
                      disabled={isLoading}
                      className="h-12 bg-gray-50 border-gray-200"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
                      Password
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => toast.info("Password reset coming soon")}
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
                    className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Trusted by 10,000+ JEE aspirants across India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
