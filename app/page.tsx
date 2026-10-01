"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MeleeLogo from "./components/MeleeLogo";
import RaceTrack from "./components/RaceTrack";
import {
  LITEPAPER_URL,
  PASS_SCORE,
  QUESTIONS,
  ROUND_SIZE,
  TIME_PER_QUESTION_SEC,
  type QuizQuestion,
} from "./data/questions";

type Phase = "landing" | "quiz" | "results";

const LETTERS = ["A", "B", "C", "D"];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** Fisher–Yates shuffle. Called only from event handlers (impure-safe). */
function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [round, setRound] = useState<QuizQuestion[]>(() =>
    QUESTIONS.slice(0, ROUND_SIZE)
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(ROUND_SIZE).fill(null)
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION_SEC);
  const [elapsed, setElapsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  interface ConfettiPiece {
    id: number;
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    round: boolean;
  }
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeftRef = useRef(TIME_PER_QUESTION_SEC);

  const q = round[index];
  const score: number = useMemo(
    () =>
      answers.reduce<number>(
        (acc, a, i) => acc + (a !== null && a === round[i].answerIndex ? 1 : 0),
        0
      ),
    [answers, round]
  );
  const passed: boolean = score >= PASS_SCORE;

  // total elapsed timer
  useEffect(() => {
    if (phase === "quiz") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase]);

  const resetClock = useCallback(() => {
    timeLeftRef.current = TIME_PER_QUESTION_SEC;
    setTimeLeft(TIME_PER_QUESTION_SEC);
  }, []);

  const startQuiz = useCallback(() => {
    setRound(shuffled(QUESTIONS).slice(0, ROUND_SIZE));
    setPhase("quiz");
    setIndex(0);
    setAnswers(Array(ROUND_SIZE).fill(null));
    setSelected(null);
    setRevealed(false);
    setTimedOut(false);
    resetClock();
    setElapsed(0);
    setStreak(0);
    setBestStreak(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetClock]);

  const choose = useCallback(
    (opt: number) => {
      if (revealed) return;
      setSelected(opt);
      setRevealed(true);
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = opt;
        return next;
      });
      const correct = opt === q.answerIndex;
      const ns = correct ? streak + 1 : 0;
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
    },
    [revealed, index, q.answerIndex, streak]
  );

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    setSelected(null);
    setRevealed(true);
    setAnswers((prev) => {
      if (prev[index] !== null) return prev;
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setStreak(0);
  }, [index]);

  // per-question countdown; fires handleTimeout at zero.
  // State updates happen inside the interval callback (not the effect body).
  useEffect(() => {
    if (phase !== "quiz" || revealed) return;
    const id = setInterval(() => {
      timeLeftRef.current -= 1;
      const v = timeLeftRef.current;
      setTimeLeft(v);
      if (v <= 0) {
        clearInterval(id);
        handleTimeout();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, index, revealed, handleTimeout]);

  const goNext = useCallback(() => {
    if (index + 1 >= ROUND_SIZE) {
      setPhase("results");
      if (timerRef.current) clearInterval(timerRef.current);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setTimedOut(false);
      resetClock();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [index, resetClock]);

  // keyboard shortcuts
  useEffect(() => {
    if (phase !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        "1": 0, "2": 1, "3": 2, "4": 3,
        a: 0, b: 1, c: 2, d: 3,
        A: 0, B: 1, C: 2, D: 3,
      };
      if (e.key in map && !revealed) choose(map[e.key]);
      if (e.key === "Enter" && revealed) goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, revealed, choose, index, goNext]);

  const goPrev = useCallback(() => {
    if (index === 0) return;
    const prevIdx = index - 1;
    setIndex(prevIdx);
    const prevAns = answers[prevIdx];
    setSelected(prevAns);
    setRevealed(prevAns !== null);
    setTimedOut(false);
  }, [index, answers]);

  // Deterministic pseudo-random (pure — lint-safe) for confetti
  const confetti: ConfettiPiece[] = useMemo(() => {
    if (phase !== "results" || !passed) return [];
    const colors = ["#8060FF", "#38E1FF", "#FFC531", "#34C77B", "#F26D85", "#16151B"];
    const hash = (n: number, salt: number) => {
      const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: hash(i, 1) * 100,
      delay: hash(i, 2) * 1.6,
      duration: 2.6 + hash(i, 3) * 2.4,
      size: 6 + hash(i, 4) * 8,
      color: colors[i % colors.length],
      round: hash(i, 5) > 0.5,
    }));
  }, [phase, passed]);

  // questions completed (answered or timed out) — drives the race track.
  // You can only reach question i by completing all before it.
  const completed = revealed ? index + 1 : index;

  return (
    <div className="relative min-h-screen bg-[#FAF7F2] text-[#16151B]">
      <div className="dotgrid pointer-events-none fixed inset-0" />

      {confetti.map((c) => (
        <span
          key={c.id}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.round ? c.size : c.size * 0.45,
            background: c.color,
            borderRadius: c.round ? "50%" : "2px",
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        />
      ))}

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-[#E7E0D2] bg-[#FAF7F2]/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => setPhase("landing")}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition hover:opacity-70"
            aria-label="Back to home"
          >
            <MeleeLogo className="h-6 w-auto" />
          </button>

          <p className="hidden font-mono text-[11px] tracking-[0.25em] text-[#8A8578] sm:block">
            PMM QUIZ
          </p>

          <div className="flex items-center gap-2">
            {phase === "quiz" && (
              <span className="hidden rounded-full border border-[#E7E0D2] bg-white px-3 py-1.5 font-mono text-xs text-[#5F5B6B] sm:block">
                Q {index + 1}/{ROUND_SIZE} · {score} pts · {formatTime(elapsed)}
              </span>
            )}
            <a
              href={LITEPAPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#16151B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black sm:text-[13px]"
            >
              Litepaper ↗
            </a>
          </div>
        </div>
        {phase === "quiz" && (
          <div className="h-[2px] w-full bg-[#EDE7D9]">
            <div
              className="h-full bg-[#8060FF] transition-all duration-500"
              style={{ width: `${((index + (revealed ? 1 : 0)) / ROUND_SIZE) * 100}%` }}
            />
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 pb-20 sm:px-6">
        {phase === "landing" && <Landing onStart={startQuiz} />}

        {phase === "quiz" && (
          <section key={q.id} className="mx-auto mt-8 max-w-2xl sm:mt-12">
            <div className="anim-fade-up flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#8A8578] uppercase">
                {q.category}
              </p>
              <div className="flex items-center gap-2">
                <TimerRing left={timeLeft} total={TIME_PER_QUESTION_SEC} />
                {streak >= 2 && (
                  <span className="anim-pop rounded-full bg-[#FFF3E2] border border-[#EBD9B4] px-2.5 py-1 text-xs font-semibold text-[#9A6B1A]">
                    🔥 {streak} streak
                  </span>
                )}
              </div>
            </div>

            {/* countdown bar */}
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#EDE7D9]">
              <div
                className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                  timeLeft <= 5 ? "bg-[#E5484D]" : "bg-[#8060FF]"
                }`}
                style={{ width: `${(Math.max(timeLeft, 0) / TIME_PER_QUESTION_SEC) * 100}%` }}
              />
            </div>

            {/* race-track progress */}
            <RaceTrack completed={completed} total={ROUND_SIZE} />

            {/* question card */}
            <div className="card anim-pop mt-5 rounded-2xl p-6 sm:p-8">
              <p className="font-mono text-xs text-[#8A8578] tabular-nums">
                {index + 1} / {ROUND_SIZE}
              </p>
              <h2 className="font-display mt-3 text-xl font-semibold leading-snug sm:text-2xl">
                {q.question}
              </h2>
              <p className="mt-2 text-xs text-[#8A8578]">
                <kbd className="rounded border border-[#E7E0D2] bg-[#F4EFE5] px-1.5 py-0.5 font-mono">A</kbd>–
                <kbd className="rounded border border-[#E7E0D2] bg-[#F4EFE5] px-1.5 py-0.5 font-mono">D</kbd>
                {" · "}
                {revealed ? (
                  "locked in"
                ) : (
                  <span className={timeLeft <= 5 ? "font-bold text-[#E5484D]" : ""}>
                    {timeLeft}s left
                  </span>
                )}
              </p>

              <div className="mt-6 grid gap-2.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.answerIndex;
                  const isPicked = selected === oi;
                  // On timeout the board stays blank — nothing highlighted.
                  const showMarks = revealed && !timedOut;
                  let cls = "border-[#E7E0D2] bg-white hover:border-[#16151B]";
                  if (showMarks) {
                    if (isCorrect) cls = "border-[#1F9D63] bg-[#EAF7F0]";
                    else if (isPicked) cls = "border-[#E5484D] bg-[#FDECEC]";
                    else cls = "border-[#EDE7D9] bg-white opacity-55";
                  } else if (revealed) {
                    cls = "border-[#EDE7D9] bg-white opacity-70";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => choose(oi)}
                      disabled={revealed}
                      className={`anim-fade-up flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-colors duration-150 ${cls} ${
                        !revealed ? "cursor-pointer" : "cursor-default"
                      }`}
                      style={{ animationDelay: `${oi * 0.05}s` }}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          showMarks && isCorrect
                            ? "bg-[#1F9D63] text-white"
                            : showMarks && isPicked
                              ? "bg-[#E5484D] text-white"
                              : "bg-[#F4EFE5] text-[#5F5B6B]"
                        }`}
                      >
                        {showMarks && isCorrect ? "✓" : showMarks && isPicked ? "✕" : LETTERS[oi]}
                      </span>
                      <span className="text-sm leading-relaxed sm:text-[15px]">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <div
                  className={`anim-pop mt-5 rounded-xl border p-4 ${
                    selected === q.answerIndex
                      ? "border-[#BFE3D2] bg-[#F0F9F4]"
                      : timedOut
                        ? "border-[#F3C2C5] bg-[#FDECEC]"
                        : "border-[#F3D9A4] bg-[#FDF6E7]"
                  }`}
                >
                  <p
                    className={`text-sm font-bold ${
                      timedOut && selected !== q.answerIndex ? "text-[#C22E3D]" : ""
                    }`}
                  >
                    {selected === q.answerIndex
                      ? "✓ Correct."
                      : timedOut
                        ? "⏱ Time's up — no answer recorded. Marked as failed."
                        : `✕ The answer was ${LETTERS[q.answerIndex]}.`}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#5F5B6B]">
                    {q.explanation}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-[#8A8578]">
                    {q.litepaperRef} ·{" "}
                    <a href={LITEPAPER_URL} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#8060FF]">
                      litepaper ↗
                    </a>
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#EFE9DB] pt-5">
                <button
                  onClick={goPrev}
                  disabled={index === 0}
                  className="rounded-full px-4 py-2.5 text-sm text-[#5F5B6B] transition hover:text-[#16151B] disabled:opacity-30"
                >
                  ← Back
                </button>
                <p className="font-mono text-xs text-[#8A8578] tabular-nums">
                  {score} correct
                </p>
                <button
                  onClick={goNext}
                  disabled={!revealed}
                  className="rounded-full bg-[#16151B] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-25"
                >
                  {index + 1 === ROUND_SIZE ? "See results →" : "Next →"}
                </button>
              </div>
            </div>
          </section>
        )}

        {phase === "results" && (
          <Results
            score={score}
            passed={passed}
            elapsed={elapsed}
            bestStreak={bestStreak}
            answers={answers}
            round={round}
            onRetake={startQuiz}
          />
        )}
      </main>

      <footer className="relative z-10 border-t border-[#E7E0D2]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <MeleeLogo className="h-5 w-auto" />
            <p className="text-xs text-[#8A8578]">
              Distilled from the PMM litepaper
            </p>
          </div>
          <p className="order-last text-xs text-[#8A8578] sm:order-none">
            created by{" "}
            <a
              href="https://x.com/nuel_ikwuoma"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#16151B] underline decoration-[#8060FF]/50 underline-offset-2 transition hover:text-[#8060FF]"
            >
              nuel
            </a>
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://melee.markets" target="_blank" rel="noreferrer" className="text-[#8A8578] transition hover:text-[#16151B]">
              melee.markets ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Timer ring ---------------- */

function TimerRing({ left, total }: { left: number; total: number }) {
  const R = 15;
  const C = 2 * Math.PI * R;
  const pct = Math.max(left, 0) / total;
  const urgent = left <= 5;
  return (
    <span
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full border font-mono text-[11px] font-bold tabular-nums ${
        urgent
          ? "animate-pulse border-[#E5484D]/50 bg-[#FDECEC] text-[#C22E3D]"
          : "border-[#E7E0D2] bg-white text-[#16151B]"
      }`}
      title={`${left}s remaining`}
    >
      <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={R} fill="none" stroke="#EDE7D9" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke={urgent ? "#E5484D" : "#8060FF"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      {left}
    </span>
  );
}

/* ---------------- Landing ---------------- */

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <section className="grid items-center gap-10 pt-12 sm:pt-20 lg:grid-cols-2">
        <div>
          <p className="anim-fade-up font-mono text-[11px] tracking-[0.25em] text-[#8A8578]">
            THE PARIMUTUEL MARKET MAKER · INTERACTIVE QUIZ
          </p>
          <h1 className="font-display anim-fade-up stagger-1 mt-4 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            Prove you{" "}
            <em className="font-accent font-normal text-[#8060FF]">get</em>
            <br />
            the PMM.
          </h1>
          <p className="anim-fade-up stagger-2 mt-5 max-w-md text-[15px] leading-relaxed text-[#5F5B6B] sm:text-base">
            A ten-question exam drawn from a bank of {QUESTIONS.length}, pulled
            straight from the Melee litepaper. Twenty seconds a question.
            Score {PASS_SCORE} or more to qualify.
          </p>

          <div className="anim-fade-up stagger-3 mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className="rounded-full bg-[#16151B] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Start quiz →
            </button>
            <a
              href={LITEPAPER_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#D9D1BE] bg-transparent px-6 py-3.5 text-sm font-semibold transition hover:border-[#16151B]"
            >
              Read the litepaper ↗
            </a>
          </div>

          {/* stats hairline row */}
          <div className="anim-fade-up stagger-4 mt-9 grid max-w-md grid-cols-3 border-y border-[#16151B]">
            {[
              [`${QUESTIONS.length}→${ROUND_SIZE}`, "questions"],
              [`${TIME_PER_QUESTION_SEC}s`, "each"],
              [`${PASS_SCORE} to pass`, "to qualify"],
            ].map(([v, l], i) => (
              <div
                key={l}
                className={`py-3.5 ${i > 0 ? "border-l border-[#E0D8C4] pl-4" : ""} ${i === 0 ? "pr-4" : ""}`}
              >
                <p className="font-display text-lg font-semibold tabular-nums">{v}</p>
                <p className="mt-0.5 text-xs text-[#8A8578]">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* flat preview card */}
        <div className="anim-pop stagger-2">
          <div className="card anim-float rounded-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#8A8578]">
                SAMPLE QUESTION
              </p>
              <span className="rounded-full bg-[#F4EFE5] px-2.5 py-1 font-mono text-[11px] font-bold text-[#5F5B6B]">
                {TIME_PER_QUESTION_SEC}s
              </span>
            </div>
            <p className="font-display mt-4 text-lg font-semibold leading-snug">
              What is a position&apos;s minimum-return floor?
            </p>
            <div className="mt-4 grid gap-2">
              {[
                ["A", "A guaranteed profit, whatever wins"],
                ["B", "A cashout quote, redeemable anytime"],
                ["C", "A stop-loss you set yourself"],
                ["D", "A minimum payout set at entry — it can only rise", true],
              ].map(([letter, text, correct]) => (
                <div
                  key={letter as string}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                    correct
                      ? "border-[#1F9D63] bg-[#EAF7F0]"
                      : "border-[#EDE7D9]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                      correct ? "bg-[#1F9D63] text-white" : "bg-[#F4EFE5] text-[#5F5B6B]"
                    }`}
                  >
                    {correct ? "✓" : (letter as string)}
                  </span>
                  <span className={correct ? "font-medium" : "text-[#5F5B6B]"}>{text as string}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-[#EFE9DB] pt-3 font-mono text-[11px] text-[#8A8578]">
              ENTRY-TIME PRICE INTEGRITY
            </p>
          </div>
          <p className="mt-3 text-center font-mono text-[11px] text-[#8A8578]">
            126 BTC markets simulated · floor held 100%
          </p>
        </div>
      </section>

      {/* syllabus */}
      <section className="mt-16 sm:mt-24">
        <p className="font-mono text-[11px] tracking-[0.25em] text-[#8A8578]">
          WHAT YOU&apos;LL BE TESTED ON
        </p>
        <h2 className="font-display mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl">
          Five ideas. <em className="font-accent font-normal text-[#8060FF]">Ten</em> questions.{" "}
          <em className="font-accent font-normal text-[#8060FF]">Twenty</em> seconds each.
        </h2>
        <div className="mt-8 border-t border-[#16151B]">
          {[
            ["01", "Continuous trading", "Buy, switch between outcomes, or cash out via the LP vault — anytime."],
            ["02", "First-dollar cold-start", "The pool itself is the counterparty. No market maker, no subsidy."],
            ["03", "Price integrity", "Entry-time quotes locked in as floors that later flow can never erode."],
            ["04", "Peer-to-peer economics", "No neutral LP bleeding into losers; settlement stays inside the pool."],
            ["05", "Passive yield", "Early and presale capital earns counterparty-liquidity rewards for absorbing volatility."],
          ].map(([n, t, d], i) => (
            <div
              key={n}
              className="anim-fade-up grid grid-cols-[48px_1fr] gap-4 border-b border-[#E7E0D2] py-5 transition-colors hover:bg-white sm:grid-cols-[64px_240px_1fr] sm:items-baseline"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <p className="font-mono text-sm text-[#B9B2A1]">{n}</p>
              <p className="font-display text-base font-semibold">{t}</p>
              <p className="col-span-2 text-sm leading-relaxed text-[#5F5B6B] sm:col-span-1">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Card themes + flat icons ---------------- */

interface CardTheme {
  id: string;
  name: string;
  accent: string;
}

const CARD_THEMES: CardTheme[] = [
  { id: "violet", name: "Melee Violet", accent: "#8060FF" },
  { id: "silks", name: "Jockey Green", accent: "#0E5C3F" },
  { id: "gold", name: "Gold Cup", accent: "#A97E14" },
  { id: "rose", name: "Rose Gallop", accent: "#D6455B" },
  { id: "midnight", name: "Midnight", accent: "#16151B" },
];

function IconDownload({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 20h16" />
    </svg>
  );
}

function IconShare({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" />
    </svg>
  );
}

function IconSliders({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

function IconRetake({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
    </svg>
  );
}

/* ---------------- Shareable card art (canvas, light) ---------------- */

const MELEE_SVG_DARK = `<svg width="248" height="64" viewBox="0 0 124 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="124" height="32" rx="7" fill="white"/><g transform="translate(7,4) scale(0.885)"><path d="M16.4346 15.4831L27.8692 4H9.52237L5 8.54154V16.7015L11.324 10.3508L12.3718 11.4031L5 18.8062V23.4769L9.52237 28H14.155L21.5269 20.5969L22.5747 21.6492L16.2508 28H24.3947L28.8987 23.4769V5.05231L17.4825 16.5354L16.4346 15.4831Z" fill="#8060FF"/><path d="M48.5506 7.15698H47.0432H44.7269L43.8444 13.0647L42.9436 7.15698H40.6273H39.1382H35.9763L34.5791 24.8431H39.2302L40.0942 13.9878L41.6016 24.8431H42.0612H45.6276H46.0689L47.5947 13.9878L48.4587 24.8431H53.1098L51.6942 7.15698H48.5506Z" fill="#101117"/><path d="M75.5197 7.15698H70.8135V19.8954V24.8431H75.5197H85.888V19.8954H75.5197V7.15698Z" fill="#101117"/><path d="M89.565 7.15698H87.2119V19.8954V24.8431H91.9181H102.286V19.8954H91.9181V18.4739H102.286V13.5262H91.9181V12.1231H102.286V7.15698H91.9181H89.565Z" fill="#101117"/><path d="M56.7681 7.15698H54.415V19.8954V24.8431H59.1212H69.508V19.8954H59.1212V18.4739H69.508V13.5262H59.1212V12.1231H69.508V7.15698H59.1212H56.7681Z" fill="#101117"/><path d="M118.684 12.1231V7.15698H108.297H105.962H103.609V19.8954V24.8431H108.297H118.684V19.8954H108.297V18.4739H118.684V13.5262H108.297V12.1231H118.684Z" fill="#101117"/></g></svg>`;

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

async function renderResultCardImage(opts: {
  score: number;
  passed: boolean;
  handle: string;
  theme: CardTheme;
}): Promise<Blob> {
  const { score, passed, handle, theme } = opts;
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  try {
    await document.fonts.ready;
  } catch {
    /* fall back to system fonts */
  }

  // background — warm paper + faded horse
  ctx.fillStyle = "#FAF7F2";
  ctx.fillRect(0, 0, W, H);

  const horse = await loadImage("/horse.png");
  if (horse) {
    // Blurred photographic backdrop — overscanned so blur never exposes edges.
    ctx.save();
    ctx.filter = "blur(6px)";
    ctx.globalAlpha = 0.65;
    const pad = 140;
    const s = Math.max((W + pad) / horse.width, (H + pad) / horse.height);
    const dw = horse.width * s;
    const dh = horse.height * s;
    ctx.drawImage(horse, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
    // Palette tint — background only, text keeps fixed colors.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // legibility wash, strong on the left where the text sits
    const leg = ctx.createLinearGradient(0, 0, W, 0);
    leg.addColorStop(0, "rgba(250,247,242,0.9)");
    leg.addColorStop(0.55, "rgba(250,247,242,0.55)");
    leg.addColorStop(1, "rgba(250,247,242,0.15)");
    ctx.fillStyle = leg;
    ctx.fillRect(0, 0, W, H);
  } else {
    const glow = ctx.createRadialGradient(W / 2, 60, 20, W / 2, 60, 560);
    glow.addColorStop(0, "rgba(128,96,255,0.20)");
    glow.addColorStop(1, "rgba(128,96,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // dotted texture, top band
    ctx.fillStyle = "rgba(128,96,255,0.16)";
    for (let y = 40; y < 150; y += 22) {
      for (let x = 40; x < W - 40; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // border
  ctx.strokeStyle = "#16151B";
  ctx.lineWidth = 3;
  rr(ctx, 26, 26, W - 52, H - 52, 26);
  ctx.stroke();

  // logo
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Logo failed to load"));
    img.src =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(MELEE_SVG_DARK);
  });
  ctx.drawImage(img, 72, 62, 248, 64);

  // top-right tag — fixed ink, never themed
  ctx.strokeStyle = "#16151B";
  ctx.lineWidth = 2;
  rr(ctx, W - 392, 66, 320, 54, 27);
  ctx.stroke();
  ctx.fillStyle = "#16151B";
  ctx.font = "700 25px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`PMM QUIZ · ${ROUND_SIZE} QUESTIONS`, W - 232, 95);

  // label
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#8A8578";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText("Y O U R   S C O R E", W / 2, 208);

  // score — fixed ink
  ctx.fillStyle = "#16151B";
  ctx.font = "800 168px system-ui, sans-serif";
  ctx.fillText(`${score}/${ROUND_SIZE}`, W / 2, 350);

  // status pill
  const status = passed ? "✓  QUALIFIED — Floor Secured" : "✕  NOT QUALIFIED — Diluted";
  ctx.font = "800 30px system-ui, sans-serif";
  const pillW = ctx.measureText(status).width + 90;
  const pillX = (W - pillW) / 2;
  const pillY = 408;
  ctx.fillStyle = passed ? "#E4F5EB" : "#FBEAEA";
  ctx.strokeStyle = passed ? "#1F9D63" : "#E5484D";
  ctx.lineWidth = 2.5;
  rr(ctx, pillX, pillY, pillW, 62, 31);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = passed ? "#0E7A4C" : "#C22E3D";
  ctx.textBaseline = "middle";
  ctx.fillText(status, W / 2, pillY + 33);
  ctx.textBaseline = "alphabetic";

  // tagline
  ctx.fillStyle = "#5F5B6B";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText(
    passed
      ? "Early conviction compounded — minimum-return floors held."
      : "Late flow eroded this one — re-read the litepaper & run it back.",
    W / 2,
    508
  );

  // meta row — handle (or litepaper) left, status right
  ctx.textBaseline = "alphabetic";
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#16151B";
  ctx.fillText(handle ? `@${handle}` : "pmm.melee.markets/litepaper", 72, 548);
  ctx.textAlign = "right";
  ctx.fillStyle = "#8A8578";
  ctx.fillText(passed ? "STATUS: QUALIFIED" : "STATUS: DILUTED", W - 72, 548);
  // footer — fixed muted
  ctx.textAlign = "center";
  ctx.fillStyle = "#8A8578";
  ctx.font = "500 21px system-ui, sans-serif";
  ctx.fillText("@meleemarkets", W / 2, H - 34);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Could not encode image");
  return blob;
}

/* ---------------- Results ---------------- */

function Results({
  score,
  passed,
  elapsed,
  bestStreak,
  answers,
  round,
  onRetake,
}: {
  score: number;
  passed: boolean;
  elapsed: number;
  bestStreak: number;
  answers: (number | null)[];
  round: QuizQuestion[];
  onRetake: () => void;
}) {
  const [busy, setBusy] = useState(false);
  // Failed runs skip the identity step; passing runs collect an X handle first.
  const [draft, setDraft] = useState("");
  const [handle, setHandle] = useState("");
  const [confirmed, setConfirmed] = useState(!passed);
  const [themeId, setThemeId] = useState(CARD_THEMES[0].id);
  const [customizing, setCustomizing] = useState(false);
  const [horseOk, setHorseOk] = useState(true);
  const theme = CARD_THEMES.find((t) => t.id === themeId) ?? CARD_THEMES[0];
  const pct = score / ROUND_SIZE;
  const accuracy = Math.round(pct * 100);

  const cleanHandle = (v: string) =>
    v.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 15);

  const download = useCallback(async () => {
    try {
      setBusy(true);
      const blob = await renderResultCardImage({ score, passed, handle, theme });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = handle
        ? `melee-pmm-quiz-@${handle}-${score}-${ROUND_SIZE}.png`
        : `melee-pmm-quiz-${score}-${ROUND_SIZE}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      alert("Could not generate the card image in this browser. Try Chrome desktop.");
    } finally {
      setBusy(false);
    }
  }, [score, passed, handle, theme]);

  const shareOnX = useCallback(() => {
    const base = passed
      ? `I scored ${score}/${ROUND_SIZE} on the @meleemarkets PMM Quiz and QUALIFIED! 🛡️ Minimum-return floors, counterparty rewards, first-dollar liquidity — think you can beat me?`
      : `I scored ${score}/${ROUND_SIZE} on the @meleemarkets PMM Quiz — diluted this round! 📉 Re-reading the litepaper and running it back. Think you can qualify?`;
    const msg = handle ? `${base} — @${handle}` : base;
    const url =
      "https://x.com/intent/post?text=" +
      encodeURIComponent(msg) +
      "&url=" +
      encodeURIComponent(LITEPAPER_URL);
    window.open(url, "_blank", "noopener,width=550,height=450");
  }, [score, passed, handle]);

  // ---- identity gate: passing scorers name their X handle before the card ----
  if (passed && !confirmed) {
    const clean = cleanHandle(draft);
    return (
      <section className="mx-auto mt-14 max-w-xl px-2 text-center sm:mt-24">
        <p className="anim-fade-up font-mono text-[11px] tracking-[0.25em] text-[#8A8578]">
          YOU QUALIFIED — {score}/{ROUND_SIZE}
        </p>
        <h2 className="font-display anim-fade-up stagger-1 mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
          Your X <em className="font-accent font-normal text-[#8060FF]">username?</em>
        </h2>
        <div className="anim-fade-up stagger-2 mx-auto mt-8 max-w-md text-left">
          <label htmlFor="x-handle" className="text-sm font-medium">
            X username
          </label>
          <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-[#D9D1BE] bg-white transition focus-within:border-[#8060FF]">
            <span className="pl-4 font-mono text-lg text-[#8A8578]">@</span>
            <input
              id="x-handle"
              value={draft}
              onChange={(e) => setDraft(cleanHandle(e.target.value))}
              placeholder="username"
              autoComplete="off"
              autoFocus
              maxLength={15}
              className="w-full bg-transparent px-1.5 py-3.5 font-mono text-lg outline-none placeholder:text-[#C9C2B2]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && clean) {
                  setHandle(clean);
                  setConfirmed(true);
                }
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (!clean) return;
                setHandle(clean);
                setConfirmed(true);
              }}
              disabled={!clean}
              className="rounded-full bg-[#16151B] px-7 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-30"
            >
              Create card →
            </button>
            <button
              onClick={() => setConfirmed(true)}
              className="rounded-full px-4 py-3 text-sm text-[#5F5B6B] transition hover:text-[#16151B]"
            >
              Skip for now
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-5xl sm:mt-12">
      <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ---- result text ---- */}
        <div className="anim-fade-up pt-2">
          <p className="font-mono text-[11px] tracking-[0.25em] text-[#8A8578]">
            {passed ? "QUALIFIED" : "NOT QUALIFIED"}
          </p>
          <h2 className="font-display mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
            {passed ? "Qualified." : "Diluted."}
          </h2>
          <p className="font-display mt-2 text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
            {score}
            <span className="text-3xl text-[#8A8578] sm:text-4xl">/{ROUND_SIZE}</span>
          </p>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-[#5F5B6B]">
            {passed ? (
              <>
                {handle ? <>Nice run, <span className="font-semibold text-[#16151B]">@{handle}</span> — </> : null}
                like an early PMM position, your conviction compounded. Floor secured.
              </>
            ) : (
              <>
                You needed at least {PASS_SCORE}/{ROUND_SIZE}. Late flow eroded this one —
                re-read the litepaper and re-enter early.
              </>
            )}
          </p>
          <p className="mt-4 font-mono text-xs text-[#8A8578] tabular-nums">
            {accuracy}% CORRECT · {formatTime(elapsed)} · 🔥 {bestStreak} STREAK
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCustomizing((c) => !c)}
              className="flex items-center gap-2 rounded-full bg-[#16151B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-black"
            >
              <IconSliders />
              Customize card
            </button>
            <button
              onClick={onRetake}
              className="flex items-center gap-2 rounded-full border border-[#D9D1BE] bg-transparent px-6 py-3 text-sm font-semibold transition hover:border-[#16151B]"
            >
              <IconRetake />
              Retake
            </button>
          </div>
          {customizing && (
            <div className="anim-pop card mt-4 max-w-sm rounded-2xl p-4">
              <p className="font-mono text-[11px] tracking-[0.2em] text-[#8A8578]">
                CARD THEME
              </p>
              <div className="mt-3 flex items-center gap-3">
                {CARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    title={t.name}
                    aria-label={t.name}
                    onClick={() => setThemeId(t.id)}
                    className={`h-9 w-9 rounded-full transition hover:scale-110 ${
                      t.id === themeId
                        ? "ring-2 ring-[#16151B] ring-offset-2 ring-offset-white"
                        : ""
                    }`}
                    style={{ background: t.accent }}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-xs font-medium">{theme.name}</p>
            </div>
          )}
        </div>

        {/* ---- card + actions ---- */}
        <div className="anim-fade-up stagger-1">
          <div
            id="result-card"
            className="relative overflow-hidden rounded-2xl border-2 border-[#16151B] bg-white"
          >
            {horseOk && (
              // Blurred photographic backdrop (optional /horse.png asset) with a
              // theme-accent tint. Palette colors touch only this background —
              // all text keeps fixed ink/semantic colors for legibility.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/horse.png"
                alt=""
                aria-hidden
                onError={() => setHorseOk(false)}
                className="absolute -inset-10 h-[calc(100%+5rem)] w-[calc(100%+5rem)] max-w-none object-cover opacity-75 blur-sm"
              />
            )}
            {horseOk && (
              <div
                className="absolute inset-0"
                style={{ background: theme.accent, opacity: 0.22 }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/20" />
            <div className="relative p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <MeleeLogo className="h-6 w-auto" />
                <span className="rounded-full border border-[#16151B] px-3 py-1 font-mono text-[10px] tracking-widest text-[#16151B]">
                  PMM QUIZ · {ROUND_SIZE} Qs
                </span>
              </div>
              <p className="mt-8 text-center font-mono text-[11px] tracking-[0.3em] text-[#8A8578]">
                YOUR SCORE
              </p>
              <p className="font-display text-center text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
                {score}
                <span className="text-2xl text-[#8A8578] sm:text-3xl">/{ROUND_SIZE}</span>
              </p>
              <p className="mt-3 text-center">
                <span
                  className={`inline-block rounded-full border px-4 py-1.5 text-xs font-bold ${
                    passed
                      ? "border-[#1F9D63] bg-[#EAF7F0] text-[#0E7A4C]"
                      : "border-[#E5484D] bg-[#FDECEC] text-[#C22E3D]"
                  }`}
                >
                  {passed ? "✓ QUALIFIED — Floor Secured" : "✕ NOT QUALIFIED — Diluted"}
                </span>
              </p>
              <div className="mt-6 flex items-center justify-between gap-3 font-mono text-xs">
                <span className="font-semibold text-[#16151B]">
                  {handle ? `@${handle}` : "pmm.melee.markets/litepaper"}
                </span>
                <span className="tracking-widest text-[#8A8578]">
                  STATUS: {passed ? "QUALIFIED" : "DILUTED"}
                </span>
              </div>
              <p className="mt-3 text-center font-mono text-[11px] text-[#8A8578]">
                @meleemarkets
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={download}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-full bg-[#16151B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              <IconDownload />
              {busy ? "Rendering…" : "Download"}
            </button>
            <button
              onClick={shareOnX}
              className="flex items-center justify-center gap-2 rounded-full border border-[#16151B] bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#16151B] hover:text-white"
            >
              <IconShare />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* review */}
      <p className="mt-10 font-mono text-[11px] tracking-[0.25em] text-[#8A8578]">
        REVIEW YOUR POSITIONS
      </p>
      <div className="mt-4 grid gap-2.5">
        {round.map((qq, i) => {
          const a = answers[i];
          const ok = a === qq.answerIndex;
          return (
            <div
              key={qq.id}
              className={`anim-fade-up card rounded-2xl border-l-4 p-4 sm:p-5 ${
                ok ? "border-l-[#1F9D63]" : "border-l-[#E5484D]"
              }`}
              style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-relaxed">
                  <span className="mr-2 font-mono text-xs font-normal text-[#8A8578]">Q{i + 1}</span>
                  {qq.question}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
                    ok ? "bg-[#EAF7F0] text-[#0E7A4C]" : "bg-[#FDECEC] text-[#C22E3D]"
                  }`}
                >
                  {ok ? "✓ +1" : a === null ? "⏱ 0" : "✕ 0"}
                </span>
              </div>
              <div className="mt-2 text-xs leading-relaxed text-[#5F5B6B]">
                <p>
                  Your pick:{" "}
                  <span className="font-medium text-[#16151B]">
                    {a === null ? "— (no answer / timed out)" : `${LETTERS[a]} · ${qq.options[a!]}`}
                  </span>
                </p>
                {!ok && (
                  <p className="mt-0.5">
                    Correct:{" "}
                    <span className="font-medium text-[#0E7A4C]">
                      {LETTERS[qq.answerIndex]} · {qq.options[qq.answerIndex]}
                    </span>
                  </p>
                )}
                <p className="mt-1.5 border-t border-[#EFE9DB] pt-1.5 text-[#8A8578]">
                  {qq.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
