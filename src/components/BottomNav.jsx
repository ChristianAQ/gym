import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Trophy, User, Plus } from "lucide-react";

const TABS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/leaderboard", label: "Ranking", icon: Trophy },
  { to: "/profile", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="relative bg-ink-900/95 backdrop-blur border-t border-ink-800">
        <div className="grid grid-cols-3 h-16 max-w-md mx-auto relative">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <NavLink
                key={to}
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
                <Icon
                  className={`relative w-5 h-5 ${active ? "text-blaze-500" : "text-ink-400"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`relative ${active ? "text-blaze-500" : "text-ink-500"}`}>
                  {label}
                </span>
              </NavLink>
            );
          })}
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
