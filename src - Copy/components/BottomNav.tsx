import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, BookOpen, Gift, User } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/orders", label: "Orders", icon: ShoppingBag },
    { href: "/bible", label: "Bible", icon: BookOpen },
    { href: "/rewards", label: "Rewards", icon: Gift },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 safe-bottom z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] max-w-[430px] mx-auto">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center p-2 transition-colors duration-200 ${
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? "fill-primary/20" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
