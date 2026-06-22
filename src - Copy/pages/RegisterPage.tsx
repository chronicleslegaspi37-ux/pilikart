import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Phone, User as UserIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !fullName) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Check if phone exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone_number", phone)
        .maybeSingle();

      if (existingUser) {
        toast({ title: "Already registered", description: "This phone number is already registered. Please login.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert([{ 
          full_name: fullName, 
          phone_number: phone,
          coins: 0,
          is_admin: false,
          is_active: true
        }])
        .select()
        .single();

      if (error || !data) {
        throw error;
      }

      toast({ title: "Success!", description: "Account created successfully" });
      login(data);
      setLocation("/");
      
    } catch (err) {
      console.error(err);
      toast({ title: "Registration failed", description: "Something went wrong", variant: "destructive" });
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
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8 text-sm">Join your local community shop</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative text-left">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1 block pl-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="text"
                  placeholder="Juan Dela Cruz"
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white text-lg transition-colors rounded-xl"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

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
              {isLoading ? "Creating account..." : "Register"}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>

          <div className="mt-8 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Login here
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
