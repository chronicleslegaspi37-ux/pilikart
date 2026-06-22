import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase, Database } from "@/lib/supabase";
import { ChevronDown, ChevronUp, Package, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STATUS_FLOW = ["Pending", "Packed", "Shipped", "Delivered"];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Packed: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({});
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  useEffect(() => {
    fetchOrders();
    const sub = supabase
      .channel("admin_orders_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const tabs = ["All", "Pending", "Packed", "Shipped", "Delivered", "Cancelled"];

  const searchFiltered = search.trim()
    ? orders.filter(o =>
        o.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.id.includes(search) ||
        o.phone_number?.includes(search)
      )
    : orders;

  const filtered = activeTab === "All"
    ? searchFiltered
    : searchFiltered.filter(o => o.status === activeTab);

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    if (!confirm(`Change order to "${newStatus}"?`)) return;
    setLoading(prev => ({ ...prev, [order.id]: true }));
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "Cancelled" && cancelReason[order.id]) {
        updates.cancellation_reason = cancelReason[order.id];
      }
      await supabase.from("orders").update(updates).eq("id", order.id);
      fetchOrders();
    } finally {
      setLoading(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const handleTrackingUpdate = async (orderId: string) => {
    const msg = trackingInputs[orderId]?.trim();
    if (!msg) return alert("Please enter a tracking message.");
    setLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await supabase.from("orders").update({ tracking_message: msg }).eq("id", orderId);
      setTrackingInputs(prev => ({ ...prev, [orderId]: "" }));
      fetchOrders();
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleProofUpload = async (order: Order) => {
    const file = proofFiles[order.id];
    if (!file) return alert("Please select an image first.");
    setLoading(prev => ({ ...prev, [order.id]: true }));
    try {
      const ext = file.name.split('.').pop();
      const path = `proofs/${order.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("pilikart").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
      await supabase.from("orders").update({
        proof_of_delivery: data.publicUrl,
        status: "Delivered"
      }).eq("id", order.id);
      setProofFiles(prev => { const n = { ...prev }; delete n[order.id]; return n; });
      fetchOrders();
      alert("Proof uploaded! Order marked as Delivered.");
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setLoading(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const pendingCount = orders.filter(o => o.status === "Pending").length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">
              {pendingCount} order{pendingCount > 1 ? "s" : ""} need attention
            </p>
          )}
        </div>
        <button
          onClick={fetchOrders}
          className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition"
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone or order ID..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {tabs.map(tab => {
          const count = tab === "All" ? orders.length : orders.filter(o => o.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition shrink-0 ${
                activeTab === tab
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : filtered.map(order => {
          const isExpanded = expandedId === order.id;
          const isLoading = loading[order.id];
          const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Order Header - tappable */}
              <div
                className="p-4 flex items-start gap-3 cursor-pointer active:bg-gray-50 transition"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm font-mono">
                      #{order.id.split('-')[0].toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1 truncate">{order.full_name}</div>
                  <div className="text-xs text-gray-400 truncate">{order.location} • {order.phone_number}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-bold text-primary text-base">₱{order.total_amount}</span>
                  <span className="text-xs text-gray-400">{(order.items as any[]).length} item{(order.items as any[]).length > 1 ? "s" : ""}</span>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 mt-1" />
                  }
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 pb-4 space-y-4">

                  {/* Order Items */}
                  <div className="pt-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {(order.items as any[]).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3 items-center bg-gray-50 rounded-xl p-2">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">{item.name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.quantity} × ₱{item.price}</div>
                          </div>
                          <div className="text-sm font-bold text-gray-900 shrink-0">
                            ₱{(Number(item.quantity) * Number(item.price)).toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</h4>
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-gray-800">{order.full_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium text-gray-800">{order.phone_number}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium text-gray-800">{order.location}</span></div>
                    {order.full_address && <div className="flex flex-col gap-0.5"><span className="text-gray-500">Address</span><span className="font-medium text-gray-800">{order.full_address}</span></div>}
                    <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium text-gray-800">Cash on Delivery</span></div>
                    {order.notes && <div className="flex flex-col gap-0.5"><span className="text-gray-500">Notes</span><span className="font-medium text-gray-800">{order.notes}</span></div>}
                  </div>

                  {/* Tracking message if exists */}
                  {order.tracking_message && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                      <div className="font-bold mb-1">Tracking Update</div>
                      <p>{order.tracking_message}</p>
                    </div>
                  )}

                  {/* Cancellation reason if exists */}
                  {order.cancellation_reason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
                      <div className="font-bold mb-1">Cancellation Reason</div>
                      <p>{order.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Proof of delivery if exists */}
                  {order.proof_of_delivery && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Proof of Delivery</div>
                      <img
                        src={order.proof_of_delivery}
                        alt="Proof"
                        className="w-full max-h-48 object-cover rounded-xl border border-gray-200"
                      />
                    </div>
                  )}

                  {/* Action Area (only for non-final statuses) */}
                  {order.status !== "Delivered" && order.status !== "Cancelled" && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">

                      {/* Tracking Message Input */}
                      <div>
                        <label className="text-xs font-bold text-gray-600 block mb-1.5">Send Tracking Update</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Your order is being packed and will be delivered soon..."
                          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary resize-none"
                          value={trackingInputs[order.id] || ""}
                          onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1.5 w-full"
                          disabled={isLoading || !trackingInputs[order.id]?.trim()}
                          onClick={() => handleTrackingUpdate(order.id)}
                        >
                          Send Update
                        </Button>
                      </div>

                      {/* Proof Upload for Shipped → Delivered */}
                      {order.status === "Shipped" && (
                        <div>
                          <label className="text-xs font-bold text-gray-600 block mb-1.5">Upload Proof of Delivery</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-xs text-gray-600"
                            onChange={e => {
                              if (e.target.files?.[0]) {
                                setProofFiles(prev => ({ ...prev, [order.id]: e.target.files![0] }));
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="mt-1.5 w-full"
                            disabled={!proofFiles[order.id] || isLoading}
                            onClick={() => handleProofUpload(order)}
                          >
                            {isLoading ? "Uploading..." : "Upload & Mark Delivered"}
                          </Button>
                        </div>
                      )}

                      {/* Cancel Reason */}
                      <div>
                        <label className="text-xs font-bold text-red-500 block mb-1">Cancellation Reason (optional)</label>
                        <input
                          type="text"
                          placeholder="Reason for cancellation..."
                          className="w-full text-xs border border-red-200 rounded-xl px-3 py-2 focus:outline-none focus:border-red-400"
                          value={cancelReason[order.id] || ""}
                          onChange={e => setCancelReason(prev => ({ ...prev, [order.id]: e.target.value }))}
                        />
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex gap-2">
                        {nextStatus && (
                          <Button
                            className="flex-1 text-sm"
                            disabled={isLoading}
                            onClick={() => handleStatusUpdate(order, nextStatus)}
                          >
                            {isLoading ? "Updating..." : `Mark as ${nextStatus}`}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                          disabled={isLoading}
                          onClick={() => handleStatusUpdate(order, "Cancelled")}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
