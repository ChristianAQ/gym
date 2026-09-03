import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";
import { computeStreak } from "./date";

export function userRef(uid) {
  return doc(db, "users", uid);
}

export async function ensureUserProfile(user) {
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const profile = {
    displayName: user.displayName || user.email?.split("@")[0] || "Atleta",
    photoURL: user.photoURL || null,
    email: user.email || null,
    createdAt: serverTimestamp(),
    currentStreak: 0,
    bestStreak: 0,
    lastWorkoutDate: null,
    workoutDates: [],
    totalVolume: 0,
    prs: {},
    routines: {},
    activeRoutineId: null,
    weeklyGoal: null,
  };
  await setDoc(ref, profile);
  return profile;
}

// Los perfiles creados antes de soportar varias rutinas guardaban una sola
// plantilla plana en `routine`. La primera vez que se carga un perfil así
// se convierte en una entrada de `routines` (llamada "Mi rutina") y se deja
// como activa, para no perder lo que el usuario ya tenía configurado.
// Idempotente: si `routines` ya existe (aunque esté vacío) no hace nada.
export async function ensureRoutinesMigrated(uid, profile) {
  if (!profile || profile.routines !== undefined) return;

  const legacy = profile.routine || {};
  const days = {};
  let hasExercises = false;
  for (const key of Object.keys(legacy)) {
    if (key === "restDays") continue;
    days[key] = legacy[key] || [];
    if (days[key].length > 0) hasExercises = true;
  }
  const hasRestDays = legacy.restDays && Object.keys(legacy.restDays).length > 0;

  if (hasExercises || hasRestDays) {
    const id = `routine_${Date.now()}`;
    await updateDoc(userRef(uid), {
      routines: { [id]: { name: "Mi rutina", days, restDays: legacy.restDays || {} } },
      activeRoutineId: id,
    });
  } else {
    await updateDoc(userRef(uid), { routines: {}, activeRoutineId: null });
  }
}

export function subscribeToUser(uid, callback) {
  return onSnapshot(userRef(uid), (snap) => callback(snap.exists() ? snap.data() : null));
}

// Registra el entrenamiento de hoy: actualiza racha, PRs y guarda el detalle
// en la subcolección `workouts`.
export async function logWorkout(uid, { dateKey, exercises, note }) {
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  const profile = snap.data() || {};

  const { currentStreak, bestStreak, lastWorkoutDate } = computeStreak(profile, dateKey);

  const prs = profile.prs || {};
  let addedVolume = 0;

  const loggedExercises = exercises.map((ex) => {
    const weight = Number(ex.weight) || 0;
    const sets = Number(ex.sets) || 0;
    const reps = Number(ex.reps) || 0;
    addedVolume += sets * reps * weight;
    const prevBest = prs[ex.name]?.weight ?? 0;
    const isPR = weight > 0 && weight > prevBest;
    return { name: ex.name, sets, reps, weight, isPR };
  });

  const updates = {
    currentStreak,
    bestStreak,
    lastWorkoutDate,
    workoutDates: arrayUnion(dateKey),
    totalVolume: (profile.totalVolume || 0) + addedVolume,
  };
  loggedExercises.forEach((ex) => {
    if (ex.isPR) updates[`prs.${ex.name}`] = { weight: ex.weight, reps: ex.reps, date: dateKey };
  });

  await updateDoc(ref, updates);
  await addDoc(collection(db, "users", uid, "workouts"), {
    dateKey,
    exercises: loggedExercises,
    note: note || "",
    createdAt: serverTimestamp(),
  });

  return loggedExercises;
}

