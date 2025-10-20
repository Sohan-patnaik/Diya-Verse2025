"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Flame,
  MessageSquare,
  Trophy,
  Star,
  Users,
  RefreshCw,
  Bot,
  Heart,
} from "lucide-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// --- Type Definitions ---
interface Confession {
  id: number;
  text: string;
  likes: number;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  name: string;
  score: number;
  badge: string;
}

interface Diya {
  id: number;
  x: number;
  y: number;
}

// --- Main Component ---
export default function DiwaliFest() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<string>("home");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState<boolean>(true);

  // Supabase client instance
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // App Features State
  const [diyas, setDiyas] = useState<Diya[]>([]);
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [generatedWish, setGeneratedWish] = useState<string>("");
  const [rangoliPixels, setRangoliPixels] = useState<string[]>(
    Array(256).fill("#fdf2f8")
  );
  const [selectedColor, setSelectedColor] = useState<string>("#ff6b35");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);

  // --- SUPABASE SETUP & REAL-TIME SYNC ---

  useEffect(() => {
    const initializeSupabase = async () => {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

      if (
        supabaseUrl === "YOUR_SUPABASE_URL" ||
        supabaseKey === "YOUR_SUPABASE_ANON_KEY"
      ) {
        console.error(
          "Supabase credentials are not set. Please update them in DiwaliFest.jsx"
        );
        return;
      }

      const client = createClient(supabaseUrl, supabaseKey);
      setSupabase(client);
    };

    initializeSupabase();

    const savedUserName = localStorage.getItem("diwaliFestUserName");
    const savedUserId = localStorage.getItem("diwaliFestUserId");
    if (savedUserName && savedUserId) {
      setUserName(savedUserName);
      setUserId(savedUserId);
      setShowNameInput(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const fetchInitialData = async () => {
      const { data: leaderboardData } = await supabase
        .from("leaderboard")
        .select("*")
        .order("score", { ascending: false })
        .limit(10);
      if (leaderboardData)
        setLeaderboard(leaderboardData as LeaderboardEntry[]);

      const { data: confessionsData } = await supabase
        .from("confessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (confessionsData) setConfessions(confessionsData as Confession[]);

      const { data: rangoliData } = await supabase
        .from("rangoli")
        .select("pixels")
        .eq("id", "mainCanvas")
        .single();
      if (rangoliData && rangoliData.pixels?.length === 256) {
        setRangoliPixels(rangoliData.pixels);
      } else {
        await supabase
          .from("rangoli")
          .upsert({ id: "mainCanvas", pixels: Array(256).fill("#1a1a2e") });
      }
    };
    fetchInitialData();

    const confessionsChannel = supabase
      .channel("public:confessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confessions" },
        async () => {
          const { data: newConfessions } = await supabase
            .from("confessions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          if (newConfessions) setConfessions(newConfessions as Confession[]);
        }
      )
      .subscribe();

    const leaderboardChannel = supabase
      .channel("public:leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leaderboard" },
        async () => {
          const { data: newLeaderboard } = await supabase
            .from("leaderboard")
            .select("*")
            .order("score", { ascending: false })
            .limit(10);
          if (newLeaderboard)
            setLeaderboard(newLeaderboard as LeaderboardEntry[]);
        }
      )
      .subscribe();

    const rangoliChannel = supabase
      .channel("public:rangoli")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rangoli",
          filter: `id=eq.mainCanvas`,
        },
        (payload) => {
          if (payload.new.pixels) {
            setRangoliPixels(payload.new.pixels);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(confessionsChannel);
      supabase.removeChannel(leaderboardChannel);
      supabase.removeChannel(rangoliChannel);
    };
  }, [supabase]);

  // --- STATIC CONTENT & DATA ---
  const quizQuestions = [
  {
    q: "Your mom says, 'Don’t burn too many crackers, save money!' What do you do?",
    options: [
      "Nod… then secretly light a full box of phuljhadis 🔥",
      "Agree and start comparing cracker prices online 💸",
      "Say 'I’m saving nature, not money' 🌱",
      "Distract her with sweets 🍬",
    ],
    correct: 3,
  },
  {
    q: "Which Diwali sweet best describes your college life?",
    options: [
      "Soan Papdi – everyone passes the responsibility around 😩",
      "Rasgulla – soft on the outside, stressed inside 🥲",
      "Kaju Katli – premium, but low in stock 💎",
      "Gulab Jamun – rolling through life effortlessly 😎",
    ],
    correct: 0,
  },
  {
    q: "What's your role in Diwali house cleaning?",
    options: [
      "Photographer – 'Maa, smile while dusting!' 📸",
      "Supervisor – giving moral support 😇",
      "Actual cleaner – why did I agree to this 😩",
      "Escape artist – suddenly have ‘urgent college work’ 🏃‍♂️",
    ],
    correct: 3,
  },
  {
    q: "If your friend group planned a Diwali party, what would you bring?",
    options: [
      "Fairy lights (because you forgot snacks again 💡)",
      "Bluetooth speaker 🎶",
      "Soan Papdi from last year 🧁",
      "Just vibes and bad jokes 😎",
    ],
    correct: 1,
  },
  {
    q: "What's the real reason you wear new clothes on Diwali?",
    options: [
      "For the family WhatsApp DP 📸",
      "Because mom forced you 👗",
      "To flex on Instagram 😏",
      "All of the above",
    ],
    correct: 3,
  },
];

  const rangoliColors = [
    "#ff6b35",
    "#f7931e",
    "#ffd700",
    "#ff1493",
    "#00ff00",
    "#00bfff",
    "#9d4edd",
    "#ffffff",
    "#831843",
  ];
  const aiWishTemplates = {
    funny: ["Hope your Diwali is as lit as your phone's screen time..."],
    poetic: ["May the glow of a million diyas light up your path..."],
    sarcastic: ["Congrats on surviving another year of family gatherings..."],
  };

  // --- CORE FUNCTIONS (now interacting with Supabase) ---

  const addConfession = async () => {
    if (!supabase) return;
    const confessionInput = document.getElementById(
      "confessionInput"
    ) as HTMLInputElement | null;
    if (confessionInput?.value.trim()) {
      const text = confessionInput.value.trim();
      confessionInput.value = "";
      await supabase.from("confessions").insert({ text: text, likes: 0 });
    }
  };

  const handleLike = async (id: number) => {
    if (!supabase) return;
    await supabase.rpc("increment_likes", { confession_id: id });
  };

  const updateLeaderboard = async (finalScore: number) => {
    if (!supabase || !userName || !userId) return;
    let badge = "✨";
    if (finalScore >= 20) badge = "🏆 Patakha Pro";
    else if (finalScore >= 10) badge = "🔥 Rocket";

    await supabase
      .from("leaderboard")
      .upsert({ user_id: userId, name: userName, score: finalScore, badge });
  };

  const paintRangoli = async (index: number) => {
    if (!supabase) return;
    const newPixels = [...rangoliPixels];
    newPixels[index] = selectedColor;
    setRangoliPixels(newPixels);
    await supabase
      .from("rangoli")
      .update({ pixels: newPixels })
      .eq("id", "mainCanvas");
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      const newUserId = crypto.randomUUID();
      setUserId(newUserId);
      localStorage.setItem("diwaliFestUserName", userName.trim());
      localStorage.setItem("diwaliFestUserId", newUserId);
      setShowNameInput(false);
    }
  };

  // --- Other client-side functions ---
  const lightDiya = (x: number, y: number) => {
    const id = Date.now();
    setDiyas((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setDiyas((prev) => prev.filter((d) => d.id !== id)), 3000);
  };

  const generateAiWish = (vibe: "funny" | "poetic" | "sarcastic") => {
    const templates = aiWishTemplates[vibe];
    const randomIndex = Math.floor(Math.random() * templates.length);
    setGeneratedWish(templates[randomIndex]);
  };

  const copyWishToClipboard = () => {
    if (generatedWish) {
      navigator.clipboard
        .writeText(generatedWish)
        .then(() => {
          alert("Wish copied to clipboard!");
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  };

  const answerQuiz = (index: number) => {
    if (quizCompleted) return;
    let newScore = quizScore;
    if (index === quizQuestions[currentQuestion].correct) newScore += 10;
    setQuizScore(newScore);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
      updateLeaderboard(newScore);
    }
  };

  const resetQuiz = () => {
    setQuizScore(0);
    setCurrentQuestion(0);
    setQuizCompleted(false);
  };

  // --- RENDER LOGIC ---
  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 flex items-center justify-center p-4 font-sans">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-yellow-300 animate-pulse" />
          <h1 className="text-4xl font-bold text-white mb-2">
            Digital Diwali Fest
          </h1>
          <p className="text-yellow-200 mb-6">
            Join the biggest online celebration!
          </p>
          <input
            type="text"
            placeholder="Enter your name to join"
            className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-4 text-center"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            disabled={!userName.trim()}
          >
            Enter Fest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-white font-sans">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 53, 0.7);
          border-radius: 10px;
        }
      `}</style>
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            <h1 className="text-2xl font-bold">Digital Diwali Fest</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
            <Users className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-medium">{userName}</span>
          </div>
        </div>
      </header>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {[
            { id: "home", icon: Sparkles, label: "Home" },
            {
              id: "confessions",
              icon: MessageSquare,
              label: "Confession Wall",
            },
            { id: "aiGenerator", icon: Bot, label: "AI Wish Gen" },
            { id: "rangoli", icon: Star, label: "Digital Rangoli" },
            { id: "quiz", icon: Trophy, label: "Meme Quiz" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap text-sm sm:text-base font-semibold ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg scale-105"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h2 className="text-4xl font-bold mb-4 text-center lg:text-left">
                Welcome to the Fest! 🎉
              </h2>
              <p className="text-center lg:text-left text-lg text-yellow-200 mb-6">
                Hey, {userName}! Ditch the lectures, grab some sweets, and dive
                into the fun. Explore the fest, top the leaderboard, and make
                some memories.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab("quiz")}
                  className="cursor-pointer bg-gradient-to-br from-green-500/20 to-teal-500/20 p-6 rounded-xl border border-white/20 hover:border-white transition-all transform hover:-translate-y-1"
                >
                  <Trophy className="w-10 h-10 mb-3 text-yellow-400" />
                  <h3 className="font-bold text-lg mb-1">Take the Meme Quiz</h3>
                  <p className="text-sm text-gray-300">
                    Think you're funny? Prove it.
                  </p>
                </div>
                <div
                  onClick={() => setActiveTab("confessions")}
                  className="cursor-pointer bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6 rounded-xl border border-white/20 hover:border-white transition-all transform hover:-translate-y-1"
                >
                  <MessageSquare className="w-10 h-10 mb-3 text-purple-400" />
                  <h3 className="font-bold text-lg mb-1">Diwali Confessions</h3>
                  <p className="text-sm text-gray-300">
                    Spill the tea. Anonymously.
                  </p>
                </div>
                <div
                  onClick={() => setActiveTab("aiGenerator")}
                  className="cursor-pointer bg-gradient-to-br from-pink-500/20 to-indigo-500/20 p-6 rounded-xl border border-white/20 hover:border-white transition-all transform hover:-translate-y-1"
                >
                  <Bot className="w-10 h-10 mb-3 text-pink-400" />
                  <h3 className="font-bold text-lg mb-1">AI Wish Generator</h3>
                  <p className="text-sm text-gray-300">
                    Generate wishes for your crew.
                  </p>
                </div>
                <div
                  onClick={() => setActiveTab("rangoli")}
                  className="cursor-pointer bg-gradient-to-br from-pink-500/20 to-yellow-500/20 p-6 rounded-xl border border-white/20 hover:border-white transition-all transform hover:-translate-y-1"
                >
                  <Star className="w-10 h-10 mb-3 text-yellow-400" />
                  <h3 className="font-bold text-lg mb-1">Create Rangoli</h3>
                  <p className="text-sm text-gray-300">
                    Collaborate on digital art.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold mb-6 text-center">
                Leaderboard 🏆
              </h2>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, i) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center justify-between bg-white/10 p-3 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-yellow-400 w-6 text-center">
                          #{i + 1}
                        </span>
                        <span className="font-semibold truncate">
                          {entry.name}{" "}
                          <span className="text-xs">{entry.badge}</span>
                        </span>
                      </div>
                      <span className="text-lg font-bold text-yellow-300">
                        {entry.score} pts
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">
                    Take the quiz to get ranked!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "confessions" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Diwali Confession Wall 🤫
            </h2>
            <p className="text-center text-yellow-200 mb-6">
              Share your funniest stories. It's totally anonymous.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                id="confessionInput"
                type="text"
                placeholder="I confess that I re-gifted soan papdi..."
                className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                onKeyPress={(e) => e.key === "Enter" && addConfession()}
              />
              <button
                onClick={addConfession}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg font-semibold"
              >
                Post Anonymously
              </button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {confessions.length > 0 ? (
                confessions
                  .sort((a, b) => b.likes - a.likes)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="bg-white/10 p-4 rounded-lg border border-white/20"
                    >
                      <p className="mb-2 text-gray-200">{c.text}</p>
                      <button
                        onClick={() => handleLike(c.id)}
                        className="text-sm text-pink-400 font-medium flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full"
                      >
                        <Heart className="w-4 h-4" /> {c.likes}
                      </button>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-400 py-8">
                  Be the first to confess!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "aiGenerator" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-center">
            <h2 className="text-3xl font-bold mb-2">
              AI Diwali Wish Generator 🤖
            </h2>
            <p className="text-yellow-200 mb-6">
              Tired of the same old "Happy Diwali"? Generate a unique wish!
            </p>
            <div className="flex justify-center gap-3 flex-wrap mb-6">
              <button
                onClick={() => generateAiWish("funny")}
                className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-semibold"
              >
                😂 Funny
              </button>
              <button
                onClick={() => generateAiWish("poetic")}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold"
              >
                ✍️ Poetic
              </button>
              <button
                onClick={() => generateAiWish("sarcastic")}
                className="px-5 py-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-lg font-semibold"
              >
                😒 Sarcastic
              </button>
            </div>
            {generatedWish && (
              <div className="bg-black/20 p-6 rounded-xl animate-fadeIn">
                <p className="text-lg mb-4 min-h-[50px]">{generatedWish}</p>
                <button
                  onClick={copyWishToClipboard}
                  className="px-6 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm"
                >
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "rangoli" && (
          <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100 rounded-3xl p-8 border border-amber-200 shadow-xl transition-all duration-300">
            <h2 className="text-3xl font-semibold mb-6 text-center text-rose-700 font-serif tracking-wide drop-shadow-sm">
              Diwali Digital Rangoli 🪔
            </h2>

            <div className="mb-6 flex gap-3 justify-center flex-wrap">
              {rangoliColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-transform duration-200 ease-in-out hover:scale-110 ${
                    selectedColor === color
                      ? "ring-4 ring-pink-300 scale-110 shadow-md"
                      : "border-white/50"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="grid grid-cols-16 gap-1 max-w-xl mx-auto bg-white/40 p-3 rounded-2xl backdrop-blur-sm shadow-inner">
              {rangoliPixels.map((color, i) => (
                <button
                  key={i}
                  onClick={() => paintRangoli(i)}
                  className="aspect-square rounded-full transition-transform duration-200 ease-out hover:scale-125"
                  style={{
                    backgroundColor: color || "transparent",
                    boxShadow: color ? `0 0 6px ${color}` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold mb-6 text-center">
              The Ultimate Diwali Meme Quiz 🏆
            </h2>
            <div className="max-w-2xl mx-auto">
              {quizCompleted ? (
                <div className="text-center">
                  <h3 className="text-4xl font-bold text-yellow-300 mb-4">
                    Quiz Complete!
                  </h3>
                  <p className="text-2xl mb-8">
                    Your final score:{" "}
                    <span className="font-bold">{quizScore}</span>
                  </p>
                  <button
                    onClick={resetQuiz}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Play Again
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <p className="text-xl mb-2">
                      Question {currentQuestion + 1} of {quizQuestions.length}
                    </p>
                    <p className="text-2xl font-semibold text-yellow-300">
                      Score: {quizScore}
                    </p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-xl mb-6">
                    <h3 className="text-xl mb-4 text-center">
                      {quizQuestions[currentQuestion].q}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quizQuestions[currentQuestion].options.map(
                        (option, i) => (
                          <button
                            key={i}
                            onClick={() => answerQuiz(i)}
                            className="w-full p-4 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-all border border-white/20 hover:border-yellow-400 transform hover:scale-105"
                          >
                            {option}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
