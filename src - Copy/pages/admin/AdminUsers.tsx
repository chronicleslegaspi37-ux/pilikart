import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase, Database } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";

type UserRow = Database["public"]["Tables"]["users"]["Row"] & {
  total_orders?: number;
  total_spent?: number;
  last_active?: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [coinAmount, setCoinAmount] = useState("");
  const [search, setSearch] = useState("");

  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCoins: 0,
  });

  const fetchUsers = async () => {
    const { data: dbUsers } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: dbOrders } = await supabase
      .from("orders")
      .select("user_id, total_amount, status");

    if (dbUsers) {
      let coinsSum = 0;
      const enriched = dbUsers.map((u: any) => {
        coinsSum += u.coins || 0;
        const userOrders = dbOrders ? dbOrders.filter(o => o.user_id === u.id) : [];
        const spent = userOrders.reduce(
          (sum, o) => o.status === "Delivered" ? sum + Number(o.total_amount || 0) : sum, 0
        );
        return {
          ...u,
          total_orders: userOrders.length,
          total_spent: spent,
          last_active: u.updated_at
            ? new Date(u.updated_at).toLocaleDateString()
            : "Just now",
        };
      });

      setUsers(enriched);
      setSummary({
        totalUsers: enriched.length,
        activeUsers: enriched.filter((u: any) => u.is_active !== false).length,
        totalCoins: coinsSum,
      });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user: UserRow) => {
    const target = user.is_active === false ? true : false;
    const word = target ? "Unban" : "Ban";
    if (!confirm(`${word} ${user.full_name}?`)) return;
    await supabase.from("users").update({ is_active: target }).eq("id", user.id);
    fetchUsers();
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, is_active: target } : null);
  };

  const handleUpdateCoins = async (type: "earn" | "spend") => {
    if (!selectedUser || !coinAmount) return alert("Enter a valid amount.");
    const amt = parseInt(coinAmount);
    if (isNaN(amt) || amt <= 0) return alert("Invalid amount.");
    setLoading(true);
    try {
      const current = selectedUser.coins || 0;
      const final = type === "earn" ? current + amt : Math.max(0, current - amt);
      await supabase.from("users").update({ coins: final }).eq("id", selectedUser.id);
      await supabase.from("coin_transactions").insert([{
        user_id: selectedUser.id,
        amount: type === "earn" ? amt : -amt,
        type,
        description: type === "earn" ? "Admin Credit" : "Admin Debit",
      }]);
      setCoinAmount("");
      fetchUsers();
      setSelectedUser(prev => prev ? { ...prev, coins: final } : null);
      alert("Coins updated successfully.");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search.trim()
    ? users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone_number?.includes(search)
      )
    : users;

  return (
    <AdminLayout>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total Users", value: summary.totalUsers, color: "text-gray-900" },
          { label: "Active", value: summary.activeUsers, color: "text-green-600" },
          { label: "Total Coins", value: `🪙 ${summary.totalCoins.toLocaleString()}`, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold uppercase">{s.label}</div>
            <div className={`text-base font-black mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* User Cards */}
      <div className="space-y-3">
        {filtered.map((user, idx) => (
          <div
            key={user.id}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${
              user.is_active === false ? "opacity-60 border-red-200 bg-red-50/20" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  : user.full_name?.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5 flex-wrap">
                  {user.full_name}
                  {user.is_admin && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                  {user.is_active === false && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">BANNED</span>}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{user.phone_number}</div>
              </div>
              <span className="text-xs text-gray-300 font-mono shrink-0">#{idx + 1}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-3 text-xs mb-3">
              <div>
                <span className="text-gray-400">Coins</span>
                <div className="font-bold text-blue-600 mt-0.5">🪙 {user.coins || 0}</div>
              </div>
              <div>
                <span className="text-gray-400">Orders</span>
                <div className="font-bold text-gray-800 mt-0.5">{user.total_orders || 0}</div>
              </div>
              <div>
                <span className="text-gray-400">Total Spent</span>
                <div className="font-bold text-green-600 mt-0.5">₱{(user.total_spent || 0).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-400">Last Seen</span>
                <div className="font-bold text-gray-500 mt-0.5 text-[11px]">{user.last_active}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
              >
                {selectedUser?.id === user.id ? "Close Panel" : "Manage"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={`text-xs ${user.is_active === false ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}`}
                onClick={() => handleToggleStatus(user)}
              >
                {user.is_active === false ? "Unban" : "Ban"}
              </Button>
            </div>

            {/* Coin management panel */}
            {selectedUser?.id === user.id && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Adjust Coins Balance</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    value={coinAmount}
                    onChange={e => setCoinAmount(e.target.value)}
                  />
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    disabled={loading}
                    onClick={() => handleUpdateCoins("earn")}
                  >
                    +Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 text-xs"
                    disabled={loading}
                    onClick={() => handleUpdateCoins("spend")}
                  >
                    -Deduct
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
