import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Star, ShoppingCart, MessageCircle, Share2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Review = Database["public"]["Tables"]["reviews"]["Row"];

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex(i => Math.max(i - 1, 0));
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (dy > 60) return;
    if (dx > 50) setIndex(i => Math.min(i + 1, images.length - 1));
    else if (dx < -50) setIndex(i => Math.max(i - 1, 0));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/70 text-sm font-medium">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Image area with swipe support */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={index}
          src={images[index]}
          alt={`Image ${index + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{ touchAction: "pinch-zoom" }}
          draggable={false}
        />

        {/* Prev arrow */}
        {index > 0 && (
          <button
            onClick={() => setIndex(i => i - 1)}
            className="absolute left-2 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/30 transition"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Next arrow */}
        {index < images.length - 1 && (
          <button
            onClick={() => setIndex(i => i + 1)}
            className="absolute right-2 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/30 transition"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center px-4 py-3 shrink-0 overflow-x-auto no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                i === index ? "border-white" : "border-transparent opacity-50"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom hint */}
      <div className="text-center pb-4 text-white/40 text-[10px]">
        Pinch to zoom • Swipe to navigate
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("products").select("*").eq("id", id).single();
      if (data) setProduct(data);
      const { data: revData } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      if (revData) setReviews(revData);
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

  const addToCart = async () => {
    if (!user) { setLocation("/login"); return; }
    if (!product) return;
    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert([{ user_id: user.id, product_id: product.id, quantity: 1 }]);
      }
      toast({ title: "Added to cart!", description: `${product.name} added to your cart.` });
    } catch {
      toast({ title: "Error", description: "Could not add to cart", variant: "destructive" });
    }
  };

  const buyNow = async () => {
    await addToCart();
    setLocation("/cart");
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Product not found.</p>
          <button onClick={() => setLocation("/")} className="mt-3 text-primary text-sm font-bold">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-[430px] mx-auto">
      {/* Fullscreen lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 max-w-[430px] mx-auto pointer-events-none">
        <button
          onClick={() => setLocation("/")}
          className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white pointer-events-auto active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2 pointer-events-auto">
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setLocation("/cart")}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="bg-white">
        <div
          className="relative aspect-square overflow-hidden bg-gray-100 cursor-zoom-in"
          ref={emblaRef}
          onClick={() => openLightbox(selectedIndex)}
        >
          <div className="flex h-full">
            {images.length > 0 ? (
              images.map((img, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0">
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              <div className="flex-[0_0_100%] min-w-0 flex items-center justify-center text-gray-300">
                <ShoppingCart className="w-16 h-16" />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <>
              <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                {selectedIndex + 1} / {images.length}
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === selectedIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Tap to zoom hint overlay */}
          <div className="absolute top-4 right-4 bg-black/30 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <span>🔍</span>
            <span>Tap to zoom</span>
          </div>
        </div>

        {/* Thumbnail row */}
        {images.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => { emblaApi?.scrollTo(i); openLightbox(i); }}
                className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                  i === selectedIndex ? "border-primary" : "border-gray-200"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-2xl font-bold text-primary">
                ₱{product.is_flash_sale && product.flash_sale_price ? product.flash_sale_price : product.price}
              </div>
              {product.is_flash_sale && product.flash_sale_price && (
                <div className="text-sm text-gray-400 line-through">₱{product.price}</div>
              )}
            </div>
            {product.badge && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="text-lg font-medium text-gray-900 leading-snug mb-3">{product.name}</h1>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-700">{product.rating}</span>
              <span>({reviews.length} reviews)</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{product.sold_count} sold</span>
              {product.stock !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  product.stock > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                }`}>
                  {product.stock > 0 ? `${product.stock} left` : "Sold Out"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-2 bg-white p-4">
        <h3 className="font-bold mb-2 text-gray-900">Product Description</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
      </div>

      {/* Reviews */}
      <div className="mt-2 bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Reviews ({reviews.length})</h3>
          {reviews.length > 3 && (
            <span className="text-primary text-sm font-medium">View All</span>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center gap-1 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-50 max-w-[430px] mx-auto flex gap-2">
        <button className="flex flex-col items-center justify-center w-12 text-gray-500 shrink-0">
          <MessageCircle className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Chat</span>
        </button>
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-11 border-primary text-primary font-bold"
          onClick={addToCart}
          disabled={product.stock !== null && product.stock <= 0}
        >
          Add to Cart
        </Button>
        <Button
          className="flex-1 rounded-xl h-11 bg-primary text-white font-bold"
          onClick={buyNow}
          disabled={product.stock !== null && product.stock <= 0}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
