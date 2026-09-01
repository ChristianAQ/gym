import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Flame, Trophy, Users, X, Swords } from "lucide-react";
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
  const [rival, setRival] = useState(null);

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

  const me = useMemo(
    () => ({
      uid: user?.uid,
      displayName: profile?.displayName || user?.displayName || "Tú",
      photoURL: profile?.photoURL || user?.photoURL,
      currentStreak: profile?.currentStreak ?? 0,
      bestStreak: profile?.bestStreak ?? 0,
      prs: profile?.prs ?? {},
    }),
    [user, profile]
  );

  const people = useMemo(() => [me, ...friends], [me, friends]);

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
            <motion.button
              key={p.uid}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => !isMe && setRival(p)}
              className={`w-full card p-3.5 flex items-center gap-3 text-left ${isMe ? "ring-2 ring-blaze-500/60" : "active:bg-ink-800/60"}`}
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
                {!isMe && <p className="text-ink-500 text-xs">Toca para competir</p>}
              </div>
              <div className="text-right shrink-0">
                <span className="font-heading text-lg font-semibold text-blaze-500">{p.value}</span>
                <span className="text-ink-500 text-xs ml-1">{p.suffix}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {rival && <CompareModal me={me} rival={rival} onClose={() => setRival(null)} />}
      </AnimatePresence>
    </PageTransition>
  );
}

function CompareModal({ me, rival, onClose }) {
  const rows = [
    { label: "Racha actual", meVal: me.currentStreak ?? 0, rivalVal: rival.currentStreak ?? 0, suffix: "días" },
    { label: "Mejor racha", meVal: me.bestStreak ?? 0, rivalVal: rival.bestStreak ?? 0, suffix: "días" },
    ...KEY_EXERCISES.map((ex) => ({
      label: ex,
      meVal: me.prs?.[ex]?.weight ?? 0,
      rivalVal: rival.prs?.[ex]?.weight ?? 0,
      suffix: "kg",
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-blaze-500" />
            <p className="font-heading uppercase tracking-wide">Cara a cara</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col items-center gap-1.5 w-24">
            <Avatar name={me.displayName} photoURL={me.photoURL} size={52} />
            <p className="text-xs text-ink-300 truncate max-w-full">Tú</p>
          </div>
          <span className="font-heading text-ink-600 text-sm">VS</span>
          <div className="flex flex-col items-center gap-1.5 w-24">
            <Avatar name={rival.displayName} photoURL={rival.photoURL} size={52} />
            <p className="text-xs text-ink-300 truncate max-w-full">{rival.displayName}</p>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <p className="text-center text-[11px] text-ink-500 uppercase tracking-wide mb-1">{row.label}</p>
              <div className="flex items-center gap-3">
                <span
                  className={`flex-1 text-right font-heading text-lg font-semibold ${
                    row.meVal > row.rivalVal ? "text-blaze-500" : "text-ink-400"
                  }`}
                >
                  {row.meVal} {row.suffix}
                </span>
                <div className="w-1 h-5 bg-ink-800 rounded-full shrink-0" />
                <span
                  className={`flex-1 text-left font-heading text-lg font-semibold ${
                    row.rivalVal > row.meVal ? "text-blaze-500" : "text-ink-400"
                  }`}
                >
                  {row.rivalVal} {row.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
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
