import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function AdminCheckin() {
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCheckinsToday: 0, totalCoinsGivenToday: 0 });
  const [day7BonusType, setDay7BonusType] = useState("coins");
  const [day7BonusValue, setDay7BonusValue] = useState("");

  const fetchCheckinDashboardData = async () => {
    const { data: checkinRewards } = await supabase.from("checkin_rewards").select("*").order("day_number");
    const { data: todayLogs } = await supabase.from("daily_checkin").select("*").gte("created_at", new Date().toISOString().split("T")[0]);
    const { data: topUsers } = await supabase.from("users").select("id, full_name, phone_number, coins, current_streak").order("coins", { ascending: false }).limit(8);

    if (checkinRewards) {
      setRewards(checkinRewards);
      const day7 = checkinRewards.find((r: any) => r.day_number === 7);
      if (day7) {
        setDay7BonusType(day7.bonus_type || "coins");
        setDay7BonusValue(day7.bonus_value || "");
      }
    }

    if (todayLogs) {
      const totalCoins = todayLogs.reduce((sum: number, log: any) => sum + (log.coins_earned || 0), 0);
      setStats({ totalCheckinsToday: todayLogs.length, totalCoinsGivenToday: totalCoins });
    }

    if (topUsers) {
      setActiveUsers(topUsers.map((u: any) => ({
        id: u.id,
        name: u.full_name || "User",
        phone: u.phone_number,
        streak: u.current_streak || 0,
      })));
    }
  };

  useEffect(() => { fetchCheckinDashboardData(); }, []);

  const handleRewardCoinsChange = (dayNumber: number, value: string) => {
    setRewards(prev => prev.map(r => r.day_number === dayNumber ? { ...r, coins: parseInt(value) || 0 } : r));
  };

  const handleSaveCheckinRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const r of rewards) {
        const updateData: any = { coins: r.coins };
        if (r.day_number === 7) {
          updateData.bonus_type = day7BonusType;
          updateData.bonus_value = day7BonusValue;
        }
        await supabase.from("checkin_rewards").update(updateData).eq("day_number", r.day_number);
      }
      alert("Check-in rewards saved!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500 col-span-1">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Check-ins Today</div>
          <div className="text-xl font-black text-gray-800 mt-0.5">{stats.totalCheckinsToday}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 col-span-1">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Coins Given Today</div>
          <div className="text-xl font-black text-blue-600 mt-0.5">🪙 {stats.totalCoinsGivenToday}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm col-span-2">
          <div className="text-[10px] text-purple-700 font-bold uppercase">Anti-Skip Rule</div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Missing a check-in within 24 hours resets the streak to Day 1 automatically.
          </p>
        </div>
      </div>

      {/* Main layout: 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 7-Day Config */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 font-bold text-gray-800 text-sm">
            ⚙️ Configure 7-Day Rewards
          </div>
          <form onSubmit={handleSaveCheckinRules} className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {rewards.slice(0, 6).map(r => (
                <div key={r.day_number} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="font-bold text-gray-700 text-sm">Day {r.day_number}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      className="w-16 p-1.5 border border-gray-200 rounded-lg text-center font-mono font-bold text-blue-600 bg-white text-sm focus:outline-none"
                      value={r.coins || 0}
                      onChange={e => handleRewardCoinsChange(r.day_number, e.target.value)}
                    />
                    <span className="text-xs text-gray-400">coins</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Day 7 Special */}
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl space-y-3">
              <div className="font-bold text-purple-900 text-sm">🎉 Day 7 Mega Milestone Bonus</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-purple-800 mb-1">Bonus Type</label>
                  <select
                    className="w-full p-2.5 border border-purple-200 bg-white rounded-xl text-xs focus:outline-none"
                    value={day7BonusType}
                    onChange={e => setDay7BonusType(e.target.value)}
                  >
                    <option value="coins">Bonus Coins 🪙</option>
                    <option value="code">Promo Code 🎟️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-800 mb-1">
                    {day7BonusType === "coins" ? "Bonus Coins Count" : "Promo Code String"}
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-purple-200 bg-white rounded-xl text-xs font-mono font-bold uppercase focus:outline-none"
                    placeholder={day7BonusType === "coins" ? "e.g. 50" : "e.g. STREAK7BONUS"}
                    value={day7BonusValue}
                    onChange={e => setDay7BonusValue(e.target.value)}
                  />
                </div>
              </div>
              {rewards.find(r => r.day_number === 7) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-700 font-bold">Base Day 7 Coins:</span>
                  <input
                    type="number"
                    className="w-20 p-1.5 border border-purple-200 rounded-lg text-center font-mono font-bold text-blue-600 bg-white text-sm focus:outline-none"
                    value={rewards.find(r => r.day_number === 7)?.coins || 0}
                    onChange={e => handleRewardCoinsChange(7, e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="px-6">
                {loading ? "Saving..." : "Apply Rewards Setup"}
              </Button>
            </div>
          </form>
        </div>

        {/* Top Users Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 font-bold text-gray-800 text-sm">
            ⭐ Top Streak Users
          </div>
          <div className="divide-y divide-gray-50">
            {activeUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No check-in data yet.</div>
            ) : activeUsers.map((user, idx) => (
              <div key={user.id} className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold text-gray-300 w-5">#{idx + 1}</span>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                    <div className="text-[10px] text-gray-400">{user.phone}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-2 py-1 rounded-full border border-orange-100 shrink-0">
                  🔥 {user.streak}d
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
