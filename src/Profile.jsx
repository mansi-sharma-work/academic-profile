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

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width  = 320;
    const H = cvs.height = 200;

    const nodes = [
      { x: 50,  y: 100 },
      { x: 130, y: 50  },
      { x: 130, y: 150 },
      { x: 210, y: 50  },
      { x: 210, y: 150 },
      { x: 270, y: 100 },
    ];

    const edges = [
      [0, 1], [0, 2],
      [1, 3], [1, 4],
      [2, 3], [2, 4],
      [3, 5], [4, 5],
    ];

    const NODE_DELAY  = 18;
    const EDGE_DELAY  = 14;
    const PAUSE       = 60;
    const totalFrames = nodes.length * NODE_DELAY + edges.length * EDGE_DELAY + PAUSE;

    let frame = 0;
    let raf;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const t = frame % totalFrames;
      const visibleNodes = Math.min(nodes.length, Math.floor(t / NODE_DELAY));
      const edgeStart    = nodes.length * NODE_DELAY;
      const visibleEdges = t < edgeStart ? 0 : Math.min(edges.length, Math.floor((t - edgeStart) / EDGE_DELAY));

      for (let i = 0; i < visibleEdges; i++) {
        const [a, b] = edges[i];
        const na = nodes[a], nb = nodes[b];
        const isDrawing = i === visibleEdges - 1 && t < edgeStart + visibleEdges * EDGE_DELAY;
        let frac = 1;
        if (isDrawing) frac = ((t - edgeStart) % EDGE_DELAY) / EDGE_DELAY;
        const ex = na.x + (nb.x - na.x) * frac;
        const ey = na.y + (nb.y - na.y) * frac;
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(ex, ey); ctx.stroke();
      }

      for (let i = 0; i < visibleNodes; i++) {
        const n     = nodes[i];
        const age   = t - i * NODE_DELAY;
        const scale = Math.min(1, age / 10);
        const r     = 7 * scale;
        const pulse = i < visibleNodes - 1 ? 1 + Math.sin(frame * 0.05 + i * 1.2) * 0.08 : 1;
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 2.2 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = i === 0 || i === nodes.length - 1 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)";
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      }

      frame++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#07120d",
      zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 24,
      opacity: done ? 0 : 1,
      pointerEvents: done ? "none" : "all",
      transition: "opacity 0.9s ease",
    }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em", fontWeight: "normal" }}>
        D. Manjunath
      </div>
      <canvas ref={canvasRef} />
      <div style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
        Department of Electrical Engineering · IIT Bombay
      </div>
    </div>
  );
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
    <li style={{ padding: "18px 0", borderBottom: `1px solid ${C.pale}`, lineHeight: 1.85, display: "flex", gap: 12 }}>
      <span style={{ color: C.teal, fontSize: 16, lineHeight: 1.6, flexShrink: 0 }}>•</span>
      <div>
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
      </div>
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
  const [opeds,       setOpeds]       = useState([]);
  const [books,       setBooks]       = useState([]);
  const [preprint,    setPreprint]    = useState([]);
  const [talks,       setTalks]       = useState([]);

  const w        = useWindowWidth();
  const isMobile = w < 700;

  useEffect(() => { const id = setTimeout(() => setLoaderDone(true), 2600); return () => clearTimeout(id); }, []);

  useCSV("https://docs.google.com/spreadsheets/d/1pfZ-iwS1ZddWTejJT2SaDi1mn4Hg7MnTiNPz0rImoo8/export?format=csv&gid=2118216013", setOpeds);
  useCSV("https://docs.google.com/spreadsheets/d/1o48HE2A1RsIYGBSMmwNs5cffDy_jILVLMGyy9uR4keY/export?format=csv&gid=632226715", setBooks);
  useCSV("https://docs.google.com/spreadsheets/d/1o0FROIzfZ_OmGLAQZgqsvCPE7oUhjQnExBaD-2_npkk/export?format=csv&gid=465249833", setPreprint);
  useCSV("https://docs.google.com/spreadsheets/d/1acmC2Vbh0CnkOJVrHtELYjdQ72VGA3uEKPb5TL7TN9A/export?format=csv&gid=790643081", setJournals);
  useCSV("https://docs.google.com/spreadsheets/d/1fVCvjTkDWQKnSW4Ir7rWbB9IoLH0EHqR9rtu4_ltH2E/export?format=csv&gid=306938548", setConferences);
  useCSV("https://docs.google.com/spreadsheets/d/1_zfbe-l28D57WqjQ5cjSh17r5lO2oC62ucKaFzU1VkQ/export?format=csv&gid=1064858605", setTalks);

  const go = (page) => { setActive(page); setMenuOpen(false); };

  const contentPad = { maxWidth: 1040, margin: "0 auto", padding: isMobile ? "0 18px 60px" : "0 36px 80px", paddingTop: 0 };

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
      <div style={{ position: "relative", height: isMobile ? 220 : 290, overflow: "hidden", background: "linear-gradient(135deg, #04180f 0%, #0a3d2e 100%)" }}>
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
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: isMobile ? 28 : 56, alignItems: "start", marginTop: 28 }}>

            <div style={{ position: "relative" }}>
              <img
                src="/cropped.JPG"
                alt="D. Manjunath"
                onError={e => { e.target.style.display = "none"; document.getElementById("prof-fallback").style.display = "flex"; }}
                style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", objectPosition: "center 35%", borderRadius: 14, display: "block", position: "relative", zIndex: 1, border: `1px solid ${C.border}` }}
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
            <SectionHead>Pre-print Publications</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {preprint.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading publications…</li>
                : preprint.map((item, i) => <PubItem key={i} item={item} />)
              }
            </ul>

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
            <SectionHead>Op-eds</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {opeds.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</li>
                : opeds.map((item, i) => (
                    <TimelineItem key={i} year={item.year || item.period} text={item.text || item.title || item.award} />
                  ))
              }
            </ul>

            <SectionHead>Books</SectionHead>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {books.length === 0
                ? <li style={{ color: C.muted, fontSize: 13, padding: "16px 0" }}>Loading…</li>
                : books.map((item, i) => (
                    <TimelineItem key={i} year={item.year || item.period} text={item.text || item.role || item.title} />
                  ))
              }
            </ul>

            <SectionHead>Refereed Conferences</SectionHead>
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