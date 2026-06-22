import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Gift, CalendarCheck, Coins, Gamepad2, Ticket, Play } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type RewardsProduct = Database["public"]["Tables"]["rewards_products"]["Row"];

export default function RewardsPage() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [code, setCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [products, setProducts] = useState<RewardsProduct[]>([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  
  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchData = async () => {
      // Products
      const { data: prods } = await supabase
        .from("rewards_products")
        .select("*")
        .eq("is_active", true);
      if (prods) setProducts(prods);

      // Checkin status
      const today = new Date().toISOString().split('T')[0];
      const { data: checkin } = await supabase
        .from("daily_checkin")
        .select("id")
        .eq("user_id", user.id)
        .eq("checkin_date", today)
        .maybeSingle();
        
      if (checkin) setHasCheckedIn(true);
    };

    fetchData();
  }, [user, setLocation]);

  const handleCheckin = async () => {
    if (!user || hasCheckedIn) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      // simplified for demo: just give 5 coins
      const coinsToGive = 5;

      await supabase.from("daily_checkin").insert([{
        user_id: user.id,
        checkin_date: today,
        day_number: 1,
        coins_earned: coinsToGive
      }]);

      await supabase.from("users").update({ coins: user.coins + coinsToGive }).eq("id", user.id);
      await supabase.from("coin_transactions").insert([{
        user_id: user.id,
        amount: coinsToGive,
        type: "checkin",
        description: "Daily check-in reward"
      }]);

      setHasCheckedIn(true);
      await refreshUser();
      toast({ title: "Checked In!", description: `You earned ${coinsToGive} coins!` });
    } catch (err) {
      toast({ title: "Error", description: "Could not check in", variant: "destructive" });
    }
  };

  const handleRedeem = async () => {
    if (!user || !code || code.length !== 4) return;
    
    setIsRedeeming(true);
    try {
      // Very simplified redeem logic
      const { data: codeData } = await supabase
        .from("redeem_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (!codeData) {
        toast({ title: "Invalid Code", description: "This code is invalid or expired.", variant: "destructive" });
        setIsRedeeming(false);
        return;
      }

      // Check if already redeemed
      const { data: alreadyRedeemed } = await supabase
        .from("redeemed_codes")
        .select("id")
        .eq("user_id", user.id)
        .eq("code_id", codeData.id)
        .maybeSingle();

      if (alreadyRedeemed) {
        toast({ title: "Already Redeemed", description: "You have already used this code.", variant: "destructive" });
        setIsRedeeming(false);
        return;
      }

      // Process redeem
      await supabase.from("redeemed_codes").insert([{ user_id: user.id, code_id: codeData.id }]);
      await supabase.from("users").update({ coins: user.coins + codeData.coins }).eq("id", user.id);
      
      await refreshUser();
      setCode("");
      toast({ title: "Redeemed!", description: `You got ${codeData.coins} coins!` });
      
    } catch (err) {
      toast({ title: "Error", description: "Redeem failed", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  const games = [
    { id: "bible_quiz", name: "Bible Quiz", color: "bg-blue-100 text-blue-600" },
    { id: "math_quiz", name: "Math Quiz", color: "bg-green-100 text-green-600" },
    { id: "guess_logo", name: "Guess Logo", color: "bg-orange-100 text-orange-600" },
    { id: "true_false", name: "True/False", color: "bg-purple-100 text-purple-600" },
    { id: "word_search", name: "Word Search", color: "bg-pink-100 text-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-[430px] mx-auto">
      {/* Header with Coin Balance */}
      <div className="bg-primary p-6 pt-10 rounded-b-[40px] text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-sm font-medium opacity-90 uppercase tracking-wider mb-1">My Coins</div>
          <div className="text-5xl font-black flex items-center gap-3">
            <Coins className="w-10 h-10 text-yellow-300" />
            {user?.coins || 0}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 -mt-6 relative z-20">
        {/* Daily Check-in */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Daily Check-in</h3>
              <p className="text-xs text-gray-500">Earn coins every day</p>
            </div>
          </div>
          <Button 
            onClick={handleCheckin} 
            disabled={hasCheckedIn}
            className={`rounded-full px-6 shadow-md ${hasCheckedIn ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white shadow-primary/20'}`}
          >
            {hasCheckedIn ? "Checked In" : "Check In"}
          </Button>
        </div>

        {/* Redeem Code */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Redeem Code
          </h3>
          <div className="flex gap-2">
            <Input 
              placeholder="Enter 4-digit code" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              className="uppercase tracking-widest text-center font-bold text-lg rounded-xl h-12 bg-gray-50 border-gray-200"
            />
            <Button 
              onClick={handleRedeem}
              disabled={isRedeeming || code.length !== 4}
              className="h-12 rounded-xl px-6 bg-gray-900 text-white"
            >
              Redeem
            </Button>
          </div>
        </div>

        {/* Mini Games */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 px-2 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> Earn More Coins
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {games.map(game => (
              <button 
                key={game.id}
                onClick={() => setLocation(`/game/${game.id}`)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 transition-transform active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${game.color}`}>
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <span className="font-bold text-sm text-gray-700">{game.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rewards Store */}
        <div className="pt-4">
          <h3 className="font-bold text-gray-800 mb-3 px-2 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" /> Rewards Store
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                  {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
                </div>
                <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-orange-500">
                    <Coins className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    {product.coins_price}
                  </div>
                  <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs border-primary text-primary">Claim</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
