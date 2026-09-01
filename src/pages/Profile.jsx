import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, UserPlus, LogOut, Dumbbell, CalendarCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { addFriend } from "../lib/firestore";
import PageTransition from "../components/PageTransition";
import Avatar from "../components/Avatar";

export default function Profile() {
  const { user, profile, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [friendId, setFriendId] = useState("");
  const [friendMsg, setFriendMsg] = useState(null);
  const [busy, setBusy] = useState(false);

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
      setFriendMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const prs = Object.entries(profile?.prs ?? {}).sort((a, b) => b[1].weight - a[1].weight);
  const totalWorkouts = profile?.workoutDates?.length ?? 0;

  return (
    <PageTransition className="px-5 pt-8 max-w-md mx-auto pb-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar name={user?.displayName} photoURL={user?.photoURL} size={72} />
        <h1 className="font-heading text-xl font-semibold uppercase tracking-wide mt-3">
          {user?.displayName || "Atleta"}
        </h1>
        <p className="text-ink-500 text-sm">{user?.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <StatCard icon={CalendarCheck} label="Entrenamientos" value={totalWorkouts} />
        <StatCard icon={Dumbbell} label="Récords" value={prs.length} />
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

      {prs.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="font-heading uppercase text-xs tracking-wide text-ink-400 mb-3">Tus récords</p>
          <div className="space-y-2">
            {prs.map(([name, pr]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-ink-200">{name}</span>
                <span className="font-heading font-semibold text-blaze-500">
                  {pr.weight} kg <span className="text-ink-500 font-normal">× {pr.reps}</span>
                </span>
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
