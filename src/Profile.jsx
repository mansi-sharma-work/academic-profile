import { useState, useEffect, useRef, useCallback } from "react";
import Papa from "papaparse";

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

const T = {
  body:   14,       // primary text size
  small:  13,       // authors, venue, year, labels
  tiny:   11,       // badge links (DOI, Link)
  lh:     1.8,      // line-height everywhere
  pad:    "14px 0", // vertical padding on every list item
  bullet: 15,       // bullet • glyph size
};

const NAV = [
  "About","Research","Professional Activities","Publications","Op-eds and Essays",
  "Awards & Distinctions","Students","Funded Projects",
  "Data Inventions & Software","Admin & Service","Talks"
];

const SECTION_CSVS = {
  "Publications":               ["journals","conferences","preprint","talks"],
  "Op-eds and Essays":                     ["opeds","books"],
  "Professional Activities":    ["profActs"],
  "Awards & Distinctions":      ["awards"],
  "Students":                   ["phd","grad"],
  "Funded Projects":            ["funded","fundedTech"],
  "Data Inventions & Software": ["inventions","software"],
  "Admin & Service":            ["adminPos","instService"],
};

const CSV_URLS = {
  opeds:       "https://docs.google.com/spreadsheets/d/1pfZ-iwS1ZddWTejJT2SaDi1mn4Hg7MnTiNPz0rImoo8/export?format=csv&gid=2118216013",
  books:       "https://docs.google.com/spreadsheets/d/1o48HE2A1RsIYGBSMmwNs5cffDy_jILVLMGyy9uR4keY/export?format=csv&gid=632226715",
  preprint:    "https://docs.google.com/spreadsheets/d/1o0FROIzfZ_OmGLAQZgqsvCPE7oUhjQnExBaD-2_npkk/export?format=csv&gid=465249833",
  journals:    "https://docs.google.com/spreadsheets/d/1acmC2Vbh0CnkOJVrHtELYjdQ72VGA3uEKPb5TL7TN9A/export?format=csv&gid=790643081",
  conferences: "https://docs.google.com/spreadsheets/d/1fVCvjTkDWQKnSW4Ir7rWbB9IoLH0EHqR9rtu4_ltH2E/export?format=csv&gid=306938548",
  talks:       "https://docs.google.com/spreadsheets/d/1_zfbe-l28D57WqjQ5cjSh17r5lO2oC62ucKaFzU1VkQ/export?format=csv&gid=1064858605",
  profActs:    "https://docs.google.com/spreadsheets/d/1UjcSLdGxeAp5EW0zvpAj8wt_A4Za5VAZnBC0qbpG0JY/export?format=csv&gid=0",
  awards:      "https://docs.google.com/spreadsheets/d/1wCI4V2UfLEkuYAUDOFSI_aOyIyAG1MtTc57Z-r1IrOo/export?format=csv&gid=0",
  phd:         "https://docs.google.com/spreadsheets/d/18isc3OTgvuOMMTAmUXkVHZljtL7rjpMSsA1oac9qz6U/export?format=csv&gid=0",
  grad:        "https://docs.google.com/spreadsheets/d/15COZ4wkz5oe6ANPGkRTRbTkFj29bXpR4YzhOCgTEgvA/export?format=csv&gid=0",
  funded:      "https://docs.google.com/spreadsheets/d/1Hyi2UZKMdC9cJBUWQDy8ch3H8IwkPJ1HaQDJxPWP_Dw/export?format=csv&gid=737011902",
  fundedTech:  "https://docs.google.com/spreadsheets/d/1FeLZpUaW4XnQ1MjRWFNBCXjmNGjCTKOufiaV6Fnmvgg/export?format=csv&gid=0",
  software:    "https://docs.google.com/spreadsheets/d/1jfXaQvpYZHmRU1_-bjM73I86dZ9dNZMf_GhJkvfxUTA/export?format=csv&gid=288940565",
  inventions:  "https://docs.google.com/spreadsheets/d/1DtBRvEoBSfJ9OFF_qkpC9cM75EpI90aS_ZZts-45Lo8/export?format=csv&gid=0",
  instService: "https://docs.google.com/spreadsheets/d/1t8nQW91QBXc2w-YZ_FdI10_njgT9EfhPdJXHuX0Ucb4/export?format=csv&gid=0",
  adminPos:    "https://docs.google.com/spreadsheets/d/1FlRAGFzJy6o5yjoLDafxTiJ7HHlMjCqtGl2gDeQF8-I/export?format=csv&gid=91758258",
};

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    let timer;
    const fn = () => { clearTimeout(timer); timer = setTimeout(() => setW(window.innerWidth), 100); };
    window.addEventListener("resize", fn);
    return () => { window.removeEventListener("resize", fn); clearTimeout(timer); };
  }, []);
  return {
    isMobile:  w < 640,
    isTablet:  w >= 640 && w < 1024,
    isDesktop: w >= 1024,
    isNarrow:  w < 1024,
  };
}

