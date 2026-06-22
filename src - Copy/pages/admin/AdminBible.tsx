import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function AdminBible() {
  const [loading, setLoading] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [prayersList, setPrayersList] = useState<any[]>([]);

  const [verseOfDay, setVerseOfDay] = useState("");
  const [verseReference, setVerseReference] = useState("");
  const [explanation, setExplanation] = useState("");
  const [verseDate, setVerseDate] = useState("");
  const [morningPrayer, setMorningPrayer] = useState("");
  const [afternoonPrayer, setAfternoonPrayer] = useState("");
  const [nightPrayer, setNightPrayer] = useState("");
  const [christianMessage, setChristianMessage] = useState("");
  const [weeklyMemoryVerse, setWeeklyMemoryVerse] = useState("");
  const [readingPlan, setReadingPlan] = useState("");
  const [bibleTrivia, setBibleTrivia] = useState("");
  const [videoTitle1, setVideoTitle1] = useState("");
  const [videoTitle2, setVideoTitle2] = useState("");
  const [videoFile1, setVideoFile1] = useState<File | null>(null);
  const [videoFile2, setVideoFile2] = useState<File | null>(null);
  const [currentVideoUrl1, setCurrentVideoUrl1] = useState("");
  const [currentVideoUrl2, setCurrentVideoUrl2] = useState("");

  const fetchAllBibleData = async () => {
    const { data: content } = await supabase.from("bible_content").select("*").limit(1).maybeSingle();
    const { data: prayers } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
    if (content) {
      setContentId(content.id);
      setVerseOfDay(content.verse || "");
      setVerseReference(content.verse_reference || "");
      setExplanation(content.explanation || "");
      setVerseDate(content.verse_date || "");
      setMorningPrayer(content.morning_prayer || "");
      setAfternoonPrayer(content.afternoon_prayer || "");
      setNightPrayer(content.night_prayer || "");
      setChristianMessage(content.christian_message || "");
      setWeeklyMemoryVerse(content.weekly_memory_verse || "");
      setReadingPlan(content.reading_plan || "");
      setBibleTrivia(content.bible_trivia || "");
      setVideoTitle1(content.video_title1 || "");
      setVideoTitle2(content.video_title2 || "");
      setCurrentVideoUrl1(content.video_url1 || "");
      setCurrentVideoUrl2(content.video_url2 || "");
    }
    if (prayers) setPrayersList(prayers);
  };

  useEffect(() => { fetchAllBibleData(); }, []);

  const uploadVideo = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `bible/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pilikart").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let url1 = currentVideoUrl1;
      let url2 = currentVideoUrl2;
      if (videoFile1) url1 = await uploadVideo(videoFile1);
      if (videoFile2) url2 = await uploadVideo(videoFile2);

      const payload = {
        verse: verseOfDay,
        verse_reference: verseReference,
        explanation,
        verse_date: verseDate,
        morning_prayer: morningPrayer,
        afternoon_prayer: afternoonPrayer,
        night_prayer: nightPrayer,
        christian_message: christianMessage,
        weekly_memory_verse: weeklyMemoryVerse,
        reading_plan: readingPlan,
        bible_trivia: bibleTrivia,
        video_title1: videoTitle1,
        video_title2: videoTitle2,
        video_url1: url1,
        video_url2: url2,
      };

      if (contentId) {
        await supabase.from("bible_content").update(payload).eq("id", contentId);
      } else {
        await supabase.from("bible_content").insert([payload]);
      }
      alert("Bible content saved!");
      fetchAllBibleData();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary";
  const label = "block text-xs font-bold text-gray-600 mb-1";

  return (
    <AdminLayout>
      <form onSubmit={handleSaveChanges} className="space-y-4 pb-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">📖 Bible Settings</h1>
            <p className="text-sm text-gray-400">Manage daily verse, prayers, and videos</p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Main layout: 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">📖 Verse of the Day</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Bible Reference</label>
                  <input type="text" className={input} placeholder="e.g. Juan 3:16" value={verseReference} onChange={e => setVerseReference(e.target.value)} />
                </div>
                <div>
                  <label className={label}>Target Date</label>
                  <input type="text" className={input} placeholder="e.g. June 18, 2026" value={verseDate} onChange={e => setVerseDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={label}>Bible Verse (Bisaya)</label>
                <textarea className={input + " resize-none"} rows={3} value={verseOfDay} onChange={e => setVerseOfDay(e.target.value)} placeholder="Isulat ang tibuok pulong sa bersikulo..." />
              </div>
              <div>
                <label className={label}>Pamalandong / Explanation</label>
                <textarea className={input + " resize-none"} rows={3} value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Mubo nga katinawan..." />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">⭐ Spiritual Highlights</h3>
              <div>
                <label className={label + " !text-amber-700"}>💎 Weekly Memory Verse</label>
                <input type="text" className={input} placeholder="e.g. Salmo 23:1..." value={weeklyMemoryVerse} onChange={e => setWeeklyMemoryVerse(e.target.value)} />
              </div>
              <div>
                <label className={label + " !text-blue-700"}>🔥 Today's Encouragement</label>
                <textarea className={input + " resize-none"} rows={3} value={christianMessage} onChange={e => setChristianMessage(e.target.value)} placeholder="Mubo nga mensahe sa pag-awhag..." />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">📚 Study & Devotion</h3>
              <div>
                <label className={label}>🗓️ Bible Reading Plan</label>
                <input type="text" className={input} placeholder="e.g. Day 1 - Genesis 1..." value={readingPlan} onChange={e => setReadingPlan(e.target.value)} />
              </div>
              <div>
                <label className={label}>💡 Bible Trivia / Fact</label>
                <input type="text" className={input} placeholder="e.g. Moses wrote the first 5 books..." value={bibleTrivia} onChange={e => setBibleTrivia(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">🙏 Daily Prayers</h3>
              {[
                { label: "🌅 Morning Prayer", value: morningPrayer, set: setMorningPrayer },
                { label: "☀️ Afternoon Prayer", value: afternoonPrayer, set: setAfternoonPrayer },
                { label: "🌌 Night Prayer", value: nightPrayer, set: setNightPrayer },
              ].map(p => (
                <div key={p.label}>
                  <label className={label}>{p.label}</label>
                  <textarea className={input + " resize-none"} rows={3} value={p.value} onChange={e => p.set(e.target.value)} />
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">🎬 Bible Videos</h3>
              {[1, 2].map(n => (
                <div key={n} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                  <label className={label}>Video {n} Title</label>
                  <input
                    type="text"
                    className={input}
                    placeholder={`Video Title ${n}`}
                    value={n === 1 ? videoTitle1 : videoTitle2}
                    onChange={e => n === 1 ? setVideoTitle1(e.target.value) : setVideoTitle2(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="video/*"
                    className="w-full text-xs text-gray-600"
                    onChange={e => n === 1 ? setVideoFile1(e.target.files?.[0] || null) : setVideoFile2(e.target.files?.[0] || null)}
                  />
                  {(n === 1 ? currentVideoUrl1 : currentVideoUrl2) && (
                    <p className="text-[10px] text-green-600 font-medium">✓ Video {n} is active</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Prayer Requests Inbox */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2">
        <div className="p-4 bg-gray-50/50 border-b font-bold text-gray-800 text-sm flex items-center gap-2">
          📬 Prayer Requests
          <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{prayersList.length}</span>
        </div>
        <div className="divide-y divide-gray-50">
          {prayersList.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No prayer requests yet.</div>
          ) : prayersList.map(req => (
            <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-sm">{req.name || "Anonymous"}</div>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{req.request}</p>
              </div>
              <div className="text-xs text-gray-400 shrink-0 sm:text-right">
                {req.created_at ? new Date(req.created_at).toLocaleDateString() : "Today"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
