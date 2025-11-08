import { useEffect, useMemo, useState } from "react";


// ---------------- Types ----------------
type EventItem = {
  id: string;
  title: string;
  startISO: string; // ISO string
  endISO: string; // ISO string
};

// UI model grouped by day offset (1..6)
type EventsByDay = Record<number, EventItem[]>;

// --------------- Helpers ---------------
const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
};

// --------------- Component ---------------
export default function App() {
  const [view, setView] = useState<"home" | "quiz" | "result">("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [byDay, setByDay] = useState<EventsByDay>({});

  // Quiz state
  type Q = { id: string; title: string; correct: string; options: string[] };
  const [questions, setQuestions] = useState<Q[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalQuestions = questions.length;
  const current = questions[qIdx];

  // Fetch real events (days 1..6)
  useEffect(() => {
    const API_URL = (import.meta as any).env?.VITE_EVENTS_API_URL as string | undefined;
    const url = API_URL || ""; // leave empty to trigger mock

    const load = async () => {
      setLoading(true); setError(null);
      try {
        if (!url) throw new Error("No API URL configured");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Expecting shape: { days: { "1": EventItem[], ..., "6": EventItem[] } }
        const parsed: EventsByDay = data?.days || {};
        setByDay(parsed);
      } catch (e) {
        console.warn("Using mock data due to error:", e);
        // Fallback mock to keep the UI working
        const now = new Date();
        const mk = (offset: number, title: string, h: number): EventItem => {
          const d = new Date(now);
          d.setDate(d.getDate() + offset);
          d.setHours(h, 0, 0, 0);
          const end = new Date(d); end.setHours(h + 1);
          return { id: `${offset}-${title}-${h}` , title, startISO: d.toISOString(), endISO: end.toISOString() };
        };
        setByDay({
          1: [mk(1, "Reunión con Apple", 10)],
          2: [mk(2, "Daily con equipo", 9), mk(2, "Cliente ABC", 15)],
          3: [],
          4: [mk(4, "UI Review", 11)],
          5: [],
          6: [mk(6, "Sprint Planning", 10)],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build quiz from events (take up to N events across days 1..6)
  const buildQuiz = () => {
    const all: EventItem[] = [1,2,3,4,5,6].flatMap((d) => byDay[d] || []);
    // Generate options for each event (±1h around the correct hour)
    const qs: Q[] = all.slice(0, 8).map((ev) => {
      const dt = new Date(ev.startISO);
      const hh = dt.getHours();
      const optsH = Array.from(new Set([hh - 1, hh, hh + 1].map(h => ((h + 24) % 24))));
      const options = optsH
        .map(h => `${String(h).padStart(2, "0")}:00`)
        .sort();
      const correct = `${String(hh).padStart(2, "0")}:00`;
      return { id: ev.id, title: ev.title, correct, options };
    });
    setQuestions(qs);
    setQIdx(0); setScore(0); setAnswers({});
    setView("quiz");
  };

  const reply = (opt: string) => {
    const q = current; if (!q) return;
    setAnswers(a => ({ ...a, [q.id]: opt }));
    if (opt === q.correct) setScore(s => s + 1);
    if (qIdx >= totalQuestions - 1) setView("result"); else setQIdx(i => i + 1);
  };

  const eventsCount = useMemo(() => [1,2,3,4,5,6].reduce((acc, d) => acc + (byDay[d]?.length || 0), 0), [byDay]);

  return (
    <main className="min-h-screen grid place-items-center p-6
                 bg-linear-to-br from-[#0ea5e9] to-[#3b82f6]">
        <div className="w-full max-w-lg mx-auto">
        <header className="mb-6 text-center bg-white rounded-2xl shadow-md p-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            🧠 Quiz de Memoria de Calendario
          </h1>
          <p className="text-slate-600 mt-1">Días 1 → 6 (hoy es 0). Datos reales si hay API, si no mock.</p>
        </header>

        {view === "home" && (
          <section className="bg-white rounded-2xl shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Eventos próximos</h2>
              <span className="text-xs rounded-full bg-cyan-100 text-cyan-700 px-3 py-1">{eventsCount} eventos</span>
            </div>

            {loading && <p className="text-slate-500">Cargando…</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            <ul className="space-y-3">
              {[1,2,3,4,5,6].map((d) => (
                <li key={d} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{formatDay(d)}</p>
                    <span className="text-xs text-slate-500">{byDay[d]?.length ?? 0} evento(s)</span>
                  </div>
                  <div className="space-y-2">
                    {(byDay[d] ?? []).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between">
                        <span className="truncate max-w-[60%]">{ev.title}</span>
                        <span className="text-sm text-slate-500">{formatTime(ev.startISO)}</span>
                      </div>
                    ))}
                    {(!byDay[d] || byDay[d].length === 0) && (
                      <p className="text-sm text-slate-400">— Sin eventos —</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={buildQuiz}
              disabled={eventsCount === 0}
              className="mt-5 w-full rounded-xl bg-cyan-600 text-black py-3 font-semibold shadow hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Empezar práctica
            </button>
          </section>
        )}

        {view === "quiz" && current && (
          <section className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500">Pregunta {qIdx + 1} de {totalQuestions}</p>
              <p className="text-sm font-semibold">Puntaje: {score}</p>
            </div>
            <h2 className="text-xl font-semibold mb-2">¿A qué hora es…</h2>
            <p className="text-lg font-medium mb-4">“{current.title}”?</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.options.map((opt) => (
                <button key={opt} onClick={() => reply(opt)} className="rounded-xl border py-3 font-semibold hover:border-cyan-400 hover:bg-cyan-50">
                  {opt}
                </button>
              ))}
            </div>
          </section>
        )}

        {view === "result" && (
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-2">¡Listo!</h2>
            <p className="text-slate-600 mb-4">Tu puntaje: {score} / {totalQuestions}</p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-slate-600">Ver respuestas</summary>
              <ul className="mt-2 space-y-2 text-sm">
                {questions.map(q => (
                  <li key={q.id} className="flex items-center justify-between border rounded-lg p-2">
                    <span className="font-medium truncate max-w-[55%]">{q.title}</span>
                    <span>
                      <span className="text-slate-500">Elegiste:</span> {answers[q.id] ?? "—"}
                      <span className="mx-2">·</span>
                      <span className="text-slate-500">Correcta:</span> {q.correct}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
            <div className="flex gap-3">
              <button onClick={() => setView("home")} className="rounded-xl border px-4 py-2 font-semibold hover:border-slate-400">Volver al inicio</button>
              <button onClick={buildQuiz} className="rounded-xl bg-cyan-600 text-white px-4 py-2 font-semibold shadow hover:bg-cyan-700">Repetir práctica</button>
            </div>
          </section>
        )}

        <footer className="mt-6 text-center text-xs text-slate-500">MVP • PWA • React + Tailwind v4</footer>
      </div>
    </main>
  );
}
