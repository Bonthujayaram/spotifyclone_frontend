import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Spinner from "@/components/Spinner";

// Everything behind auth is route-split. The entry chunk that /login and
// /signup must download is then just React + router + the two forms -- it used
// to also carry Layout -> Sidebar -> SmartDiscoveryMap -> Leaflet (~400kB).
const Layout = lazy(() => import("./components/Layout"));
const Home = lazy(() => import("./pages/Home"));
const Search = lazy(() => import("./pages/Search"));
const Trending = lazy(() => import("./pages/Trending"));
const Popular = lazy(() => import("./pages/Popular"));
const Recent = lazy(() => import("./pages/Recent"));
const Feed = lazy(() => import("./pages/Feed"));
const NowPlaying = lazy(() => import("./pages/NowPlaying"));
const Library = lazy(() => import("./pages/Library"));
const Playlist = lazy(() => import("./pages/Playlist"));
const Artist = lazy(() => import("./pages/Artist"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIDJPage = lazy(() => import("./pages/AIDJPage"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));
const Upload = lazy(() => import("./pages/Upload"));
const Profile = lazy(() => import("./pages/Profile"));

// Shown while a route chunk downloads. Without it the screen goes blank for a
// beat right after login, which reads as the app hanging.
const RouteFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <Spinner size={32} className="text-primary" />
  </div>
);

const App = () => (
  <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <TooltipProvider>
            <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/now-playing" element={<NowPlaying />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/playlist/:id" element={<Playlist />} />
                  <Route path="/artist/:id" element={<Artist />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/ai-dj" element={<AIDJPage />} />
                  <Route path="/creator-studio" element={<CreatorStudio />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
            </Suspense>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
);

export default App;
