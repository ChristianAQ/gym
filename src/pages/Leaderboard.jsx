import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Flame, Trophy, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { listFriendProfiles } from "../lib/firestore";
import { KEY_EXERCISES } from "../lib/exercises";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";

const RANK_STYLES = [
  "bg-blaze-gradient text-white shadow-blaze",
  "bg-ink-700 text-ink-100",
  "bg-ink-800 text-ink-200",
];

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("racha");
  const [exercise, setExercise] = useState(KEY_EXERCISES[0]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listFriendProfiles(user.uid);
      setFriends(list);
    } catch (err) {
      console.error("[GymRat] No se pudo cargar el ranking:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const people = useMemo(() => {
    const me = {
      uid: user?.uid,
      displayName: user?.displayName || "Tú",
      photoURL: user?.photoURL,
      currentStreak: profile?.currentStreak ?? 0,
      bestStreak: profile?.bestStreak ?? 0,
      prs: profile?.prs ?? {},
    };
    return [me, ...friends];
  }, [user, profile, friends]);

  const ranked = useMemo(() => {
    if (tab === "racha") {
      return [...people]
        .map((p) => ({ ...p, value: p.currentStreak ?? 0, suffix: "días" }))
        .sort((a, b) => b.value - a.value);
    }
    return [...people]
      .map((p) => ({ ...p, value: p.prs?.[exercise]?.weight ?? 0, suffix: "kg" }))
      .sort((a, b) => b.value - a.value);
  }, [people, tab, exercise]);

  return (
    <PageTransition className="px-5 pt-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">Ranking</h1>
        <button onClick={load} className="p-2 text-ink-400 active:text-blaze-500">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex bg-ink-800 rounded-2xl p-1 mb-4">
        <TabButton active={tab === "racha"} onClick={() => setTab("racha")} icon={Flame} label="Racha" />
        <TabButton active={tab === "records"} onClick={() => setTab("records")} icon={Trophy} label="Récords" />
      </div>

      {tab === "records" && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
          {KEY_EXERCISES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExercise(ex)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-heading uppercase tracking-wide whitespace-nowrap transition-colors ${
                exercise === ex ? "bg-blaze-gradient text-white shadow-blaze" : "bg-ink-800 text-ink-400"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {friends.length === 0 && !loading && (
        <div className="card p-6 text-center mb-4">
          <Users className="w-8 h-8 text-ink-600 mx-auto mb-2" />
          <p className="text-ink-400 text-sm">
            Todavía no tienes amigos añadidos. Ve a tu perfil y comparte tu ID de GymRat.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {ranked.map((p, i) => {
          const isMe = p.uid === user?.uid;
          return (
            <motion.div
              key={p.uid}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card p-3.5 flex items-center gap-3 ${isMe ? "ring-2 ring-blaze-500/60" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-heading text-sm font-semibold shrink-0 ${
                  RANK_STYLES[i] || "bg-ink-800 text-ink-500"
                }`}
              >
                {i + 1}
              </div>
              <Avatar name={p.displayName} photoURL={p.photoURL} size={38} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{isMe ? `${p.displayName} (Tú)` : p.displayName}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-heading text-lg font-semibold text-blaze-500">{p.value}</span>
                <span className="text-ink-500 text-xs ml-1">{p.suffix}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageTransition>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl font-heading uppercase text-sm tracking-wide flex items-center justify-center gap-1.5 transition-colors ${
        active ? "bg-blaze-gradient text-white shadow-blaze" : "text-ink-400"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
