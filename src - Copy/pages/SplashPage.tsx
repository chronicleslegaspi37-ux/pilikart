import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function SplashPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center max-w-[430px] mx-auto relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 260, 
          damping: 20, 
          duration: 1 
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-32 h-32 bg-white rounded-3xl p-2 shadow-2xl mb-6"
        >
          <img src="/logo.jpg" alt="PiliKart Logo" className="w-full h-full object-cover rounded-2xl" />
        </motion.div>
        
        <h1 className="text-4xl font-extrabold text-white tracking-tight">PiliKart</h1>
        <p className="text-white/80 mt-2 font-medium">Your Community Shop</p>
      </motion.div>

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/20 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}
