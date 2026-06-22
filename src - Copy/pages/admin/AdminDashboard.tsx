import { useState, useEffect } from "react";
import { Users, ShoppingBag, Package, Coins } from "lucide-react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase, Database } from "@/lib/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    products: 0,
    coins: 0,
    revenue: 0,
    pending: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch baseline counts for the main cards
        const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
        const { count: orderCount } = await supabase.from("orders").select("*", { count: "exact", head: true });
        const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true });

        // Fetch delivered orders to calculate total revenue
        const { data: revData } = await supabase.from("orders").select("total_amount").eq("status", "Delivered");
        const rev = revData?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

        // Fetch the 5 most recent orders for the dashboard table rows logs
        const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);

        setStats({
          users: userCount || 0,
          orders: orderCount || 0,
          products: productCount || 0,
          coins: 0,
          revenue: rev,
          pending: 0
        });

        if (orders) setRecentOrders(orders);
      } catch (err) {
        console.error("Dashboard database fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Total Orders", value: stats.orders, icon: ShoppingBag, color: "bg-purple-100 text-purple-600" },
    { label: "Total Products", value: stats.products, icon: Package, color: "bg-orange-100 text-orange-600" },
    { label: "Total Revenue", value: `₱${stats.revenue.toLocaleString()}`, icon: Coins, color: "bg-green-100 text-green-600" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-sm font-mono animate-pulse text-gray-400">
          Loading baseline store statistics...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* SUMMARY DASHBOARD LOG INDICATOR METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-500 truncate">{stat.label}</div>
                <div className="text-lg font-bold text-gray-900 mt-0.5 truncate font-mono">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECENT ORDERS MASTER DATA SET TABLE VIEW WRAPPER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-xs">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-800">Recent Orders Log</h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 font-mono text-[10px] uppercase tracking-wider border-b">
              <tr>
                <th className="p-4 font-medium">Order ID</th>
                <th className="p-4 font-medium">Customer Name</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Amount Invoice</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-4 font-medium font-mono text-purple-700">#{order.id.split('-')[0].toUpperCase()}</td>
                  <td className="p-4 font-sans font-bold">{order.full_name || "Anonymous Client"}</td>
                  <td className="p-4 max-w-[150px] truncate">{order.location || "Not Provided"}</td>
                  <td className="p-4 font-bold font-mono text-gray-900">₱{Number(order.total_amount || 0).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      order.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                      order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">No recent orders tracked inside storage.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
