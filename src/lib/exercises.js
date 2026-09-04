import {
  BodyPartSixPackIcon,
  ShoulderIcon,
  BicepsFlexedIcon,
  BackMuscleBodyIcon,
  BodyPartMuscleIcon,
  HandGripIcon,
  BodyPartLegIcon,
  Dumbbell01Icon,
} from "@hugeicons/core-free-icons";

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

// Un icono anatómico por grupo muscular, de @hugeicons/core-free-icons (los
// datos del icono, no un componente — MuscleIcon.jsx los pinta con
// HugeiconsIcon). Tríceps no tenía un icono específico dictado, así que usa
// el mismo "brazo flexionado" que Bíceps pero en su variante propia.
export const MUSCLE_ICONS = {
  Pecho: BodyPartSixPackIcon,
  Hombro: ShoulderIcon,
  Tríceps: BicepsFlexedIcon,
  Espalda: BackMuscleBodyIcon,
  Bíceps: BodyPartMuscleIcon,
  Antebrazo: HandGripIcon,
  Pierna: BodyPartLegIcon,
  Trapecio: Dumbbell01Icon,
};

// Nombre de ejercicio -> grupo muscular. "Pullover" está en dos grupos; aquí
// se queda con el último (Espalda) porque solo puede llevar un icono.
export const EXERCISE_TO_MUSCLE = Object.fromEntries(
  MUSCLE_GROUPS.flatMap((g) => g.exercises.map((ex) => [ex, g.name]))
);

// Cada uno de mis 8 grupos musculares -> las "piezas" del modelo de cuerpo
// de react-body-highlighter que le corresponden (puede ser más de una,
// p. ej. "Pierna" cubre varios músculos de la librería). Algunas piezas
// solo existen en la vista frontal (anterior) y otras solo en la trasera
// (posterior) del modelo — ver ANTERIOR_MUSCLES/POSTERIOR_MUSCLES más abajo.
export const MUSCLE_TO_BODY_PARTS = {
  Pecho: ["chest"],
  Hombro: ["front-deltoids", "back-deltoids"],
  Tríceps: ["triceps"],
  Espalda: ["upper-back", "lower-back"],
  Bíceps: ["biceps"],
  Antebrazo: ["forearm"],
  Pierna: ["quadriceps", "hamstring", "calves", "gluteal", "adductor", "abductors"],
  Trapecio: ["trapezius"],
};

// Inverso: pieza del modelo de cuerpo -> mi grupo muscular. Así, al tocar
// cualquier región del cuerpo (p. ej. "hamstring" o "quadriceps"), se sabe
// que corresponde al grupo "Pierna" sin importar cuál de sus piezas se tocó.
export const BODY_PART_TO_MUSCLE = Object.fromEntries(
  Object.entries(MUSCLE_TO_BODY_PARTS).flatMap(([muscle, parts]) => parts.map((part) => [part, muscle]))
);

// De mis 8 grupos, cuáles tienen alguna pieza visible/tocable en cada vista
// del modelo (comprobado contra los datos SVG de la librería): Pecho y
// Bíceps solo existen de frente; Espalda y Trapecio solo de espaldas: el
// resto aparece en ambas vistas.
export const ANTERIOR_MUSCLES = new Set(["Pecho", "Hombro", "Tríceps", "Bíceps", "Antebrazo", "Pierna"]);
export const POSTERIOR_MUSCLES = new Set(["Hombro", "Tríceps", "Espalda", "Antebrazo", "Pierna", "Trapecio"]);
