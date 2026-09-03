import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, UserPlus, LogOut, Dumbbell, CalendarCheck, Pencil, X, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { addFriend, updateProfileData } from "../lib/firestore";
import { updateAuthProfile } from "../firebase";
import { MUSCLE_GROUPS } from "../lib/exercises";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";
import MuscleIcon from "../components/MuscleIcon";

// Agrupa los PRs por músculo (mismo catálogo que la rutina y el registro),
// y deja aparte los que no encajen en ningún grupo (ejercicios
// personalizados, o nombres de antes de organizar el catálogo).
function groupPRsByMuscle(prs) {
  const remaining = new Set(Object.keys(prs));
  const groups = MUSCLE_GROUPS.map((group) => {
    const items = group.exercises
      .filter((ex) => prs[ex])
      .map((ex) => {
        remaining.delete(ex);
        return [ex, prs[ex]];
      })
      .sort((a, b) => b[1].weight - a[1].weight);
    return { name: group.name, items };
  }).filter((group) => group.items.length > 0);

  const others = [...remaining].map((ex) => [ex, prs[ex]]).sort((a, b) => b[1].weight - a[1].weight);
  if (others.length > 0) groups.push({ name: "Otros", items: others });

  return groups;
}

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [friendId, setFriendId] = useState("");
  const [friendMsg, setFriendMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const displayName = profile?.displayName || user?.displayName || "Atleta";
  const photoURL = profile?.photoURL || user?.photoURL;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard API no disponible; el usuario puede seleccionar el texto a mano.
    }
  }

  async function handleAddFriend(e) {
    e.preventDefault();
    setFriendMsg(null);
    if (!friendId.trim()) return;
    setBusy(true);
    try {
      const friend = await addFriend(user.uid, friendId.trim());
      setFriendMsg({ type: "ok", text: `¡${friend.displayName} añadido a tu lista!` });
      setFriendId("");
    } catch (err) {
      const text =
        err.code === "permission-denied"
          ? "Firestore rechazó la petición (permission-denied). Publica las reglas de firestore.rules en la consola de Firebase → Firestore → Reglas."
          : err.message;
      setFriendMsg({ type: "error", text });
    } finally {
      setBusy(false);
    }
  }

  const prsMap = profile?.prs ?? {};
  const prCount = Object.keys(prsMap).length;
  const prGroups = groupPRsByMuscle(prsMap);
  const totalWorkouts = profile?.workoutDates?.length ?? 0;

  return (
    <PageTransition className="px-5 pt-8 max-w-md mx-auto pb-6">
      <AnimatePresence mode="wait">
        {editing ? (
          <EditProfileForm
            key="edit"
            uid={user.uid}
            initialName={displayName}
            initialPhoto={photoURL}
            onDone={() => setEditing(false)}
          />
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center mb-6 relative"
          >
            <button
              onClick={() => setEditing(true)}
              aria-label="Editar perfil"
              className="absolute right-0 top-0 p-2.5 bg-ink-800 rounded-xl text-blaze-500"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <Avatar name={displayName} photoURL={photoURL} size={72} />
            <h1 className="font-heading text-xl font-semibold uppercase tracking-wide mt-3">{displayName}</h1>
            <p className="text-ink-500 text-sm">{user?.email}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <StatCard icon={CalendarCheck} label="Entrenamientos" value={totalWorkouts} />
        <StatCard icon={Dumbbell} label="Récords" value={prCount} />
      </div>

      <div className="card p-5 mb-4">
        <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-2">Tu ID de GymRat</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-ink-800 rounded-xl px-3 py-2.5 text-xs text-ink-300 truncate">{user?.uid}</code>
          <button onClick={copyId} className="p-3 bg-ink-800 rounded-xl text-blaze-500 shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-ink-500 text-xs mt-2">Compártelo con amigos para que puedan añadirte.</p>
      </div>

      <form onSubmit={handleAddFriend} className="card p-5 mb-4">
        <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-2">Añadir amigo</p>
        <div className="flex items-center gap-2">
          <input
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            placeholder="Pega el ID de tu amigo"
            className="input-field flex-1 text-sm"
          />
          <button type="submit" disabled={busy} className="p-3.5 bg-blaze-gradient rounded-xl text-white shrink-0 disabled:opacity-60">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
        {friendMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs mt-2 ${friendMsg.type === "ok" ? "text-blaze-400" : "text-red-400"}`}
          >
            {friendMsg.text}
          </motion.p>
        )}
      </form>

      {prGroups.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-3">Tus récords</p>
          <div className="space-y-4">
            {prGroups.map((group) => (
              <div key={group.name}>
                <p className="text-blaze-500 text-[11px] font-heading uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <MuscleIcon muscle={group.name} className="w-3.5 h-3.5" />
                  {group.name}
                </p>
                <div className="space-y-2">
                  {group.items.map(([name, pr]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-ink-200">{name}</span>
                      <span className="font-heading font-semibold text-blaze-500">
                        {pr.weight} kg <span className="text-ink-500 font-normal">× {pr.reps}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={logout} className="btn-ghost w-full flex items-center justify-center gap-2 mt-2">
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </PageTransition>
  );
}

function EditProfileForm({ uid, initialName, initialPhoto, onDone }) {
  const [name, setName] = useState(initialName);
  const [photo, setPhoto] = useState(initialPhoto || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateProfileData(uid, { displayName: name.trim(), photoURL: photo.trim() });
      try {
        await updateAuthProfile({ displayName: name.trim(), photoURL: photo.trim() });
      } catch {
        // No crítico: el perfil de Firestore (lo que ve el resto de la app) ya quedó guardado.
      }
      onDone();
    } catch {
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSave}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-heading uppercase text-sm tracking-wide">Editar perfil</p>
        <button type="button" onClick={onDone} className="p-1.5 text-ink-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <Avatar name={name} photoURL={photo} size={64} />
      </div>

      <label className="block text-[11px] text-ink-500 uppercase tracking-wide mb-1">Nombre</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="input-field mb-3"
      />

      <label className="block text-[11px] text-ink-500 uppercase tracking-wide mb-1">Foto de perfil (URL)</label>
      <input
        value={photo}
        onChange={(e) => setPhoto(e.target.value)}
        placeholder="https://..."
        className="input-field mb-1"
      />
      <p className="text-ink-600 text-xs mb-4">Pega el enlace a una imagen tuya. Déjalo vacío para usar tus iniciales.</p>

      {error && <p className="text-blaze-300 text-sm mb-3 text-center">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onDone} className="btn-ghost flex-1">
          Cancelar
        </button>
        <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar
        </button>
      </div>
    </motion.form>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blaze-500/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blaze-500" />
      </div>
      <div>
        <p className="font-heading text-xl font-semibold leading-none">{value}</p>
        <p className="text-ink-500 text-xs mt-1">{label}</p>
      </div>
    </div>
  );
}
