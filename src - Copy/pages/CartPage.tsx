import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Trash2, Plus, Minus, MapPin, Store } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type CartItem = Database["public"]["Tables"]["cart_items"]["Row"] & {
  product: Database["public"]["Tables"]["products"]["Row"];
};

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationName, setLocationName] = useState("Piligayon");

  const deliveryFees: Record<string, number> = {
    "Piligayon": 5,
    "Balubal": 25,
    "Alae": 25
  };

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchCart = async () => {
      setIsLoading(true);
      // Simplify query for now - join with products
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id);
        
      if (data && !error) {
        setItems(data as unknown as CartItem[]);
      }
      setIsLoading(false);
    };

    fetchCart();
  }, [user, setLocation]);

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Optimistic update
    setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    
    await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", id);
  };

  const removeItem = async (id: string) => {
    // Optimistic update
    setItems(items.filter(item => item.id !== id));
    
    await supabase
      .from("cart_items")
      .delete()
      .eq("id", id);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = items.length > 0 ? deliveryFees[locationName] : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 max-w-[430px] mx-auto flex flex-col">
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg">My Cart ({items.length})</h1>
      </header>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading cart...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Store className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6 text-sm">Looks like you haven't added anything yet.</p>
            <Button onClick={() => setLocation("/")} className="rounded-xl px-8">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                  {item.product.images?.[0] && (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-medium text-sm text-gray-800 line-clamp-2 leading-tight mb-1">
                      {item.product.name}
                    </h3>
                    <div className="font-bold text-primary">₱{item.product.price}</div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-l-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-r-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Delivery Location
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(deliveryFees).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocationName(loc)}
                    className={`py-2 px-1 rounded-xl text-sm font-medium border text-center transition-all ${
                      locationName === loc 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom z-50 max-w-[430px] mx-auto shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₱{subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee ({locationName})</span>
              <span>₱{deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span className="text-primary">₱{total}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
            onClick={() => setLocation("/checkout")}
          >
            Checkout ({items.length})
          </Button>
        </div>
      )}
    </div>
  );
}