function PageLoader({ done }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width = 320, H = cvs.height = 180;
    const nodes = [{x:50,y:90},{x:130,y:45},{x:130,y:135},{x:210,y:45},{x:210,y:135},{x:270,y:90}];
    const edges = [[0,1],[0,2],[1,3],[1,4],[2,3],[2,4],[3,5],[4,5]];
    const NODE_DELAY=18, EDGE_DELAY=14, PAUSE=60;
    const totalFrames = nodes.length*NODE_DELAY + edges.length*EDGE_DELAY + PAUSE;
    let frame = 0;
    const draw = () => {
      if (done) return;
      ctx.clearRect(0,0,W,H);
      const t = frame % totalFrames;
      const visibleNodes = Math.min(nodes.length, Math.floor(t/NODE_DELAY));
      const edgeStart = nodes.length * NODE_DELAY;
      const visibleEdges = t < edgeStart ? 0 : Math.min(edges.length, Math.floor((t-edgeStart)/EDGE_DELAY));
      for (let i=0;i<visibleEdges;i++) {
        const [a,b]=edges[i]; const na=nodes[a],nb=nodes[b];
        const isDrawing = i===visibleEdges-1 && t<edgeStart+visibleEdges*EDGE_DELAY;
        const frac = isDrawing ? ((t-edgeStart)%EDGE_DELAY)/EDGE_DELAY : 1;
        ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(na.x+(nb.x-na.x)*frac,na.y+(nb.y-na.y)*frac); ctx.stroke();
      }
      for (let i=0;i<visibleNodes;i++) {
        const n=nodes[i]; const scale=Math.min(1,(t-i*NODE_DELAY)/10); const r=7*scale;
        const pulse = i<visibleNodes-1 ? 1+Math.sin(frame*0.05+i*1.2)*0.08 : 1;
        ctx.strokeStyle="rgba(255,255,255,0.12)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(n.x,n.y,r*2.2*pulse,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle = i===0||i===nodes.length-1 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)";
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();
      }
      frame++;
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [done]);
  return (
    <div style={{position:"fixed",inset:0,background:"#07120d",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,opacity:done?0:1,pointerEvents:done?"none":"all",transition:"opacity 0.9s ease"}}>
      <div style={{fontFamily:"Arial, sans-serif",fontSize:24,color:"rgba(255,255,255,0.85)",letterSpacing:"0.04em"}}>D. Manjunath</div>
      <canvas ref={canvasRef} style={{maxWidth:"90vw"}} />
      <div style={{fontFamily:"Arial, sans-serif",fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em",textTransform:"uppercase",textAlign:"center",padding:"0 20px"}}>
        Department of Electrical Engineering · IIT Bombay
      </div>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"40px 0 16px"}}>
      <div style={{width:3,height:20,background:C.teal,borderRadius:3,flexShrink:0}} />
      <span style={{fontSize:13,letterSpacing:"0.06em",textTransform:"uppercase",color:C.teal,fontFamily:"Arial, sans-serif",fontWeight:"600"}}>{children}</span>
    </div>
  );
}

function PageTitle({ children }) {
  return (
    <div style={{textAlign:"center",padding:"40px 0 4px"}}>
      <span style={{fontSize:20,letterSpacing:"0.1em",textTransform:"uppercase",color:C.teal,fontFamily:"Arial, sans-serif",fontWeight:"bold"}}>{children}</span>
      <div style={{width:44,height:2.5,background:C.teal,borderRadius:2,margin:"10px auto 0"}} />
    </div>
  );
}

