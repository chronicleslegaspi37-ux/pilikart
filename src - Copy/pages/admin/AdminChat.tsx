import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, MessageSquare, Package } from "lucide-react";

export default function AdminChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [mobileView, setMobileView] = useState<"inbox" | "chat">("inbox");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [stats, setStats] = useState({ openChats: 0, messagesToday: 0 });

  const quickReplies = [
    "Thank you for contacting PiliKart. 🙏",
    "Your order is being prepared. 📦",
    "Your order has been shipped. 🚚",
    "Sorry for the inconvenience. 💔",
    "Please wait for further updates. ⏳",
  ];

  const fetchInboxConversations = async () => {
    const { data: allMsgs } = await supabase
      .from("support_messages")
      .select("*")
      .order("created_at", { ascending: true });
    const { data: dbUsers } = await supabase
      .from("users")
      .select("id, full_name, phone_number");

    if (allMsgs && dbUsers) {
      const inboxMap: any = {};
      allMsgs.forEach(m => {
        if (!m.user_id || m.is_announcement) return;
        if (!inboxMap[m.user_id]) {
          const userMeta = dbUsers.find(u => u.id === m.user_id);
          inboxMap[m.user_id] = {
            userId: m.user_id,
            name: userMeta?.full_name || "Anonymous",
            phone: userMeta?.phone_number || "",
            lastMsg: m.message,
            unreadCount: 0,
            timestamp: m.created_at,
          };
        }
        inboxMap[m.user_id].lastMsg = m.message;
        inboxMap[m.user_id].timestamp = m.created_at;
        if (!m.is_admin && !m.is_seen) inboxMap[m.user_id].unreadCount++;
      });

      const inboxList = Object.values(inboxMap).sort(
        (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setConversations(inboxList);
      setStats({
        openChats: inboxList.filter((c: any) => c.unreadCount > 0).length,
        messagesToday: allMsgs.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).length,
      });
    }
  };

  useEffect(() => {
    fetchInboxConversations();
    const sub = supabase
      .channel("realtime_support")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => {
        fetchInboxConversations();
        if (activeUserId) loadChat(activeUserId);
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeUserId]);

  const loadChat = async (userId: string) => {
    setActiveUserId(userId);
    const selected = conversations.find(c => c.userId === userId);
    if (selected) setActiveUser(selected);
    const { data: chatHistory } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (chatHistory) setMessages(chatHistory);
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (orders) setUserOrders(orders);
    await supabase.from("support_messages").update({ is_seen: true }).eq("user_id", userId).eq("is_admin", false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    setMobileView("chat");
  };

  const handleSendReply = async (text?: string) => {
    const finalMsg = text || replyText;
    if (!finalMsg && !chatImage) return;
    if (!activeUserId) return;
    setLoading(true);
    try {
      let imgUrl = null;
      if (chatImage) {
        const ext = chatImage.name.split('.').pop();
        const path = `support/images/${Date.now()}.${ext}`;
        await supabase.storage.from("pilikart").upload(path, chatImage);
        const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
        imgUrl = data.publicUrl;
      }
      await supabase.from("support_messages").insert([{
        user_id: activeUserId,
        message: finalMsg,
        is_admin: true,
        is_seen: false,
        image_url: imgUrl,
      }]);
      setReplyText("");
      setChatImage(null);
      loadChat(activeUserId);
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText) return;
    if (!confirm("Broadcast this announcement to all users?")) return;
    await supabase.from("support_messages").insert([{
      message: `📢 SYSTEM ANNOUNCEMENT: ${announcementText}`,
      is_admin: true,
      is_announcement: true,
      is_seen: false,
    }]);
    alert("Announcement broadcast sent!");
    setAnnouncementText("");
    fetchInboxConversations();
  };

  return (
    <AdminLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-red-400">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Unread Threads</div>
          <div className="text-xl font-black text-red-600 mt-0.5">{stats.openChats}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Messages Today</div>
          <div className="text-xl font-black text-gray-800 mt-0.5">{stats.messagesToday}</div>
        </div>
      </div>

      {/* Desktop: 2-column layout | Mobile: single panel view */}
      <div className="flex gap-4 h-[70vh]">

        {/* Inbox Panel */}
        <div className={`flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
          mobileView === "chat" ? "hidden md:flex md:w-72" : "flex w-full md:w-72"
        } shrink-0`}>
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Support Inbox
            </span>
            <span className="text-xs text-gray-400">{conversations.length} chats</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">No conversations yet</div>
            )}
            {conversations.map(c => (
              <div
                key={c.userId}
                className={`p-3 cursor-pointer transition active:bg-gray-100 ${
                  activeUserId === c.userId ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-gray-50/50"
                }`}
                onClick={() => loadChat(c.userId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{c.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{c.phone}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5">{c.lastMsg}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] text-gray-400">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white font-bold rounded-full flex items-center justify-center text-[10px] animate-pulse">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Broadcast */}
          <form onSubmit={handleBroadcast} className="p-3 bg-gray-50 border-t border-gray-100 space-y-2 shrink-0">
            <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wide">📢 Broadcast Message</div>
            <input
              type="text"
              placeholder="Announcement text..."
              className="w-full p-2 border border-gray-200 bg-white rounded-xl text-xs focus:outline-none focus:border-primary"
              value={announcementText}
              onChange={e => setAnnouncementText(e.target.value)}
            />
            <Button type="submit" size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs">
              Send to All Users
            </Button>
          </form>
        </div>

        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-w-0 ${
          mobileView === "inbox" ? "hidden md:flex" : "flex"
        }`}>
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setMobileView("inbox")}
                  className="md:hidden p-1.5 rounded-lg hover:bg-gray-200 transition"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm">{activeUser.name}</div>
                  <div className="text-[10px] text-green-600 font-medium">● Online</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 shrink-0"
                  onClick={() => setShowOrders(!showOrders)}
                >
                  <Package className="w-3 h-3 mr-1" />
                  {showOrders ? "Chat" : "Orders"}
                </Button>
              </div>

              {/* Messages or Orders */}
              {showOrders ? (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/30">
                  <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">
                    User Orders ({userOrders.length})
                  </div>
                  {userOrders.map(o => (
                    <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>#{o.id.substring(0, 6).toUpperCase()}</span>
                        <span className="text-primary">₱{o.total_amount}</span>
                      </div>
                      <div className="text-gray-400">{o.location} • {o.order_type}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{new Date(o.created_at).toLocaleDateString()}</span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded font-bold text-[10px]">{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/20">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_admin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        m.is_admin
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                      }`}>
                        {m.message && <div>{m.message}</div>}
                        {m.image_url && (
                          <img src={m.image_url} alt="" className="mt-1 w-32 rounded-lg border" />
                        )}
                        <div className={`text-[9px] mt-1 ${m.is_admin ? "text-white/60" : "text-gray-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {m.is_admin && (m.is_seen ? " · Seen" : " · Sent")}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Quick Replies */}
              {!showOrders && (
                <div className="px-3 pt-2 shrink-0">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {quickReplies.map((qr, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendReply(qr)}
                        className="shrink-0 text-[10px] bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 px-2.5 py-1.5 rounded-xl border border-gray-200 transition whitespace-nowrap"
                      >
                        {qr.split(" ").slice(0, 3).join(" ")}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              {!showOrders && (
                <div className="p-3 border-t border-gray-100 space-y-2 shrink-0">
                  {chatImage && (
                    <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-xl">
                      <span>📸 Image attached</span>
                      <button onClick={() => setChatImage(null)} className="ml-auto text-red-500 font-bold">✕</button>
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        placeholder="Type a reply..."
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) handleSendReply(); }}
                      />
                      <label className="p-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 flex items-center">
                        <span className="text-sm">📸</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setChatImage(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <Button
                      className="bg-primary hover:bg-primary/90 shrink-0 h-10 px-4 rounded-xl"
                      onClick={() => handleSendReply()}
                      disabled={loading}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium text-sm">Select a conversation</p>
              <p className="text-xs mt-1 text-gray-300">Tap a chat from the inbox</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
