import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

/* ─── Design tokens ─────────────────────────────────────────── */
const C = {
  ink:    "#0d1f17",
  deep:   "#04180f",
  forest: "#0a5f4e",
  teal:   "#0d7c66",
  mint:   "#1db87e",
  pale:   "#e8f4ef",
  border: "#c8ddd5",
  muted:  "#64748b",
  slate:  "#1e293b",
  bg:     "#f0f5f2",
  white:  "#ffffff",
};

const NAV = ["About", "Publications", "Activities", "Research"];

/* ─── Loader ─────────────────────────────────────────────────── */
function PageLoader({ done }) {
  const canvasRef = useRef(null);
  const [pct, setPct] = useState(0);

  /* animate loader bar */
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v += Math.random() * 4 + 1;
      if (v >= 100) { v = 100; clearInterval(id); }
      setPct(Math.round(v));
    }, 40);
    return () => clearInterval(id);
  }, []);

  /* animated circuit on canvas */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width = 260;
    const H = cvs.height = 110;

    /* circuit node graph */
    const nodes = [
      { x: 20,  y: 55 },
      { x: 60,  y: 55 },
      { x: 60,  y: 25 },
      { x: 110, y: 25 },
      { x: 110, y: 55 },
      { x: 155, y: 55 },
      { x: 155, y: 80 },
      { x: 200, y: 80 },
      { x: 200, y: 55 },
      { x: 240, y: 55 },
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]
    ];

    /* components */
    const comps = [
      { type: "resistor", cx: 40, cy: 55 },
      { type: "capacitor", cx: 130, cy: 55 },
      { type: "led", cx: 178, cy: 80 },
    ];

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      /* background grid */
      ctx.strokeStyle = "rgba(13,124,102,0.08)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 15) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 15) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      /* wires */
      ctx.strokeStyle = "#0d3a26";
      ctx.lineWidth = 1.5;
      edges.forEach(([a, b]) => {
        ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
      });

      /* travelling signal dot */
      const totalLen = edges.length;
      const phase = (t * 0.04) % totalLen;
      const ei = Math.floor(phase);
      const frac = phase - ei;
      if (ei < edges.length) {
        const [a, b] = edges[ei];
        const sx = nodes[a].x + (nodes[b].x - nodes[a].x) * frac;
        const sy = nodes[a].y + (nodes[b].y - nodes[a].y) * frac;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
        grad.addColorStop(0, "#1db87e"); grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI*2); ctx.fill();
      }

      /* component symbols */
      comps.forEach(({ type, cx, cy }) => {
        ctx.save();
        if (type === "resistor") {
          ctx.fillStyle = "#0d3a26"; ctx.strokeStyle = "#1db87e"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(cx-14, cy-7, 28, 14, 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#1db87e"; ctx.font = "bold 7px 'Courier New'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("Ω", cx, cy);
        } else if (type === "capacitor") {
          ctx.strokeStyle = "#1db87e"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cx-5, cy-10); ctx.lineTo(cx-5, cy+10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx+5, cy-10); ctx.lineTo(cx+5, cy+10); ctx.stroke();
        } else if (type === "led") {
          const glow = Math.sin(t * 0.08) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(29,184,126,${glow * 0.25})`; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = "#1db87e"; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI*2); ctx.stroke();
          ctx.fillStyle = `rgba(29,184,126,${glow})`; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });

      /* oscilloscope wave at bottom */
      ctx.strokeStyle = `rgba(29,184,126,0.6)`; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H - 12 + Math.sin((x + t*1.5) * 0.08) * 4 + Math.sin((x + t) * 0.15) * 2;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      t++;
    };

    const raf = { id: null };
    const loop = () => { draw(); raf.id = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf.id);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.deep, zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24,
      opacity: done ? 0 : 1,
      pointerEvents: done ? "none" : "all",
      transition: "opacity 0.7s ease",
    }}>
      <canvas ref={canvasRef} style={{ imageRendering: "crisp-edges" }} />
      <div style={{ fontFamily: "'Courier New', monospace", color: C.mint, fontSize: 11, letterSpacing: "0.2em" }}>
        INITIALIZING · EE · IIT BOMBAY
      </div>
      <div style={{ width: 260, height: 2, background: "#0d3a26", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: C.mint, borderRadius: 2, transition: "width 0.05s linear" }} />
      </div>
      <div style={{ fontFamily: "'Courier New', monospace", color: "#0d5c3e", fontSize: 10, letterSpacing: "0.1em" }}>
        {pct}%
      </div>
    </div>
  );
}

/* ─── Hero canvas art ────────────────────────────────────────── */
function HeroCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let t = 0, raf;

    const resize = () => {
      cvs.width = cvs.offsetWidth;
      cvs.height = cvs.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const W = cvs.width, H = cvs.height;
      ctx.clearRect(0, 0, W, H);

      /* dot grid */
      ctx.fillStyle = "rgba(13,124,102,0.18)";
      for (let x = 0; x < W; x += 28) {
        for (let y = 0; y < H; y += 28) {
          const pulse = Math.sin(t * 0.02 + x * 0.03 + y * 0.04) * 0.5 + 0.5;
          ctx.globalAlpha = pulse * 0.25;
          ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI*2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      /* sine wave lines */
      [0, 1, 2].forEach(i => {
        const amp = 18 + i * 8;
        const freq = 0.018 - i * 0.003;
        const yBase = H * 0.35 + i * 30;
        const alpha = 0.12 - i * 0.03;
        ctx.strokeStyle = `rgba(29,184,126,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = yBase + Math.sin((x * freq) + t * 0.04 + i) * amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      /* circuit traces */
      const traces = [
        { x1: W*0.55, y1: 40,    x2: W*0.55, y2: H*0.6 },
        { x1: W*0.55, y1: H*0.6, x2: W*0.75, y2: H*0.6 },
        { x1: W*0.75, y1: H*0.6, x2: W*0.75, y2: 40    },
        { x1: W*0.75, y1: 40,    x2: W*0.9,  y2: 40    },
        { x1: W*0.9,  y1: 40,    x2: W*0.9,  y2: H*0.4 },
      ];
      ctx.strokeStyle = "rgba(13,124,102,0.25)";
      ctx.lineWidth = 1.5;
      traces.forEach(({ x1, y1, x2, y2 }) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });

      /* node circles */
      [[W*0.55,40],[W*0.75,40],[W*0.9,40],[W*0.75,H*0.6]].forEach(([x,y]) => {
        const pulse = Math.sin(t*0.05 + x*0.01) * 0.4 + 0.6;
        ctx.strokeStyle = `rgba(29,184,126,${pulse*0.4})`; ctx.lineWidth = 1;
        ctx.fillStyle = `rgba(29,184,126,${pulse*0.15})`;
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      });

      /* FFT bars on right */
      const bars = 18;
      for (let i = 0; i < bars; i++) {
        const bh = (Math.sin(t*0.07 + i*0.7) * 0.4 + 0.6) * 50 + 8;
        const bx = W - 30 - (bars - i) * 10;
        const alpha = 0.15 + (i/bars)*0.1;
        ctx.fillStyle = `rgba(29,184,126,${alpha})`;
        ctx.fillRect(bx, H - 10 - bh, 6, bh);
      }

      t++;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "44px 0 20px" }}>
      <div style={{ width: 3, height: 18, background: C.teal, borderRadius: 3 }} />
      <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: C.teal, fontFamily: "'Courier New', monospace" }}>
        {children}
      </span>
    </div>
  );
}

