import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Dumbbell, X, Moon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkoutsByDate, updateWeeklyGoal } from "../lib/firestore";
import { formatFullDate, isToday, countThisWeek } from "../lib/date";
import { EXERCISE_TO_MUSCLE } from "../lib/exercises";
import PageTransition from "../components/PageTransition";
import Calendar from "../components/Calendar";
import Avatar from "../components/Avatar";
import MuscleIcon from "../components/MuscleIcon";

// Cuántos días de la semana son de entreno (no descanso) según la rutina
// activa — el objetivo semanal no tiene sentido pedir más días de los que
// la propia rutina dedica a entrenar. Sin rutina activa no hay con qué
// acotarlo, así que se permiten los 7.
function trainingDaysCount(routine) {
  if (!routine) return 7;
  const restCount = Object.values(routine.restDays || {}).filter(Boolean).length;
  return Math.max(0, 7 - restCount);
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(null);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);

  const streak = profile?.currentStreak ?? 0;
  const best = profile?.bestStreak ?? 0;
  const workoutDates = profile?.workoutDates ?? [];
  const displayName = profile?.displayName || user?.displayName || "Atleta";
  const photoURL = profile?.photoURL || user?.photoURL;
  const firstName = displayName.split(" ")[0];

  const activeRoutine = profile?.activeRoutineId ? profile?.routines?.[profile.activeRoutineId] : null;
  const todayIdx = new Date().getDay();
  const todayIsRest = !!activeRoutine?.restDays?.[todayIdx];
  const todayExercises = activeRoutine?.days?.[todayIdx] || [];
  const todayMuscles = [...new Set(todayExercises.map((ex) => EXERCISE_TO_MUSCLE[ex.name]).filter(Boolean))].slice(
    0,
    3
  );

  const maxGoal = trainingDaysCount(activeRoutine);
  const weeklyGoal = profile?.weeklyGoal ? Math.min(profile.weeklyGoal, maxGoal) : null;
  const weekCount = countThisWeek(workoutDates);

  async function handleSetGoal(n) {
    setGoalSheetOpen(false);
    await updateWeeklyGoal(user.uid, n);
  }

  return (
    <PageTransition className="px-5 pt-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-ink-400 text-sm">Hola,</p>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">{firstName}</h1>
        </div>
        <button onClick={() => navigate("/profile")} aria-label="Ir a tu perfil" className="active:opacity-70">
          <Avatar name={displayName} photoURL={photoURL} size={48} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-3.5 mb-3 bg-blaze-gradient border-none flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-white shrink-0" strokeWidth={2.2} />
          <span className="font-heading text-3xl font-semibold text-white leading-none">{streak}</span>
          <span className="text-white/80 font-heading uppercase text-xs">{streak === 1 ? "día" : "días"}</span>
        </div>
        <span className="text-white/70 text-xs shrink-0">Mejor: {best}</span>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={() => navigate("/routine")}
          className="card p-3 text-left active:bg-ink-800/60 min-w-0"
        >
          <p className="text-ink-500 text-[10px] uppercase font-heading tracking-wide mb-1.5">Hoy</p>
          {!activeRoutine ? (
            <span className="text-blaze-500 text-sm">Elegir rutina</span>
          ) : todayIsRest ? (
            <span className="flex items-center gap-1.5 text-sm text-ink-300">
              <Moon className="w-3.5 h-3.5 shrink-0" /> Descanso
            </span>
          ) : todayExercises.length > 0 ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex -space-x-1 shrink-0">
                {todayMuscles.map((m) => (
                  <MuscleIcon key={m} muscle={m} className="w-3.5 h-3.5 text-blaze-500" />
                ))}
              </div>
              <span className="text-sm text-ink-200 truncate">{todayExercises.length} ejerc.</span>
            </div>
          ) : (
            <span className="text-sm text-ink-500">Sin ejercicios</span>
          )}
        </button>

        <button
          onClick={() => setGoalSheetOpen(true)}
          className="card p-3 text-left active:bg-ink-800/60 min-w-0"
        >
          <p className="text-ink-500 text-[10px] uppercase font-heading tracking-wide mb-1.5">Esta semana</p>
          {weeklyGoal ? (
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-sm font-semibold shrink-0">
                {Math.min(weekCount, weeklyGoal)}/{weeklyGoal}
              </span>
              <div className="flex gap-0.5 flex-1 min-w-0">
                {Array.from({ length: weeklyGoal }).map((_, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full ${i < weekCount ? "bg-blaze-gradient" : "bg-ink-800"}`} />
                ))}
              </div>
            </div>
          ) : (
            <span className="text-blaze-500 text-sm">Elegir objetivo</span>
          )}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Calendar workoutDates={workoutDates} restDays={activeRoutine?.restDays} onSelectDay={setSelectedDay} />
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

      <AnimatePresence>
        {goalSheetOpen && (
          <WeeklyGoalSheet
            weeklyGoal={weeklyGoal}
            maxGoal={maxGoal}
            onSelect={handleSetGoal}
            onClose={() => setGoalSheetOpen(false)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function WeeklyGoalSheet({ weeklyGoal, maxGoal, onSelect, onClose }) {
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
        <div className="flex items-center justify-between mb-1">
          <p className="font-heading uppercase tracking-wide">Objetivo semanal</p>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-ink-500 text-sm mb-1">¿Cuántos días a la semana quieres entrenar?</p>
        <p className="text-ink-600 text-xs mb-4 min-h-[2.5em]">
          {maxGoal === 0
            ? "Tu rutina activa no tiene ningún día de entreno — marca alguno como no descanso."
            : maxGoal < 7
            ? `Tu rutina activa tiene ${maxGoal} ${maxGoal === 1 ? "día" : "días"} de entreno a la semana.`
            : ""}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const disabled = n > maxGoal;
            return (
              <button
                key={n}
                onClick={() => !disabled && onSelect(n)}
                disabled={disabled}
                className={`py-3 rounded-xl text-sm font-heading transition-colors ${
                  weeklyGoal === n
                    ? "bg-blaze-gradient text-white shadow-blaze"
                    : disabled
                    ? "bg-ink-800/40 text-ink-700"
                    : "bg-ink-800 text-ink-400 active:bg-ink-700"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
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
