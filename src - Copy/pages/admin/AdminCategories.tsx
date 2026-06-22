import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase, Database } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2 } from "lucide-react";

type Category = Database["public"]["Tables"]["categories"]["Row"] & {
  icon_emoji?: string;
  is_visible?: boolean;
  is_featured?: boolean;
  bg_color?: string;
  banner_url?: string;
  product_count?: number;
};

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [iconEmoji, setIconEmoji] = useState("📁");
  const [isVisible, setIsVisible] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [bgColor, setBgColor] = useState("#4caf50");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const fetchCategoriesWithCounters = async () => {
    const { data: cats } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
    const { data: prods } = await supabase.from("products").select("category_id");
    if (cats) {
      setCategories(cats.map((cat: any) => ({
        ...cat,
        product_count: prods ? prods.filter(p => p.category_id === cat.id).length : 0,
        icon_emoji: cat.icon_emoji || "📁",
        is_visible: cat.is_visible !== undefined ? cat.is_visible : true,
        is_featured: cat.is_featured || false,
        bg_color: cat.bg_color || "#4caf50",
      })));
    }
  };

  useEffect(() => { fetchCategoriesWithCounters(); }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName(""); setSortOrder("0"); setIconEmoji("📁");
    setIsVisible(true); setIsFeatured(false); setBgColor("#4caf50");
    setImageFile(null); setBannerFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setSortOrder(cat.sort_order?.toString() || "0");
    setIconEmoji((cat as any).icon_emoji || "📁");
    setIsVisible((cat as any).is_visible !== false);
    setIsFeatured((cat as any).is_featured || false);
    setBgColor((cat as any).bg_color || "#4caf50");
    setImageFile(null); setBannerFile(null);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategoriesWithCounters();
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `categories/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pilikart").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Category name is required.");
    setLoading(true);
    try {
      let imageUrl = editingCategory?.image_url || null;
      let bannerUrl = (editingCategory as any)?.banner_url || null;
      if (imageFile) imageUrl = await uploadFile(imageFile, "images");
      if (bannerFile) bannerUrl = await uploadFile(bannerFile, "banners");

      const payload: any = {
        name,
        sort_order: parseInt(sortOrder) || 0,
        icon_emoji: iconEmoji,
        is_visible: isVisible,
        is_featured: isFeatured,
        bg_color: bgColor,
        image_url: imageUrl,
        banner_url: bannerUrl,
      };

      if (editingCategory) {
        await supabase.from("categories").update(payload).eq("id", editingCategory.id);
      } else {
        await supabase.from("categories").insert([payload]);
      }
      setIsModalOpen(false);
      fetchCategoriesWithCounters();
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
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categories</p>
        </div>
        <Button onClick={handleOpenAddModal} className="flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="font-bold text-gray-900 text-base">
                {editingCategory ? "Edit Category" : "Add Category"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-xl font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category Name *</label>
                  <input type="text" required placeholder="e.g. Groceries" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Icon Emoji</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none" value={iconEmoji} onChange={e => setIconEmoji(e.target.value)}>
                    {["📁","🏠","💄","📱","🎮","🍼","👕","⚡","🎄","🎒","🛒","🍪","🥤","🧴","💊","📦"].map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sort Order</label>
                  <input type="number" className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Theme Color</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none" value={bgColor} onChange={e => setBgColor(e.target.value)}>
                    <option value="#4caf50">Green 🟢</option>
                    <option value="#2196f3">Blue 🔵</option>
                    <option value="#f44336">Red 🔴</option>
                    <option value="#ff9800">Orange 🟠</option>
                    <option value="#9c27b0">Purple 🟣</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isVisible} onChange={e => setIsVisible(e.target.checked)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm font-medium text-gray-700">Visible</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm font-bold text-amber-600">⭐ Featured</span>
                  </label>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category Icon Image</label>
                  <input type="file" accept="image/*" className="w-full text-xs text-gray-600" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inside Banner Image</label>
                  <input type="file" accept="image/*" className="w-full text-xs text-gray-600" onChange={e => setBannerFile(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Saving..." : editingCategory ? "Save Changes" : "Add Category"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center text-gray-400">
            <p className="font-medium">No categories yet.</p>
          </div>
        ) : categories.map((cat, idx) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
              style={{ backgroundColor: (cat as any).bg_color + "30" || "#4caf5030" }}
            >
              {(cat as any).icon_emoji || "📁"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                {(cat as any).is_featured && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">⭐ Featured</span>}
                {(cat as any).is_visible === false && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold">Hidden</span>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                #{idx + 1} • Order {cat.sort_order} • {cat.product_count || 0} products
              </div>
            </div>

            {/* Image preview */}
            {cat.image_url && (
              <img src={cat.image_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0" />
            )}

            {/* Actions */}
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => handleOpenEditModal(cat)}
                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
