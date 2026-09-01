import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Dumbbell, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkoutsByDate } from "../lib/firestore";
import { formatFullDate, isToday } from "../lib/date";
import PageTransition from "../components/PageTransition";
import Calendar from "../components/Calendar";
import Avatar from "../components/Avatar";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(null);

  const streak = profile?.currentStreak ?? 0;
  const best = profile?.bestStreak ?? 0;
  const workoutDates = profile?.workoutDates ?? [];
  const prCount = Object.keys(profile?.prs ?? {}).length;
  const displayName = profile?.displayName || user?.displayName || "Atleta";
  const photoURL = profile?.photoURL || user?.photoURL;
  const firstName = displayName.split(" ")[0];

  return (
    <PageTransition className="px-5 pt-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-ink-400 text-sm">Hola,</p>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">{firstName}</h1>
        </div>
        <button onClick={() => navigate("/profile")} aria-label="Ir a tu perfil" className="active:opacity-70">
          <Avatar name={displayName} photoURL={photoURL} size={48} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 mb-5 bg-blaze-gradient border-none relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 opacity-20">
          <Flame className="w-32 h-32" strokeWidth={1} />
        </div>
        <p className="text-white/80 text-xs uppercase tracking-widest font-heading">Racha actual</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="font-heading text-6xl font-semibold text-white leading-none">{streak}</span>
          <span className="text-white/80 font-heading uppercase mb-1.5">
            {streak === 1 ? "día" : "días"}
          </span>
        </div>
        <p className="text-white/70 text-sm mt-2">
          {streak === 0
            ? "Hoy es un buen día para empezar."
            : `Tu mejor racha: ${best} ${best === 1 ? "día" : "días"}.`}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <StatCard icon={Trophy} label="Mejor racha" value={best} onClick={() => navigate("/leaderboard")} />
        <StatCard icon={Dumbbell} label="Récords" value={prCount} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Calendar workoutDates={workoutDates} onSelectDay={setSelectedDay} />
      </motion.div>

      <AnimatePresence>
        {selectedDay && (
          <DayDetailModal
            uid={user.uid}
            dateKey={selectedDay}
            logged={workoutDates.includes(selectedDay)}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function DayDetailModal({ uid, dateKey, logged, onClose }) {
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    let active = true;
    if (!logged) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    getWorkoutsByDate(uid, dateKey)
      .then((list) => active && setWorkouts(list))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid, dateKey, logged]);

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
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10 max-h-[75vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-heading uppercase tracking-wide text-lg flex items-center gap-2">
              {formatFullDate(dateKey)}
              {isToday(dateKey) && (
                <span className="text-[10px] bg-blaze-500/20 text-blaze-400 px-2 py-0.5 rounded-full normal-case tracking-normal">
                  Hoy
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <p className="text-ink-500 text-sm text-center py-6">Cargando...</p>}

        {!loading && workouts.length === 0 && (
          <div className="text-center py-8">
            <Dumbbell className="w-8 h-8 text-ink-600 mx-auto mb-2" />
            <p className="text-ink-400 text-sm">No registraste ningún entrenamiento este día.</p>
          </div>
        )}

        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="space-y-2">
                {w.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink-200 flex items-center gap-1.5">
                      {ex.name}
                      {ex.isPR && <span title="Récord personal">🔥</span>}
                    </span>
                    <span className="font-heading font-semibold text-blaze-500">
                      {ex.weight} kg
                      <span className="text-ink-500 font-normal ml-1">
                        × {ex.sets}×{ex.reps}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              {w.note && <p className="text-ink-500 text-xs mt-3 border-t border-ink-800 pt-2">{w.note}</p>}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`card p-4 flex items-center gap-3 text-left ${onClick ? "active:bg-ink-800/60" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-blaze-500/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blaze-500" />
      </div>
      <div>
        <p className="font-heading text-xl font-semibold leading-none">{value}</p>
        <p className="text-ink-500 text-xs mt-1">{label}</p>
      </div>
    </Tag>
  );
}
