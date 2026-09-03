import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Flame,
  Trophy,
  Users,
  X,
  Swords,
  CalendarCheck,
  BarChart3,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { listFriendProfiles } from "../lib/firestore";
import { KEY_EXERCISES, MUSCLE_GROUPS } from "../lib/exercises";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";
import MuscleIcon from "../components/MuscleIcon";

const RANK_STYLES = [
  "bg-blaze-gradient text-white shadow-blaze",
  "bg-ink-700 text-ink-100",
  "bg-ink-800 text-ink-200",
];

const TABS = [
  { key: "racha", label: "Racha", icon: Flame },
  { key: "dias", label: "Días", icon: CalendarCheck },
  { key: "volumen", label: "Volumen", icon: BarChart3 },
  { key: "records", label: "Récords", icon: Trophy },
];

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tab, setTab] = useState("racha");
  const [exercise, setExercise] = useState(KEY_EXERCISES[0]);
  const [rival, setRival] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    try {
      const list = await listFriendProfiles(user.uid);
      setFriends(list);
    } catch (err) {
      console.error("[GymRat] No se pudo cargar el ranking:", err);
      setLoadError(
        err.code === "permission-denied"
          ? "Firestore rechazó la petición (permission-denied). Revisa que las reglas de Firestore de firestore.rules estén publicadas en la consola de Firebase."
          : "No se pudo cargar tu lista de amigos. Comprueba tu conexión e inténtalo de nuevo."
      );
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
      workoutDates: profile?.workoutDates ?? [],
      totalVolume: profile?.totalVolume ?? 0,
      prs: profile?.prs ?? {},
    }),
    [user, profile]
  );

  const people = useMemo(() => [me, ...friends], [me, friends]);

  const ranked = useMemo(() => {
    const rank = (getValue, suffix) =>
      [...people].map((p) => ({ ...p, value: getValue(p), suffix })).sort((a, b) => b.value - a.value);

    switch (tab) {
      case "dias":
        return rank((p) => p.workoutDates?.length ?? 0, "días");
      case "volumen":
        return rank((p) => p.totalVolume ?? 0, "kg");
      case "records":
        return rank((p) => p.prs?.[exercise]?.weight ?? 0, "kg");
      default:
        return rank((p) => p.currentStreak ?? 0, "días");
    }
  }, [people, tab, exercise]);

  return (
    <PageTransition className="px-5 pt-[calc(env(safe-area-inset-top)+2rem)] max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">Ranking</h1>
        <button onClick={load} className="p-2 text-ink-400 active:text-blaze-500">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {friends.length > 0 && (
        <div className="mb-5">
          <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-2">Tus amigos</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {friends.map((f) => (
              <button
                key={f.uid}
                onClick={() => setRival(f)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 active:opacity-70"
              >
                <Avatar name={f.displayName} photoURL={f.photoURL} size={52} />
                <span className="text-[11px] text-ink-300 truncate w-full text-center">
                  {(f.displayName || "?").split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 px-4 py-2.5 rounded-xl font-heading uppercase text-sm tracking-wide flex items-center gap-1.5 transition-colors ${
              tab === key ? "bg-blaze-gradient text-white shadow-blaze" : "bg-ink-800 text-ink-400"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "records" && (
        <div className="relative mb-4">
          <MuscleIcon
            exercise={exercise}
            className="w-4 h-4 text-blaze-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            className="input-field w-full appearance-none pl-10 pr-10"
          >
            <optgroup label="Ejercicios clave">
              {KEY_EXERCISES.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </optgroup>
            {MUSCLE_GROUPS.map((group) => (
              <optgroup key={group.name} label={group.name}>
                {group.exercises.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-ink-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      )}

      {loadError && (
        <div className="card p-6 text-center mb-4 border-red-900/50">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-300 text-sm">{loadError}</p>
        </div>
      )}

      {friends.length === 0 && !loading && !loadError && (
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
                <span className="font-heading text-lg font-semibold text-blaze-500">
                  {p.value.toLocaleString("es-ES")}
                </span>
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
    {
      label: "Entrenamientos",
      meVal: me.workoutDates?.length ?? 0,
      rivalVal: rival.workoutDates?.length ?? 0,
      suffix: "días",
    },
    { label: "Volumen total", meVal: me.totalVolume ?? 0, rivalVal: rival.totalVolume ?? 0, suffix: "kg" },
    ...KEY_EXERCISES.map((ex) => ({
      label: ex,
      exercise: ex,
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
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto"
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
              <p className="text-center text-[11px] text-ink-500 uppercase tracking-wide mb-1 flex items-center justify-center gap-1">
                {row.exercise && <MuscleIcon exercise={row.exercise} className="w-3 h-3" />}
                {row.label}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className={`flex-1 text-right font-heading text-lg font-semibold ${
                    row.meVal > row.rivalVal ? "text-blaze-500" : "text-ink-400"
                  }`}
                >
                  {row.meVal.toLocaleString("es-ES")} {row.suffix}
                </span>
                <div className="w-1 h-5 bg-ink-800 rounded-full shrink-0" />
                <span
                  className={`flex-1 text-left font-heading text-lg font-semibold ${
                    row.rivalVal > row.meVal ? "text-blaze-500" : "text-ink-400"
                  }`}
                >
                  {row.rivalVal.toLocaleString("es-ES")} {row.suffix}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

