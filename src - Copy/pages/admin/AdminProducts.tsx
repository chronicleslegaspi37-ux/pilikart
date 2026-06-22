import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase, Database } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Search, Package, Star, X, Truck, Coins, ShieldCheck } from "lucide-react";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  coin_cost?: number;
  piso_price?: number;
  required_delivered_order?: boolean;
  max_redemption?: number;
  is_active_status?: boolean;
  brand_name?: string;
  est_delivery?: string;
  choices?: string[];
};
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Active Filter Tabs Handling Setup
  const [activeTab, setActiveTab] = useState("regular");

  // Core Form State Controllers Matrix
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productType, setProductType] = useState("regular"); 
  const [rating, setRating] = useState("5");
  const [badge, setBadge] = useState("");
  const [brandName, setBrandName] = useState("PiliKart Genuine");
  const [estDelivery, setEstDelivery] = useState("2-3 Days");
  const [isActiveStatus, setIsActiveStatus] = useState(true);

  // Product Variants Configurations (Choices List array tags management)
  const [choicesList, setChoicesList] = useState<string[]>([]);
  const [newChoiceInput, setNewChoiceInput] = useState("");

  // Custom Sales Modifier Counters
  const [soldCount, setSoldCount] = useState("0");
  const [coinCost, setCoinCost] = useState("0");
  const [pisoPrice, setPisoPrice] = useState("1");
  const [requiredDeliveredOrder, setRequiredDeliveredOrder] = useState(true);
  const [maxRedemption, setMaxRedemption] = useState("1");

  // Multi-Media Files State Hooks Accumulator Arrays
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Summary Metrics Aggregations counters state
  const [summary, setSummary] = useState({ regular: 0, pisoDeal: 0, rewards: 0 });
  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (data) {
      setProducts(data);
      const counts = { regular: 0, pisoDeal: 0, rewards: 0 };
      data.forEach(p => {
        const type = p.product_type ? p.product_type.toLowerCase().replace(/\s+/g, '').trim() : "regular";
        if (type === "piso_deal" || type === "piso_deals") counts.pisoDeal++;
        else if (type === "rewards" || type === "reward") counts.rewards++;
        else counts.regular++;
      });
      setSummary(counts);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const resetForm = (type: string) => {
    setEditingProduct(null);
    setName(""); setDescription(""); setPrice(""); setStock("");
    setCategoryId(""); setProductType(type); setRating("5");
    setBadge(""); setBrandName("PiliKart Genuine"); setEstDelivery("2-3 Days");
    setIsActiveStatus(true); setCoinCost("0"); setPisoPrice("1");
    setRequiredDeliveredOrder(true); setMaxRedemption("1");
    setChoicesList([]); setNewChoiceInput(""); setSoldCount("0");
    setImageFiles([]); setVideoFile(null);
  };

  const handleOpenAddModal = (type: string) => {
    resetForm(type);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price?.toString() || "");
    setStock(product.stock?.toString() || "0");
    setCategoryId(product.category_id || "");
    setProductType(product.product_type || "regular");
    setRating(product.rating?.toString() || "5");
    setBadge(product.badge || "");
    setBrandName(product.brand_name || "PiliKart Genuine");
    setEstDelivery(product.est_delivery || "2-3 Days");
    setIsActiveStatus(product.is_active_status !== false);
    setCoinCost(product.coin_cost?.toString() || "0");
    setPisoPrice(product.piso_price?.toString() || "1");
    setRequiredDeliveredOrder(product.required_delivered_order !== false);
    setMaxRedemption(product.max_redemption?.toString() || "1");
    setChoicesList(product.choices || []);
    setNewChoiceInput("");
    setSoldCount(product.sold_count?.toString() || "0");
    setImageFiles([]); setVideoFile(null);
    setIsModalOpen(true);
  };

  const handleAddChoice = () => {
    if (!newChoiceInput.trim()) return;
    if (choicesList.length >= 6) return alert("Maximum limit error: 6 choices only allowed.");
    setChoicesList(prev => [...prev, newChoiceInput.trim()]);
    setNewChoiceInput("");
  };

  const handleRemoveChoice = (indexToRemove: number) => {
    setChoicesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    if (imageFiles.length + selected.length > 5) return alert("Maximum limit error: 5 images only.");
    setImageFiles(prev => [...prev, ...selected]);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Product name is required.");
    setLoading(true);

    try {
      let imageUrls: string[] = editingProduct ? (editingProduct.images || []) : [];
      let finalVideoUrl = editingProduct ? (editingProduct.video_url || "") : "";

      // direct gallery image file accumulator upload loops
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop();
        const path = `products/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("pilikart").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
        if (data) imageUrls.push(data.publicUrl);
      }

      // direct video file upload loop
      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `products/videos/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("pilikart").upload(path, videoFile);
        if (error) throw error;
        const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
        if (data) finalVideoUrl = data.publicUrl;
      }

      const formattedType = productType.toLowerCase().trim();

      const productData: any = {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: formattedType === "rewards" ? 0 : (parseFloat(price) || 0),
        stock: parseInt(stock) || 0,
        category_id: categoryId || null,
        product_type: formattedType,
        rating: parseFloat(rating) || 5,
        badge: badge || null,
        sold_count: parseInt(soldCount) || 0,
        brand_name: brandName ? brandName.trim() : 'PiliKart Genuine',
        est_delivery: estDelivery ? estDelivery.trim() : '2-3 Days',
        is_active_status: isActiveStatus,
        is_active: true, 
        coin_cost: formattedType === "rewards" ? (parseInt(coinCost) || 0) : 0,
        piso_price: formattedType === "piso_deal" ? (parseFloat(pisoPrice) || 1) : 0,
        required_delivered_order: formattedType === "piso_deal" ? requiredDeliveredOrder : false,
        max_redemption: formattedType === "piso_deal" ? (parseInt(maxRedemption) || 1) : null,
        images: imageUrls,
        video_url: finalVideoUrl || null,
        choices: formattedType === "regular" ? choicesList : []
      };

      if (editingProduct) {
        await supabase.from("products").update(productData).eq("id", editingProduct.id);
        alert("Product updated successfully!");
      } else {
        await supabase.from("products").insert([productData]);
        alert("Product added successfully!");
      }

      // Auto-tab switcher configuration parameter checks after successful postings
      if (formattedType === "piso_deal" || formattedType === "piso_deals") {
        setActiveTab("piso_deal");
      } else if (formattedType === "rewards" || formattedType === "reward") {
        setActiveTab("rewards");
      } else {
        setActiveTab("regular");
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) { 
      alert("Error sa pag-save: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredDataset = products.filter(p => {
    const normalizedType = p.product_type ? p.product_type.toLowerCase().replace(/\s+/g, '').trim() : "regular";
    const currentTab = activeTab.toLowerCase().trim();

    const matchesTab = 
      (currentTab === "regular" && (normalizedType === "regular" || normalizedType === "")) ||
      (currentTab === "piso_deal" && (normalizedType === "piso_deal" || normalizedType === "piso_deals")) ||
      (currentTab === "rewards" && (normalizedType === "rewards" || normalizedType === "reward"));

    const matchesSearch = search.trim() === "" || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });
  return (
    <AdminLayout>
      {/* 📊 SUMMARY OVERVIEW TOP CARDS WIDGETS DISPLAY */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 font-sans text-xs text-gray-700">
        <button type="button" onClick={() => setActiveTab("regular")} className={`p-3 rounded-2xl border text-left transition shadow-xs bg-white ${activeTab === "regular" ? "border-purple-200 ring-2 ring-purple-600/10 font-bold" : "opacity-70"}`}>
          <div className="text-gray-400 font-bold text-[10px]">📦 Regular Items</div>
          <div className="text-sm font-black text-purple-700 mt-0.5">{summary.regular} items</div>
        </button>
        <button type="button" onClick={() => setActiveTab("piso_deal")} className={`p-3 rounded-2xl border text-left transition shadow-xs bg-white ${activeTab === "piso_deal" ? "border-green-200 ring-2 ring-green-600/10 font-bold" : "opacity-70"}`}>
          <div className="text-gray-400 font-bold text-[10px]">🪙 Piso Deals</div>
          <div className="text-sm font-black text-green-700 mt-0.5">{summary.pisoDeal} items</div>
        </button>
        <button type="button" onClick={() => setActiveTab("rewards")} className={`p-3 rounded-2xl border text-left transition shadow-xs bg-white ${activeTab === "rewards" ? "border-amber-200 ring-2 ring-amber-600/10 font-bold" : "opacity-70"}`}>
          <div className="text-gray-400 font-bold text-[10px]">🎁 Rewards Portal</div>
          <div className="text-sm font-black text-amber-700 mt-0.5">{summary.rewards} items</div>
        </button>
      </div>

      {/* 🟢 UNIFIED CONTROL PANEL */}
      <div className="bg-white p-3 rounded-2xl border shadow-xs mb-4 font-sans text-xs flex items-center justify-between">
        <div>
          <span className="font-black text-gray-800 text-sm block">Products Directory</span>
          <span className="text-[10px] text-gray-400 font-medium">Manage and deploy catalog items securely.</span>
        </div>
        <button 
          type="button" 
          onClick={() => handleOpenAddModal(activeTab)} 
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold transition active:scale-95 shadow-md border-none cursor-pointer text-xs"
        >
          ➕ Add New Product
        </button>
      </div>

      <div className="relative mb-4 font-sans text-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder={`Search dynamic ${activeTab} items entries...`} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* STREAM MOBILE CARDS RENDERER */}
      <div className="space-y-3 font-sans text-xs">
        {filteredDataset.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-400 font-medium">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No products located inside this segment folder view link.</p>
          </div>
        ) : (
          filteredDataset.map(product => {
            const firstImg = product.images && product.images.length > 0 ? product.images[0] : null;
            const isOutOfStock = product.stock !== null && product.stock <= 0;
            return (
              <div key={product.id} className={`bg-white rounded-2xl border p-3 flex gap-3 shadow-xs relative ${product.is_active_status === false ? "bg-red-50/20 opacity-60" : ""}`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border shrink-0">
                  {firstImg ? <img src={firstImg} alt="prod" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-100"><Package className="w-6 h-6 text-gray-300" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug truncate pr-6">{product.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {product.product_type === "rewards" ? (
                      <span className="text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">🪙 {product.coin_cost || 0} Coins Cost</span>
                    ) : product.product_type === "piso_deal" ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-green-700 font-black bg-green-50 px-1.5 py-0.5 rounded border border-green-200">₱{product.piso_price || 1} Piso Deal</span>
                        <span className="text-gray-400 line-through text-[11px]">Reg: ₱{product.price}</span>
                      </div>
                    ) : (
                      <span className="text-purple-600 font-black bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">₱{product.price} Price</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px]">
                    {product.badge && <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100 font-bold">{product.badge}</span>}
                    <span className={`px-1.5 py-0.5 rounded font-bold ${isOutOfStock ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>{isOutOfStock ? "Sold Out" : `${product.stock} stock`}</span>
                    <span className="text-gray-400">⭐ {product.rating} · {product.sold_count} sold</span>
                  </div>

                  {product.product_type === "regular" && product.choices && product.choices.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-gray-500 bg-gray-50 p-1 rounded border">
                      <span className="font-bold">Choices:</span>
                      {product.choices.map((c, idx) => (
                        <span key={idx} className="bg-white px-1 rounded border font-sans">{c}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-2.5">
                    <button type="button" onClick={() => handleOpenEditModal(product)} className="flex items-center gap-1 text-xs text-blue-600 font-bold px-2.5 py-1 bg-blue-50 rounded-lg active:scale-95 transition cursor-pointer border-none">Edit</button>
                    <button type="button" onClick={() => handleDeleteProduct(product.id)} className="flex items-center gap-1 text-xs text-red-600 font-bold px-2.5 py-1 bg-red-50 rounded-lg active:scale-95 transition cursor-pointer border-none">Delete</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* POPUP MODAL CONTROL ENGINES */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 font-sans text-xs text-gray-700">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-wide">
                {editingProduct ? "⚙️ Edit Product Registry" : "📦 Add New Catalog Product"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold bg-none border-none cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1">🎯 Product Listing Channel Type *</label>
                <select 
                  className="w-full p-2.5 border rounded-xl font-bold text-gray-800 bg-gray-50 focus:outline-none"
                  value={productType} 
                  onChange={(e) => setProductType(e.target.value)}
                  required
                >
                  <option value="regular">📦 Regular Product Storefront</option>
                  <option value="piso_deal">🪙 Piso Deals Promotional Campaign</option>
                  <option value="rewards">🎁 Coins Rewards Product Center</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Product Name *</label>
                  <input type="text" className="w-full p-2.5 border rounded-xl text-xs focus:outline-none" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">📦 Brand Name Label</label>
                  <input type="text" className="w-full p-2.5 border rounded-xl text-xs focus:outline-none" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Nike, Samsung" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Product Description Context</label>
                <textarea className="w-full p-2.5 border rounded-xl h-16 resize-none focus:outline-none" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              {productType === "regular" && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-3 bg-purple-50/30 p-3 rounded-xl border border-purple-100">
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">Price (₱) *</label>
                      <input type="number" step="any" min="0" className="w-full p-2 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">Stock Vol *</label>
                      <input type="number" min="0" className="w-full p-2 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={stock} onChange={e => setStock(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block font-bold text-purple-900 mb-1">🚗 Est. Delivery</label>
                      <input type="text" className="w-full p-2 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
                    </div>
                  </div>

                  <div className="bg-purple-50/20 p-3 rounded-xl border border-purple-100 font-sans space-y-2">
                    <label className="block text-xs font-bold text-purple-950">🎨 Product Choices / Variants (Max 6)</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="e.g. Red, XL" className="flex-1 p-2 border bg-white rounded-lg text-xs focus:outline-none" value={newChoiceInput} onChange={e => setNewChoiceInput(e.target.value)} />
                      <button type="button" onClick={handleAddChoice} className="bg-purple-600 text-white font-bold px-3 rounded-lg border-none active:scale-95 cursor-pointer text-xs">Add</button>
                    </div>
                    {choicesList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {choicesList.map((ch, i) => (
                          <span key={i} className="bg-white border border-purple-200 text-purple-950 font-medium px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <span>{ch}</span>
                            <button type="button" onClick={() => handleRemoveChoice(i)} className="text-red-500 font-bold border-none bg-none cursor-pointer"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {productType === "piso_deal" && (
                <div className="grid grid-cols-2 gap-3 bg-green-50/40 p-3 rounded-xl border border-green-200 animate-fadeIn">
                  <div>
                    <label className="block mb-1 text-green-950 font-bold">Original Capital Price (₱) *</label>
                    <input type="number" className="w-full p-2.5 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={price} onChange={e => setPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block mb-1 text-green-950 font-bold">Piso deals Price (₱) *</label>
                    <input type="number" className="w-full p-2.5 border bg-white rounded-lg font-mono text-xs text-green-700 font-black focus:outline-none" value={pisoPrice} onChange={e => setPisoPrice(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block mb-1 text-green-950 font-bold">Max claims per user</label>
                    <input type="number" className="w-full p-2.5 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={maxRedemption} onChange={e => setMaxRedemption(e.target.value)} />
                  </div>
                  <div className="pt-5 flex items-center gap-1.5 pl-1 text-xs">
                    <input type="checkbox" id="reqDeliveredOrder" checked={requiredDeliveredOrder} onChange={e => setRequiredDeliveredOrder(e.target.checked)} />
                    <label htmlFor="reqDeliveredOrder" className="text-green-800 cursor-pointer font-bold">Required Delivered Order</label>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-600 mb-1 font-bold">🚗 Est. Delivery Time Frame</label>
                    <input type="text" className="w-full p-2.5 border bg-white rounded-xl text-xs font-mono focus:outline-none text-gray-700" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
                  </div>
                </div>
              )}

              {productType === "rewards" && (
                <div className="grid grid-cols-2 gap-3 bg-amber-50/40 p-3 rounded-xl border border-amber-200 animate-fadeIn font-bold text-amber-900">
                  <div>
                    <label className="block mb-1 text-amber-950 font-black">🪙 Coin Cost (Required Price) *</label>
                    <input type="number" className="w-full p-2.5 border bg-white rounded-lg text-amber-700 font-mono text-sm font-black focus:outline-none" value={coinCost} onChange={e => setCoinCost(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block mb-1">Available Rewards Stock *</label>
                    <input type="number" className="w-full p-2.5 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" value={stock} onChange={e => setStock(e.target.value)} required />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-600 mb-1">🚗 Est. Delivery Time Frame</label>
                    <input type="text" className="w-full p-2.5 border bg-white rounded-xl text-xs font-mono focus:outline-none text-gray-700" value={estDelivery} onChange={e => setEstDelivery(e.target.value)} />
                  </div>
                </div>
              )}

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Category Link</label>
                      <select className="w-full p-2.5 border rounded-xl bg-white focus:outline-none font-bold text-gray-700 text-xs" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">Rating Stars</label>
                      <select className="w-full p-2.5 border rounded-xl bg-white focus:outline-none font-bold text-yellow-600 text-xs" value={rating} onChange={e => setRating(e.target.value)}>
                        {["5","4.5","4","3.5","3"].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-600 mb-1">✨ Advanced Badge</label>
                      <select className="w-full p-2.5 border rounded-xl bg-white focus:outline-none font-bold text-emerald-700 text-xs" value={badge} onChange={e => setBadge(e.target.value)}>
                        <option value="">No Badge</option>
                        <option value="Hot Sale">🔥 Hot Sale</option>
                        <option value="New Arrival">🆕 New Arrival</option>
                        <option value="Premium">💎 Premium</option>
                      </select>
                    </div>
                  </div>

                  {/* 📊 MANUAL SOLD COUNT & METRICS MODIFIER */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">📈 Manual Sold Count</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 border bg-white rounded-lg font-mono text-xs focus:outline-none text-gray-700" 
                        value={soldCount} 
                        onChange={e => setSoldCount(e.target.value)} 
                        placeholder="e.g. 150"
                      />
                    </div>
                    <div className="pt-6 flex items-center gap-1.5 pl-1 text-xs">
                      <input type="checkbox" id="isActiveStatusField" checked={isActiveStatus} onChange={e => setIsActiveStatus(e.target.checked)} />
                      <label htmlFor="isActiveStatusField" className="text-gray-700 cursor-pointer font-bold">Item Active Display</label>
                    </div>
                  </div>

                  {/* 📸 DIRECT MEDIA GALLERY FILES ACCUMULATOR INPUTS */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2.5 rounded-xl border">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Photos (Max 5)</label>
                      <input type="file" accept="image/*" multiple className="w-full text-[10px]" onChange={handleImageChange} />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Product Video (Max 1)</label>
                      <input type="file" accept="video/*" className="w-full text-[10px]" onChange={e => setVideoFile(e.target.files?.item(0) || null)} />
                    </div>
                  </div>

                  {/* 🔘 ACTION INTERFACE BUTTON PANELS */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-bold pt-2">
                    <Button type="button" variant="outline" className="w-full h-10 rounded-xl" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white h-10 rounded-xl border-none shadow-md cursor-pointer" disabled={loading}>
                      {loading ? "Saving..." : "Save Product Details"}
                    </Button>
                  </div>
                  </form>
                  </div>
                  </div>
                  )}
                  </AdminLayout>
                  );
                  }
