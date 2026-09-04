import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { MUSCLE_GROUPS } from "../lib/exercises";
import MuscleIcon from "./MuscleIcon";

// Hoja rápida para meter varios ejercicios de un músculo de un tirón: cada
// toque añade o quita ese ejercicio (sin cerrarse ni reabrir un desplegable
// nativo por cada uno), y se puede escribir uno propio al final. Usada
// tanto en la Rutina (por día) como al registrar un entrenamiento.
export default function QuickAddSheet({ muscle, rows, onToggle, onAddCustom, onClose }) {
  const group = MUSCLE_GROUPS.find((g) => g.name === muscle);
  const selectedNames = new Set(rows.filter((r) => r.muscle === muscle && !r.custom).map((r) => r.name));
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");

  function submitCustom(e) {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustom(customName.trim());
    setCustomName("");
    setShowCustom(false);
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
        className="w-full max-w-md bg-ink-900 border-t border-ink-800 rounded-t-3xl p-6 pb-10 max-h-[75vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="font-heading uppercase tracking-wide flex items-center gap-2">
            <MuscleIcon muscle={muscle} className="w-4 h-4 text-blaze-500" />
            {muscle}
          </p>
          <button onClick={onClose} className="p-1.5 text-ink-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-ink-500 text-xs mb-4">Toca los que hagas. Puedes marcar varios.</p>

        <div className="space-y-2 mb-3">
          {group.exercises.map((ex) => {
            const selected = selectedNames.has(ex);
            return (
              <button
                key={ex}
                type="button"
                onClick={() => onToggle(ex)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors ${
                  selected
                    ? "bg-blaze-gradient text-white shadow-blaze"
                    : "bg-ink-800 text-ink-200 active:bg-ink-700"
                }`}
              >
                <span>{ex}</span>
                {selected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>

        {showCustom ? (
          <form onSubmit={submitCustom} className="flex items-center gap-2 mb-4">
            <input
              autoFocus
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Nombre del ejercicio"
              className="input-field flex-1 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-blaze-gradient rounded-xl text-white text-xs font-heading uppercase tracking-wide shrink-0"
            >
              Añadir
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="w-full py-2.5 mb-4 text-blaze-500 font-heading uppercase text-xs tracking-wide border border-dashed border-ink-700 rounded-xl active:bg-ink-800/50"
          >
            + Otro ejercicio
          </button>
        )}

        <button onClick={onClose} className="btn-primary w-full">
          Listo
        </button>
      </motion.div>
    </motion.div>
  );
}
