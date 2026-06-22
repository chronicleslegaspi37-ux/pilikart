import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, RefreshCw, Image, Plus } from "lucide-react";

export default function AdminBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const fetchBanners = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order", { ascending: true });
    if (data) setBanners(data);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    fetchBanners();
  };

  const handleReorder = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === banners.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const b1 = banners[index];
    const b2 = banners[targetIndex];
    await supabase.from("banners").update({ sort_order: b2.sort_order }).eq("id", b1.id);
    await supabase.from("banners").update({ sort_order: b1.sort_order }).eq("id", b2.id);
    fetchBanners();
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner && !imageFile) return alert("Please select an image.");
    setLoading(true);
    try {
      let finalUrl = editingBanner ? editingBanner.image_url : "";
      if (imageFile) {
        if (imageFile.size > 5 * 1024 * 1024) throw new Error("Image too large! Max 5MB.");
        const ext = imageFile.name.split('.').pop();
        const path = `banners/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("pilikart").upload(path, imageFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
        if (data) finalUrl = data.publicUrl;
      }
      if (editingBanner) {
        await supabase.from("banners").update({ image_url: finalUrl, sort_order: parseInt(sortOrder) }).eq("id", editingBanner.id);
      } else {
        await supabase.from("banners").insert([{ image_url: finalUrl, sort_order: parseInt(sortOrder) }]);
      }
      setIsModalOpen(false);
      setImageFile(null);
      setEditingBanner(null);
      fetchBanners();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-400 mt-0.5">{banners.length} / 5 banners active</p>
        </div>
        <Button
          onClick={() => { setEditingBanner(null); setSortOrder((banners.length + 1).toString()); setImageFile(null); setIsModalOpen(true); }}
          disabled={banners.length >= 5}
          className="flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Banner
        </Button>
      </div>

      {/* Banner Cards */}
      <div className="space-y-3">
        {banners.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-dashed border-gray-200 text-center">
            <Image className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 font-medium">No banners yet. Add your first one!</p>
          </div>
        ) : banners.map((banner, index) => (
          <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Banner Image */}
            <div className="w-full h-32 bg-gray-100 relative">
              <img src={banner.image_url} className="w-full h-full object-cover" alt="Banner" />
              <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm">
                #{index + 1} • Order {banner.sort_order}
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleReorder(index, "up")}
                  className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-30 transition"
                >
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  disabled={index === banners.length - 1}
                  onClick={() => handleReorder(index, "down")}
                  className="p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 disabled:opacity-30 transition"
                >
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <button
                onClick={() => { setEditingBanner(banner); setSortOrder(banner.sort_order.toString()); setImageFile(null); setIsModalOpen(true); }}
                className="flex-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
              >
                Replace Image
              </button>
              <button
                onClick={() => handleDeleteBanner(banner.id)}
                className="p-2 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-base">
              {editingBanner ? "Replace Banner Image" : "Upload New Banner"}
            </h2>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Image (Max 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-600"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Uploading..." : editingBanner ? "Replace" : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
