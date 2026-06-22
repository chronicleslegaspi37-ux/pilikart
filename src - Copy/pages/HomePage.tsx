// ========================================================
// HOMEPAGE.TSX: PARTE 1 (IMPORTS UG RESPONSIVE BANNER CAROUSEL)
// ========================================================
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, ShoppingCart, ChevronRight, Zap, Package, Tag } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Banner = Database["public"]["Tables"]["banners"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const CATEGORIES_FALLBACK = [
  { id: "c1", name: "Groceries", icon: "🛒", image_url: null, sort_order: 1, created_at: "" },
  { id: "c2", name: "Snacks", icon: "🍪", image_url: null, sort_order: 2, created_at: "" },
  { id: "c3", name: "Drinks", icon: "🥤", image_url: null, sort_order: 3, created_at: "" },
  { id: "c4", name: "Personal Care", icon: "🧴", image_url: null, sort_order: 4, created_at: "" },
  { id: "c5", name: "Household", icon: "🏠", image_url: null, sort_order: 5, created_at: "" },
  { id: "c6", name: "Baby & Kids", icon: "👶", image_url: null, sort_order: 6, created_at: "" },
  { id: "c7", name: "Medicine", icon: "💊", image_url: null, sort_order: 7, created_at: "" },
  { id: "c8", name: "More", icon: "📦", image_url: null, sort_order: 8, created_at: "" },
];

const CATEGORY_ICONS: Record<string, string> = {
  groceries: "🛒", snacks: "🍪", drinks: "🥤", beverages: "🥤",
  "personal care": "🧴", household: "🏠", baby: "👶", medicine: "💊",
  clothing: "👕", electronics: "📱", default: "📦",
};

function getCatIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

function BannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const items = banners;

  useEffect(() => {
    if (items.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-primary to-primary/70 rounded-2xl p-6 text-center shadow-md mb-4 flex flex-col items-center justify-center min-h-[120px]">
        <p className="text-xl font-bold text-white">Welcome to PiliKart! 🛒</p>
        <p className="text-sm text-white/80 mt-1">Your Community Shop</p>
      </div>
    );
  }

  return (
    /* 🚀 SYSTEM UPGRADE: Gi-lock ang layout ngadto sa pure fluid auto-height settings para makita ang TIBUOK unod dirediretso sa phone! */
    <div className="relative w-full rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-100 bg-white">
      {/* 1. Main Display Box Component Container */}
      <div className="w-full h-full relative block">
        {items.map((b, i) => (
          <div 
            key={b.id} 
            className={`w-full transition-opacity duration-500 block ${
              i === current ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 z-0 pointer-events-none"
            }`}
          >
            {/* 🟢 FLUID AUTO-HEIGHT CORE: tibuok gitas-on ug gilapdon ang mupakita nga walay putol! */}
            <img 
              src={b.image_url} 
              alt="Live Promotional Banner Panel" 
              className="w-full h-auto max-w-full object-contain block select-none transform active:scale-[0.99] transition-transform" 
            />
          </div>
        ))}
      </div>

      {/* 2. Slide Navigation Indicators Matrix */}
      {items.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 z-20">
          {items.map((_, i) => (
            <button 
              key={i} 
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all border-none shadow-2xs cursor-pointer ${
                i === current ? "bg-primary w-4 shadow-sm" : "bg-gray-300/80 w-1.5"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
  const displayPrice = product.is_flash_sale && product.flash_sale_price ? product.flash_sale_price : product.price;
  const originalPrice = product.is_flash_sale && product.flash_sale_price ? product.price : null;
  const discountPct = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;
  const isOutOfStock = product.stock !== null && product.stock <= 0;

  return (
    <div onClick={onPress} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-95 transition-transform">
      <div className="relative w-full h-28 bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {discountPct > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            -{discountPct}%
          </span>
        )}
        {product.badge && (
          <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {product.badge}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug mb-1">{product.name}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-primary font-bold text-sm">₱{displayPrice}</span>
          {originalPrice && (
            <span className="text-gray-400 text-[10px] line-through">₱{originalPrice}</span>
          )}
        </div>
        {product.sold_count > 0 && (
          <p className="text-[10px] text-gray-400 mt-0.5">{product.sold_count} sold</p>
        )}
      </div>
    </div>
  );
}
// ========================================================
// HOMEPAGE.TSX: PARTE 2 (HOOK STATES UG DATABASES LOADERS)
// ========================================================
export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<any[]>(CATEGORIES_FALLBACK);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [pisoDeals, setPisoDeals] = useState<Product[]>([]);
  const [regularProducts, setRegularProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [flashTimer, setFlashTimer] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const [
        { data: bannersData },
        { data: catsData },
        { data: flashData },
        { data: pisoData },
        { data: regularData },
      ] = await Promise.all([
        supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("categories").select("*").order("sort_order"),

        /* 🟢 GI-FIX NA: Gi-bag-o ang filter gikan sa `.eq("is_active", true)` ngadto sa `.neq("is_active_status", false)` 
           aron mosakar dirediretso sa data row values nga gi-upload nimo sa Admin panel! */
        supabase.from("products").select("*").eq("product_type", "flash_sale").neq("is_active_status", false).order("created_at", { ascending: false }).limit(10),
        supabase.from("products").select("*").eq("product_type", "piso_deal").neq("is_active_status", false).order("created_at", { ascending: false }).limit(10),
        supabase.from("products").select("*").eq("product_type", "regular").neq("is_active_status", false).order("created_at", { ascending: false }).limit(20),
      ]);

      setBanners(bannersData || []);
      if (catsData && catsData.length > 0) setCategories(catsData);
      setFlashSaleProducts(flashData || []);
      setPisoDeals(pisoData || []);
      setRegularProducts(regularData || []);
      setIsLoading(false);
    };
    fetchAll();
  }, []);


  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`cart_${user.id}`);
      if (stored) {
        try {
          const cart = JSON.parse(stored);
          setCartCount(Array.isArray(cart) ? cart.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 0);
        } catch {}
      }
    }
  }, [user]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      setFlashTimer({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    updateTimer();
    const t = setInterval(updateTimer, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  // ========================================================
  // HOMEPAGE.TSX: PARTE 3 (STOREFRONT VISUAL CLIENT SYSTEM)
  // ========================================================
    return (
      <div className="min-h-screen bg-gray-50 pb-24 max-w-[430px] mx-auto">
        <header className="bg-white px-4 pt-4 pb-3 sticky top-0 z-40 border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-primary text-xl tracking-tight">PiliKart</span>
            </div>
            <button type="button" className="relative p-2 border-none bg-transparent cursor-pointer" onClick={() => setLocation(user ? "/cart" : "/login")}>
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
          <div className="bg-gray-100 rounded-full h-10 flex items-center px-4 cursor-pointer" onClick={() => setLocation("/search")}>
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <span className="text-gray-400 text-sm">Search products...</span>
          </div>
        </header>

        <div className="px-4 pt-4 space-y-5">
          <BannerSlider banners={banners} />

          <div>
            <h2 className="font-bold text-gray-900 text-base mb-3">Categories</h2>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map((cat: any) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setLocation(`/search?category=${encodeURIComponent(cat.name)}`)}
                  className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-transform border-none cursor-pointer"
                >
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl">{cat.icon || getCatIcon(cat.name)}</span>
                  )}
                  <span className="text-[10px] text-gray-600 font-medium text-center leading-tight line-clamp-2">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-900 text-base">Flash Sale</h2>
                <div className="flex items-center gap-0.5 ml-1 bg-gray-900 rounded px-1.5 py-0.5">
                  <span className="text-white text-[10px] font-mono font-bold">{pad(flashTimer.h)}:{pad(flashTimer.m)}:{pad(flashTimer.s)}</span>
                </div>
              </div>
              <button type="button" onClick={() => setLocation("/search?type=flash_sale")} className="text-primary text-xs font-semibold flex items-center border-none bg-transparent cursor-pointer">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {flashSaleProducts.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {flashSaleProducts.map((p) => (
                  <div key={p.id} className="w-36 shrink-0">
                    <ProductCard product={p} onPress={() => setLocation(`/product/${p.id}`)} />
                  </div>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <Zap className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No flash sale items yet</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                {[...Array(3)].map((_, i) => <div key={i} className="w-36 h-44 shrink-0 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-900 text-base">Piso Deals</h2>
              </div>
              <button type="button" onClick={() => setLocation("/search?type=piso_deal")} className="text-primary text-xs font-semibold flex items-center border-none bg-transparent cursor-pointer">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {pisoDeals.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {pisoDeals.map((p) => (
                  <div key={p.id} className="w-36 shrink-0">
                    <ProductCard product={p} onPress={() => setLocation(`/product/${p.id}`)} />
                  </div>
                ))}
              </div>
            ) : !isLoading ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <Tag className="w-8 h-8 text-red-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No piso deals yet</p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                {[...Array(3)].map((_, i) => <div key={i} className="w-36 h-44 shrink-0 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-bold text-gray-900 text-base">All Products</h2>
              </div>
              <button type="button" onClick={() => setLocation("/search")} className="text-primary text-xs font-semibold flex items-center border-none bg-transparent cursor-pointer">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-gray-100" />)}
              </div>
            ) : regularProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {regularProducts.map((p) => (
                  <ProductCard key={p.id} product={p} onPress={() => setLocation(`/product/${p.id}`)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No products yet</p>
                <p className="text-gray-400 text-xs mt-1">Run the Supabase SQL to add products</p>
              </div>
            )}
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }
