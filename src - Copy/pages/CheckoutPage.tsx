import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, User, Phone, MapPin, FileText } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type CartItem = Database["public"]["Tables"]["cart_items"]["Row"] & {
  product: Database["public"]["Tables"]["products"]["Row"];
};

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || "",
    phone: user?.phone_number || "",
    address: "",
    location: "Piligayon",
    notes: ""
  });

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
      const { data, error } = await supabase
        .from("cart_items")
        .select(`*, product:products(*)`)
        .eq("user_id", user.id);
        
      if (data && !error && data.length > 0) {
        setItems(data as unknown as CartItem[]);
      } else {
        setLocation("/cart");
      }
      setIsLoading(false);
    };

    fetchCart();
  }, [user, setLocation]);

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = deliveryFees[formData.location] || 5;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!formData.fullName || !formData.phone || !formData.address) {
      toast({ title: "Incomplete", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create order
      const orderItems = items.map(i => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images?.[0] || ""
      }));

      const { data: order, error } = await supabase
        .from("orders")
        .insert([{
          user_id: user!.id,
          phone_number: formData.phone,
          full_name: formData.fullName,
          full_address: formData.address,
          location: formData.location,
          notes: formData.notes,
          items: orderItems,
          total_amount: total,
          delivery_fee: deliveryFee,
          status: "Pending",
          order_type: "regular"
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Clear cart
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user!.id);

      setIsSuccess(true);
      
    } catch (error) {
      toast({ title: "Checkout Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-primary/5 flex flex-col items-center justify-center p-6 max-w-[430px] mx-auto text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-6 text-primary">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-8">Your order has been successfully placed and is now pending confirmation.</p>
        <div className="space-y-3 w-full">
          <Button className="w-full h-12 rounded-xl text-lg font-bold" onClick={() => setLocation("/orders")}>
            View My Orders
          </Button>
          <Button variant="outline" className="w-full h-12 rounded-xl font-medium" onClick={() => setLocation("/")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 max-w-[430px] mx-auto">
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg">Checkout</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
              <Input 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone Number</label>
              <Input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="bg-gray-50 border-gray-200"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(deliveryFees).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setFormData({...formData, location: loc})}
                    className={`py-2 px-1 rounded-xl text-sm font-medium border text-center transition-all ${
                      formData.location === loc 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-gray-200 text-gray-600 bg-gray-50"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Address / Landmark</label>
              <Input 
                placeholder="House No., Street, Landmark"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="bg-gray-50 border-gray-200"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes for delivery (Optional)</label>
              <Input 
                placeholder="Near the chapel..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Order Summary
          </h2>
          
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600"><span className="text-primary font-medium">{item.quantity}x</span> {item.product.name}</span>
                <span className="font-medium text-gray-900">₱{item.product.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>₱{subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Delivery Fee</span>
              <span>₱{deliveryFee}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-2">
              <span>Total to Pay</span>
              <span className="text-primary">₱{total}</span>
            </div>
            <div className="text-xs text-center text-orange-500 bg-orange-50 p-2 rounded-lg mt-2">
              Cash on Delivery only
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom z-50 max-w-[430px] mx-auto">
        <Button 
          className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
          onClick={handleCheckout}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : `Place Order • ₱${total}`}
        </Button>
      </div>
    </div>
  );
}