// ── EntryItem ─────────────────────────────────────────────────────────────────
// The single bullet-list component used across ALL content sections.
// Layout:
//   [•]  authors (small muted)  title (bold)  · venue (small muted),  year  [DOI/Link badge]
//        note (small muted, below)
// ─────────────────────────────────────────────────────────────────────────────
function EntryItem({ authors, title, venue, year, doi, link, note }) {
  const badgeStyle = {
    marginLeft: 8,
    fontSize: T.tiny,
    textDecoration: "none",
    color: C.teal,
    border: `1px solid ${C.teal}`,
    padding: "2px 7px",
    borderRadius: 4,
  };
  return (
    <li style={{ padding: T.pad, borderBottom: `1px solid ${C.pale}`, lineHeight: T.lh, display: "flex", gap: 12 }}>
      <span style={{ color: C.teal, fontSize: T.bullet, lineHeight: 1.6, flexShrink: 0 }}>•</span>
      <div style={{ fontSize: T.body, color: C.slate }}>
        {authors && (
          <span style={{ color: C.muted, fontSize: T.small }}>{authors}{" "}</span>
        )}
        <span style={{ fontWeight: "bold", color: C.slate, fontSize: T.body }}>
          {title || "(Untitled)"}
        </span>
        {venue && <span style={{ color: C.muted, fontSize: T.small }}>{" · "}{venue}</span>}
        {year  && <span style={{ color: C.muted, fontSize: T.small }}>{", "}{year}</span>}
        {doi  && <a href={doi}  target="_blank" rel="noreferrer" style={badgeStyle}>DOI ↗</a>}
        {link && <a href={link} target="_blank" rel="noreferrer" style={badgeStyle}>Link ↗</a>}
        {note && (
          <div style={{ marginTop: 4, fontSize: T.small, color: C.muted, fontStyle: "italic" }}>{note}</div>
        )}
      </div>
    </li>
  );
}

// ── BulletItem ────────────────────────────────────────────────────────────────
// Single-text bullet entry — Professional Activities.
// No title styling needed; just consistent bullet + body text.
// ─────────────────────────────────────────────────────────────────────────────
function BulletItem({ text }) {
  return (
    <li style={{ display: "flex", gap: 12, padding: T.pad, borderBottom: `1px solid ${C.pale}`, lineHeight: T.lh }}>
      <span style={{ color: C.teal, fontSize: T.bullet, lineHeight: 1.6, flexShrink: 0 }}>•</span>
      <span style={{ color: "#374151", fontSize: T.body }}>{text}</span>
    </li>
  );
}

// ── TimelineItem ──────────────────────────────────────────────────────────────
// Year | text two-column layout — Awards, refereed talks, admin positions.
// Used only where the year label is the primary organising axis.
// ─────────────────────────────────────────────────────────────────────────────
function TimelineItem({ year, text }) {
  const isLong = (year || "").length > 6;
  return (
    <li style={{ display: "flex", gap: 14, padding: T.pad, borderBottom: `1px solid ${C.pale}` }}>
      <span style={{ minWidth: 86, color: C.teal, fontWeight: "bold", fontSize: isLong ? T.tiny : T.small, fontFamily: "Arial, sans-serif", paddingTop: 2, flexShrink: 0 }}>
        {year}
      </span>
      <span style={{ color: "#374151", fontSize: T.body, lineHeight: T.lh }}>{text}</span>
    </li>
  );
}

// ── Tabular layout helpers (Students, Funded Projects, Admin & Service) ───────
function ColRow({ children }) {
  return <div style={{ display: "flex", gap: 16, padding: "10px 0", borderBottom: `2px solid ${C.teal}`, marginBottom: 4 }}>{children}</div>;
}
function CH({ children, w }) {
  return (
    <span style={{ width: w || "auto", flexShrink: 0, flexGrow: w ? 0 : 1, fontSize: T.tiny, letterSpacing: "0.09em", textTransform: "uppercase", color: C.forest, fontFamily: "Arial, sans-serif", fontWeight: "bold" }}>
      {children}
    </span>
  );
}
function DataRow({ children }) {
  return <li style={{ display: "flex", gap: 16, padding: T.pad, borderBottom: `1px solid ${C.pale}`, lineHeight: T.lh, listStyle: "none", alignItems: "flex-start" }}>{children}</li>;
}
function DC({ children, w, color, mono, size }) {
  return (
    <span style={{ width: w || "auto", flexShrink: 0, flexGrow: w ? 0 : 1, color: color || "#374151", fontSize: size || T.body, fontFamily: "Arial, sans-serif", fontWeight: mono ? "bold" : "normal", lineHeight: T.lh }}>
      {children}
    </span>
  );
}

// ── MobileCard — tabular data on narrow screens ───────────────────────────────
function MobileCard({ label, title, sub }) {
  return (
    <li style={{ padding: T.pad, borderBottom: `1px solid ${C.pale}` }}>
      {label && <div style={{ color: C.teal, fontWeight: "bold", fontSize: T.tiny, fontFamily: "Arial, sans-serif", marginBottom: 2, letterSpacing: "0.05em" }}>{label}</div>}
      {title && <div style={{ color: C.forest, fontSize: T.body, fontWeight: "bold", marginBottom: 2 }}>{title}</div>}
      {sub   && <div style={{ color: "#374151", fontSize: T.small, lineHeight: T.lh }}>{sub}</div>}
    </li>
  );
}

