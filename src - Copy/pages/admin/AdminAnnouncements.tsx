import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pin } from "lucide-react";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [badgeType, setBadgeType] = useState("NEW");
  const [targetAudience, setTargetAudience] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleOpenAddModal = () => {
    setTitle(""); setMessage(""); setType("general"); setBadgeType("NEW");
    setTargetAudience("all"); setStartDate(""); setEndDate("");
    setIsPinned(false); setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    fetchAnnouncements();
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await supabase.from("announcements").update({ is_pinned: !currentPinned }).eq("id", id);
    fetchAnnouncements();
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return alert("Title and message required.");
    setLoading(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `announcements/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("pilikart").upload(path, imageFile);
        if (error) throw error;
        const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
      await supabase.from("announcements").insert([{
        title,
        message,
        type,
        badge_type: badgeType,
        target_audience: targetAudience,
        start_date: startDate || null,
        end_date: endDate || null,
        is_pinned: isPinned,
        is_active: true,
        image_url: imageUrl,
        reads_count: 0,
        clicks_count: 0,
      }]);
      setIsModalOpen(false);
      fetchAnnouncements();
      alert("Announcement broadcasted!");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const BADGE_COLORS: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    IMPORTANT: "bg-red-100 text-red-700",
    PROMO: "bg-purple-100 text-purple-800",
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-400 mt-0.5">{announcements.length} campaigns</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base">📢 Create Announcement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
                <input type="text" required placeholder="e.g. 🔥 Piso Deals is LIVE!" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message *</label>
                <textarea required placeholder="Announcement details..." className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" rows={3} value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Badge</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none" value={badgeType} onChange={e => setBadgeType(e.target.value)}>
                    <option value="NEW">NEW 🔥</option>
                    <option value="IMPORTANT">IMPORTANT ⚠️</option>
                    <option value="PROMO">PROMO 🎉</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Campaign Type</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none" value={type} onChange={e => setType(e.target.value)}>
                    <option value="general">General</option>
                    <option value="promo">Promo</option>
                    <option value="flash_sale">Flash Sale</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="warning">Warning</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Audience</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none" value={targetAudience} onChange={e => setTargetAudience(e.target.value)}>
                    <option value="all">All Users</option>
                    <option value="active">Active Only</option>
                    <option value="new">New Users</option>
                    <option value="buyers">Buyers Only</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-bold text-amber-600">📌 Pin Top</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">📅 Start Date</label>
                  <input type="date" className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">📅 End Date</label>
                  <input type="date" className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Banner Image (optional)</label>
                <input type="file" accept="image/*" className="w-full text-sm text-gray-600" onChange={e => setImageFile(e.target.files?.[0] || null)} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Broadcasting..." : "Broadcast"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400">
            <p className="font-medium">No announcements yet.</p>
          </div>
        ) : announcements.map(a => {
          const now = new Date();
          const isLive = a.end_date ? (new Date(a.start_date) <= now && now <= new Date(a.end_date)) : (a.is_active !== false);
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {a.image_url && (
                <img src={a.image_url} alt="" className="w-full h-24 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[a.badge_type] || "bg-gray-100 text-gray-600"}`}>
                        {a.badge_type || "NEW"}
                      </span>
                      {a.is_pinned && <span className="text-[10px] text-amber-700 font-bold">📌 Pinned</span>}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {isLive ? "● Live" : "● Inactive"}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">{a.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.message}</p>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 flex gap-3 flex-wrap mb-3">
                  <span>Target: <strong className="text-gray-600 capitalize">{a.target_audience || "All"}</strong></span>
                  {a.start_date && <span>{a.start_date} → {a.end_date || "—"}</span>}
                  <span>👁 {a.reads_count || 0} · 🖱 {a.clicks_count || 0}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTogglePin(a.id, a.is_pinned)}
                    className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      a.is_pinned ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <Pin className="w-3 h-3" /> {a.is_pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 transition ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
