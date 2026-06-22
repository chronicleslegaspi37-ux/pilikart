import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Star, Trash2, Pin, EyeOff, Eye, ThumbsUp } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("all");

  const [stats, setStats] = useState({
    totalReviews: 0,
    hiddenReviews: 0,
    pinnedReviews: 0,
    totalPhotos: 0,
  });

  const fetchData = async () => {
    const { data: revList } = await supabase
      .from("reviews")
      .select("*, products(id, name), users(full_name, phone_number)")
      .order("created_at", { ascending: false });
    const { data: prodList } = await supabase.from("products").select("id, name");
    if (prodList) setProducts(prodList);
    if (revList) {
      setReviews(revList);
      const counts = { totalReviews: revList.length, hiddenReviews: 0, pinnedReviews: 0, totalPhotos: 0 };
      revList.forEach(r => {
        if (r.is_hidden) counts.hiddenReviews++;
        if (r.is_pinned) counts.pinnedReviews++;
        if (r.images) counts.totalPhotos += r.images.length;
      });
      setStats(counts);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleColumn = async (id: string, col: string, current: boolean) => {
    await supabase.from("reviews").update({ [col]: !current }).eq("id", id);
    fetchData();
  };

  const addHelpful = async (id: string, count: number) => {
    await supabase.from("reviews").update({ helpful_count: (count || 0) + 1 }).eq("id", id);
    fetchData();
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    fetchData();
  };

  const filtered = selectedProductId === "all"
    ? reviews
    : reviews.filter(r => r.product_id === selectedProductId);

  return (
    <AdminLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total Reviews", value: stats.totalReviews, color: "text-gray-800" },
          { label: "Pinned", value: stats.pinnedReviews, color: "text-amber-600" },
          { label: "Hidden", value: stats.hiddenReviews, color: "text-red-600" },
          { label: "Photos", value: stats.totalPhotos, color: "text-blue-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold uppercase">{s.label}</div>
            <div className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
        >
          <option value="all">All Products</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="font-medium">No reviews found</p>
          </div>
        ) : filtered.map(r => (
          <div
            key={r.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
              r.is_hidden ? "opacity-60 border-red-200 bg-red-50/10" : "border-gray-100"
            }`}
          >
            <div className="p-4">
              {/* Reviewer + Product */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-bold text-gray-900 text-sm">{r.users?.full_name || "Anonymous"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{r.users?.phone_number}</div>
                  <div className="text-[10px] text-primary font-medium mt-0.5">{r.products?.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 justify-end">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < (r.rating || 5) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 justify-end flex-wrap">
                    {r.is_pinned && <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold">📌 Pinned</span>}
                    {r.is_hidden && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Hidden</span>}
                    {r.is_verified !== false && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100 font-bold">✅ Verified</span>}
                  </div>
                </div>
              </div>

              {/* Comment */}
              {r.comment && (
                <p className="text-sm text-gray-600 leading-relaxed mb-3 italic">"{r.comment}"</p>
              )}

              {/* Media */}
              {(r.images?.length > 0 || r.video_url) && (
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {r.images?.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                  {r.video_url && (
                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white text-xs font-bold border">
                      🎥
                    </div>
                  )}
                </div>
              )}

              {/* Helpful count */}
              <div className="text-xs text-gray-400 mb-3">
                👍 {r.helpful_count || 0} found this helpful
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => addHelpful(r.id, r.helpful_count)}
                  className="flex items-center gap-1 text-xs text-gray-600 font-bold px-2.5 py-1.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  <ThumbsUp className="w-3 h-3" /> +Helpful
                </button>
                <button
                  onClick={() => toggleColumn(r.id, "is_pinned", r.is_pinned)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition ${
                    r.is_pinned ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                  }`}
                >
                  <Pin className="w-3 h-3" /> {r.is_pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => toggleColumn(r.id, "is_hidden", r.is_hidden)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition ${
                    r.is_hidden ? "bg-gray-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                >
                  {r.is_hidden ? <><Eye className="w-3 h-3" /> Show</> : <><EyeOff className="w-3 h-3" /> Hide</>}
                </button>
                <button
                  onClick={() => deleteReview(r.id)}
                  className="flex items-center gap-1 text-xs text-red-600 font-bold px-2.5 py-1.5 bg-red-50 rounded-xl hover:bg-red-100 transition ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