// ── Loading placeholder ───────────────────────────────────────────────────────
function Loading() {
  return <li style={{ color: C.muted, fontSize: T.small, padding: T.pad }}>Loading…</li>;
}

function TopNav({ active, menuOpen, setMenuOpen, go }) {
  return (
    <nav aria-label="Main navigation" style={{ position: "sticky", top: 0, zIndex: 200, background: C.white, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", minHeight: 52 }}>
        <span style={{ fontSize: 14, fontWeight: "bold", color: C.forest, fontFamily: "Arial, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "calc(100% - 60px)" }}>{active}</span>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          style={{ border: `1px solid ${C.border}`, background: menuOpen ? C.pale : C.white, padding: "7px 11px", borderRadius: 6, cursor: "pointer", fontSize: 18, lineHeight: 1, color: C.teal, flexShrink: 0 }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <ul style={{margin:0,padding:0,listStyle:"none",borderTop:`1px solid ${C.border}`,maxHeight:"70vh",overflowY:"auto"}}>
          {NAV.map(n => (
            <li key={n}>
              <button
                onClick={() => go(n)}
                aria-current={active === n ? "page" : undefined}
                style={{ width: "100%", textAlign: "left", padding: "13px 20px", background: active === n ? C.pale : C.white, border: "none", borderBottom: `1px solid ${C.pale}`, fontSize: T.body, fontFamily: "Arial, sans-serif", color: active === n ? C.teal : C.slate, fontWeight: active === n ? "bold" : "normal", cursor: "pointer" }}>
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════ */
export default function App() {
  const [active,     setActive]     = useState("About");
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [photoFailed,setPhotoFailed]= useState(false);

  const [csvData, setCsvData] = useState(
    Object.fromEntries(Object.keys(CSV_URLS).map(k => [k, []]))
  );
  const loadedKeys = useRef(new Set());

  const loadCSVsForSection = useCallback((section) => {
    const keys = SECTION_CSVS[section];
    if (!keys) return;
    keys.forEach(key => {
      if (loadedKeys.current.has(key)) return;
      loadedKeys.current.add(key);
      Papa.parse(CSV_URLS[key], {
        download: true, header: true, skipEmptyLines: true,
        complete: (r) => setCsvData(prev => ({ ...prev, [key]: r.data })),
      });
    });
  }, []);

  const { isMobile, isTablet, isDesktop, isNarrow } = useBreakpoint();

  useEffect(() => {
    const id = setTimeout(() => setLoaderDone(true), 1800);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    loadCSVsForSection(active);
  }, [active, loadCSVsForSection]);

  const go = (page) => {
    setActive(page);
    setMenuOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const contentPadding = isMobile ? "0 14px 60px" : isTablet ? "24px 28px 60px" : "40px 52px 80px";
  const heroHeight     = isMobile ? 180 : isTablet ? 220 : 280;
  const d = csvData;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: C.bg, color: C.slate, minHeight: "100vh" }}>

      <PageLoader done={loaderDone} />

      <div style={{ background: C.ink, padding: "6px 16px", color: "#4d8c76", fontSize: 10, letterSpacing: "0.09em", fontFamily: "Arial, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        DEPARTMENT OF ELECTRICAL ENGINEERING {" · "} IIT BOMBAY {" · "} CMInDS
      </div>

      {/* Hero */}
      <div style={{ position: "relative", height: heroHeight, overflow: "hidden", background: "linear-gradient(135deg, #04180f 0%, #0a3d2e 100%)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.teal, opacity: 0.6 }} />
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: isMobile ? "0 20px" : "0 40px" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: isMobile ? 8.5 : 14, letterSpacing: "0.14em", color: C.mint, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block", width: isMobile ? 12 : 20, height: 1, background: C.mint }} />
            PROFESSOR · DEPT. OF ELECTRICAL ENGINEERING
          </div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 26 : isTablet ? 36 : 48, fontWeight: "bold", color: C.white, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            D. Manjunath
          </h1>
          <p style={{ margin: "8px 0 0", color: "#7bbba6", fontSize: isMobile ? 12 : 14 }}>IIT Bombay</p>
          {!isMobile && (
            <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap", justifyContent: "center", maxWidth: 760 }}>
              {["Communications Networking","Stochastic and AI systems","Performance and Queueing Models","Recommendation systems and Bandit algorithms","Economics of Internet and AI"].map(t => (
                <span key={t} style={{ fontSize: isTablet ? 10 : 11, padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(29,184,126,0.3)", color: C.mint, fontFamily: "Arial, sans-serif", letterSpacing: "0.04em" }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {isNarrow && (
        <TopNav active={active} menuOpen={menuOpen} setMenuOpen={setMenuOpen} go={go} />
      )}

      <div style={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>

        {/* Sidebar */}
        {isDesktop && (
          <nav aria-label="Main navigation" style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${C.border}`, background: C.white, position: "sticky", top: 0, alignSelf: "flex-start", height: "100vh", overflowY: "auto", paddingTop: 20 }}>
            {NAV.map(n => (
              <button key={n} onClick={() => go(n)}
                aria-current={active === n ? "page" : undefined}
                style={{ width: "100%", textAlign: "left", padding: "11px 18px", background: active === n ? C.pale : "none", border: "none", borderLeft: active === n ? `3px solid ${C.teal}` : "3px solid transparent", fontSize: T.small, fontFamily: "Arial, sans-serif", color: active === n ? C.teal : C.slate, fontWeight: active === n ? "bold" : "normal", cursor: "pointer", lineHeight: 1.5, transition: "all 0.12s" }}
                onMouseEnter={e => { if (active !== n) e.currentTarget.style.background = "#f5f5f5"; }}
                onMouseLeave={e => { if (active !== n) e.currentTarget.style.background = "none"; }}
              >{n}</button>
            ))}
          </nav>
        )}

        <div style={{flex:1,minWidth:0,padding:contentPadding,maxWidth:isDesktop?"900px":"100%",margin:"0 auto"}}>

          {/* ═══ ABOUT ═══ */}
          {active === "About" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "160px 1fr" : "290px 1fr", gap: isMobile ? 20 : 36, alignItems: "start", paddingTop: isMobile ? 20 : 0 }}>
              <div style={{ maxWidth: isMobile ? "200px" : "100%", margin: isMobile ? "0 auto" : "0" }}>
                {!photoFailed ? (
                  <img
                    src="/cropped.JPG"
                    alt="D. Manjunath"
                    onError={() => setPhotoFailed(true)}
                    style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", objectPosition: "center 35%", borderRadius: 12, display: "block", border: `1px solid ${C.border}` }}
                  />
                ) : (
                  <div style={{ width: "100%", aspectRatio: "3/4", background: `linear-gradient(160deg, #0d3a26, ${C.teal})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.border}`, flexDirection: "column", gap: 10 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 24, color: "rgba(255,255,255,0.7)" }}>DM</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 22 : isTablet ? 26 : 32, fontWeight: "bold", color: "#0a3d2e", letterSpacing: "-0.01em", marginBottom: 4 }}>D. Manjunath</div>
                <div style={{ fontSize: T.tiny, color: C.teal, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "Arial, sans-serif", marginBottom: 16 }}>Professor · IIT Bombay</div>
                <div style={{ width: 32, height: 2.5, background: C.teal, borderRadius: 2, marginBottom: 18 }} />
                {[
                  "I am a Professor at the Department of Electrical Engineering, IIT Bombay, and the Head of the Centre for Machine Intelligence and Data Science (CMInDS).",
                  "My research spans computer and communication networks, queueing theory, stochastic systems, performance modeling, network economics, distributed optimization, and learning systems.",
                  "Current work focuses on stochastic models for large-scale systems, resource allocation, recommendation systems, and data-driven optimization in networked environments.",
                ].map((p, i) => (
                  <p key={i} style={{ lineHeight: T.lh, color: "#374151", fontSize: isMobile ? T.small : T.body, marginBottom: 12 }}>{p}</p>
                ))}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {[["Google Scholar ↗","https://scholar.google.com/citations?user=zqKRsNUAAAAJ&hl=en"],["IIT Bombay ↗","https://www.ee.iitb.ac.in/web/people/d-manjunath/"],["Email ↗","mailto:dmanju@ee.iitb.ac.in"]].map(([label, href]) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer"
                      style={{ textDecoration: "none", border: `1.5px solid ${C.teal}`, color: C.teal, padding: "7px 13px", borderRadius: 7, fontSize: isMobile ? 12 : T.small, transition: "all 0.18s", display: "inline-block" }}
                      onMouseEnter={e => { e.target.style.background = C.teal; e.target.style.color = "#fff"; }}
                      onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.teal; }}
                    >{label}</a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ RESEARCH ═══ */}
          {active === "Research" && (
            <>
              <PageTitle>Research</PageTitle>
              <SectionHead>Research Interests</SectionHead>
              <p style={{ lineHeight: T.lh, color: "#374151", fontSize: isMobile ? T.small : T.body, marginTop: 8, marginBottom: 20 }}>
                General area of networking, queueing and other stochastic systems, and performance modeling.
              </p>

              <SectionHead>Current Work</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {[
                  "Stochastic models for performance analysis of systems.",
                  "Network economics, microeconomic models, and game theory.",
                  "Learning systems and self tuning mechanisms for optimal resource allocation in computer systems.",
                  "Distributed computation and distributed optimisation for network resource provisioning.",
                ].map((item, i) => <BulletItem key={i} text={item} />)}
              </ul>

              <SectionHead>Recent Past Topics</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {[
                  "Microeconomic models for the security and connectivity in the Internet.",
                  "Learning models in non stationary environments.",
                  "Random geometric graph models for wireless networks and stochastic coverage processes.",
                  "Traffic Measurement and Performance Monitoring.",
                  "Optical Networks: Design and Algorithms for Traffic Engineering.",
                  "Packet Switches: Architectures and Analysis.",
                ].map((item, i) => <BulletItem key={i} text={item} />)}
              </ul>
            </>
          )}

          {/* ═══ PUBLICATIONS ═══ */}
          {active === "Publications" && (
            <>
              <PageTitle>Publications</PageTitle>

              {}
              {[
                ["Pre-print Publications", d.preprint],
                ["Journal Articles and Premiere Conferences", d.journals],
                ["Conference Papers", d.conferences],
              ].map(([heading, data]) => (
                <div key={heading}>
                  <SectionHead>{heading}</SectionHead>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {data.length === 0
                      ? <Loading />
                      : data.map((item, i) => (
                          <EntryItem key={i}
                            authors={item.authors}
                            title={item.title}
                            venue={item.venue}
                            year={item.year}
                            doi={item.doi}
                            note={item.note}
                          />
                        ))
                    }
                  </ul>
                </div>
              ))}

              {}
              

              {/* Refereed Conferences / Talks → TimelineItem (year + citation string) */}
              <SectionHead>Refereed Conferences</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.talks.length === 0
                  ? <Loading />
                  : d.talks.map((item, i) => (
                      <TimelineItem key={i}
                        year={item.year || item.period}
                        text={item.text || item.title || item.role}
                      />
                    ))
                }
              </ul>
            </>
          )}

          {/* ═══ OP-EDS (standalone) ═══ */}
          {active === "Op-eds and Essays" && (
            <>
              <PageTitle>Op-eds and Essays</PageTitle>

              {}
              <SectionHead>Op-eds & Essays</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.opeds.length === 0
                  ? <Loading />
                  : d.opeds.map((item, i) => (
                      <EntryItem key={i}
                        authors={item.authors}
                        title={item.title}
                        venue={item.outlet}
                        year={item.year}
                        link={item.link}

                      />
                    ))
                }
              </ul>

              <SectionHead>Books</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.books.length === 0
                  ? <Loading />
                  : d.books.map((item, i) => (
                      <EntryItem key={i}
                        authors={item.authors}
                        title={item.title || item.text}
                        venue={item.venue}
                        year={item.year || item.period}
                        doi={item.doi}

                      />
                    ))
                }
              </ul>
            </>
          )}

          {/* ═══ PROFESSIONAL ACTIVITIES ═══ */}
          {active === "Professional Activities" && (
            <>
              <PageTitle>Professional Activities</PageTitle>
              {d.profActs.length === 0
                ? <p style={{ color: C.muted, fontSize: T.small, padding: T.pad }}>Loading…</p>
                : (() => {
                    const knownCategories = ["Organiser","Editorial","Board Membership","Conference Leadership","Refereeing - IEEE Journals","Refereeing - ACM Journals","Refereeing - CS and Mathematics","Refereeing - Operations Research","Refereeing - Other Journals","Refereeing - IEEE Conferences","Refereeing - ACM Conferences","Refereeing - Other Conferences","Refereeing","TPC Member","IEEE Membership","Conference Participation"];
                    const parsed = d.profActs.map(item => {
                      const cols = Object.values(item);
                      const colA = (cols[0] || "").trim(), colB = (cols[1] || "").trim(), colC = (cols[2] || "").trim();
                      let category = "Other", activity = colA;
                      for (const cat of knownCategories) {
                        if (colA.startsWith(cat)) {
                          category = cat.startsWith("Refereeing -") ? "Refereeing" : cat === "Editorial" ? "Editorship" : cat;
                          activity = colA.slice(cat.length).trim();
                          break;
                        }
                      }
                      return { category, activity: [activity, colB, colC].filter(Boolean).join(", ") };
                    });
                    const groups = [], seen = {};
                    parsed.forEach(({ category, activity }) => {
                      if (!seen[category]) { seen[category] = true; groups.push({ category, items: [] }); }
                      groups.find(g => g.category === category).items.push(activity);
                    });
                    return groups.map(({ category, items }) => (
                      <div key={category}>
                        <SectionHead>{category}</SectionHead>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                          {items.map((activity, i) => <BulletItem key={i} text={activity} />)}
                        </ul>
                      </div>
                    ));
                  })()
              }
            </>
          )}

          {/* ═══ AWARDS & DISTINCTIONS ═══ */}
          {active === "Awards & Distinctions" && (
            <>
              <PageTitle>Awards & Distinctions</PageTitle>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
                {d.awards.length === 0
                  ? <Loading />
                  : d.awards.map((item, i) => (
                      <TimelineItem key={i} year={item.Year || item.year} text={item.Award || item.award} />
                    ))
                }
              </ul>
            </>
          )}

          {/* ═══ STUDENTS ═══ */}
          {active === "Students" && (
            <>
              <PageTitle>Students</PageTitle>
              <SectionHead>PhD Supervisions: Completed</SectionHead>
              {isNarrow ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {d.phd.length === 0
                    ? <Loading />
                    : d.phd.map((item, i) => (
                        <MobileCard key={i}
                          label={item.Year || item.year}
                          title={item.Student || item.student}
                          sub={(item["Thesis Title"] || item.thesis || "") + (item.Institution || item.institution ? ", " + (item.Institution || item.institution) : "")}
                        />
                      ))
                  }
                </ul>
              ) : (
                <div>
                  <ColRow><CH w={60}>Year</CH><CH w={180}>Student</CH><CH>Thesis</CH></ColRow>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {d.phd.length === 0
                      ? <Loading />
                      : d.phd.map((item, i) => (
                          <DataRow key={i}>
                            <DC w={60}  color={C.teal}   mono>{item.Year || item.year}</DC>
                            <DC w={180} color={C.forest}>{item.Student || item.student}</DC>
                            <DC>{(item["Thesis Title"] || item.thesis || "")}{(item.Institution || item.institution) ? ", " + (item.Institution || item.institution) : ""}</DC>
                          </DataRow>
                        ))
                    }
                  </ul>
                </div>
              )}

              <SectionHead>Graduate Thesis Supervisions</SectionHead>
              {isNarrow ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {d.grad.length === 0
                    ? <Loading />
                    : d.grad.map((item, i) => (
                        <MobileCard key={i}
                          label={(item.Year || item.year || "") + (item.Type || item.type ? " · " + (item.Type || item.type) : "")}
                          title={item.Student || item.student}
                          sub={item["Thesis Title"] || item.thesis || ""}
                        />
                      ))
                  }
                </ul>
              ) : (
                <div>
                  <ColRow><CH w={60}>Year</CH><CH w={190}>Student</CH><CH w={130}>Type</CH><CH>Thesis</CH></ColRow>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {d.grad.length === 0
                      ? <Loading />
                      : d.grad.map((item, i) => (
                          <DataRow key={i}>
                            <DC w={60}  color={C.teal}  mono>{item.Year || item.year}</DC>
                            <DC w={190} color={C.forest}>{item.Student || item.student}</DC>
                            <DC w={130} color={C.muted} size={T.small}>{item.Type || item.type}</DC>
                            <DC>{item["Thesis Title"] || item.thesis || ""}</DC>
                          </DataRow>
                        ))
                    }
                  </ul>
                </div>
              )}
            </>
          )}

          {/* ═══ FUNDED PROJECTS ═══ */}
          {active === "Funded Projects" && (
            <>
              <PageTitle>Funded Projects</PageTitle>
              {[
                { title: "Research & Development Projects", data: d.funded },
                { title: "Technology Deployment Projects",  data: d.fundedTech },
              ].map(({ title, data }) => (
                <div key={title}>
                  <SectionHead>{title}</SectionHead>
                  {isNarrow ? (
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {data.length === 0
                        ? <Loading />
                        : data.map((item, i) => {
                            const period = item.Period || item.period;
                            return (
                              <MobileCard key={i}
                                label={[item.Role || item.role, (period && period !== "–" ? period : null)].filter(Boolean).join(" · ")}
                                sub={[item.Project || item.project, item.Funder || item.funder].filter(Boolean).join(" — ")}
                              />
                            );
                          })
                      }
                    </ul>
                  ) : (
                    <div>
                      <ColRow><CH w={160}>Role</CH><CH w={80}>Period</CH><CH>Project</CH><CH w={200}>Funder</CH></ColRow>
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {data.length === 0
                          ? <Loading />
                          : data.map((item, i) => (
                              <DataRow key={i}>
                                <DC w={160} color={C.teal} mono size={12}>{item.Role || item.role}</DC>
                                <DC w={80}  color={C.muted} size={T.small}>{item.Period || item.period}</DC>
                                <span style={{ flex: 1, color: "#374151", fontSize: T.body, lineHeight: T.lh, minWidth: 0 }}>{item.Project || item.project}</span>
                                <span style={{ width: 200, flexShrink: 0, color: C.muted, fontSize: T.small, lineHeight: T.lh }}>{item.Funder || item.funder}</span>
                              </DataRow>
                            ))
                        }
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* ═══ DATA INVENTIONS & SOFTWARE ═══ */}
          {active === "Data Inventions & Software" && (
            <>
              <PageTitle>Data Inventions & Software</PageTitle>

              {}
              <SectionHead>Inventions</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.inventions.length === 0
                  ? <Loading />
                  : d.inventions.map((item, i) => (
                      <EntryItem key={i}
                        authors={item.Authors || item.authors}
                        title={item.Title || item.title}
                        note={item.Details || item.details}

                      />
                    ))
                }
              </ul>

              {}
              <SectionHead>Software Developed</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.software.length === 0
                  ? <Loading />
                  : d.software.map((item, i) => (
                      <EntryItem key={i}
                        title={item.Name || item.name}
                        note={item.Description || item.description}

                      />
                    ))
                }
              </ul>
            </>
          )}

          {/* ═══ ADMIN & SERVICE ═══ */}
          {active === "Admin & Service" && (
            <>
              <PageTitle>Admin & Service</PageTitle>

              <SectionHead>Administrative & Service Positions</SectionHead>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {d.adminPos.length === 0
                  ? <Loading />
                  : d.adminPos.map((item, i) => (
                      <TimelineItem key={i} year={item.Period || item.period} text={item.Position || item.position} />
                    ))
                }
              </ul>

              <SectionHead>Selected Institute Service</SectionHead>
              {isNarrow ? (
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {d.instService.length === 0
                    ? <Loading />
                    : d.instService.map((item, i) => (
                        <MobileCard key={i}
                          label={[item.Period || item.period, item.Institution || item.institution].filter(Boolean).join(" · ")}
                          sub={item.Activity || item.activity || ""}
                        />
                      ))
                  }
                </ul>
              ) : (
                <div>
                  <ColRow><CH w={90}>Period</CH><CH w={110}>Institution</CH><CH>Activity</CH></ColRow>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {d.instService.length === 0
                      ? <Loading />
                      : d.instService.map((item, i) => (
                          <DataRow key={i}>
                            <DC w={90}  color={C.teal} mono size={12}>{item.Period || item.period}</DC>
                            <DC w={110} color={C.muted} size={T.small}>{item.Institution || item.institution}</DC>
                            <DC>{item.Activity || item.activity || ""}</DC>
                          </DataRow>
                        ))
                    }
                  </ul>
                </div>
              )}
            </>
          )}
          {/* ═══ TALKS ═══ */}
{active === "Talks" && (
  <>
    <PageTitle>Talks</PageTitle>
    <p style={{textAlign:"center",color:C.muted,fontSize:14,lineHeight:1.8,maxWidth:600,margin:"16px auto 0"}}>
      Selected public lectures, outreach talks, and invited presentations beyond the academic conference circuit.
    </p>
    <div style={{marginTop:40,display:"flex",justifyContent:"center",alignItems:"flex-start"}}>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden",width:"100%",maxWidth:440,boxShadow:"0 2px 16px rgba(0,0,0,0.08)"}}>
        <img
          src="/talks.png"
          alt="Curated Choice: Technology of Recommendations"
          style={{width:"100%",display:"block"}}
        />
        <div style={{padding:"18px 22px"}}>
          <div style={{fontSize:16,fontWeight:"bold",color:C.forest,marginBottom:6}}>Curated Choice: Technology of Recommendations</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:4}}>Lecture Over Drinks · Pint of View</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:10}}>
            <span style={{fontSize:13,color:C.slate}}>📅 Sunday, 26 April 2026</span>
            <span style={{fontSize:13,color:C.slate}}>🕔 5 PM – 7 PM</span>
            <span style={{fontSize:13,color:C.slate}}>📍 Sthamba Brewery, Andheri</span>
          </div>
        </div>
      </div>
    </div>
  </>
)}

        </div>
      </div>

      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "18px 16px", textAlign: "center", fontSize: T.tiny, color: C.muted, fontFamily: "Arial, sans-serif", letterSpacing: "0.06em" }}>
        © D. MANJUNATH · IIT BOMBAY · DEPARTMENT OF ELECTRICAL ENGINEERING
      </footer>

    </div>
  );
}