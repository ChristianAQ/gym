import { useState } from "react";
import Model from "react-body-highlighter";
import { MUSCLE_TO_BODY_PARTS, BODY_PART_TO_MUSCLE, ANTERIOR_MUSCLES, POSTERIOR_MUSCLES } from "../lib/exercises";

const VIEWS = [
  { key: "anterior", label: "Frontal", muscles: ANTERIOR_MUSCLES },
  { key: "posterior", label: "Trasera", muscles: POSTERIOR_MUSCLES },
];

// Selector de grupo muscular con un modelo de cuerpo interactivo
// (react-body-highlighter) en vez de una rejilla de iconos: se toca la
// zona del cuerpo directamente. El cuerpo tiene dos caras, así que hay un
// toggle frontal/trasera — cada uno de mis grupos solo es tocable en la
// vista donde de verdad se ve (Pecho y Bíceps de frente, Espalda y
// Trapecio de espaldas, el resto en ambas).
export default function MuscleBodyPicker({ usedMuscles, onSelectMuscle }) {
  const [view, setView] = useState("anterior");
  const current = VIEWS.find((v) => v.key === view);

  const data = [...usedMuscles]
    .filter((muscle) => current.muscles.has(muscle))
    .map((muscle) => ({ name: muscle, muscles: MUSCLE_TO_BODY_PARTS[muscle] }));

  function handleClick({ muscle }) {
    const group = BODY_PART_TO_MUSCLE[muscle];
    if (group) onSelectMuscle(group);
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex bg-ink-800 rounded-xl p-1 mb-2">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`px-4 py-1.5 rounded-lg font-heading uppercase text-xs tracking-wide transition-colors ${
              view === v.key ? "bg-blaze-gradient text-white shadow-blaze" : "text-ink-400"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      <Model
        type={view}
        data={data}
        onClick={handleClick}
        bodyColor="#1c1c20"
        highlightedColors={["#ff5c00"]}
        style={{ width: "11rem", height: "22rem" }}
      />
    </div>
  );
}
