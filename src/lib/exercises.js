// Catálogo de ejercicios organizado por grupo muscular — se usa tanto en el
// desplegable de la rutina y del registro diario (como <optgroup>, para que
// en iOS la rueda nativa salga ya dividida por músculo) como para agrupar
// "Tus récords" en el perfil.
export const MUSCLE_GROUPS = [
  {
    name: "Pecho",
    exercises: ["Press banca inclinado", "Aperturas", "Press banca plano", "Pullover", "Press banca declinado"],
  },
  {
    name: "Hombro",
    exercises: ["Press Arnold", "Elevaciones frontales", "Pájaros", "Elevaciones laterales"],
  },
  {
    name: "Tríceps",
    exercises: ["Press francés", "Extensiones en polea", "Fondos", "Extensión individual"],
  },
  {
    name: "Espalda",
    exercises: ["Dominadas", "Jalón al pecho", "Remo", "Pullover"],
  },
  {
    name: "Bíceps",
    exercises: ["Curl barra Z", "Curl inclinado", "Curl martillo", "Curl con barra de pie"],
  },
  {
    name: "Antebrazo",
    exercises: ["Curl supinación", "Curl pronación"],
  },
  {
    name: "Pierna",
    exercises: ["Sentadillas", "Hack", "Peso muerto", "Prensa", "Curl pierna", "Extensiones", "Gemelos", "Aductores"],
  },
  {
    name: "Trapecio",
    exercises: ["Encogimientos", "Encogimiento inclinado con barra"],
  },
];

// Lista plana (sin duplicados) — útil para comprobar si un nombre es "de
// catálogo" o personalizado. "Pullover" aparece en Pecho y Espalda a
// propósito: trabaja ambos.
export const COMMON_EXERCISES = [...new Set(MUSCLE_GROUPS.flatMap((g) => g.exercises))];

// Los "grandes" usados para comparar rachas de PRs en el ranking.
export const KEY_EXERCISES = ["Press banca plano", "Sentadillas", "Peso muerto", "Press Arnold"];
