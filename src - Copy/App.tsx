import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";

import SplashPage from "@/pages/SplashPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HomePage from "@/pages/HomePage";
import SearchPage from "@/pages/SearchPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import BiblePage from "@/pages/BiblePage";
import RewardsPage from "@/pages/RewardsPage";
import GamePage from "@/pages/GamePage";
import ProfilePage from "@/pages/ProfilePage";
import SupportChatPage from "@/pages/SupportChatPage";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminBible from "@/pages/admin/AdminBible";
import AdminGames from "@/pages/admin/AdminGames";
import AdminCodes from "@/pages/admin/AdminCodes";
import AdminCheckin from "@/pages/admin/AdminCheckin";
import AdminChat from "@/pages/admin/AdminChat";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminAnnouncements from "@/pages/admin/AdminAnnouncements";

// GI-FIX NA: GIKUHA ANG CURLY BRACKETS ARON MOSUGOT ANG VITE DEFAULT EXPORT
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/splash" component={SplashPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={HomePage} />

      <Route path="/search" component={SearchPage} />
      <Route path="/product/:id" component={ProductDetailPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/bible" component={BiblePage} />
      <Route path="/rewards" component={RewardsPage} />
      <Route path="/game/:type" component={GamePage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/support" component={SupportChatPage} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/products" component={AdminProducts} />

      {/* 🟢 GI-DUGANGAN NA: Bulag nga mga endpoint routes para sa Piso Deals ug Rewards menu handles */}
      <Route path="/admin/piso-deals" component={AdminProducts} />
      <Route path="/admin/rewards-shop" component={AdminProducts} />

      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/banners" component={AdminBanners} />
      <Route path="/admin/bible" component={AdminBible} />
      <Route path="/admin/games" component={AdminGames} />
      <Route path="/admin/codes" component={AdminCodes} />
      <Route path="/admin/checkin" component={AdminCheckin} />
      <Route path="/admin/chat" component={AdminChat} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <PWAInstallPrompt />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
