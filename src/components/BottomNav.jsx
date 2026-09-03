import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Trophy, User, Plus, ClipboardList } from "lucide-react";

const LEFT_TABS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/routine", label: "Rutina", icon: ClipboardList },
];
const RIGHT_TABS = [
  { to: "/leaderboard", label: "Ranking", icon: Trophy },
  { to: "/profile", label: "Perfil", icon: User },
];

function NavButton({ to, label, icon: Icon, active }) {
  return (
    <NavLink
      to={to}
      className="relative flex flex-col items-center justify-center gap-1 text-xs font-heading tracking-wide uppercase"
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute top-1.5 w-10 h-10 rounded-2xl bg-blaze-500/15"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className={`relative w-5 h-5 ${active ? "text-blaze-500" : "text-ink-400"}`} strokeWidth={active ? 2.5 : 2} />
      <span className={`relative ${active ? "text-blaze-500" : "text-ink-500"}`}>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40">
      <div className="relative bg-ink-900/95 backdrop-blur border-t border-ink-800 pb-[env(safe-area-inset-bottom)]">
        {/* El hueco central (mismo ancho que el FAB) no tiene ningún botón de
            navegación debajo, para que el FAB no le robe los toques a nada. */}
        <div className="flex items-stretch h-16 max-w-md mx-auto">
          <div className="flex-1 grid grid-cols-2">
            {LEFT_TABS.map((tab) => (
              <NavButton key={tab.to} {...tab} active={location.pathname === tab.to} />
            ))}
          </div>
          <div className="w-16 shrink-0" aria-hidden="true" />
          <div className="flex-1 grid grid-cols-2">
            {RIGHT_TABS.map((tab) => (
              <NavButton key={tab.to} {...tab} active={location.pathname === tab.to} />
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/log")}
          aria-label="Registrar entrenamiento de hoy"
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-16 h-16 rounded-full bg-blaze-gradient flex items-center justify-center shadow-blaze animate-pulse-glow active:scale-95 transition-transform"
        >
          <Plus className="w-8 h-8 text-white" strokeWidth={3} />
        </button>
      </div>
    </nav>
  );
}
