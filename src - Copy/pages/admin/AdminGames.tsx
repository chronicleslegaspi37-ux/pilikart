import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Gamepad2 } from "lucide-react";

export default function AdminGames() {
  const [activeTab, setActiveTab] = useState("bible_quiz");
  const [questions, setQuestions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isEnabled, setIsEnabled] = useState(true);
  const [coinsPerCorrect, setCoinsPerCorrect] = useState(1);
  const [bonusPerfectScore, setBonusPerfectScore] = useState(5);
  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const [correctFile, setCorrectFile] = useState<File | null>(null);
  const [wrongFile, setWrongFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [coinsReward, setCoinsReward] = useState("1");
  const [wordClues, setWordClues] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [stats, setStats] = useState({
    totalPlayers: 0,
    coinsGiven: 0,
    mostPlayed: "Bible Quiz",
    leastPlayed: "Word Search",
    counts: { bible_quiz: 0, math_quiz: 0, guess_logo: 0, true_false: 0, word_search: 0 }
  });

  const GAME_TABS = [
    { id: "bible_quiz", label: "📖 Bible Quiz" },
    { id: "math_quiz", label: "➕ Math Quiz" },
    { id: "guess_logo", label: "🏷️ Guess Logo" },
    { id: "true_false", label: "✅ True/False" },
    { id: "word_search", label: "🔤 Word Search" },
  ];

  const loadGameSectionData = async () => {
    const { data: config } = await supabase.from("game_controls").select("*").eq("game_type", activeTab).maybeSingle();
    if (config) {
      setIsEnabled(config.is_enabled !== false);
      setCoinsPerCorrect(config.coins_per_correct || 1);
      setBonusPerfectScore(config.bonus_perfect_score || 5);
    }

    const { data: qList } = await supabase.from("game_questions").select("*").eq("game_type", activeTab);
    if (qList) setQuestions(qList);

    const { data: logs } = await supabase.from("game_sessions").select("game_type, coins_earned");
    if (logs) {
      let coinsSum = 0;
      const counts = { bible_quiz: 0, math_quiz: 0, guess_logo: 0, true_false: 0, word_search: 0 };
      logs.forEach((l: any) => {
        coinsSum += l.coins_earned || 0;
        if (l.game_type in counts) counts[l.game_type as keyof typeof counts]++;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      setStats({
        totalPlayers: logs.length,
        coinsGiven: coinsSum,
        mostPlayed: sorted[0]?.[0].replace('_', ' ') || "Bible Quiz",
        leastPlayed: sorted[sorted.length - 1]?.[0].replace('_', ' ') || "Word Search",
        counts,
      });
    }
  };

  useEffect(() => { loadGameSectionData(); }, [activeTab]);

  const handleOpenAddModal = () => {
    setEditingId(null); setQuestionText("");
    setOpt1(""); setOpt2(""); setOpt3(""); setOpt4("");
    setCorrectAnswer(""); setDifficulty("easy"); setCoinsReward("1"); setWordClues(""); setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: any) => {
    setEditingId(q.id); setQuestionText(q.question || "");
    setOpt1(q.options?.[0] || ""); setOpt2(q.options?.[1] || "");
    setOpt3(q.options?.[2] || ""); setOpt4(q.options?.[3] || "");
    setCorrectAnswer(q.correct_answer || ""); setDifficulty(q.difficulty || "easy");
    setCoinsReward(q.coins_reward?.toString() || "1"); setWordClues(q.clues?.join(", ") || ""); setLogoFile(null);
    setIsModalOpen(true);
  };

  const handleUploadFile = async (file: File, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `games/${activeTab}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pilikart").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("pilikart").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const handleSaveGameControlSettings = async () => {
    try {
      const settingsUpdate: any = { is_enabled: isEnabled, coins_per_correct: coinsPerCorrect, bonus_perfect_score: bonusPerfectScore };
      if (bgMusicFile) settingsUpdate.bg_music_url = await handleUploadFile(bgMusicFile, "music");
      if (correctFile) settingsUpdate.correct_sound_url = await handleUploadFile(correctFile, "correct");
      if (wrongFile) settingsUpdate.wrong_sound_url = await handleUploadFile(wrongFile, "wrong");
      await supabase.from("game_controls").upsert({ game_type: activeTab, ...settingsUpdate });
      alert("Settings applied!");
      setBgMusicFile(null); setCorrectFile(null); setWrongFile(null);
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalLogoUrl = "";
      if (logoFile) finalLogoUrl = await handleUploadFile(logoFile, "logos");
      const optsArray = [opt1, opt2, opt3, opt4].filter(o => o !== "");
      const cluesArray = wordClues ? wordClues.split(",").map(c => c.trim()) : [];

      const payload: any = {
        game_type: activeTab,
        question: questionText || (activeTab === "guess_logo" ? "Identify the Brand Logo" : ""),
        options: optsArray.length > 0 ? optsArray : null,
        correct_answer: correctAnswer,
        difficulty: (activeTab === "math_quiz" || activeTab === "bible_quiz") ? difficulty : null,
        coins_reward: parseInt(coinsReward) || 1,
        clues: cluesArray.length > 0 ? cluesArray : null,
      };
      if (finalLogoUrl) payload.image_url = finalLogoUrl;

      if (editingId) {
        await supabase.from("game_questions").update(payload).eq("id", editingId);
      } else {
        await supabase.from("game_questions").insert([payload]);
      }
      setIsModalOpen(false);
      loadGameSectionData();
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("game_questions").delete().eq("id", id);
    loadGameSectionData();
  };

  return (
    <AdminLayout>
      {/* Stats - 2 cols on mobile, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-purple-500">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Played Today</div>
          <div className="text-xl font-black text-gray-800 mt-0.5">{stats.totalPlayers}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-400">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Coins Given</div>
          <div className="text-xl font-black text-blue-600 mt-0.5">🪙{stats.coinsGiven}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] text-emerald-600 font-bold uppercase">Most Played</div>
          <div className="text-xs font-black text-gray-800 mt-0.5 capitalize">{stats.mostPlayed}</div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-[10px] text-red-500 font-bold uppercase">Least Played</div>
          <div className="text-xs font-black text-gray-800 mt-0.5 capitalize">{stats.leastPlayed}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Breakdown</div>
          <div className="text-[10px] text-gray-500 space-y-0.5 font-mono">
            {Object.entries(stats.counts).map(([k, v]) => (
              <div key={k}>• {k.replace("_", " ")}: <b>{v}</b></div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation - scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {GAME_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
              activeTab === t.id ? "bg-purple-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main layout: stacked on mobile, sidebar+main on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar: Game Rules Config */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="font-bold text-sm text-gray-800 capitalize flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              {activeTab.replace("_", " ")} Rules
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer font-bold">
              <input type="checkbox" checked={isEnabled} onChange={e => setIsEnabled(e.target.checked)} className="w-4 h-4" />
              <span className={`text-sm font-bold ${isEnabled ? "text-green-600" : "text-red-500"}`}>
                {isEnabled ? "ON" : "OFF"}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Per Correct</label>
              <input
                type="number"
                className="w-full p-2.5 border border-gray-200 rounded-xl text-center font-mono font-bold text-sm focus:outline-none"
                value={coinsPerCorrect}
                onChange={e => setCoinsPerCorrect(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-700 mb-1">10/10 Bonus</label>
              <input
                type="number"
                className="w-full p-2.5 border border-amber-200 bg-amber-50/30 rounded-xl text-center font-mono font-bold text-amber-800 text-sm focus:outline-none"
                value={bonusPerfectScore}
                onChange={e => setBonusPerfectScore(parseInt(e.target.value) || 5)}
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">🎵 Audio Files</div>
            {[
              { label: "Background Music", set: setBgMusicFile },
              { label: "Correct Sound", set: setCorrectFile, color: "text-green-600" },
              { label: "Wrong Sound", set: setWrongFile, color: "text-red-500" },
            ].map(a => (
              <div key={a.label}>
                <label className={`block text-xs font-medium mb-0.5 ${a.color || "text-gray-500"}`}>{a.label}</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="w-full text-xs text-gray-600"
                  onChange={e => a.set(e.target.files?.[0] || null)}
                />
              </div>
            ))}
          </div>

          <Button
            type="button"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm"
            onClick={handleSaveGameControlSettings}
          >
            Apply Settings
          </Button>
        </div>

        {/* Questions Panel */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between shrink-0">
            <span className="font-bold text-gray-800 text-sm capitalize">
              📝 {activeTab.replace("_", " ")} ({questions.length})
            </span>
            <Button size="sm" onClick={handleOpenAddModal} className="text-xs h-8">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>

          <div className="divide-y divide-gray-50 overflow-y-auto max-h-[60vh]">
            {questions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-4xl mb-2">🎮</div>
                <p className="font-medium">No questions yet. Add one!</p>
              </div>
            ) : questions.map((q, i) => (
              <div key={q.id} className="p-4 flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-gray-300 pt-0.5 shrink-0">#{i + 1}</span>
                {q.image_url && (
                  <img src={q.image_url} alt="logo" className="w-10 h-10 object-cover rounded-lg border shrink-0" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  {q.question && (
                    <div className="font-bold text-gray-900 text-sm leading-snug">{q.question}</div>
                  )}
                  {q.options && (
                    <div className="text-xs text-gray-500">
                      Choices: <span className="font-mono text-gray-700 font-bold">{q.options.join(" | ")}</span>
                    </div>
                  )}
                  {q.clues && (
                    <div className="text-xs text-gray-500">
                      Words: <span className="text-purple-600 font-bold">{q.clues.join(", ")}</span>
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded border border-green-100">
                      ✓ {q.correct_answer}
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                      🪙 {q.coins_reward || 1}
                    </span>
                    {q.difficulty && (
                      <span className="text-[10px] bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded uppercase">
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleOpenEditModal(q)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base capitalize">
                {editingId ? "Edit Question" : `Add to ${activeTab.replace("_", " ")}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-5 space-y-4">
              {activeTab !== "guess_logo" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Question / Prompt *</label>
                  <textarea
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                    rows={3}
                    value={questionText}
                    onChange={e => setQuestionText(e.target.value)}
                  />
                </div>
              )}

              {activeTab === "guess_logo" && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">🏷️ Brand Logo Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-gray-600"
                    onChange={e => setLogoFile(e.target.files?.[0] || null)}
                    required={!editingId}
                  />
                </div>
              )}

              {(activeTab === "bible_quiz" || activeTab === "guess_logo") && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Answer Choices</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: opt1, set: setOpt1, label: "Choice A" },
                      { val: opt2, set: setOpt2, label: "Choice B" },
                      { val: opt3, set: setOpt3, label: "Choice C" },
                      { val: opt4, set: setOpt4, label: "Choice D" },
                    ].map(o => (
                      <input
                        key={o.label}
                        type="text"
                        placeholder={o.label}
                        required={activeTab === "bible_quiz" && (o.label === "Choice A" || o.label === "Choice B")}
                        className="p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                        value={o.val}
                        onChange={e => o.set(e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "word_search" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">🔤 Word List (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. JESUS, MOSES, AMEN"
                    required
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary"
                    value={wordClues}
                    onChange={e => setWordClues(e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Correct Answer *</label>
                  {activeTab === "true_false" ? (
                    <select
                      required
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                      value={correctAnswer}
                      onChange={e => setCorrectAnswer(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Tinuod">Tinuod (True)</option>
                      <option value="Bakak">Bakak (False)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Correct answer..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                      value={correctAnswer}
                      onChange={e => setCorrectAnswer(e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Coins Reward</label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono font-bold text-blue-600 text-center focus:outline-none"
                    value={coinsReward}
                    onChange={e => setCoinsReward(e.target.value)}
                  />
                </div>
              </div>

              {(activeTab === "math_quiz" || activeTab === "bible_quiz") && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Difficulty</label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Save Changes" : "Add Question"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
