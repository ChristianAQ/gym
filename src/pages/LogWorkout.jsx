import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Loader2, PartyPopper, ChevronDown, ClipboardList } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logWorkout } from "../lib/firestore";
import { dateKey } from "../lib/date";
import { COMMON_EXERCISES, MUSCLE_GROUPS, EXERCISE_TO_MUSCLE } from "../lib/exercises";
import PageTransition from "../components/PageTransition";
import MuscleIcon from "../components/MuscleIcon";
import QuickAddSheet from "../components/QuickAddSheet";

const CUSTOM = "__custom__";

let rowId = 0;
function newRow(ex, muscle) {
  rowId += 1;
  const name = ex?.name || "";
  return {
    id: rowId,
    name,
    muscle: muscle || (name ? EXERCISE_TO_MUSCLE[name] : undefined),
    custom: !!name && !COMMON_EXERCISES.includes(name),
    sets: String(ex?.sets ?? 3),
    reps: String(ex?.reps ?? 10),
    weight: "",
  };
}

// Si hoy toca algo en la rutina, se rellenan los ejercicios de esa
// plantilla (nombre, series y reps objetivo) y solo falta el peso — pero
// sigue siendo una lista normal: se puede añadir, quitar o cambiar
// cualquier fila sin que eso afecte a la rutina guardada.
function initialRows(routine) {
  const today = routine?.[new Date().getDay()];
  if (today && today.length > 0) return today.map((ex) => newRow(ex));
  return [];
}

export default function LogWorkout() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => initialRows(profile?.routine));
  const [prefilled] = useState(() => Boolean(profile?.routine?.[new Date().getDay()]?.length));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [pickerMuscle, setPickerMuscle] = useState(null);

  const prs = profile?.prs || {};
  const usedMuscles = new Set(rows.map((r) => r.muscle).filter(Boolean));

  function patchRow(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  // Toca un ejercicio del catálogo en la hoja rápida: si ya estaba en la
  // lista lo quita, si no lo añade — así se pueden marcar varios de un
  // tirón sin reabrir nada entre uno y otro.
  function toggleExercise(muscle, name) {
    setRows((rs) => {
      const existing = rs.find((r) => r.muscle === muscle && r.name === name);
      if (existing) return rs.filter((r) => r.id !== existing.id);
      return [...rs, newRow({ name }, muscle)];
    });
  }
  function addCustom(muscle, name) {
    setRows((rs) => [...rs, newRow({ name }, muscle)]);
  }
  function isPR(row) {
    const w = Number(row.weight);
    if (!row.name || !w) return false;
    const best = prs[row.name]?.weight ?? 0;
    return w > best;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) {
      setError("Añade al menos un ejercicio.");
      return;
    }
    setBusy(true);
    try {
      await logWorkout(user.uid, {
        dateKey: dateKey(),
        exercises: valid.map((r) => ({
          name: r.name.trim(),
          sets: Number(r.sets) || 0,
          reps: Number(r.reps) || 0,
          weight: Number(r.weight) || 0,
        })),
        note,
      });
      setDone(true);
      setTimeout(() => navigate("/"), 1100);
    } catch (err) {
      setError("No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-950">
        <motion.div
          initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-20 h-20 rounded-full bg-blaze-gradient flex items-center justify-center shadow-blaze"
        >
          <PartyPopper className="w-10 h-10 text-white" />
        </motion.div>
        <p className="font-heading text-xl uppercase tracking-wide">¡Entrenamiento guardado!</p>
      </div>
    );
  }

  return (
    <PageTransition
      variant="slide-up"
      className="min-h-screen bg-ink-950 flex flex-col pt-[env(safe-area-inset-top)]"
    >
      <div className="flex items-center justify-between px-5 pt-8 pb-4">
        <h1 className="font-heading text-xl font-semibold uppercase tracking-wide">Registrar entrenamiento</h1>
        <button onClick={() => navigate(-1)} className="p-2 text-ink-400">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-5 pb-8 overflow-y-auto space-y-3">
        {prefilled && (
          <div className="flex items-start gap-2 bg-blaze-500/10 border border-blaze-500/20 rounded-2xl p-3 text-xs text-blaze-300">
            <ClipboardList className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Rellenado desde tu rutina de hoy — añade el peso y cambia lo que necesites.</span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {MUSCLE_GROUPS.map((group) => {
            const active = usedMuscles.has(group.name);
            return (
              <button
                key={group.name}
                type="button"
                onClick={() => setPickerMuscle(group.name)}
                aria-label={`Añadir ejercicio de ${group.name}`}
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

        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.div
              key={row.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blaze-500/15 flex items-center justify-center shrink-0">
                  <MuscleIcon muscle={row.muscle} exercise={row.name} className="w-4 h-4 text-blaze-500" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <select
                    value={row.custom ? CUSTOM : row.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === CUSTOM) patchRow(row.id, { custom: true, name: "" });
                      else patchRow(row.id, { custom: false, name: v });
                    }}
                    className="input-field w-full appearance-none pr-10"
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
                  <ChevronDown className="w-4 h-4 text-ink-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="p-3 text-ink-500 active:text-blaze-500 shrink-0"
                  aria-label="Quitar ejercicio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {row.custom && (
                <input
                  autoFocus={!row.name}
                  placeholder="Nombre del ejercicio"
                  value={row.name}
                  onChange={(e) => patchRow(row.id, { name: e.target.value })}
                  className="input-field mb-3"
                />
              )}
              <div className="grid grid-cols-3 gap-2">
                <Field label="Series">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={row.sets}
                    onChange={(e) => patchRow(row.id, { sets: e.target.value })}
                    className="input-field text-center py-2.5"
                  />
                </Field>
                <Field label="Reps">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={row.reps}
                    onChange={(e) => patchRow(row.id, { reps: e.target.value })}
                    className="input-field text-center py-2.5"
                  />
                </Field>
                <Field label="Kg">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    value={row.weight}
                    onChange={(e) => patchRow(row.id, { weight: e.target.value })}
                    className="input-field text-center py-2.5"
                  />
                </Field>
              </div>
              {isPR(row) && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-blaze-400 text-xs font-heading uppercase tracking-wide mt-2 flex items-center gap-1"
                >
                  🔥 ¡Nuevo récord personal!
                </motion.p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {rows.length === 0 && (
          <p className="text-ink-500 text-sm text-center py-6">
            Toca un grupo muscular arriba para añadir ejercicios.
          </p>
        )}

        <textarea
          placeholder="Notas (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="input-field resize-none"
        />

        {error && <p className="text-blaze-300 text-sm text-center">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar entrenamiento
        </button>
      </form>

      <AnimatePresence>
        {pickerMuscle && (
          <QuickAddSheet
            muscle={pickerMuscle}
            rows={rows}
            onToggle={(name) => toggleExercise(pickerMuscle, name)}
            onAddCustom={(name) => addCustom(pickerMuscle, name)}
            onClose={() => setPickerMuscle(null)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] text-ink-500 uppercase tracking-wide text-center mb-1">{label}</label>
      {children}
    </div>
  );
}
