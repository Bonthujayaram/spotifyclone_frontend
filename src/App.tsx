import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Trending from "./pages/Trending";
import Feed from "./pages/Feed";
import Upload from "./pages/Upload";
import NowPlaying from "./pages/NowPlaying";
import Library from "./pages/Library";
import Artist from "./pages/Artist";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Popular from "./pages/Popular";
import Recent from "./pages/Recent";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Playlist from "./pages/Playlist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
    <PlayerProvider>
      <TooltipProvider>
          <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/trending" element={<Trending />} />
                  <Route path="/popular" element={<Popular />} />
                  <Route path="/recent" element={<Recent />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/now-playing" element={<NowPlaying />} />
              <Route path="/library" element={<Library />} />
              <Route path="/playlist/:id" element={<Playlist />} />
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
                </Route>
            </Route>
          </Routes>
          <Toaster />
          <Sonner />
      </TooltipProvider>
    </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
