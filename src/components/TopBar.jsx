import { Flame } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { asset } from "../lib/asset";

// Barra fija arriba del todo (misma idea que BottomNav pero para el
// notch/safe-area superior): da identidad de marca constante en todas las
// pantallas principales y un vistazo rápido a la racha sin tener que ir
// al Dashboard. AppShell reserva su altura exacta (3.5rem + safe-area)
// en el padding superior de <main>.
export default function TopBar() {
  const { profile } = useAuth();
  const streak = profile?.currentStreak ?? 0;

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur border-b border-ink-800 pt-[env(safe-area-inset-top)]">
      <div className="h-14 max-w-md mx-auto px-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={asset("icons/logo.png")} alt="" className="w-6 h-6" />
          <span className="font-heading text-sm font-semibold uppercase tracking-wide">
            Gym<span className="text-blaze-500">Rat</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-blaze-500" aria-label={`Racha actual: ${streak} días`}>
          <Flame className="w-4 h-4" />
          <span className="font-heading text-sm font-semibold">{streak}</span>
        </div>
      </div>
    </header>
  );
}
