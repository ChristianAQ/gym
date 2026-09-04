import { HugeiconsIcon } from "@hugeicons/react";
import { MUSCLE_ICONS, EXERCISE_TO_MUSCLE } from "../lib/exercises";

// Icono del grupo muscular de un ejercicio (o de un grupo directamente).
// Devuelve null si no hay icono para ese nombre (ejercicios personalizados).
export default function MuscleIcon({ exercise, muscle, className = "w-4 h-4" }) {
  const name = muscle || EXERCISE_TO_MUSCLE[exercise];
  const icon = MUSCLE_ICONS[name];
  if (!icon) return null;
  return <HugeiconsIcon icon={icon} className={className} strokeWidth={2} />;
}
