import { useEffect, useRef, useState, useCallback } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Inline SVG icons — no external dependency
const Zap = ({ className, style, strokeWidth = 2 }: { className?: string; style?: React.CSSProperties; strokeWidth?: number }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const Shield = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const CheckCircle2 = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const Circle = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const Users = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ExternalLink = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Constants ───────────────────────────────────────────────────────────────
const TOTAL_CLICKS = 1000;
const AUTO_INCREMENT_RATE = 4; // clicks/second baseline
const REDIRECT_URL = "https://ebet-oss.vercel.app/ebet/";
const REDIRECT_DELAY = 4000;
const RESET_GESTURE_TAPS = 5;

const MILESTONES = [
  { pct: 25, label: "Core Engine Initialized" },
  { pct: 50, label: "Regional Nodes Synchronized" },
  { pct: 75, label: "Digital Certificate Authority Ready" },
  { pct: 100, label: "Nationwide Launch Activated" },
];

// ─── Confetti ────────────────────────────────────────────────────────────────
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#38bdf8", "#2563eb", "#0f2b5c", "#facc15", "#f472b6", "#34d399", "#fb923c"];
  const particles: {
    x: number; y: number; vx: number; vy: number;
    color: string; size: number; rotation: number; rotV: number; shape: "rect" | "circle";
  }[] = [];

  for (let i = 0; i < 300; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 8,
      vy: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }

  let frame: number;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      p.vy += 0.1;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotV;
      if (p.y < canvas.height + 40) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive) frame = requestAnimationFrame(draw);
  }
  draw();
  return () => cancelAnimationFrame(frame);
}

