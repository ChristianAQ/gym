// Todas las fechas se manejan como claves locales "YYYY-MM-DD" (no UTC),
// para que "hoy" y "ayer" coincidan con el calendario del usuario.

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(keyA, keyB) {
  const a = keyToDate(keyA);
  const b = keyToDate(keyB);
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

export function isToday(key) {
  return key === dateKey();
}

// Devuelve { currentStreak, bestStreak, lastWorkoutDate } tras registrar un
// entrenamiento en `todayKey`, a partir del estado previo del usuario.
export function computeStreak({ lastWorkoutDate, currentStreak = 0, bestStreak = 0 }, todayKey) {
  if (lastWorkoutDate === todayKey) {
    return { currentStreak, bestStreak, lastWorkoutDate: todayKey };
  }
  const gap = lastWorkoutDate ? daysBetween(lastWorkoutDate, todayKey) : null;
  const next = gap === 1 ? currentStreak + 1 : 1;
  return {
    currentStreak: next,
    bestStreak: Math.max(bestStreak, next),
    lastWorkoutDate: todayKey,
  };
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function monthLabel(year, month) {
  return `${MONTHS_ES[month]} ${year}`;
}

const WEEKDAYS_ES = ["L", "M", "X", "J", "V", "S", "D"];
export { WEEKDAYS_ES };

// Cuadrícula de un mes: array de semanas, cada una con 7 celdas
// ({ key, day, inMonth } | null para huecos fuera de mes).
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ key: dateKey(date), day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
