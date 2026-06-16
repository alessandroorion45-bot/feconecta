import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoadingFallback from "@/components/LoadingFallback";

// Eager: critical path pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: all other pages
const Bible = lazy(() => import("./pages/Bible"));
const Testimonies = lazy(() => import("./pages/Testimonies"));
const TestimonyDetail = lazy(() => import("./pages/TestimonyDetail"));
const Prayers = lazy(() => import("./pages/Prayers"));
const Events = lazy(() => import("./pages/Events"));
const Profile = lazy(() => import("./pages/Profile"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Feed = lazy(() => import("./pages/Feed"));
const Friends = lazy(() => import("./pages/Friends"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const FriendDetails = lazy(() => import("./pages/FriendDetails"));
const Videos = lazy(() => import("./pages/Videos"));
const Chat = lazy(() => import("./pages/Chat"));
const SharedReading = lazy(() => import("./pages/SharedReading"));
const ChurchCommunity = lazy(() => import("./pages/ChurchCommunity"));
const WordSearch = lazy(() => import("./pages/WordSearch"));
const Devotional = lazy(() => import("./pages/Devotional"));
const BibleDictionary = lazy(() => import("./pages/BibleDictionary"));
const BibleQuestions = lazy(() => import("./pages/BibleQuestions"));
const Worship = lazy(() => import("./pages/Worship"));
const BibleStudies = lazy(() => import("./pages/BibleStudies"));
const GratitudeWall = lazy(() => import("./pages/GratitudeWall"));
const SpiritualMentoring = lazy(() => import("./pages/SpiritualMentoring"));
const FavoritesHub = lazy(() => import("./pages/FavoritesHub"));
const NearbyChurches = lazy(() => import("./pages/NearbyChurches"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure QueryClient with optimized settings for high traffic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NetworkStatusIndicator />
              <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/bible" element={<Bible />} />
                    <Route path="/testimonies" element={<Testimonies />} />
                    <Route path="/testemunho/:id" element={<TestimonyDetail />} />
                    <Route path="/prayers" element={<ProtectedRoute><Prayers /></ProtectedRoute>} />
                    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/:userId" element={<UserProfile />} />
                    <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
                    <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                    <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/shared-reading" element={<ProtectedRoute><SharedReading /></ProtectedRoute>} />
                    <Route path="/church-community" element={<ProtectedRoute><ChurchCommunity /></ProtectedRoute>} />
                    <Route path="/palavra-viva" element={<WordSearch />} />
                    <Route path="/devotional" element={<Devotional />} />
                    <Route path="/dictionary" element={<BibleDictionary />} />
                    <Route path="/questions" element={<ProtectedRoute><BibleQuestions /></ProtectedRoute>} />
                    <Route path="/worship" element={<ProtectedRoute><Worship /></ProtectedRoute>} />
                    <Route path="/studies" element={<BibleStudies />} />
                    <Route path="/gratitude" element={<ProtectedRoute><GratitudeWall /></ProtectedRoute>} />
                    <Route path="/mentoring" element={<ProtectedRoute><SpiritualMentoring /></ProtectedRoute>} />
                    <Route path="/favorites" element={<ProtectedRoute><FavoritesHub /></ProtectedRoute>} />
                    <Route path="/nearby-churches" element={<ProtectedRoute><NearbyChurches /></ProtectedRoute>} />
                    <Route path="/user/:userId" element={<UserProfile />} />
                    <Route path="/friend/:friendId" element={<FriendDetails />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
