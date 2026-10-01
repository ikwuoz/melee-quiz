interface RaceTrackProps {
  /** questions completed (answered or timed out) */
  completed: number;
  total: number;
}

/**
 * Flat minimal race-track progress strip.
 * A horse badge gallops from START to the 🏁 flag as questions complete.
 * Note: the 🐎 glyph faces left, so it is flipped to run toward the flag.
 */
export default function RaceTrack({ completed, total }: RaceTrackProps) {
  const pct = Math.min(Math.max(completed / total, 0), 1) * 100;
  const finished = completed >= total;

  return (
    <div className="anim-fade-up mt-4 select-none" aria-label={`Progress: ${completed} of ${total}`}>
      <div className="px-5">
        <div className="relative h-12">
          {/* rail */}
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#E7E0D2]" />
          {/* ridden distance */}
          <div
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#8060FF] transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
          {/* question ticks */}
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-[2px] rounded-full transition-colors duration-300 ${
                  i < completed ? "bg-[#8060FF]" : "bg-[#CFC6B1]"
                }`}
              />
            ))}
          </div>

          {/* horse */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700 ease-out"
            style={{ left: `${pct}%` }}
          >
            {/* dust puffs */}
            <span className="dust dust-a" />
            <span className="dust dust-b" />
            <span className="inline-block -scale-x-100">
              <span className="anim-gallop flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#16151B] bg-white text-[19px] leading-none shadow-[2px_2px_0_#16151B]">
                🐎
              </span>
            </span>
          </div>

          {/* finish flag */}
          <span
            className={`absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 text-[22px] leading-none ${
              finished ? "anim-pop" : ""
            }`}
            role="img"
            aria-label="Finish"
          >
            🏁
          </span>
        </div>
      </div>
      <div className="mt-0.5 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-[#8A8578]">
        <span>START</span>
        <span className="tabular-nums">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}
