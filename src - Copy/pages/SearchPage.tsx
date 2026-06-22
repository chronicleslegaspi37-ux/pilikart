import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, ArrowLeft, Star, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase, Database } from "@/lib/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }
      setIsLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${query}%`)
        .eq("is_active", true)
        .limit(20);

      if (data && !error) {
        setResults(data);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 max-w-[430px] mx-auto">
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input 
            autoFocus
            type="search"
            placeholder="Search Pilikart..."
            className="pl-9 h-10 bg-gray-100 border-none rounded-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Searching...</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {results.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 block">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                  {product.badge && (
                    <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {product.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">{product.name}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-500">{product.rating} | {product.sold_count} sold</span>
                </div>
                <div className="font-bold text-primary">₱{product.price}</div>
              </Link>
            ))}
          </div>
        ) : query.trim() !== "" ? (
          <div className="text-center py-20 text-gray-500">
            No products found for "{query}"
          </div>
        ) : null}
      </div>
    </div>
  );
}
