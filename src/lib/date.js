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

export function isToday(key) {
  return key === dateKey();
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

const WEEKDAYS_FULL_ES = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
export { WEEKDAYS_FULL_ES };

export function formatFullDate(key) {
  const date = keyToDate(key);
  const weekday = WEEKDAYS_FULL_ES[date.getDay()];
  return `${weekday}, ${date.getDate()} de ${MONTHS_ES[date.getMonth()].toLowerCase()}`;
}

// Clave "YYYY-MM-DD" del lunes de la semana de `date` (semana lunes-domingo,
// igual que el calendario y la rejilla de la rutina).
export function startOfWeekKey(date = new Date()) {
  const offset = (date.getDay() + 6) % 7; // 0 = lunes
  const monday = new Date(date);
  monday.setDate(date.getDate() - offset);
  return dateKey(monday);
}

// Cuántas fechas de `workoutDates` caen en la semana actual (lunes-hoy).
export function countThisWeek(workoutDates) {
  const start = startOfWeekKey();
  return (workoutDates || []).filter((key) => key >= start).length;
}

// Racha basada en el objetivo semanal: cada semana lunes-domingo que llega
// al objetivo suma sus días entrenados a la racha; la semana en curso suma
// lo que lleva hecho sin exigirle todavía el objetivo (aún puede
// completarlo antes de que acabe). En cuanto una semana YA CERRADA se
// queda corta, la racha se reinicia desde la siguiente — así una semana a
// medias que acaba en 3/4 puede enseñar un pico de "racha" más alto
// mientras está en curso, pero al cerrarse sin llegar al objetivo borra lo
// acumulado hasta entonces. Sin objetivo semanal se usa una racha diaria
// clásica (días consecutivos con entrenamiento) como alternativa.
export function computeStreakStats(workoutDates, weeklyGoal) {
  const loggedSet = new Set(workoutDates || []);
  if (loggedSet.size === 0) return { currentStreak: 0, bestStreak: 0 };

  if (!weeklyGoal) return computeDailyStreak(loggedSet);

  const sortedKeys = [...loggedSet].sort();
  const cursor = keyToDate(startOfWeekKey(keyToDate(sortedKeys[0])));
  const currentWeekStartKey = startOfWeekKey();

  // `running` es lo acumulado ANTES de la semana que se está mirando. El
  // pico de esa semana (running + sus días) siempre entra en el cálculo de
  // `best` — incluida una semana que acaba fallando, porque mientras
  // todavía estaba en curso sí llegó a enseñar ese pico — pero solo pasa a
  // ser la base de la siguiente semana si la semana YA CERRADA cumplió el
  // objetivo. La semana en curso (la última) no se evalúa como cumplida o
  // fallida todavía: su pico es directamente la racha actual.
  let running = 0;
  let best = 0;
  let cursorKey = dateKey(cursor);
  while (cursorKey <= currentWeekStartKey) {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      d.setDate(d.getDate() + i);
      if (loggedSet.has(dateKey(d))) count++;
    }
    const weekPeak = running + count;
    if (weekPeak > best) best = weekPeak;

    const isCurrentWeek = cursorKey === currentWeekStartKey;
    running = isCurrentWeek || count >= weeklyGoal ? weekPeak : 0;

    cursor.setDate(cursor.getDate() + 7);
    cursorKey = dateKey(cursor);
  }

  return { currentStreak: running, bestStreak: best };
}

function computeDailyStreak(loggedSet) {
  const sortedKeys = [...loggedSet].sort();
  const cursor = keyToDate(sortedKeys[0]);
  const todayKey = dateKey();

  let running = 0;
  let best = 0;
  let cursorKey = dateKey(cursor);
  while (cursorKey <= todayKey) {
    running = loggedSet.has(cursorKey) ? running + 1 : 0;
    if (running > best) best = running;
    cursor.setDate(cursor.getDate() + 1);
    cursorKey = dateKey(cursor);
  }
  return { currentStreak: running, bestStreak: best };
}

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
