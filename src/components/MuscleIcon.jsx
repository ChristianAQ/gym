import { MUSCLE_ICONS, EXERCISE_TO_MUSCLE } from "../lib/exercises";

// Icono del grupo muscular de un ejercicio (o de un grupo directamente).
// Devuelve null si no hay icono para ese nombre (ejercicios personalizados).
export default function MuscleIcon({ exercise, muscle, className = "w-4 h-4" }) {
  const name = muscle || EXERCISE_TO_MUSCLE[exercise];
  const Icon = MUSCLE_ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}