// ─── Floating +1 Particle ───────────────────────────────────────────────────
interface Particle { id: number; x: number; y: number }

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [clicks, setClicks] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [launched, setLaunched] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [participants, setParticipants] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [badgeTaps, setBadgeTaps] = useState(0);
  const [btnActive, setBtnActive] = useState(false);

  const confettiRef = useRef<HTMLCanvasElement>(null);
  const clicksRef = useRef(clicks);
  clicksRef.current = clicks;
  const launchedRef = useRef(launched);
  launchedRef.current = launched;
  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);
  const badgeTapTimer = useRef<ReturnType<typeof setTimeout>>();

  const pct = Math.min(100, Math.round((clicks / TOTAL_CLICKS) * 100));

  // Load the shared counter and keep every open page synchronized.
  useEffect(() => {
    if (!supabase) {
      setConnectionError("Shared counter is not configured.");
      return;
    }

    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    const connect = async () => {
      const { data, error } = await supabase.from("launch_state").select("clicks").eq("id", 1).single();
      if (cancelled) return;
      if (error) {
        setConnectionError("Unable to connect to the shared counter.");
        return;
      }
      setClicks(data.clicks);

      channel = supabase
        .channel("ebet-launch-room", { config: { presence: { key: crypto.randomUUID() } } })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "launch_state", filter: "id=eq.1" }, (payload) => {
          setClicks(payload.new.clicks as number);
        })
        .on("presence", { event: "sync" }, () => {
          if (channel) setParticipants(Object.keys(channel.presenceState()).length);
        });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel?.track({ online_at: new Date().toISOString() });
      });
    };

    connect();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Watch for 100%
  useEffect(() => {
    if (clicks >= TOTAL_CLICKS && !launchedRef.current) {
      setLaunched(true);
      if (confettiRef.current) launchConfetti(confettiRef.current);
    } else if (clicks === 0 && launchedRef.current) {
      setLaunched(false);
      setCountdown(4);
      setParticles([]);
    }
  }, [clicks]);

  // Countdown after launch
  useEffect(() => {
    if (!launched) return;
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(iv);
          window.location.href = REDIRECT_URL;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [launched]);

  const spawnParticle = useCallback((btnEl: HTMLElement) => {
    const rect = btnEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const spread = rect.width * 0.35;
    const id = particleIdRef.current++;
    const x = cx + (Math.random() - 0.5) * spread;
    const y = cy + (Math.random() - 0.5) * spread * 0.5;
    setParticles((ps) => [...ps.slice(-20), { id, x, y }]);
    setTimeout(() => setParticles((ps) => ps.filter((p) => p.id !== id)), 1000);
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (launched || launchedRef.current) return;

      // Haptic
      if (navigator.vibrate) navigator.vibrate(20);

      // Ripple
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      let cx: number, cy: number;
      cx = e.clientX ? e.clientX - rect.left : rect.width / 2;
      cy = e.clientY ? e.clientY - rect.top : rect.height / 2;
      const rid = rippleIdRef.current++;
      setRipples((r) => [...r, { id: rid, x: cx, y: cy }]);
      setTimeout(() => setRipples((r) => r.filter((rr) => rr.id !== rid)), 600);

      // Particle
      spawnParticle(btn);

      // Click pulse
      setBtnActive(true);
      setTimeout(() => setBtnActive(false), 100);

      if (!supabase) return;
      const { error } = await supabase.rpc("increment_clicks");
      if (error) setConnectionError("That tap could not be shared. Please try again.");
    },
    [launched, spawnParticle]
  );

  // A concealed multi-tap gesture keeps reset out of the normal visitor flow.
  const handleBadgeTap = () => {
    setBadgeTaps((t) => {
      const next = t + 1;
      clearTimeout(badgeTapTimer.current);
      if (next >= RESET_GESTURE_TAPS) {
        const resetCode = window.prompt("Enter the launch reset code");
        if (resetCode && supabase) {
          supabase.rpc("reset_launch", { reset_code: resetCode }).then(({ error }) => {
            if (error) setConnectionError("Reset code rejected.");
          });
        }
        return 0;
      }
      badgeTapTimer.current = setTimeout(() => setBadgeTaps(0), 1500);
      return next;
    });
  };

  return (
    <div className="min-h-full bg-[#f8fafc] flex flex-col relative overflow-hidden">
      {/* Confetti canvas */}
      <canvas
        ref={confettiRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ display: launched ? "block" : "none" }}
      />

      {/* Floating "+1" particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="float-particle fixed pointer-events-none z-40 select-none font-bold text-[#38bdf8]"
          style={{
            left: p.x,
            top: p.y,
            fontSize: "1.25rem",
            textShadow: "0 0 8px rgba(56,189,248,0.8)",
            transform: "translateX(-50%)",
          }}
        >
          +1
        </div>
      ))}

      {/* ── Header ── */}
      <header className="bg-[#0f2b5c] text-white px-4 py-3 flex items-center justify-between shadow-lg relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-blue-200 uppercase tracking-widest leading-tight">
            Technical Education and Skills Development Authority
          </span>
          <button
            onClick={handleBadgeTap}
            className="mt-1 inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-blue-500 transition-colors text-white text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer select-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] inline-block" />
            EBET OSS Web Portal Soft Launch
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
          <span className="participant-dot w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-xs font-semibold tabular-nums">
            <span className="text-green-300">{participants}</span>
            <span className="text-blue-200 ml-1 hidden sm:inline">Participants Online</span>
            <span className="text-blue-200 ml-1 sm:hidden">Online</span>
          </span>
          <Users className="w-3.5 h-3.5 text-blue-300" />
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 relative">
        {/* Background glow blobs */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(ellipse, #2563eb 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(ellipse, #38bdf8 0%, transparent 70%)" }}
        />

        {/* Title block */}
        <div className="text-center z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-[#0f2b5c]/8 border border-[#2563eb]/20 rounded-full px-4 py-1.5 mb-4">
            <Zap className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="text-[11px] font-semibold text-[#0f2b5c] tracking-wider uppercase">
              Collective Launch Activation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0f2b5c] leading-tight tracking-tight">
            Powering the Future of<br />
            <span className="text-[#2563eb]">Enterprise Training</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md mx-auto leading-relaxed">
            Tap together to activate the <strong className="text-[#0f2b5c]">EBET One-Stop Shop Web Portal</strong> platform nationwide.
          </p>
        </div>

        {/* Progress block */}
        <div className="w-full max-w-sm sm:max-w-md z-10">
          {/* Stats row */}
          <div className="flex items-end justify-between mb-2 px-1">
            <div className="flex items-baseline gap-1">
              <span
                className="font-mono text-4xl sm:text-5xl font-black tabular-nums leading-none"
                style={{ color: "#0f2b5c", fontFamily: "'JetBrains Mono', monospace" }}
              >
                {pct}%
              </span>
            </div>
            <div className="text-right">
              <div
                className="text-xs font-semibold tabular-nums text-slate-400"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {Math.min(clicks, TOTAL_CLICKS).toLocaleString()} / {TOTAL_CLICKS.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Collective Clicks</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden border border-slate-300 shadow-inner">
            <div
              className="absolute inset-y-0 left-0 rounded-full shimmer-bar overflow-hidden transition-all duration-300 ease-out"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #0f2b5c 0%, #2563eb 50%, #38bdf8 100%)",
                boxShadow: "0 0 12px rgba(56,189,248,0.5)",
                minWidth: pct > 0 ? "1.5rem" : "0",
              }}
            />
          </div>

          {/* Milestone row */}
          <div className="flex justify-between mt-3 px-0.5">
            {MILESTONES.map((m) => {
              const done = pct >= m.pct;
              return (
                <div key={m.pct} className="flex flex-col items-center gap-1 w-1/4 px-0.5">
                  <div className="relative">
                    <div
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background: done ? "#38bdf8" : "#cbd5e1",
                        boxShadow: done ? "0 0 6px rgba(56,189,248,0.8)" : "none",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] text-center leading-tight font-medium transition-colors ${
                      done ? "text-[#0f2b5c]" : "text-slate-400"
                    }`}
                  >
                    {m.pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── The Big Button ── */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative">
            {/* Outer glow ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-200 ${
                !launched ? "btn-pulse" : ""
              }`}
              style={{ margin: "-8px" }}
            />

            <button
              onClick={handleClick}
              disabled={launched}
              className={`relative overflow-hidden select-none touch-none transition-transform duration-75 active:scale-95 focus:outline-none
                ${launched ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                ${btnActive ? "scale-90" : ""}
              `}
              style={{
                width: "clamp(160px, 40vw, 220px)",
                height: "clamp(160px, 40vw, 220px)",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af 0%, #2563eb 40%, #38bdf8 100%)",
                border: "3px solid rgba(56,189,248,0.6)",
                boxShadow: launched
                  ? "none"
                  : "0 0 30px rgba(37,99,235,0.5), 0 0 60px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
              aria-label="Tap to launch EBET OSS Portal"
            >
              {/* Ripple effects */}
              {ripples.map((r) => (
                <span
                  key={r.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 40,
                    height: 40,
                    left: r.x - 20,
                    top: r.y - 20,
                    background: "rgba(255,255,255,0.4)",
                    animation: "ripple 0.6s ease-out forwards",
                  }}
                />
              ))}

              <div className="flex flex-col items-center justify-center h-full gap-2 pointer-events-none">
                <Zap
                  className="glow-pulse"
                  style={{ width: "clamp(28px, 7vw, 40px)", height: "clamp(28px, 7vw, 40px)", color: "#fff" }}
                  strokeWidth={2.5}
                />
                <span
                  className="font-black text-white tracking-widest uppercase text-center leading-tight"
                  style={{ fontSize: "clamp(11px, 2.8vw, 15px)" }}
                >
                  TAP TO<br />LAUNCH
                </span>
              </div>
            </button>
          </div>

          {!launched && (
            <p className="text-[11px] text-slate-400 font-medium tracking-wide text-center">
              Every tap counts — keep going!
            </p>
          )}
        </div>

        {/* ── Milestone checklist ── */}
        <div className="w-full max-w-sm z-10">
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
            {MILESTONES.map((m) => {
              const done = pct >= m.pct;
              const active = pct >= m.pct - 25 && pct < m.pct;
              return (
                <div
                  key={m.pct}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    done ? "bg-blue-50/60" : active ? "bg-slate-50" : ""
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
                  ) : (
                    <Circle
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: active ? "#2563eb" : "#cbd5e1" }}
                    />
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] font-mono font-bold tabular-nums px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: done ? "#dbeafe" : "#f1f5f9",
                        color: done ? "#1d4ed8" : "#94a3b8",
                      }}
                    >
                      {m.pct}%
                    </span>
                    <span
                      className={`text-xs font-medium truncate ${
                        done ? "text-[#0f2b5c]" : "text-slate-400"
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {connectionError && (
        <div className="fixed bottom-12 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-red-700 px-3 py-2 text-center text-[11px] font-semibold text-white shadow-lg">
          {connectionError}
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-[#0f2b5c] text-center py-3 px-4">
        <p className="text-[10px] text-blue-300 tracking-wider uppercase font-medium">
          EBET OSS Portal — TESDA Enterprise Training Platform
        </p>
      </footer>

      {/* ── Launch Modal ── */}
      {launched && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0f2b5c]/90 backdrop-blur-md p-4">
          <div
            className="bounce-in bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-center"
            style={{ boxShadow: "0 0 80px rgba(56,189,248,0.4), 0 30px 60px rgba(15,43,92,0.5)" }}
          >
            {/* Top stripe */}
            <div
              className="h-2 w-full"
              style={{ background: "linear-gradient(90deg, #0f2b5c, #2563eb, #38bdf8)" }}
            />

            <div className="px-8 py-8 flex flex-col items-center gap-4">
              {/* Animated shield/check */}
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #0f2b5c, #2563eb)",
                    boxShadow: "0 0 30px rgba(56,189,248,0.6)",
                  }}
                >
                  <Shield className="w-10 h-10 text-[#38bdf8]" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "#22c55e" }}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="slide-up">
                <div className="text-[10px] font-semibold text-[#2563eb] tracking-widest uppercase mb-2">
                  Official Launch
                </div>
                <h2 className="text-xl font-black text-[#0f2b5c] leading-tight">
                  EBET One-Stop Shop<br />Web Portal is
                  <br />
                  <span className="text-[#2563eb]">Officially Live!</span>
                </h2>
              </div>

              <div
                className="w-full rounded-xl px-4 py-3"
                style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}
              >
                <p className="text-xs text-slate-500 leading-relaxed">
                  Redirecting to Staging Sandbox in
                </p>
                <p
                  className="text-4xl font-black tabular-nums mt-1"
                  style={{ color: "#0f2b5c", fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {countdown > 0 ? `${countdown}...` : "↗"}
                </p>
              </div>

              <a
                href={REDIRECT_URL}
                className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(90deg, #0f2b5c, #2563eb)",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Enter Portal Now
              </a>

              <p className="text-[10px] text-slate-400">
                {participants.toLocaleString()} participants launched together
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
