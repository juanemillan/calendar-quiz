import { useMemo, useState } from "react";

// MVP: UI básica con un flujo de quiz sobre "eventos de mañana" (simulados por ahora).
// Luego conectaremos un endpoint para leer Google Calendar y registrar respuestas.

// --- Datos simulados ---
type EventItem = {
  id: string;
  title: string;
  correctTime: string; // HH:mm
  options: string[];   // HH:mm
};

const mockTomorrowEvents: EventItem[] = [
  {
    id: "1",
    title: "Reunión con Apple",
    correctTime: "10:00",
    options: ["09:00", "10:00", "11:00"],
  },
  {
    id: "2",
    title: "Daily con equipo",
    correctTime: "09:30",
    options: ["09:00", "09:30", "10:00"],
  },
];

export default function App() {
  const [view, setView] = useState<"home" | "quiz" | "result">("home");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const events = useMemo(() => mockTomorrowEvents, []);
  const current = events[idx];

  const startQuiz = () => {
    setView("quiz");
    setIdx(0);
    setScore(0);
    setAnswers({});
  };

  const selectAnswer = (opt: string) => {
    // Guardar respuesta y actualizar score si corresponde
    setAnswers((prev) => ({ ...prev, [current.id]: opt }));
    if (opt === current.correctTime) setScore((s) => s + 1);

    // Avanzar
    const isLast = idx === events.length - 1;
    if (isLast) {
      setView("result");
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-cyan-100 via-white to-blue-100 text-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            🧠 Quiz de Memoria de Calendario
          </h1>
          <p className="text-slate-600 mt-1">
            Practica recordando tus eventos de mañana. Este es un MVP con datos simulados.
          </p>
        </header>

        {view === "home" && (
          <section className="bg-white rounded-2xl shadow-md p-5">
            <h2 className="text-lg font-semibold mb-3">Eventos de mañana</h2>
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-slate-500">Te preguntaremos la hora ✨</p>
                  </div>
                  <span className="text-xs rounded-full bg-cyan-100 text-cyan-700 px-3 py-1">
                    1 pregunta
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={startQuiz}
              className="mt-5 w-full rounded-xl bg-cyan-600 text-white py-3 font-semibold shadow hover:bg-cyan-700 active:translate-y-px"
            >
              Empezar práctica
            </button>
          </section>
        )}

        {view === "quiz" && (
          <section className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Pregunta {idx + 1} de {events.length}</p>
              <p className="text-sm font-semibold">Puntaje: {score}</p>
            </div>

            <h2 className="text-xl font-semibold mb-2">¿A qué hora es…</h2>
            <p className="text-lg font-medium mb-4">“{current.title}”?</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectAnswer(opt)}
                  className="rounded-xl border py-3 font-semibold hover:border-cyan-400 hover:bg-cyan-50"
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>
        )}

        {view === "result" && (
          <section className="bg-white rounded-2xl shadow-md p-5">
            <h2 className="text-xl font-bold mb-2">¡Listo!</h2>
            <p className="text-slate-600 mb-4">Tu puntaje: {score} / {events.length}</p>

            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-slate-600">Ver respuestas</summary>
              <ul className="mt-2 space-y-2 text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border rounded-lg p-2">
                    <span className="font-medium">{e.title}</span>
                    <span>
                      <span className="text-slate-500">Elegiste:</span> {answers[e.id] ?? "—"}
                      <span className="mx-2">·</span>
                      <span className="text-slate-500">Correcta:</span> {e.correctTime}
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <div className="flex gap-3">
              <button
                onClick={() => setView("home")}
                className="rounded-xl border px-4 py-2 font-semibold hover:border-slate-400"
              >
                Volver al inicio
              </button>
              <button
                onClick={startQuiz}
                className="rounded-xl bg-cyan-600 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-700"
              >
                Repetir práctica
              </button>
            </div>
          </section>
        )}

        <footer className="mt-6 text-center text-xs text-slate-500">
          MVP • PWA • React + Tailwind v4
        </footer>
      </div>
    </main>
  );
}

