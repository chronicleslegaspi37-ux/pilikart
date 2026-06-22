import { useLocation } from "wouter";
import { Settings, ShoppingBag, MessageSquare, ExternalLink, LogOut, Coins, ChevronRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  // Base menu items para sa tanang users
  const menuItems = [
    { icon: ShoppingBag, label: "My Orders", href: "/orders", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: MessageSquare, label: "Support Chat", href: "/support", color: "text-primary", bg: "bg-primary/10" },
    { icon: ExternalLink, label: "Facebook Page", href: "https://www.facebook.com/PiliKart2026", color: "text-blue-600", bg: "bg-blue-50", external: true },
    { icon: Settings, label: "Settings", href: "#", color: "text-gray-500", bg: "bg-gray-100" },
  ];

  // 🟢 GI-DUGANGAN: Isalbot ang Admin Dashboard button kung ikaw ang admin
  const isAdminUser = user.is_admin || user.phone_number === "09618768471";
  if (isAdminUser) {
    // Ibutang sa pinakaunahan sa listahan para dali makita
    menuItems.unshift({
      icon: ShieldCheck,
      label: "Admin Dashboard",
      href: "/admin",
      color: "text-red-600",
      bg: "bg-red-50"
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-[430px] mx-auto">
      {/* Profile Header */}
      <div className="bg-primary p-6 pt-12 pb-24 text-white relative rounded-b-[40px] shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 p-1">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {user.full_name ? user.full_name.charAt(0) : "U"}
                </span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.full_name || "Admin"}</h1>
            <p className="text-primary-foreground/80">{user.phone_number}</p>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex items-center justify-around">
          <div className="text-center cursor-pointer" onClick={() => setLocation("/rewards")}>
            <div className="w-12 h-12 mx-auto bg-orange-50 rounded-full flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">{user.coins || 0}</div>
            <div className="text-xs text-gray-500 font-medium">Pili Coins</div>
          </div>

          <div className="w-px h-16 bg-gray-100"></div>

          <div className="text-center cursor-pointer" onClick={() => setLocation("/orders")}>
            <div className="w-12 h-12 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-2">
              <ShoppingBag className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500 font-medium">My Orders</div>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="p-4 mt-4 space-y-3">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              onClick={() => {
                if (item.external) window.open(item.href, "_blank");
                else if (item.href !== "#") setLocation(item.href);
              }}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="flex-1 font-medium text-gray-800">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </div>
          );
        })}

        <button 
          onClick={logout}
          className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-red-100 mt-6 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <span className="flex-1 text-left font-medium text-red-600">Log Out</span>
        </button>
      </div>

      <div className="text-center mt-8 pb-4">
        <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg mx-auto mb-2 grayscale opacity-50" />
        <p className="text-xs text-gray-400">PiliKart App v1.0.0</p>
      </div>

      <BottomNav />
    </div>
  );
}
