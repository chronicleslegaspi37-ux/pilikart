import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Check, X, Coins } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function GamePage() {
  const { type } = useParams();
  const [, setLocation] = useLocation();
  const { user, refreshUser } = useAuth();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  useEffect(() => {
    if (!user || !type) return;

    const checkAndLoad = async () => {
      // Check if played today
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase
        .from("game_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_type", type)
        .eq("played_date", today)
        .maybeSingle();

      if (session) {
        setHasPlayedToday(true);
        setIsFinished(true);
        return;
      }

      // Load questions
      const { data } = await supabase
        .from("game_questions")
        .select("*")
        .eq("game_type", type)
        .eq("is_active", true)
        .order("sort_order")
        .limit(10);
        
      if (data) setQuestions(data);
    };

    checkAndLoad();
  }, [user, type]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // prevent double click
    
    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correct_answer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(s => s + 1);
      // Play ding sound
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..."); // dummy small sound
        audio.play().catch(e => {});
      } catch (e) {}
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        finishGame(score + (correct ? 1 : 0));
      }
    }, 1500);
  };

  const finishGame = async (finalScore: number) => {
    setIsFinished(true);
    if (!user || !type) return;

    const today = new Date().toISOString().split('T')[0];
    const coinsEarned = finalScore; // 1 coin per correct answer

    await supabase.from("game_sessions").insert([{
      user_id: user.id,
      game_type: type,
      score: finalScore,
      coins_earned: coinsEarned,
      played_date: today
    }]);

    if (coinsEarned > 0) {
      await supabase.from("users").update({ coins: user.coins + coinsEarned }).eq("id", user.id);
      await supabase.from("coin_transactions").insert([{
        user_id: user.id,
        amount: coinsEarned,
        type: "game",
        description: `Won ${type} game`
      }]);
      await refreshUser();
    }
  };

  if (!questions.length && !hasPlayedToday) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  const formatTitle = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center max-w-[430px] mx-auto">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
          <Coins className="w-12 h-12 text-yellow-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Game Over!</h1>
        
        {hasPlayedToday ? (
          <p className="text-gray-400 mb-8">You have already played {formatTitle(type!)} today. Come back tomorrow!</p>
        ) : (
          <>
            <p className="text-gray-400 mb-2">You scored</p>
            <div className="text-5xl font-black text-primary mb-8">{score} / {questions.length}</div>
            <p className="text-yellow-400 font-bold mb-8">+{score} Coins Earned!</p>
          </>
        )}
        
        <Button 
          className="w-full h-14 rounded-2xl bg-white text-gray-900 hover:bg-gray-100 text-lg font-bold"
          onClick={() => setLocation("/rewards")}
        >
          Back to Rewards
        </Button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col max-w-[430px] mx-auto">
      <header className="p-4 flex items-center justify-between">
        <button onClick={() => setLocation("/rewards")} className="p-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="font-bold text-gray-400">{formatTitle(type!)}</div>
        <div className="font-bold bg-white/10 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {questions.length}
        </div>
      </header>

      <div className="flex-1 flex flex-col p-6 pb-12">
        <div className="flex-1 flex items-center justify-center mb-8">
          <h2 className="text-2xl font-bold text-center leading-relaxed">
            {q.question}
          </h2>
        </div>

        <div className="space-y-3">
          {q.options.map((opt: string, idx: number) => {
            const isSelected = selectedAnswer === opt;
            const isCorrectAnswer = opt === q.correct_answer;
            
            let btnClass = "bg-white/10 border-transparent text-white hover:bg-white/20";
            if (selectedAnswer) {
              if (isCorrectAnswer) btnClass = "bg-green-500 border-green-400 text-white";
              else if (isSelected) btnClass = "bg-red-500 border-red-400 text-white";
              else btnClass = "bg-white/5 opacity-50";
            }

            return (
              <button
                key={idx}
                disabled={!!selectedAnswer}
                onClick={() => handleAnswer(opt)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-lg transition-all flex items-center justify-between ${btnClass}`}
              >
                <span>{opt}</span>
                {selectedAnswer && isCorrectAnswer && <Check className="w-5 h-5 text-white" />}
                {selectedAnswer && isSelected && !isCorrectAnswer && <X className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