function PubItem({ item }) {
  return (
    <li style={{ padding: "18px 0", borderBottom: `1px solid ${C.pale}`, lineHeight: 1.85 }}>
      <span style={{ color: C.muted, fontSize: 13.5 }}>{item.authors} </span>
      <span style={{ fontStyle: "italic", color: C.slate, fontSize: 14 }}>{item.title}</span>
      <span style={{ color: C.muted, fontSize: 13 }}> {item.venue}</span>
      {(item.award || item.Award) && (
        <span style={{ display: "inline-block", marginLeft: 8, background: "#fffbeb", color: "#92610a", border: "1px solid #fcd34d", borderRadius: 4, fontSize: 11, padding: "2px 8px" }}>
          ★ {item.award || item.Award}
        </span>
      )}
      {item.doi && (
        <a href={item.doi} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: 11, textDecoration: "none", color: C.teal, border: `1px solid ${C.teal}`, padding: "2px 8px", borderRadius: 4 }}>
          DOI ↗
        </a>
      )}
      {item.note && <div style={{ marginTop: 4, fontSize: 12, color: C.muted, fontStyle: "italic" }}>{item.note}</div>}
    </li>
  );
}

function TimelineItem({ year, text }) {
  return (
    <li style={{ display: "flex", gap: 20, padding: "10px 0", borderBottom: `1px solid ${C.pale}` }}>
      <span style={{ minWidth: 72, color: C.teal, fontWeight: "bold", fontSize: 12, fontFamily: "'Courier New', monospace", paddingTop: 2 }}>
        {year}
      </span>
      <span style={{ color: "#374151", fontSize: 14, lineHeight: 1.75 }}>{text}</span>
    </li>
  );
}

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 900);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

