import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Tag, Clock } from "lucide-react";

export default function AdminCodes() {
  const [codesList, setCodesList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [codeString, setCodeString] = useState("");
  const [coinsReward, setCoinsReward] = useState("");
  const [usageLimit, setUsageLimit] = useState("100");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const fetchCodesAndHistory = async () => {
    const { data: codes } = await supabase.from("redeem_codes").select("*").order("created_at", { ascending: false });
    const { data: history } = await supabase
      .from("redeemed_codes")
      .select("*, users(full_name, phone_number)")
      .order("created_at", { ascending: false });

    if (codes) setCodesList(codes);
    if (history) {
      setHistoryList(history.map((h: any) => ({
        id: h.id,
        name: h.users?.full_name || "Anonymous",
        phone: h.users?.phone_number || "",
        code: h.code,
        date: h.created_at ? new Date(h.created_at).toLocaleDateString() : "",
      })));
    }
  };

  useEffect(() => { fetchCodesAndHistory(); }, []);

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await supabase.from("redeem_codes").delete().eq("id", id);
    fetchCodesAndHistory();
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeString || !coinsReward) return alert("Code and coins required.");
    setLoading(true);
    try {
      await supabase.from("redeem_codes").insert([{
        code: codeString.toUpperCase(),
        coins: parseInt(coinsReward),
        usage_limit: parseInt(usageLimit),
        usage_count: 0,
        expires_at: expiresAt || null,
        is_active: isActive,
      }]);
      setIsModalOpen(false);
      setCodeString(""); setCoinsReward(""); setUsageLimit("100"); setExpiresAt(""); setIsActive(true);
      fetchCodesAndHistory();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vouchers & Promo Codes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{codesList.length} codes created</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Create Code
        </Button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">➕ Create Promo Code</h2>
            <form onSubmit={handleSaveCode} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Code (e.g. BLESS50)</label>
                <input
                  type="text"
                  required
                  placeholder="BLESS50"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:outline-none focus:border-primary"
                  value={codeString}
                  onChange={e => setCodeString(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Coins Reward 🪙</label>
                  <input type="number" required className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={coinsReward} onChange={e => setCoinsReward(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Usage Limit</label>
                  <input type="number" required className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">📅 Expiration Date (optional)</label>
                <input type="date" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="activeCode" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-primary" />
                <label htmlFor="activeCode" className="text-sm font-medium text-gray-700 cursor-pointer">Active / Available</label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Saving..." : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main content: codes list + history */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Codes List - takes 2 cols on desktop */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 font-bold text-gray-800 text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Active Promo Codes ({codesList.length})
          </div>
          <div className="divide-y divide-gray-50">
            {codesList.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No promo codes yet. Create one!</div>
            ) : codesList.map(c => {
              const remaining = Math.max(0, (c.usage_limit || 1) - (c.usage_count || 0));
              const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
              return (
                <div key={c.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-purple-700 font-mono bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                        {c.code}
                      </span>
                      {c.is_active && !isExpired
                        ? <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-100">✅ Live</span>
                        : <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-100">{isExpired ? "Expired" : "Disabled"}</span>
                      }
                    </div>
                    <div className="text-xs text-gray-600 mt-1.5">
                      <span className="font-bold text-blue-600">🪙 {c.coins} coins</span>
                      {" · "}Used {c.usage_count || 0} / {c.usage_limit} · {remaining} left
                    </div>
                    {c.expires_at && (
                      <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isExpired ? "text-red-500" : "text-gray-400"}`}>
                        <Clock className="w-3 h-3" />
                        Expires: {new Date(c.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteCode(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Redemption History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-96 md:max-h-none">
          <div className="p-4 border-b bg-gray-50/50 font-bold text-gray-800 text-sm flex items-center justify-between shrink-0">
            <span>🔔 Redemption Log</span>
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{historyList.length}</span>
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
            {historyList.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No redemptions yet.</div>
            ) : historyList.map(log => (
              <div key={log.id} className="p-3 text-xs leading-tight space-y-0.5">
                <div className="flex justify-between font-bold text-gray-900">
                  <span className="truncate max-w-[120px]">{log.name}</span>
                  <span className="text-purple-700 font-mono">{log.code}</span>
                </div>
                <div className="text-gray-400 flex justify-between text-[10px]">
                  <span>{log.phone}</span>
                  <span>{log.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
