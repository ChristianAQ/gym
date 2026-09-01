import { motion } from "framer-motion";
import { Flame, Trophy, Dumbbell } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import PageTransition from "../components/PageTransition";
import Calendar from "../components/Calendar";
import Avatar from "../components/Avatar";

export default function Dashboard() {
  const { user, profile } = useAuth();

  const streak = profile?.currentStreak ?? 0;
  const best = profile?.bestStreak ?? 0;
  const workoutDates = profile?.workoutDates ?? [];
  const prCount = Object.keys(profile?.prs ?? {}).length;
  const firstName = (user?.displayName || "Atleta").split(" ")[0];

  return (
    <PageTransition className="px-5 pt-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-ink-400 text-sm">Hola,</p>
          <h1 className="font-heading text-2xl font-semibold uppercase tracking-wide">{firstName}</h1>
        </div>
        <Avatar name={user?.displayName} photoURL={user?.photoURL} size={48} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card p-6 mb-5 bg-blaze-gradient border-none relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 opacity-20">
          <Flame className="w-32 h-32" strokeWidth={1} />
        </div>
        <p className="text-white/80 text-xs uppercase tracking-widest font-heading">Racha actual</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="font-heading text-6xl font-semibold text-white leading-none">{streak}</span>
          <span className="text-white/80 font-heading uppercase mb-1.5">
            {streak === 1 ? "día" : "días"}
          </span>
        </div>
        <p className="text-white/70 text-sm mt-2">
          {streak === 0
            ? "Hoy es un buen día para empezar."
            : `Tu mejor racha: ${best} ${best === 1 ? "día" : "días"}.`}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <StatCard icon={Trophy} label="Mejor racha" value={best} />
        <StatCard icon={Dumbbell} label="Récords" value={prCount} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Calendar workoutDates={workoutDates} />
      </motion.div>
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
