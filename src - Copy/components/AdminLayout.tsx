import { useState } from "react";
import { useLocation } from "wouter";
import {
  X, Menu, LayoutDashboard, ShoppingBag, Package, Tag, Users,
  Image, BookOpen, Gamepad2, Ticket, Calendar, MessageSquare,
  Star, Megaphone, LogOut, Coins, Gift
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// 🟢 GI-DUGANGAN NA SA SAKTONG MGA LABELS PARA SA BULAG NGA SUB-MENUS!
const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "├─ Piso Deals", href: "/admin/piso-deals", icon: Gift },     // 🔥 BAG-O
  { label: "└─ Rewards", href: "/admin/rewards-shop", icon: Coins },     // 🔥 BAG-O
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Banners", href: "/admin/banners", icon: Image },
  { label: "Bible", href: "/admin/bible", icon: BookOpen },
  { label: "Games", href: "/admin/games", icon: Gamepad2 },
  { label: "Redeem Codes", href: "/admin/codes", icon: Ticket },
  { label: "Daily Check-in", href: "/admin/checkin", icon: Calendar },
  { label: "Support Chat", href: "/admin/chat", icon: MessageSquare },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

function NavLinks({ onNav }: { onNav?: () => void }) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  return (
    <>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <button
              key={item.href}
              onClick={() => { setLocation(item.href); onNav?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border-none h-auto cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => { logout(); onNav?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition text-left border-none h-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [location] = useLocation();
  const currentPage = NAV_ITEMS.find(n => n.href === location)?.label || "Admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition border-none h-auto cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px]">P</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">PiliKart</span>
        </div>
        <span className="text-xs text-gray-500 font-medium shrink-0 truncate max-w-[100px]">{currentPage}</span>
      </header>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm">PiliKart Admin</div>
                <div className="text-[10px] text-gray-400">Management Portal</div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0 border-none h-auto cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <NavLinks onNav={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="md:flex md:h-screen md:overflow-hidden">
        <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0 overflow-y-auto">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">PiliKart Admin</div>
              <div className="text-[10px] text-gray-400">Management Portal</div>
            </div>
          </div>
          <NavLinks />
        </aside>

        <main className="flex-1 md:overflow-y-auto p-4 md:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