function useCSV(url, setter) {
  useEffect(() => {
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => setter(r.data),
    });
  }, [url]);
}

/* ─── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [active, setActive]         = useState("About");
  const [menuOpen, setMenuOpen]     = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);

  const [journals,    setJournals]    = useState([]);
  const [conferences, setConferences] = useState([]);
  const [awards,      setAwards]      = useState([]);
  const [adminRoles,  setAdminRoles]  = useState([]);
  const [talks,       setTalks]       = useState([]);

  const w        = useWindowWidth();
  const isMobile = w < 700;

  /* finish loader after ~2.5 s */
  useEffect(() => { const id = setTimeout(() => setLoaderDone(true), 2600); return () => clearTimeout(id); }, []);

  useCSV("https://docs.google.com/spreadsheets/d/1pfZ-iwS1ZddWTejJT2SaDi1mn4Hg7MnTiNPz0rImoo8/export?format=csv&gid=2118216013", setAwards);
  useCSV("https://docs.google.com/spreadsheets/d/1o48HE2A1RsIYGBSMmwNs5cffDy_jILVLMGyy9uR4keY/export?format=csv&gid=632226715", setAdminRoles);
  useCSV("https://docs.google.com/spreadsheets/d/1o0FROIzfZ_OmGLAQZgqsvCPE7oUhjQnExBaD-2_npkk/export?format=csv&gid=465249833", setJournals);
  useCSV("https://docs.google.com/spreadsheets/d/1acmC2Vbh0CnkOJVrHtELYjdQ72VGA3uEKPb5TL7TN9A/export?format=csv&gid=790643081", setConferences);
  useCSV("https://docs.google.com/spreadsheets/d/1fVCvjTkDWQKnSW4Ir7rWbB9IoLH0EHqR9rtu4_ltH2E/export?format=csv&gid=306938548", setTalks);

  const go = (page) => { setActive(page); setMenuOpen(false); };

  /* ── shared content styles ── */
  const contentPad = { maxWidth: 1040, margin: "0 auto", padding: isMobile ? "0 18px 60px" : "0 36px 80px" };

  return (
    <div style={{ fontFamily: "Georgia, serif", background: C.bg, color: C.slate, minHeight: "100vh" }}>

      <PageLoader done={loaderDone} />

      {/* top bar */}
      <div style={{ background: C.ink, padding: "7px 24px", color: "#4d8c76", fontSize: 10, letterSpacing: "0.14em", fontFamily: "'Courier New', monospace" }}>
        DEPARTMENT OF ELECTRICAL ENGINEERING &nbsp;·&nbsp; IIT BOMBAY &nbsp;·&nbsp; CMInDS
      </div>

      {/* sticky nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: C.white, borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 28px", minHeight: 58,
        boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
      }}>
        <button onClick={() => go("About")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 18, fontWeight: "bold", color: C.forest,
          fontFamily: "Georgia, serif", letterSpacing: "-0.01em",
        }}>D. Manjunath</button>

        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            border: `1px solid ${C.border}`, background: C.white,
            padding: "7px 11px", borderRadius: 6, cursor: "pointer", fontSize: 16,
          }}>☰</button>
        ) : (
          <div style={{ display: "flex" }}>
            {NAV.map(n => (
              <button key={n} onClick={() => go(n)} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "18px 15px", fontSize: 13.5, fontFamily: "Georgia, serif",
                borderBottom: active === n ? `2.5px solid ${C.teal}` : "2.5px solid transparent",
                color: active === n ? C.teal : C.muted,
                transition: "color 0.2s",
              }}>{n}</button>
            ))}
          </div>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}` }}>
          {NAV.map(n => (
            <button key={n} onClick={() => go(n)} style={{
              width: "100%", textAlign: "left", padding: "13px 22px",
              background: C.white, border: "none", borderBottom: `1px solid ${C.pale}`,
              fontSize: 14, fontFamily: "Georgia, serif", color: C.slate, cursor: "pointer",
            }}>{n}</button>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: isMobile ? 220 : 290, overflow: "hidden", background: C.deep }}>
        <HeroCanvas />

        {/* left accent line */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.teal, opacity: 0.6 }} />

        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "0 24px" : "0 52px" }}>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: "0.2em", color: C.mint, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: 28, height: 1, background: C.mint }} />
            PROFESSOR · DEPT. OF ELECTRICAL ENGINEERING
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 34 : 50, fontWeight: "bold", color: C.white, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            D. Manjunath
          </h1>
          <p style={{ margin: "10px 0 0", color: "#7bbba6", fontSize: isMobile ? 13 : 15 }}>
            IIT Bombay &nbsp;·&nbsp; Head, Centre for Machine Intelligence &amp; Data Science
          </p>
          {!isMobile && (
            <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
              {["Stochastic Systems", "Network Theory", "Queueing Models", "ML & Optimization"].map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: "4px 12px", borderRadius: 4,
                  border: "1px solid rgba(29,184,126,0.3)", color: C.mint,
                  fontFamily: "'Courier New', monospace", letterSpacing: "0.05em",
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={contentPad}>

        {/* ── About ── */}
        {active === "About" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: isMobile ? 28 : 56, alignItems: "start", marginTop: 44 }}>

            {/* portrait */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: 12, left: 12, right: -12, bottom: -12, border: `1.5px solid ${C.border}`, borderRadius: 16, zIndex: 0 }} />
              <img
                src="/profile.png"
                alt="D. Manjunath"
                onError={e => { e.target.style.display = "none"; document.getElementById("prof-fallback").style.display = "flex"; }}
                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 14, display: "block", position: "relative", zIndex: 1, border: `1px solid ${C.border}` }}
              />
              <div id="prof-fallback" style={{
                display: "none", width: "100%", aspectRatio: "3/4",
                background: `linear-gradient(160deg, #0d3a26, ${C.teal})`,
                borderRadius: 14, alignItems: "center", justifyContent: "center",
                position: "relative", zIndex: 1, border: `1px solid ${C.border}`,
                flexDirection: "column", gap: 10,
              }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>DM</span>
                </div>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "'Courier New', monospace" }}>profile.png</span>
              </div>
            </div>

            {/* bio */}
            <div>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: "bold", color: "#0a3d2e", letterSpacing: "-0.01em", marginBottom: 4 }}>D. Manjunath</div>
              <div style={{ fontSize: 11, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Courier New', monospace", marginBottom: 20 }}>Professor · IIT Bombay</div>
              <div style={{ width: 36, height: 2.5, background: C.teal, borderRadius: 2, marginBottom: 22 }} />

              {[
                "I am a Professor at the Department of Electrical Engineering, IIT Bombay, and the Head of the Centre for Machine Intelligence and Data Science (CMInDS).",
                "My research spans computer and communication networks, queueing theory, stochastic systems, performance modeling, network economics, distributed optimization, and learning systems.",
                "Current work focuses on stochastic models for large-scale systems, resource allocation, recommendation systems, and data-driven optimization in networked environments.",
              ].map((p, i) => (
                <p key={i} style={{ lineHeight: 1.9, color: "#374151", fontSize: isMobile ? 14.5 : 15.5, marginBottom: 16 }}>{p}</p>
              ))}

              {/* info cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "22px 0" }}>
                {[
                  ["Department", "Electrical Engineering"],
                  ["Centre", "CMInDS"],
                  ["Research", "Networks & Stochastic Systems"],
                  ["Institution", "IIT Bombay"],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: C.white, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.teal, fontFamily: "'Courier New', monospace", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.5 }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  ["Google Scholar ↗", "https://scholar.google.com"],
                  ["IIT Bombay ↗", "https://www.ee.iitb.ac.in"],
                  ["Email ↗", "mailto:dmanjunath@iitb.ac.in"],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                    textDecoration: "none", border: `1.5px solid ${C.teal}`, color: C.teal,
                    padding: "9px 16px", borderRadius: 7, fontSize: 13, transition: "all 0.2s",
                    display: "inline-block",
                  }}
                    onMouseEnter={e => { e.target.style.background = C.teal; e.target.style.color = "#fff"; }}
                    onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.teal; }}
                  >{label}</a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Publications ── */}
        {active === "Publications" && (
          <>
            <SectionHead>Journal Articles</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {journals.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading publications…</li>
                : journals.map((item, i) => <PubItem key={i} item={item} />)
              }
            </ul>

            <SectionHead>Conference Papers</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {conferences.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading conference papers…</li>
                : conferences.map((item, i) => <PubItem key={i} item={item} />)
              }
            </ul>
          </>
        )}

        {/* ── Activities ── */}
        {active === "Activities" && (
          <>
            <SectionHead>Awards &amp; Honours</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {awards.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</li>
                : awards.map((item, i) => (
                    <TimelineItem key={i} year={item.year || item.period} text={item.text || item.title || item.award} />
                  ))
              }
            </ul>

            <SectionHead>Administrative Roles</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {adminRoles.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</li>
                : adminRoles.map((item, i) => (
                    <TimelineItem key={i} year={item.year || item.period} text={item.text || item.role || item.title} />
                  ))
              }
            </ul>

            <SectionHead>Invited Talks</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {talks.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</li>
                : talks.map((item, i) => (
                    <TimelineItem key={i} year={item.year || item.period} text={item.text || item.title} />
                  ))
              }
            </ul>
          </>
        )}

        {/* ── Research ── */}
        {active === "Research" && (
          <>
            <SectionHead>Research Interests</SectionHead>
            <p style={{ lineHeight: 1.9, color: "#374151", fontSize: 15, marginBottom: 24, marginTop: 8 }}>
              My work lies at the intersection of probability theory, network science, and machine learning — building rigorous analytical and data-driven models for real-world systems at scale.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                "Computer Networks", "Communication Networks", "Queueing Theory",
                "Stochastic Systems", "Performance Modeling", "Network Economics",
                "Distributed Optimization", "Recommendation Systems", "Resource Allocation",
                "Learning Systems", "Data-Driven Optimization", "Large-Scale Systems",
              ].map(tag => (
                <span key={tag} style={{
                  padding: "7px 14px", borderRadius: 7, fontSize: 13,
                  background: C.pale, color: C.forest, border: `1px solid ${C.border}`,
                }}>{tag}</span>
              ))}
            </div>

            <SectionHead>Current Focus Areas</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {[
                { title: "Stochastic Models", desc: "Rigorous probabilistic models for large-scale network systems and queues." },
                { title: "Resource Allocation", desc: "Optimal and near-optimal policies for resource distribution in dynamic environments." },
                { title: "Recommendation Systems", desc: "Theory and algorithms for personalized recommendations at scale." },
                { title: "Data-Driven Optimization", desc: "Combining statistical learning with classical optimization in networked settings." },
              ].map(({ title, desc }) => (
                <div key={title} style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}`, borderRadius: 10, padding: "18px 20px" }}>
                  <div style={{ fontWeight: "bold", color: C.forest, fontSize: 15, marginBottom: 8 }}>{title}</div>
                  <div style={{ color: "#4b5563", fontSize: 13.5, lineHeight: 1.75 }}>{desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* footer */}
      <div style={{
        background: C.white, borderTop: `1px solid ${C.border}`,
        padding: "20px 28px", textAlign: "center",
        fontSize: 11, color: C.muted, fontFamily: "'Courier New', monospace", letterSpacing: "0.08em",
      }}>
        © D. MANJUNATH &nbsp;·&nbsp; IIT BOMBAY &nbsp;·&nbsp; DEPARTMENT OF ELECTRICAL ENGINEERING
      </div>

    </div>
  );
}