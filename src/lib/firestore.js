import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
    prs: {},
  };
  await setDoc(ref, profile);
  return profile;
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
  const updates = {
    currentStreak,
    bestStreak,
    lastWorkoutDate,
    workoutDates: arrayUnion(dateKey),
  };

  const loggedExercises = exercises.map((ex) => {
    const weight = Number(ex.weight) || 0;
    const prevBest = prs[ex.name]?.weight ?? 0;
    const isPR = weight > 0 && weight > prevBest;
    if (isPR) {
      updates[`prs.${ex.name}`] = { weight, reps: Number(ex.reps) || 0, date: dateKey };
    }
    return { ...ex, weight, isPR };
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
