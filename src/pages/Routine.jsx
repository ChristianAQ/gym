import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, Save, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { updateRoutine } from "../lib/firestore";
import { COMMON_EXERCISES } from "../lib/exercises";
import { WEEKDAYS_FULL_ES } from "../lib/date";
import PageTransition from "../components/PageTransition";

const CUSTOM = "__custom__";
// Lunes primero para que se lea como una semana normal; cada número es el
// índice de Date#getDay() (0=domingo ... 6=sábado), que es como se guarda.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

let rowId = 0;
function newRow(ex) {
  rowId += 1;
  const name = ex?.name || "";
  return {
    id: rowId,
    name,
    custom: !!name && !COMMON_EXERCISES.includes(name),
    sets: String(ex?.sets ?? 4),
    reps: String(ex?.reps ?? 10),
  };
}

function buildInitialDays(routine) {
  const days = {};
  for (const day of DAY_ORDER) {
    days[day] = (routine?.[day] || []).map((ex) => newRow(ex));
  }
  return days;
}

export default function Routine() {
  const { user, profile } = useAuth();
  const [days, setDays] = useState(() => buildInitialDays(profile?.routine));
  const [openDay, setOpenDay] = useState(new Date().getDay());
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function patchRow(day, id, patch) {
    setDays((d) => ({ ...d, [day]: d[day].map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }
  function addRow(day) {
    setDays((d) => ({ ...d, [day]: [...d[day], newRow()] }));
  }
  function removeRow(day, id) {
    setDays((d) => ({ ...d, [day]: d[day].filter((r) => r.id !== id) }));
  }

  async function handleSave() {
    setBusy(true);
    setSaved(false);
    const routine = {};
    for (const day of DAY_ORDER) {
      routine[day] = days[day]
        .filter((r) => r.name.trim())
        .map((r) => ({ name: r.name.trim(), sets: Number(r.sets) || 0, reps: Number(r.reps) || 0 }));
    }
    try {
      await updateRoutine(user.uid, routine);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageTransition className="px-5 pt-8 pb-8 max-w-md mx-auto">
      <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide mb-1">Tu rutina</h1>
      <p className="text-ink-500 text-sm mb-5">
        Define qué entrenas cada día. Al registrar el entrenamiento se rellenará solo — tú solo pones las
        repeticiones y el peso, y puedes cambiar lo que quieras ese día sin tocar la plantilla.
      </p>

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
                                  Elige un ejercicio
                                </option>
                                {COMMON_EXERCISES.map((ex) => (
                                  <option key={ex} value={ex}>
                                    {ex}
                                  </option>
                                ))}
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

                      <button
                        onClick={() => addRow(day)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-blaze-500 font-heading uppercase text-xs tracking-wide border border-dashed border-ink-700 rounded-xl active:bg-ink-800/50"
                      >
                        <Plus className="w-4 h-4" /> Añadir ejercicio
                      </button>
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
    </PageTransition>
  );
}
