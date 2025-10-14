import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search, BookOpen, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const funnyMessages = [
    "This page is like that one JEE question you skipped... it doesn't exist! 😅",
    "Error 404: Page not found (just like the right formula during your exam)",
    "This page went missing faster than your revision notes before exam! 📚",
    "Looks like you're lost... like finding integration limits at 2 AM 🌙",
    "Page not found! Must have gotten distracted by YouTube recommendations again 📺"
  ];

  const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center space-y-8">
          {/* Error Code - Styled like a math equation */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-lg animate-pulse">
              <span className="text-6xl font-bold text-white">404</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6 border border-gray-100">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-gray-900">
                  Oops! Page Not Found
                </h1>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-lg text-gray-700 font-medium">{randomMessage}</p>
                </div>
              </div>

              {/* Physics Joke */}
              <div className="bg-blue-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Physics Concept:</span>
                </div>
                <p className="text-gray-700">
                  <span className="font-mono bg-white px-2 py-1 rounded border">Error 404</span> means:
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  4 → Vectors you didn't study<br />
                  0 → Your marks if you keep browsing random pages<br />
                  4 → Hours you wasted today (so far) 😬
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4">
                <p className="text-gray-600 font-medium">
                  Don't worry! Even toppers take wrong turns. Here's how to get back on track:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => navigate("/")}
                    className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    <Home className="h-5 w-5 mr-2" />
                    Go Home
                  </Button>
                  
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="h-14 border-2 font-semibold"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Dashboard
                  </Button>
                  
                  <Button
                    onClick={() => navigate("/auth")}
                    variant="outline"
                    className="h-14 border-2 font-semibold"
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Start Fresh
                  </Button>
                </div>
              </div>

              {/* Motivational Quote */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  "Getting lost is okay. Even Newton took years to figure out gravity. 
                  You've got this! 💪"
                </p>
              </div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="bg-white rounded-xl shadow-md p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-3 text-center">
              🎯 Did You Know?
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ 404 errors happen 100 million times per day on the internet</li>
              <li>✓ You're still smarter than 95% of people just for preparing for JEE</li>
              <li>✓ This is your sign to get back to studying! 📚</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
