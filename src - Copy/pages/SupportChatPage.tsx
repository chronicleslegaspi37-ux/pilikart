import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

type Message = Database["public"]["Tables"]["support_messages"]["Row"];

export default function SupportChatPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
        
      if (data) setMessages(data);
    };

    fetchMessages();

    const subscription = supabase
      .channel(`chat:${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, setLocation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const text = newMessage;
    setNewMessage("");

    // Optimistic update
    const optMsg: any = {
      id: "temp-" + Date.now(),
      user_id: user.id,
      message: text,
      is_admin: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optMsg]);

    await supabase.from("support_messages").insert([{
      user_id: user.id,
      message: text,
      is_admin: false
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[430px] mx-auto">
      <header className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => setLocation("/profile")} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <img src="/logo.jpg" alt="Admin" className="w-8 h-8 rounded-full" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm">PiliKart Support</h1>
            <p className="text-xs text-primary font-medium">We usually reply instantly</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
        <div className="space-y-4">
          <div className="text-center text-xs text-gray-400 my-4">Conversation Started</div>
          
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 max-w-[80%] text-sm">
              Hello {user?.full_name}! 👋 Welcome to PiliKart Support. How can we help you today?
            </div>
          </div>

          {messages.map((msg) => {
            const isMe = !msg.is_admin;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] text-sm ${
                  isMe 
                    ? "bg-primary text-white rounded-tr-sm" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                }`}>
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 p-4 safe-bottom">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full bg-gray-50 border-gray-200 h-12 px-4"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-300 shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
