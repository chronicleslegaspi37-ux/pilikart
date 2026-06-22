import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BottomNav } from "@/components/BottomNav";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buyAgainLoading, setBuyAgainLoading] = useState<string | null>(null);

  const tabs = [
    { id: "Pending", label: "Pending", icon: Clock },
    { id: "Packed", label: "Packed", icon: Package },
    { id: "Shipped", label: "Shipped", icon: Truck },
    { id: "Delivered", label: "Delivered", icon: CheckCircle2 },
    { id: "Cancelled", label: "Cancelled", icon: XCircle }
  ];

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && !error) setOrders(data);
      setIsLoading(false);
    };

    fetchOrders();

    const subscription = supabase
      .channel(`orders:${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`
      }, () => fetchOrders())
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [user, setLocation]);

  const filteredOrders = orders.filter(order => order.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-orange-600 bg-orange-100";
      case "Packed": return "text-blue-600 bg-blue-100";
      case "Shipped": return "text-indigo-600 bg-indigo-100";
      case "Delivered": return "text-green-600 bg-green-100";
      case "Cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const handleBuyAgain = async (order: Order) => {
    if (!user) return;
    setBuyAgainLoading(order.id);

    try {
      const items = order.items as any[];
      let addedCount = 0;

      for (const item of items) {
        let productId: string | null = item.product_id || null;

        if (!productId && item.name) {
          const { data: found } = await supabase
            .from("products")
            .select("id")
            .ilike("name", item.name)
            .limit(1)
            .maybeSingle();
          productId = found?.id || null;
        }

        if (!productId) continue;

        const { data: existing } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("cart_items")
            .update({ quantity: existing.quantity + (item.quantity || 1) })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("cart_items")
            .insert([{ user_id: user.id, product_id: productId, quantity: item.quantity || 1 }]);
        }
        addedCount++;
      }

      if (addedCount === 0) {
        toast({ title: "Products unavailable", description: "Some products may no longer be available.", variant: "destructive" });
      } else {
        toast({ title: "Added to cart!", description: `${addedCount} item${addedCount > 1 ? "s" : ""} added to your cart.` });
        setLocation("/cart");
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not add items to cart.", variant: "destructive" });
    } finally {
      setBuyAgainLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-[430px] mx-auto flex flex-col">
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setLocation("/")} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg flex-1">My Orders</h1>
        <span className="text-xs text-gray-400">{orders.length} total</span>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-[61px] z-30">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = orders.filter(o => o.status === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 whitespace-nowrap text-sm font-medium border-b-2 transition-colors relative ${
                  isActive ? "border-primary text-primary" : "border-transparent text-gray-500"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                    isActive ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-800">No {activeTab} Orders</h3>
            <p className="text-sm text-gray-500 mt-1">You have no orders in this status.</p>
            {activeTab !== "Pending" && (
              <button
                onClick={() => setLocation("/")}
                className="mt-4 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl"
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-3 border-b border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-mono">#{order.id.split('-')[0].toUpperCase()}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  {(order.items as any[]).map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                        <div className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</div>
                        <div className="font-bold text-primary mt-0.5">₱{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {order.tracking_message && (
                  <div className="px-3 pb-2">
                    <div className="bg-blue-50 text-blue-700 text-xs p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
                      <Truck className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{order.tracking_message}</p>
                    </div>
                  </div>
                )}

                {order.cancellation_reason && (
                  <div className="px-3 pb-2">
                    <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl border border-red-100 flex items-start gap-2">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>Reason: {order.cancellation_reason}</p>
                    </div>
                  </div>
                )}

                {order.proof_of_delivery && (
                  <div className="px-3 pb-3">
                    <div className="text-xs font-medium text-gray-600 mb-2">Proof of Delivery</div>
                    <img
                      src={order.proof_of_delivery}
                      alt="Proof"
                      className="w-full h-32 object-cover rounded-xl border border-gray-200"
                    />
                  </div>
                )}

                <div className="p-3 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center gap-3">
                  <div className="text-sm">
                    Total: <span className="font-bold text-primary text-base">₱{order.total_amount}</span>
                  </div>

                  {order.status === "Delivered" && (
                    <button
                      onClick={() => handleBuyAgain(order)}
                      disabled={buyAgainLoading === order.id}
                      className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {buyAgainLoading === order.id ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          Buy Again
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
