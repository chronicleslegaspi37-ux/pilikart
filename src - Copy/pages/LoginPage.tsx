import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phone)
        .single();

      if (error || !data) {
        // Backdoor para sa admin kung wala pa sa database
        if (phone === "09618768471") {
          login({ phone_number: "09618768471", is_admin: true });
          setLocation("/");
          return;
        }
        toast({ 
          title: "Not found", 
          description: "Phone number not registered. Please register first.", 
          variant: "destructive" 
        });
      } else {
        login(data);
        // 🟢 GI-FIX NA GYUD: Bisan admin sa database, ipadala ra gihapon sa Home Page (/)
        setLocation("/");
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[430px] mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-64 bg-primary rounded-b-[40px] -z-10 shadow-lg" />

      <div className="flex-1 flex flex-col justify-center px-6 pt-12 pb-8 z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center"
        >
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl p-2 mb-6 flex items-center justify-center border border-primary/20">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full rounded-xl object-cover" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-500 mb-8 text-sm">Sign in to continue your shopping</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative text-left">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block pl-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="tel"
                  placeholder="09123456789"
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white text-lg transition-colors rounded-xl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold rounded-xl mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>

          <div className="mt-8 text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Register here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
