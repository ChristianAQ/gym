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
  Check,
  ClipboardList,
  Moon,
  Copy,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { listFriendProfiles, importRoutine } from "../lib/firestore";
import { computeStreakStats, WEEKDAYS_FULL_ES } from "../lib/date";
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
  const [pickerMuscle, setPickerMuscle] = useState(null);

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

  const me = useMemo(() => {
    const workoutDates = profile?.workoutDates ?? [];
    const weeklyGoal = profile?.weeklyGoal ?? null;
    const { currentStreak, bestStreak } = computeStreakStats(workoutDates, weeklyGoal);
    return {
      uid: user?.uid,
      displayName: profile?.displayName || user?.displayName || "Tú",
      photoURL: profile?.photoURL || user?.photoURL,
      currentStreak,
      bestStreak,
      workoutDates,
      weeklyGoal,
      totalVolume: profile?.totalVolume ?? 0,
      prs: profile?.prs ?? {},
      routines: profile?.routines ?? {},
      activeRoutineId: profile?.activeRoutineId ?? null,
    };
  }, [user, profile]);

  // La racha ya no viene guardada en el perfil (se calcula al vuelo desde
  // workoutDates+weeklyGoal), así que se recalcula igual para cada amigo
  // con sus propios datos antes de rankear o comparar.
  const enrichedFriends = useMemo(
    () =>
      friends.map((f) => ({
        ...f,
        ...computeStreakStats(f.workoutDates, f.weeklyGoal),
      })),
    [friends]
  );

  const people = useMemo(() => [me, ...enrichedFriends], [me, enrichedFriends]);

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
    <PageTransition className="px-5 pt-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">Ranking</h1>
        <button onClick={load} className="p-2 text-ink-400 active:text-blaze-500">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {enrichedFriends.length > 0 && (
        <div className="mb-5">
          <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-2">Tus amigos</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {enrichedFriends.map((f) => (
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
        <>
          <div className="flex items-center gap-2 mb-3">
            <MuscleIcon exercise={exercise} className="w-4 h-4 text-blaze-500 shrink-0" />
            <span className="text-sm text-ink-200 font-medium truncate">{exercise}</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MUSCLE_GROUPS.map((group) => {
              const active = group.exercises.includes(exercise);
              return (
                <button
                  key={group.name}
                  type="button"
                  onClick={() => setPickerMuscle(group.name)}
                  aria-label={`Elegir ejercicio de ${group.name}`}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors ${
                    active
                      ? "bg-blaze-gradient text-white shadow-blaze"
                      : "bg-ink-800/60 text-ink-400 active:bg-blaze-500/15 active:text-blaze-500"
                  }`}
                >
                  <MuscleIcon muscle={group.name} className="w-4 h-4" />
                  <span className="text-[9px] font-heading uppercase tracking-wide leading-none">
                    {group.name}
                  </span>
                </button>
              );
            })}
          </div>
        </>
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

      <AnimatePresence>
        {pickerMuscle && (
          <RecordsPickerSheet
            muscle={pickerMuscle}
            selected={exercise}
            onSelect={(name) => {
              setExercise(name);
              setPickerMuscle(null);
            }}
            onClose={() => setPickerMuscle(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

// Hoja de selección única para elegir de qué ejercicio de un músculo se
// compara el récord (mismo patrón visual que la hoja de la Rutina, pero
// tocar un ejercicio elige y cierra en vez de sumarlo a una lista).
function RecordsPickerSheet({ muscle, selected, onSelect, onClose }) {
  const group = MUSCLE_GROUPS.find((g) => g.name === muscle);

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
        <div className="flex items-center justify-between mb-4">
          <p className="font-heading uppercase tracking-wide flex items-center gap-2">
            <MuscleIcon muscle={muscle} className="w-4 h-4 text-blaze-500" />
            {muscle}
          </p>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {group.exercises.map((ex) => {
            const isSelected = ex === selected;
            return (
              <button
                key={ex}
                type="button"
                onClick={() => onSelect(ex)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors ${
                  isSelected
                    ? "bg-blaze-gradient text-white shadow-blaze"
                    : "bg-ink-800 text-ink-200 active:bg-ink-700"
                }`}
              >
                <span>{ex}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CompareModal({ me, rival, onClose }) {
  const [showRoutine, setShowRoutine] = useState(false);
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

        <button
          type="button"
          onClick={() => setShowRoutine(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 mb-5 rounded-xl bg-ink-800/60 text-blaze-500 font-heading uppercase text-xs tracking-wide active:bg-ink-800"
        >
          <ClipboardList className="w-4 h-4" /> Ver rutina de {rival.displayName.split(" ")[0]}
        </button>

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

      <AnimatePresence>
        {showRoutine && (
          <FriendRoutineSheet uid={me.uid} rival={rival} onClose={() => setShowRoutine(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Vista de solo lectura de la rutina activa de un amigo, con un botón para
// copiarla directamente a las rutinas propias (importRoutine) — a
// diferencia del flujo de "compartir", aquí no hace falta que el amigo
// envíe nada: como los perfiles son legibles entre amigos, se puede ver y
// copiar su rutina activa en cualquier momento.
function FriendRoutineSheet({ uid, rival, onClose }) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstName = (rival.displayName || "tu amigo").split(" ")[0];
  const activeRoutine = rival.activeRoutineId ? rival.routines?.[rival.activeRoutineId] : null;

  async function handleCopy() {
    setCopying(true);
    try {
      await importRoutine(uid, activeRoutine);
      setCopied(true);
    } finally {
      setCopying(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-heading uppercase tracking-wide truncate pr-3">Rutina de {firstName}</p>
          <button onClick={onClose} className="p-1.5 text-ink-400 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!activeRoutine ? (
          <div className="text-center py-8">
            <ClipboardList className="w-8 h-8 text-ink-600 mx-auto mb-2" />
            <p className="text-ink-400 text-sm">{firstName} todavía no tiene una rutina activa.</p>
          </div>
        ) : (
          <>
            <p className="font-heading text-lg font-semibold mb-3 truncate">{activeRoutine.name}</p>
            <div className="space-y-2 mb-5">
              {DAY_ORDER.map((day) => {
                const exercises = activeRoutine.days?.[day] || [];
                const isRest = !!activeRoutine.restDays?.[day];
                return (
                  <div key={day} className="bg-ink-800/60 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading uppercase text-xs tracking-wide">{WEEKDAYS_FULL_ES[day]}</span>
                      {isRest ? (
                        <span className="flex items-center gap-1 text-[11px] text-ink-500">
                          <Moon className="w-3 h-3" /> Descanso
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-500">
                          {exercises.length} {exercises.length === 1 ? "ejercicio" : "ejercicios"}
                        </span>
                      )}
                    </div>
                    {!isRest && exercises.length > 0 && (
                      <div className="space-y-1.5">
                        {exercises.map((ex, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-ink-200 truncate min-w-0">
                              <MuscleIcon exercise={ex.name} className="w-3.5 h-3.5 text-blaze-500 shrink-0" />
                              <span className="truncate">{ex.name}</span>
                            </span>
                            <span className="text-ink-500 text-xs shrink-0 ml-2">
                              {ex.sets}×{ex.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              disabled={copying || copied}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {copying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "¡Copiada a tus rutinas!" : "Copiar a mis rutinas"}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

