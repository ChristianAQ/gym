import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronDown, Save, Loader2, Share2, X, Inbox, Check, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  updateRoutine,
  listFriendProfiles,
  shareRoutine,
  listIncomingRoutines,
  deleteIncomingRoutine,
} from "../lib/firestore";
import { COMMON_EXERCISES, MUSCLE_GROUPS, EXERCISE_TO_MUSCLE } from "../lib/exercises";
import { WEEKDAYS_FULL_ES } from "../lib/date";
import PageTransition from "../components/PageTransition";
import MuscleIcon from "../components/MuscleIcon";
import Avatar from "../components/Avatar";

const CUSTOM = "__custom__";
// Lunes primero para que se lea como una semana normal; cada número es el
// índice de Date#getDay() (0=domingo ... 6=sábado), que es como se guarda.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

let rowId = 0;
function newRow(ex, muscle) {
  rowId += 1;
  const name = ex?.name || "";
  return {
    id: rowId,
    name,
    // El músculo se fija al crear la fila (al tocar su icono, o al cargar
    // una rutina guardada/importada) y decide qué lista de ejercicios
    // ofrece el desplegable de esa fila.
    muscle: muscle || (name ? EXERCISE_TO_MUSCLE[name] : undefined),
    custom: !!name && !COMMON_EXERCISES.includes(name),
    sets: String(ex?.sets ?? 4),
    reps: String(ex?.reps ?? 10),
  };
}

// Músculos únicos que se entrenan ese día, para la fila de iconos junto al
// nombre del día (limitado a 4 para que quepan sin desbordar en móvil).
// Cuenta el músculo en cuanto se añade la fila (aunque el ejercicio en sí
// todavía no esté elegido), así el resumen del día es inmediato.
function dayMuscles(rows) {
  const names = new Set();
  for (const row of rows) {
    const muscle = row.muscle || EXERCISE_TO_MUSCLE[row.name];
    if (muscle) names.add(muscle);
  }
  return [...names].slice(0, 4);
}

function buildInitialDays(routine) {
  const days = {};
  for (const day of DAY_ORDER) {
    days[day] = (routine?.[day] || []).map((ex) => newRow(ex));
  }
  return days;
}

function countExercises(routine) {
  return DAY_ORDER.reduce((total, day) => total + (routine?.[day]?.length || 0), 0);
}

