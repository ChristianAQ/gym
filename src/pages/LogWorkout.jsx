import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader2, PartyPopper, ChevronDown, ClipboardList } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { logWorkout } from "../lib/firestore";
import { dateKey } from "../lib/date";
import { COMMON_EXERCISES } from "../lib/exercises";
import PageTransition from "../components/PageTransition";

const CUSTOM = "__custom__";

let rowId = 0;
function emptyRow(ex) {
  rowId += 1;
  const name = ex?.name || "";
  return {
    id: rowId,
    name,
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
  if (today && today.length > 0) return today.map((ex) => emptyRow(ex));
  return [emptyRow()];
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

  const prs = profile?.prs || {};

  function updateRow(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, emptyRow()]);
  }
  function removeRow(id) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
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
    <PageTransition variant="slide-up" className="min-h-screen bg-ink-950 flex flex-col">
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
                <div className="relative flex-1">
                  <select
                    value={row.custom ? CUSTOM : row.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === CUSTOM) {
                        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, custom: true, name: "" } : r)));
                      } else {
                        setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, custom: false, name: v } : r)));
                      }
                    }}
                    className="input-field w-full appearance-none pr-10"
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
                  autoFocus
                  placeholder="Nombre del ejercicio"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, "name", e.target.value)}
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
                    onChange={(e) => updateRow(row.id, "sets", e.target.value)}
                    className="input-field text-center py-2.5"
                  />
                </Field>
                <Field label="Reps">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={row.reps}
                    onChange={(e) => updateRow(row.id, "reps", e.target.value)}
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
                    onChange={(e) => updateRow(row.id, "weight", e.target.value)}
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

        <button
          type="button"
          onClick={addRow}
          className="w-full flex items-center justify-center gap-2 py-3 text-blaze-500 font-heading uppercase text-sm tracking-wide border border-dashed border-ink-700 rounded-2xl active:bg-ink-800/50"
        >
          <Plus className="w-4 h-4" /> Añadir ejercicio
        </button>

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
