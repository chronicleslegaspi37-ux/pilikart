import { useState, useEffect } from "react";
import { Book, Sun, Sunrise, Moon } from "lucide-react";
import { supabase, Database } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";

type BibleContent = Database["public"]["Tables"]["bible_content"]["Row"];

export default function BiblePage() {
  const [content, setContent] = useState<BibleContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Default fallback content if none in DB
  const fallbackContent = {
    verse_of_day: "Kay gihigugma gayud sa Dios ang kalibutan, nga tungod niana gihatag niya ang iyang bugtong Anak, aron ang tanan nga mosalig kaniya dili malaglag, kondili may kinabuhing dayon.",
    verse_reference: "Juan 3:16",
    explanation: "Kini nga bersikulo nagpahinumdom kanato sa dakong gugma sa Dios.",
    morning_prayer: "Ginoo, salamat sa bag-ong adlaw. Hinaot nga giyahan mo ako karong adlawa...",
    afternoon_prayer: "Ginoo, padayon ako nga gina-agak sa tunga-tunga niining adlawa...",
    night_prayer: "Salamat Ginoo sa pagbantay kanako tibuok adlaw. Hinaot nga makapahulay ako og tarong...",
    video_urls: []
  };

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bible_content")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setContent(data);
      }
      setIsLoading(false);
    };

    fetchContent();
  }, []);

  const currentHour = new Date().getHours();
  let prayerType = "morning";
  let prayerTitle = "Morning Prayer";
  let PrayerIcon = Sunrise;

  if (currentHour >= 12 && currentHour < 18) {
    prayerType = "afternoon";
    prayerTitle = "Afternoon Prayer";
    PrayerIcon = Sun;
  } else if (currentHour >= 18 || currentHour < 5) {
    prayerType = "night";
    prayerTitle = "Night Prayer";
    PrayerIcon = Moon;
  }

  const displayContent = content || fallbackContent;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-[430px] mx-auto">
      <header className="bg-primary p-6 text-white rounded-b-[32px] shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <Book className="w-48 h-48 absolute -right-10 -bottom-10" />
        </div>
        <div className="relative z-10 pt-4">
          <h1 className="text-2xl font-bold mb-1">Bible & Devotional</h1>
          <p className="text-primary-foreground/80 text-sm">Spiritual nourishment for your day</p>
        </div>
      </header>

      <div className="p-4 space-y-4 -mt-6 relative z-20">
        {/* Verse of the Day */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-green-300" />
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <Book className="w-6 h-6" />
          </div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Verse of the Day</h2>
          <p className="text-lg font-serif italic text-gray-800 leading-relaxed mb-4">
            "{displayContent.verse_of_day}"
          </p>
          <div className="font-bold text-primary text-sm">
            {displayContent.verse_reference}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 text-left">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Explanation:</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {displayContent.explanation}
            </p>
          </div>
        </div>

        {/* Dynamic Prayer */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600">
              <PrayerIcon className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-gray-800">{prayerTitle}</h2>
          </div>
          <p className="text-gray-700 italic leading-relaxed text-sm">
            {prayerType === "morning" && displayContent.morning_prayer}
            {prayerType === "afternoon" && displayContent.afternoon_prayer}
            {prayerType === "night" && displayContent.night_prayer}
          </p>
        </div>

        {/* Videos */}
        {displayContent.video_urls && displayContent.video_urls.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 px-1">Daily Inspiration</h3>
            {displayContent.video_urls.map((url, idx) => (
              <div key={idx} className="aspect-video bg-black rounded-2xl overflow-hidden shadow-md">
                <iframe 
                  src={url.includes("youtube.com/watch?v=") ? url.replace("watch?v=", "embed/") : url} 
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="Bible Video"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