export async function listWorkouts(uid) {
  const snaps = await getDocs(collection(db, "users", uid, "workouts"));
  return snaps.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

export async function getWorkoutsByDate(uid, dateKey) {
  const q = query(collection(db, "users", uid, "workouts"), where("dateKey", "==", dateKey));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Actualiza nombre/foto en Firestore (fuente de verdad para lo que ven los
// amigos) y, de forma best-effort, en la cuenta de Firebase Auth.
export async function updateProfileData(uid, { displayName, photoURL }) {
  await updateDoc(userRef(uid), { displayName, photoURL: photoURL || null });
}

// Un usuario puede tener varias rutinas guardadas (routines[routineId]) y
// una marcada como activa (activeRoutineId) — esa es la que rellena el
// registro de entrenamiento y se muestra en el inicio. Cada rutina es una
// plantilla semanal: days[díaDeLaSemana] (0=domingo ... 6=sábado, igual
// que Date#getDay()) -> [{ name, sets, reps }], más restDays[día] ->
// boolean para los días marcados explícitamente como descanso.
export async function createRoutine(uid, name) {
  const id = `routine_${Date.now()}`;
  const days = {};
  for (let d = 0; d < 7; d++) days[d] = [];
  await updateDoc(userRef(uid), {
    [`routines.${id}`]: { name, days, restDays: {} },
  });
  return id;
}

export async function renameRoutine(uid, routineId, name) {
  await updateDoc(userRef(uid), { [`routines.${routineId}.name`]: name });
}

// nextActiveId solo hace falta cuando se borra la rutina activa: el
// llamante decide cuál pasa a ser la nueva activa (u null si no queda
// ninguna) para no dejar activeRoutineId apuntando a una rutina borrada.
export async function deleteRoutine(uid, routineId, nextActiveId) {
  const updates = { [`routines.${routineId}`]: deleteField() };
  if (nextActiveId !== undefined) updates.activeRoutineId = nextActiveId;
  await updateDoc(userRef(uid), updates);
}

export async function setActiveRoutine(uid, routineId) {
  await updateDoc(userRef(uid), { activeRoutineId: routineId });
}

// Guarda la semana entera de una rutina de una vez (se edita como un todo
// antes de tener guardado por día).
export async function updateRoutineDays(uid, routineId, days, restDays) {
  await updateDoc(userRef(uid), {
    [`routines.${routineId}.days`]: days,
    [`routines.${routineId}.restDays`]: restDays,
  });
}

// Guarda solo un día (rutas con puntos en Firestore actualizan esa clave
// del mapa sin tocar el resto de la semana), para poder ir guardando según
// se termina cada día en vez de esperar a la semana entera.
export async function updateRoutineDay(uid, routineId, day, exercises, isRest) {
  await updateDoc(userRef(uid), {
    [`routines.${routineId}.days.${day}`]: exercises,
    [`routines.${routineId}.restDays.${day}`]: isRest,
  });
}

export async function updateWeeklyGoal(uid, goal) {
  await updateDoc(userRef(uid), { weeklyGoal: goal });
}

// Añade una rutina recibida de un amigo como una rutina nueva propia (no
// activa automáticamente, para no reemplazar sin querer la que ya usas).
export async function importRoutine(uid, routineData) {
  const id = `routine_${Date.now()}`;
  await updateDoc(userRef(uid), { [`routines.${id}`]: routineData });
  return id;
}

// Amistad mutua: cada lado puede escribir en la subcolección `friends` del
// otro (ver firestore.rules), así que un solo "añadir amigo" basta.
export async function addFriend(myUid, friendUid) {
  if (friendUid === myUid) throw new Error("No puedes añadirte a ti mismo.");
  const friendSnap = await getDoc(userRef(friendUid));
  if (!friendSnap.exists()) throw new Error("No existe ningún atleta con ese ID.");

  await setDoc(doc(db, "users", myUid, "friends", friendUid), { addedAt: serverTimestamp() });
  await setDoc(doc(db, "users", friendUid, "friends", myUid), { addedAt: serverTimestamp() });
  return friendSnap.data();
}

// Envía tu rutina a un amigo: le deja una copia en su propia bandeja
// (`incomingRoutines`), que solo él puede leer o borrar. Las reglas de
// Firestore exigen que quien envía figure ya como su amigo.
export async function shareRoutine(fromUser, toUid, routine) {
  await addDoc(collection(db, "users", toUid, "incomingRoutines"), {
    fromUid: fromUser.uid,
    fromName: fromUser.displayName || "Un amigo",
    fromPhotoURL: fromUser.photoURL || null,
    routine,
    sentAt: serverTimestamp(),
  });
}

export async function listIncomingRoutines(uid) {
  const snaps = await getDocs(collection(db, "users", uid, "incomingRoutines"));
  return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteIncomingRoutine(uid, id) {
  await deleteDoc(doc(db, "users", uid, "incomingRoutines", id));
}

export async function listFriendProfiles(uid) {
  const friendSnaps = await getDocs(collection(db, "users", uid, "friends"));
  const ids = friendSnaps.docs.map((d) => d.id);
  const profiles = await Promise.all(
    ids.map(async (id) => {
      const snap = await getDoc(userRef(id));
      return snap.exists() ? { uid: id, ...snap.data() } : null;
    })
  );
  return profiles.filter(Boolean);
}
