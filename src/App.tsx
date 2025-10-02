import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Landing from "./pages/Landing";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import ActivityHistory from "./pages/ActivityHistory";
import Stages from "./pages/Stages";
import Raids from "./pages/Raids";
import Store from "./pages/Store";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/onboard" element={<Onboard />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/map" element={<Layout><MapPage /></Layout>} />
          <Route path="/activity-history" element={<Layout><ActivityHistory /></Layout>} />
          <Route path="/stages" element={<Layout><Stages /></Layout>} />
          <Route path="/raids" element={<Layout><Raids /></Layout>} />
          <Route path="/store" element={<Layout><Store /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