export default function Routine() {
  const { user, profile } = useAuth();
  const [days, setDays] = useState(() => buildInitialDays(profile?.routine));
  const [openDay, setOpenDay] = useState(new Date().getDay());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [importedMsg, setImportedMsg] = useState("");

  const loadIncoming = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listIncomingRoutines(user.uid);
      setIncoming(list);
    } catch (err) {
      console.error("[GymRat] No se pudieron cargar las rutinas recibidas:", err);
    }
  }, [user]);

  useEffect(() => {
    loadIncoming();
  }, [loadIncoming]);

  function patchRow(day, id, patch) {
    setDays((d) => ({ ...d, [day]: d[day].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }
  function addRow(day, muscle) {
    setDays((d) => ({ ...d, [day]: [...d[day], newRow(undefined, muscle)] }));
  }
  function removeRow(day, id) {
    setDays((d) => ({ ...d, [day]: d[day].filter((r) => r.id !== id) }));
  }

  function currentRoutine() {
    const routine = {};
    for (const day of DAY_ORDER) {
      routine[day] = days[day]
        .filter((r) => r.name.trim())
        .map((r) => ({ name: r.name.trim(), sets: Number(r.sets) || 0, reps: Number(r.reps) || 0 }));
    }
    return routine;
  }

  async function handleSave() {
    setBusy(true);
    setSaved(false);
    try {
      await updateRoutine(user.uid, currentRoutine());
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(item) {
    setDays(buildInitialDays(item.routine));
    setOpenDay(new Date().getDay());
    setImportedMsg(`Rutina de ${item.fromName} cargada. Revísala y dale a "Guardar rutina" para confirmarla.`);
    setTimeout(() => setImportedMsg(""), 5000);
    setIncoming((list) => list.filter((i) => i.id !== item.id));
    try {
      await deleteIncomingRoutine(user.uid, item.id);
    } catch {
      // No crítico: si falla el borrado, la próxima vez la verá otra vez en la bandeja.
    }
  }

  async function handleDiscard(item) {
    setIncoming((list) => list.filter((i) => i.id !== item.id));
    try {
      await deleteIncomingRoutine(user.uid, item.id);
    } catch {
      // No crítico.
    }
  }

  const hasSavedRoutine = countExercises(profile?.routine) > 0;

  return (
    <PageTransition className="px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-8 max-w-md mx-auto">
      <div className="flex items-start justify-between mb-1">
        <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">Tu rutina</h1>
        <button
          onClick={() => setShareOpen(true)}
          disabled={!hasSavedRoutine}
          title={hasSavedRoutine ? "" : "Guarda tu rutina antes de compartirla"}
          className="p-2.5 bg-ink-800 rounded-xl text-blaze-500 shrink-0 disabled:opacity-40"
          aria-label="Compartir rutina con un amigo"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
      <p className="text-ink-500 text-sm mb-5">
        Define qué entrenas cada día. Al registrar el entrenamiento se rellenará solo — tú solo pones las
        repeticiones y el peso, y puedes cambiar lo que quieras ese día sin tocar la plantilla.
      </p>

      {importedMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 bg-blaze-500/10 border border-blaze-500/20 rounded-2xl p-3 text-xs text-blaze-300 mb-4"
        >
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{importedMsg}</span>
        </motion.div>
      )}

      {incoming.length > 0 && (
        <div className="mb-5">
          <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-2 flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5" /> Rutinas recibidas
          </p>
          <div className="space-y-2">
            {incoming.map((item) => (
              <div key={item.id} className="card p-3.5 flex items-center gap-3">
                <Avatar name={item.fromName} photoURL={item.fromPhotoURL} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.fromName}</p>
                  <p className="text-ink-500 text-xs">{countExercises(item.routine)} ejercicios</p>
                </div>
                <button
                  onClick={() => handleDiscard(item)}
                  className="p-2 text-ink-500 active:text-red-400 shrink-0"
                  aria-label="Descartar"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleImport(item)}
                  className="px-3 py-2 bg-blaze-gradient rounded-xl text-white text-xs font-heading uppercase tracking-wide shrink-0"
                >
                  Importar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {DAY_ORDER.map((day) => {
          const exercises = days[day];
          const isOpen = openDay === day;
          return (
            <div key={day} className="card overflow-hidden">
              <button
                onClick={() => setOpenDay(isOpen ? null : day)}
                className="w-full flex items-center justify-between p-4"
              >
                <span className="font-heading uppercase tracking-wide">{WEEKDAYS_FULL_ES[day]}</span>
                <div className="flex items-center gap-2">
                  {dayMuscles(exercises).map((muscle) => (
                    <MuscleIcon key={muscle} muscle={muscle} className="w-3.5 h-3.5 text-ink-500 shrink-0" />
                  ))}
                  {exercises.length > 0 && (
                    <span className="text-xs bg-blaze-500/15 text-blaze-400 px-2 py-0.5 rounded-full shrink-0">
                      {exercises.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-ink-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {exercises.length === 0 && (
                        <p className="text-ink-600 text-sm text-center py-2">
                          Día de descanso — sin ejercicios todavía.
                        </p>
                      )}
                      {exercises.map((row) => (
                        <div key={row.id} className="bg-ink-800/60 rounded-2xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blaze-500/15 flex items-center justify-center shrink-0">
                              <MuscleIcon muscle={row.muscle} exercise={row.name} className="w-4 h-4 text-blaze-500" />
                            </div>
                            <div className="relative flex-1 min-w-0">
                              <select
                                value={row.custom ? CUSTOM : row.name}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === CUSTOM) patchRow(day, row.id, { custom: true, name: "" });
                                  else patchRow(day, row.id, { custom: false, name: v });
                                }}
                                className="input-field w-full appearance-none pr-9 py-2.5 text-sm"
                              >
                                <option value="" disabled>
                                  Elige un ejercicio{row.muscle ? ` de ${row.muscle.toLowerCase()}` : ""}
                                </option>
                                {row.muscle ? (
                                  MUSCLE_GROUPS.find((g) => g.name === row.muscle)?.exercises.map((ex) => (
                                    <option key={ex} value={ex}>
                                      {ex}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    {MUSCLE_GROUPS.map((group) => (
                                      <optgroup key={group.name} label={group.name}>
                                        {group.exercises.map((ex) => (
                                          <option key={ex} value={ex}>
                                            {ex}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </>
                                )}
                                <option value={CUSTOM}>Otro ejercicio…</option>
                              </select>
                              <ChevronDown className="w-4 h-4 text-ink-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            <button
                              onClick={() => removeRow(day, row.id)}
                              className="p-2 text-ink-500 active:text-blaze-500 shrink-0"
                              aria-label="Quitar ejercicio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {row.custom && (
                            <input
                              autoFocus
                              value={row.name}
                              onChange={(e) => patchRow(day, row.id, { name: e.target.value })}
                              placeholder="Nombre del ejercicio"
                              className="input-field mb-2 py-2 text-sm"
                            />
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-ink-500 uppercase tracking-wide text-center mb-1">
                                Series
                              </label>
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={row.sets}
                                onChange={(e) => patchRow(day, row.id, { sets: e.target.value })}
                                className="input-field text-center py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-ink-500 uppercase tracking-wide text-center mb-1">
                                Reps objetivo
                              </label>
                              <input
                                type="number"
                                min="0"
                                inputMode="numeric"
                                value={row.reps}
                                onChange={(e) => patchRow(day, row.id, { reps: e.target.value })}
                                className="input-field text-center py-2 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div>
                        <p className="text-[10px] text-ink-500 uppercase tracking-wide text-center mb-2">
                          Añadir ejercicio de...
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {MUSCLE_GROUPS.map((group) => (
                            <button
                              key={group.name}
                              type="button"
                              onClick={() => addRow(day, group.name)}
                              aria-label={`Añadir ejercicio de ${group.name}`}
                              className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-ink-800/60 text-ink-400 active:bg-blaze-500/15 active:text-blaze-500"
                            >
                              <MuscleIcon muscle={group.name} className="w-4 h-4" />
                              <span className="text-[9px] font-heading uppercase tracking-wide leading-none">
                                {group.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={busy}
        className="btn-primary w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? "¡Guardado!" : "Guardar rutina"}
      </button>

      <AnimatePresence>
        {shareOpen && (
          <ShareSheet user={user} profile={profile} onClose={() => setShareOpen(false)} />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function ShareSheet({ user, profile, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    listFriendProfiles(user.uid)
      .then((list) => active && setFriends(list))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user.uid]);

  async function handleSend(friend) {
    setError("");
    try {
      const fromUser = {
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        photoURL: profile?.photoURL || user.photoURL,
      };
      await shareRoutine(fromUser, friend.uid, profile?.routine || {});
      setSentTo(friend.uid);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError("No se pudo enviar. Comprueba tu conexión e inténtalo de nuevo.");
    }
  }

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
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10 max-h-[70vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <p className="font-heading uppercase tracking-wide">Compartir rutina</p>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <p className="text-ink-500 text-sm text-center py-6">Cargando amigos...</p>}

        {!loading && friends.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-ink-600 mx-auto mb-2" />
            <p className="text-ink-400 text-sm">Todavía no tienes amigos añadidos.</p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        <div className="space-y-2">
          {friends.map((friend) => (
            <button
              key={friend.uid}
              onClick={() => handleSend(friend)}
              disabled={sentTo !== null}
              className="w-full card p-3.5 flex items-center gap-3 text-left disabled:opacity-60"
            >
              <Avatar name={friend.displayName} photoURL={friend.photoURL} size={40} />
              <span className="flex-1 font-medium truncate">{friend.displayName}</span>
              {sentTo === friend.uid && <Check className="w-4 h-4 text-blaze-500 shrink-0" />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
