import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Moon } from "./icons";
import { monthGrid, monthLabel, WEEKDAYS_ES, dateKey } from "../lib/date";

// `restDays` es el mapa de días de descanso de la rutina activa
// (0=domingo ... 6=sábado, igual que Date#getDay()). La rejilla siempre
// empieza en lunes (mismo orden que WEEKDAYS_ES), así que la columna de
// cada celda ya dice qué día de la semana es sin mirar la fecha en sí.
function weekdayOfColumn(ci) {
  return (ci + 1) % 7;
}

export default function Calendar({ workoutDates = [], restDays = {}, onSelectDay }) {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [direction, setDirection] = useState(1);

  const loggedSet = new Set(workoutDates);
  const weeks = monthGrid(cursor.year, cursor.month);
  const todayKey = dateKey();

  function shift(delta) {
    setDirection(delta);
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shift(-1)} className="p-2 -ml-2 text-ink-400 active:text-blaze-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-heading uppercase tracking-wide text-sm text-ink-200">
          {monthLabel(cursor.year, cursor.month)}
        </span>
        <button onClick={() => shift(1)} className="p-2 -mr-2 text-ink-400 active:text-blaze-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS_ES.map((d) => (
          <span key={d} className="text-center text-[11px] text-ink-500 font-heading uppercase">
            {d}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${cursor.year}-${cursor.month}`}
          custom={direction}
          initial={{ opacity: 0, x: 24 * direction }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 * direction }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-1"
        >
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((cell, ci) => {
                if (!cell) return <div key={ci} className="aspect-square" />;
                const logged = loggedSet.has(cell.key);
                const isToday = cell.key === todayKey;
                // Días de descanso planificados: solo se marcan si ese día no
                // se llegó a registrar nada (si hay entreno registrado, gana
                // el logro sobre la plantilla).
                const isRestDay = !logged && !!restDays[weekdayOfColumn(ci)];
                return (
                  <button
                    key={ci}
                    type="button"
                    onClick={() => onSelectDay?.(cell.key)}
                    className="aspect-square flex items-center justify-center"
                  >
                    <motion.div
                      initial={logged ? { scale: 0.4, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className={`relative w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium
                        ${logged ? "bg-blaze-gradient text-white shadow-blaze" : isRestDay ? "bg-ink-800/40 text-ink-500" : "text-ink-300"}
                        ${isToday && !logged ? "ring-2 ring-blaze-500/70" : ""}
                      `}
                    >
                      {logged ? <Flame className="w-4 h-4" strokeWidth={2.5} /> : cell.day}
                      {isRestDay && (
                        <Moon className="absolute -top-1 -right-1 w-3 h-3 text-ink-400 bg-ink-900 rounded-full p-0.5" />
                      )}
                      {isToday && logged && (
                        <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-blaze-300" />
                      )}
                    </motion.div>
                  </button>
                );
              })}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
