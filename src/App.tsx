import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, RouteObject } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { LinkBlockProvider } from "@/components/anti-link/LinkBlockModal";
import LoadingFallback from "@/components/LoadingFallback";
import { DailyLoginTracker } from "@/components/gamification/DailyLoginTracker";
import { PremiumEffectsWrapper } from "@/components/effects/PremiumEffectsWrapper";

// Eager: critical path pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy: all other pages
const Bible = lazy(() => import("./pages/Bible"));
const Testimonies = lazy(() => import("./pages/Testimonies"));
const TestimonyDetail = lazy(() => import("./pages/TestimonyDetail"));
const Prayers = lazy(() => import("./pages/Prayers"));
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
const TestChatEngine = lazy(() => import("./pages/TestChatEngine"));
const SharedReading = lazy(() => import("./pages/SharedReading"));
const ChurchCommunity = lazy(() => import("./pages/ChurchCommunity"));
const WordSearch = lazy(() => import("./pages/WordSearch"));
const Devotional = lazy(() => import("./pages/Devotional"));
const BibleDictionary = lazy(() => import("./pages/BibleDictionary"));
const BibleQuestions = lazy(() => import("./pages/BibleQuestions"));
const BibleStudies = lazy(() => import("./pages/BibleStudies"));
const FavoritesHub = lazy(() => import("./pages/FavoritesHub"));
const ThemesGallery = lazy(() => import("./pages/ThemesGallery"));
const FavoriteVerses = lazy(() => import("./pages/FavoriteVerses"));
const Gamification = lazy(() => import("./pages/Gamification"));
const AboutProject = lazy(() => import("./pages/AboutProject"));
const KingdomStore = lazy(() => import("./pages/KingdomStore"));
const GiftsKingdom = lazy(() => import("./pages/GiftsKingdom"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

// Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/UsersEnhanced"));
const AdminThemes = lazy(() => import("./pages/admin/Themes"));
const AdminBadges = lazy(() => import("./pages/admin/Badges"));
const AdminStore = lazy(() => import("./pages/admin/Store"));
const AdminPhotos = lazy(() => import("./pages/admin/Photos"));
const AdminVideos = lazy(() => import("./pages/admin/Videos"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const AdminLogs = lazy(() => import("./pages/admin/Logs"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminAutomation = lazy(() => import("./pages/admin/Automation"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminLinkViolations = lazy(() => import("./pages/admin/LinkViolations"));
const AdminSystemHealth = lazy(() => import("./pages/admin/SystemHealth"));

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

const routes: RouteObject[] = [
  { path: "/", element: <Index /> },
  { path: "/auth", element: <Auth /> },
  { path: "/bible", element: <Bible /> },
  { path: "/testimonies", element: <Testimonies /> },
  { path: "/testemunho/:id", element: <TestimonyDetail /> },
  { path: "/prayers", element: <ProtectedRoute><Prayers /></ProtectedRoute> },
  { path: "/profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
  { path: "/profile/:userId", element: <UserProfile /> },
  { path: "/achievements", element: <ProtectedRoute><Achievements /></ProtectedRoute> },
  { path: "/ranking", element: <Ranking /> },
  { path: "/challenges", element: <ProtectedRoute><Challenges /></ProtectedRoute> },
  { path: "/quiz", element: <ProtectedRoute><Quiz /></ProtectedRoute> },
  { path: "/feed", element: <ProtectedRoute><Feed /></ProtectedRoute> },
  { path: "/friends", element: <ProtectedRoute><Friends /></ProtectedRoute> },
  { path: "/videos", element: <Videos /> },
  { path: "/chat", element: <ProtectedRoute><Chat /></ProtectedRoute> },
  { path: "/test-chat-engine", element: <ProtectedRoute><TestChatEngine /></ProtectedRoute> },
  { path: "/shared-reading", element: <ProtectedRoute><SharedReading /></ProtectedRoute> },
  { path: "/church-community", element: <ProtectedRoute><ChurchCommunity /></ProtectedRoute> },
  { path: "/palavra-viva", element: <WordSearch /> },
  { path: "/devotional", element: <Devotional /> },
  { path: "/dictionary", element: <BibleDictionary /> },
  { path: "/questions", element: <ProtectedRoute><BibleQuestions /></ProtectedRoute> },
  { path: "/studies", element: <BibleStudies /> },
  { path: "/favorites", element: <ProtectedRoute><FavoritesHub /></ProtectedRoute> },
  { path: "/themes", element: <ProtectedRoute><ThemesGallery /></ProtectedRoute> },
  { path: "/favorite-verses", element: <ProtectedRoute><FavoriteVerses /></ProtectedRoute> },
  { path: "/gamification", element: <Gamification /> },
  { path: "/sobre-o-projeto", element: <AboutProject /> },
  { path: "/privacidade", element: <PrivacyPolicy /> },
  { path: "/termos", element: <TermsOfService /> },
  { path: "/loja", element: <KingdomStore /> },
  { path: "/presentes", element: <ProtectedRoute><GiftsKingdom /></ProtectedRoute> },

  // Admin Routes — ProtectedRoute (401: não autenticado → /auth) +
  // AdminRoute (403: autenticado sem papel admin → tela de acesso negado,
  // timeout de inatividade e log de acesso ao painel)
  { path: "/admin", element: <ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute> },
  { path: "/admin/users", element: <ProtectedRoute><AdminRoute><AdminUsers /></AdminRoute></ProtectedRoute> },
  { path: "/admin/themes", element: <ProtectedRoute><AdminRoute><AdminThemes /></AdminRoute></ProtectedRoute> },
  { path: "/admin/badges", element: <ProtectedRoute><AdminRoute><AdminBadges /></AdminRoute></ProtectedRoute> },
  { path: "/admin/store", element: <ProtectedRoute><AdminRoute><AdminStore /></AdminRoute></ProtectedRoute> },
  { path: "/admin/photos", element: <ProtectedRoute><AdminRoute><AdminPhotos /></AdminRoute></ProtectedRoute> },
  { path: "/admin/videos", element: <ProtectedRoute><AdminRoute><AdminVideos /></AdminRoute></ProtectedRoute> },
  { path: "/admin/notifications", element: <ProtectedRoute><AdminRoute><AdminNotifications /></AdminRoute></ProtectedRoute> },
  { path: "/admin/logs", element: <ProtectedRoute><AdminRoute><AdminLogs /></AdminRoute></ProtectedRoute> },
  { path: "/admin/analytics", element: <ProtectedRoute><AdminRoute><AdminAnalytics /></AdminRoute></ProtectedRoute> },
  { path: "/admin/automation", element: <ProtectedRoute><AdminRoute><AdminAutomation /></AdminRoute></ProtectedRoute> },
  { path: "/admin/reports", element: <ProtectedRoute><AdminRoute><AdminReports /></AdminRoute></ProtectedRoute> },
  { path: "/admin/link-violations", element: <ProtectedRoute><AdminRoute><AdminLinkViolations /></AdminRoute></ProtectedRoute> },
  { path: "/admin/system", element: <ProtectedRoute><AdminRoute><AdminSystemHealth /></AdminRoute></ProtectedRoute> },

  { path: "/user/:userId", element: <UserProfile /> },
  { path: "/friend/:friendId", element: <FriendDetails /> },
  { path: "*", element: <NotFound /> },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PresenceProvider>
            <AdminProvider>
              <ThemeProvider>
                <PremiumEffectsWrapper>
                  <DailyLoginTracker />
                  <LanguageProvider>
                    <TooltipProvider>
                      <LinkBlockProvider>
                        <Toaster />
                        <Sonner />
                        <NetworkStatusIndicator />
                        <Suspense fallback={<LoadingFallback />}>
                          <RouterProvider router={router} fallbackElement={<LoadingFallback />} />
                        </Suspense>
                      </LinkBlockProvider>
                    </TooltipProvider>
                  </LanguageProvider>
                </PremiumEffectsWrapper>
              </ThemeProvider>
            </AdminProvider>
          </PresenceProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
