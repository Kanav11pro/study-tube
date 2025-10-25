import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Player from "./pages/Player";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import StudyTips from "@/pages/StudyTips";
import Admin from "@/pages/Admin";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/player/:playlistId" element={<Player />} />
          <Route path="/analytics/:playlistId" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/tips" element={<StudyTips />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
