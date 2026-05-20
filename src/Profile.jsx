import { useState, useEffect, useRef } from "react";
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

const NAV = ["About", "Publications", "Research", "Professional Activities", "Awards & Distinctions", "Students", "Funded Projects", "Inventions & Software"];

function PageLoader({ done }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width = 320, H = cvs.height = 200;
    const nodes = [{x:50,y:100},{x:130,y:50},{x:130,y:150},{x:210,y:50},{x:210,y:150},{x:270,y:100}];
    const edges = [[0,1],[0,2],[1,3],[1,4],[2,3],[2,4],[3,5],[4,5]];
    const NODE_DELAY=18, EDGE_DELAY=14, PAUSE=60;
    const totalFrames = nodes.length*NODE_DELAY + edges.length*EDGE_DELAY + PAUSE;
    let frame=0, raf;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const t = frame%totalFrames;
      const visibleNodes = Math.min(nodes.length, Math.floor(t/NODE_DELAY));
      const edgeStart = nodes.length*NODE_DELAY;
      const visibleEdges = t<edgeStart ? 0 : Math.min(edges.length, Math.floor((t-edgeStart)/EDGE_DELAY));
      for (let i=0;i<visibleEdges;i++) {
        const [a,b]=edges[i]; const na=nodes[a],nb=nodes[b];
        const isDrawing = i===visibleEdges-1 && t<edgeStart+visibleEdges*EDGE_DELAY;
        const frac = isDrawing ? ((t-edgeStart)%EDGE_DELAY)/EDGE_DELAY : 1;
        ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(na.x+(nb.x-na.x)*frac, na.y+(nb.y-na.y)*frac); ctx.stroke();
      }
      for (let i=0;i<visibleNodes;i++) {
        const n=nodes[i]; const scale=Math.min(1,(t-i*NODE_DELAY)/10); const r=7*scale;
        const pulse = i<visibleNodes-1 ? 1+Math.sin(frame*0.05+i*1.2)*0.08 : 1;
        ctx.strokeStyle="rgba(255,255,255,0.12)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(n.x,n.y,r*2.2*pulse,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle = i===0||i===nodes.length-1 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)";
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,Math.PI*2); ctx.fill();
      }
      frame++; raf=requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{position:"fixed",inset:0,background:"#07120d",zIndex:9999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,opacity:done?0:1,pointerEvents:done?"none":"all",transition:"opacity 0.9s ease"}}>
      <div style={{fontFamily:"Georgia, serif",fontSize:26,color:"rgba(255,255,255,0.85)",letterSpacing:"0.04em",fontWeight:"normal"}}>D. Manjunath</div>
      <canvas ref={canvasRef} style={{maxWidth:"100%"}} />
      <div style={{fontFamily:"'Courier New', monospace",fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:"0.18em",textTransform:"uppercase",textAlign:"center",padding:"0 20px"}}>Department of Electrical Engineering · IIT Bombay</div>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"44px 0 20px"}}>
      <div style={{width:3,height:22,background:C.teal,borderRadius:3,flexShrink:0}} />
      <span style={{fontSize:15,letterSpacing:"0.06em",textTransform:"uppercase",color:C.teal,fontFamily:"'Courier New', monospace",fontWeight:"600"}}>{children}</span>
    </div>
  );
}

function PageTitle({ children }) {
  return (
    <div style={{textAlign:"center",padding:"48px 0 8px"}}>
      <span style={{fontSize:22,letterSpacing:"0.12em",textTransform:"uppercase",color:C.teal,fontFamily:"Georgia, serif",fontWeight:"bold"}}>{children}</span>
      <div style={{width:48,height:2.5,background:C.teal,borderRadius:2,margin:"12px auto 0"}} />
    </div>
  );
}

function PubItem({ item }) {
  return (
    <li style={{padding:"18px 0",borderBottom:`1px solid ${C.pale}`,lineHeight:1.85,display:"flex",gap:12}}>
      <span style={{color:C.teal,fontSize:16,lineHeight:1.6,flexShrink:0}}>•</span>
      <div>
        <span style={{color:C.muted,fontSize:13.5}}>{item.authors} </span>
        <span style={{fontStyle:"italic",color:C.slate,fontSize:14}}>{item.title}</span>
        <span style={{color:C.muted,fontSize:13}}> {item.venue}</span>
        {(item.award||item.Award) && <span style={{display:"inline-block",marginLeft:8,background:"#fffbeb",color:"#92610a",border:"1px solid #fcd34d",borderRadius:4,fontSize:11,padding:"2px 8px"}}>★ {item.award||item.Award}</span>}
        {item.doi && <a href={item.doi} target="_blank" rel="noreferrer" style={{marginLeft:8,fontSize:11,textDecoration:"none",color:C.teal,border:`1px solid ${C.teal}`,padding:"2px 8px",borderRadius:4}}>DOI ↗</a>}
        {item.note && <div style={{marginTop:4,fontSize:12,color:C.muted,fontStyle:"italic"}}>{item.note}</div>}
      </div>
    </li>
  );
}

function TimelineItem({ year, text }) {
  const isLong = (year||"").length > 6;
  return (
    <li style={{display:"flex",gap:16,padding:"10px 0",borderBottom:`1px solid ${C.pale}`}}>
      <span style={{minWidth:90,color:C.teal,fontWeight:"bold",fontSize:isLong?10:13,fontFamily:"'Courier New', monospace",paddingTop:isLong?4:2,flexShrink:0}}>{year}</span>
      <span style={{color:"#374151",fontSize:15,lineHeight:1.75}}>{text}</span>
    </li>
  );
}

/* Table header label */
function CH({ children, w }) {
  return (
    <span style={{width:w||"auto",flexShrink:0,flexGrow:w?0:1,fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",color:C.forest,fontFamily:"Georgia, serif",fontWeight:"bold"}}>
      {children}
    </span>
  );
}

/* Table header row */
function ColRow({ children }) {
  return <div style={{display:"flex",gap:20,padding:"10px 0",borderBottom:`2px solid ${C.teal}`,marginBottom:6}}>{children}</div>;
}

/* Table data row */
function DataRow({ children }) {
  return <li style={{display:"flex",gap:20,padding:"12px 0",borderBottom:`1px solid ${C.pale}`,lineHeight:1.75,listStyle:"none",alignItems:"flex-start"}}>{children}</li>;
}

/* Table data cell */
function DC({ children, w, color, mono, size }) {
  return (
    <span style={{
      width:w||"auto", flexShrink:0, flexGrow:w?0:1,
      color:color||"#374151", fontSize:size||14,
      fontFamily:mono?"'Courier New', monospace":"Georgia, serif",
      fontWeight:mono?"bold":"normal", lineHeight:1.75,
    }}>{children}</span>
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
    Papa.parse(url, { download:true, header:true, skipEmptyLines:true, complete:(r) => setter(r.data) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
}

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
  const [profActs,    setProfActs]    = useState([]);
  const [awards,      setAwards]      = useState([]);
  const [phd,         setPhd]         = useState([]);
  const [grad,        setGrad]        = useState([]);
  const [funded,      setFunded]      = useState([]);
  const [fundedTech,  setFundedTech]  = useState([]);
  const [inventions,  setInventions]  = useState([]);
  const [software,    setSoftware]    = useState([]);

  const w = useWindowWidth();
  const isMobile = w < 700;

  useEffect(() => { const id = setTimeout(() => setLoaderDone(true), 2600); return () => clearTimeout(id); }, []);

  useCSV("https://docs.google.com/spreadsheets/d/1pfZ-iwS1ZddWTejJT2SaDi1mn4Hg7MnTiNPz0rImoo8/export?format=csv&gid=2118216013", setOpeds);
  useCSV("https://docs.google.com/spreadsheets/d/1o48HE2A1RsIYGBSMmwNs5cffDy_jILVLMGyy9uR4keY/export?format=csv&gid=632226715", setBooks);
  useCSV("https://docs.google.com/spreadsheets/d/1o0FROIzfZ_OmGLAQZgqsvCPE7oUhjQnExBaD-2_npkk/export?format=csv&gid=465249833", setPreprint);
  useCSV("https://docs.google.com/spreadsheets/d/1acmC2Vbh0CnkOJVrHtELYjdQ72VGA3uEKPb5TL7TN9A/export?format=csv&gid=790643081", setJournals);
  useCSV("https://docs.google.com/spreadsheets/d/1fVCvjTkDWQKnSW4Ir7rWbB9IoLH0EHqR9rtu4_ltH2E/export?format=csv&gid=306938548", setConferences);
  useCSV("https://docs.google.com/spreadsheets/d/1_zfbe-l28D57WqjQ5cjSh17r5lO2oC62ucKaFzU1VkQ/export?format=csv&gid=1064858605", setTalks);
  useCSV("https://docs.google.com/spreadsheets/d/1UjcSLdGxeAp5EW0zvpAj8wt_A4Za5VAZnBC0qbpG0JY/export?format=csv&gid=0", setProfActs);
  useCSV("https://docs.google.com/spreadsheets/d/1wCI4V2UfLEkuYAUDOFSI_aOyIyAG1MtTc57Z-r1IrOo/export?format=csv&gid=0", setAwards);
  useCSV("https://docs.google.com/spreadsheets/d/18isc3OTgvuOMMTAmUXkVHZljtL7rjpMSsA1oac9qz6U/export?format=csv&gid=0", setPhd);
  useCSV("https://docs.google.com/spreadsheets/d/15COZ4wkz5oe6ANPGkRTRbTkFj29bXpR4YzhOCgTEgvA/export?format=csv&gid=0", setGrad);
  useCSV("https://docs.google.com/spreadsheets/d/1Hyi2UZKMdC9cJBUWQDy8ch3H8IwkPJ1HaQDJxPWP_Dw/export?format=csv&gid=737011902", setFunded);
  useCSV("https://docs.google.com/spreadsheets/d/1FeLZpUaW4XnQ1MjRWFNBCXjmNGjCTKOufiaV6Fnmvgg/export?format=csv&gid=0", setFundedTech);
  useCSV("https://docs.google.com/spreadsheets/d/1jfXaQvpYZHmRU1_-bjM73I86dZ9dNZMf_GhJkvfxUTA/export?format=csv&gid=288940565", setSoftware);
  useCSV("https://docs.google.com/spreadsheets/d/1DtBRvEoBSfJ9OFF_qkpC9cM75EpI90aS_ZZts-45Lo8/export?format=csv&gid=0", setInventions);

  const go = (page) => { setActive(page); setMenuOpen(false); };
  const contentPad = { maxWidth:1040, margin:"0 auto", padding:isMobile?"0 16px 60px":"0 36px 80px", paddingTop:0 };

  return (
    <div style={{fontFamily:"Georgia, serif",background:C.bg,color:C.slate,minHeight:"100vh"}}>

      <PageLoader done={loaderDone} />

      <div style={{background:C.ink,padding:"7px 16px",color:"#4d8c76",fontSize:10,letterSpacing:"0.1em",fontFamily:"'Courier New', monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        DEPARTMENT OF ELECTRICAL ENGINEERING {" · "} IIT BOMBAY {" · "} CMInDS
      </div>

      {/* ── NAV ── */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:C.white,borderBottom:`1px solid ${C.border}`,boxShadow:"0 1px 12px rgba(0,0,0,0.06)"}}>
        {isMobile ? (
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 16px",minHeight:54}}>
            <span style={{fontSize:15,fontWeight:"bold",color:C.forest,fontFamily:"Georgia, serif"}}>{active}</span>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{border:`1px solid ${C.border}`,background:C.white,padding:"7px 11px",borderRadius:6,cursor:"pointer",fontSize:16,lineHeight:1}}>☰</button>
          </div>
        ) : (
          <div style={{display:"flex",justifyContent:"center",flexWrap:"wrap",padding:"0 8px"}}>
            {NAV.map(n => (
              <button key={n} onClick={() => go(n)} style={{
                background:"none",border:"none",cursor:"pointer",
                padding:"16px 12px",
                fontSize:13,fontFamily:"Georgia, serif",
                borderBottom:active===n?`2.5px solid ${C.teal}`:"2.5px solid transparent",
                color:active===n?C.teal:C.muted,
                fontWeight:active===n?"bold":"normal",
                transition:"color 0.2s",whiteSpace:"nowrap",
              }}>{n}</button>
            ))}
          </div>
        )}
      {isMobile && menuOpen && (
        <div style={{background:C.white,borderBottom:`1px solid ${C.border}`}}>
          {NAV.map(n => (
            <button key={n} onClick={() => go(n)} style={{
              width:"100%",textAlign:"left",padding:"14px 20px",
              background:active===n?C.pale:C.white,
              border:"none",borderBottom:`1px solid ${C.pale}`,
              fontSize:14,fontFamily:"Georgia, serif",
              color:active===n?C.teal:C.slate,
              fontWeight:active===n?"bold":"normal",
              cursor:"pointer",
            }}>{n}</button>
          ))}
        </div>
      )}
      </nav>

      {/* HERO */}
      <div style={{position:"relative",height:isMobile?200:290,overflow:"hidden",background:"linear-gradient(135deg, #04180f 0%, #0a3d2e 100%)"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:C.teal,opacity:0.6}} />
        <div style={{position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:isMobile?"0 20px":"0 52px"}}>
          <div style={{fontFamily:"'Courier New', monospace",fontSize:isMobile?9:10,letterSpacing:"0.15em",color:C.mint,marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            <span style={{display:"inline-block",width:20,height:1,background:C.mint}} />
            PROFESSOR · DEPT. OF ELECTRICAL ENGINEERING
          </div>
          <h1 style={{margin:0,fontSize:isMobile?30:50,fontWeight:"bold",color:C.white,letterSpacing:"-0.02em",lineHeight:1.05}}>D. Manjunath</h1>
          <p style={{margin:"8px 0 0",color:"#7bbba6",fontSize:isMobile?12:15}}>IIT Bombay {" · "} Head, Centre for Machine Intelligence {"&"} Data Science</p>
          {!isMobile && (
            <div style={{display:"flex",gap:8,marginTop:20,flexWrap:"wrap",justifyContent:"center"}}>
              {["Stochastic Systems","Network Theory","Queueing Models","ML & Optimization"].map(t => (
                <span key={t} style={{fontSize:11,padding:"4px 12px",borderRadius:4,border:"1px solid rgba(29,184,126,0.3)",color:C.mint,fontFamily:"'Courier New', monospace",letterSpacing:"0.05em"}}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={contentPad}>

        {/* ── About ── */}
        {active === "About" && (
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"260px 1fr",gap:isMobile?24:52,alignItems:"start",marginTop:28}}>
            <div style={{position:"relative",maxWidth:isMobile?"220px":"100%",margin:isMobile?"0 auto":"0"}}>
              <img src="/cropped.JPG" alt="D. Manjunath"
                onError={e => { e.target.style.display="none"; document.getElementById("prof-fallback").style.display="flex"; }}
                style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",objectPosition:"center 35%",borderRadius:14,display:"block",border:`1px solid ${C.border}`}}
              />
              <div id="prof-fallback" style={{display:"none",width:"100%",aspectRatio:"3/4",background:`linear-gradient(160deg, #0d3a26, ${C.teal})`,borderRadius:14,alignItems:"center",justifyContent:"center",border:`1px solid ${C.border}`,flexDirection:"column",gap:10}}>
                <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:28,color:"rgba(255,255,255,0.7)"}}>DM</span>
                </div>
              </div>
            </div>
            <div>
              <div style={{fontSize:isMobile?24:32,fontWeight:"bold",color:"#0a3d2e",letterSpacing:"-0.01em",marginBottom:4}}>About</div>
              <div style={{fontSize:11,color:C.teal,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'Courier New', monospace",marginBottom:18}}>Professor · IIT Bombay</div>
              <div style={{width:36,height:2.5,background:C.teal,borderRadius:2,marginBottom:20}} />
              {["I am a Professor at the Department of Electrical Engineering, IIT Bombay, and the Head of the Centre for Machine Intelligence and Data Science (CMInDS).","My research spans computer and communication networks, queueing theory, stochastic systems, performance modeling, network economics, distributed optimization, and learning systems.","Current work focuses on stochastic models for large-scale systems, resource allocation, recommendation systems, and data-driven optimization in networked environments."].map((p,i) => (
                <p key={i} style={{lineHeight:1.9,color:"#374151",fontSize:isMobile?14:15.5,marginBottom:14}}>{p}</p>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"20px 0"}}>
                {[["Department","Electrical Engineering"],["Centre","CMInDS"],["Research","Networks & Stochastic Systems"],["Institution","IIT Bombay"]].map(([label,val]) => (
                  <div key={label} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.teal}`,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:C.teal,fontFamily:"'Courier New', monospace",marginBottom:4}}>{label}</div>
                    <div style={{fontSize:13,color:C.slate,lineHeight:1.5}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[["Google Scholar ↗","https://scholar.google.com"],["IIT Bombay ↗","https://www.ee.iitb.ac.in"],["Email ↗","mailto:dmanjunath@iitb.ac.in"]].map(([label,href]) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" style={{textDecoration:"none",border:`1.5px solid ${C.teal}`,color:C.teal,padding:"8px 14px",borderRadius:7,fontSize:13,transition:"all 0.2s",display:"inline-block"}}
                    onMouseEnter={e => { e.target.style.background=C.teal; e.target.style.color="#fff"; }}
                    onMouseLeave={e => { e.target.style.background="transparent"; e.target.style.color=C.teal; }}
                  >{label}</a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Publications ── */}
        {active === "Publications" && (
          <>
            <PageTitle>Publications</PageTitle>
            <SectionHead>Pre-print Publications</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {preprint.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : preprint.map((item,i) => <PubItem key={i} item={item} />)}
            </ul>
            <SectionHead>Journal Articles</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {journals.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : journals.map((item,i) => <PubItem key={i} item={item} />)}
            </ul>
            <SectionHead>Conference Papers</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {conferences.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : conferences.map((item,i) => <PubItem key={i} item={item} />)}
            </ul>
            <SectionHead>Op-eds</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {opeds.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : opeds.map((item,i) => <TimelineItem key={i} year={item.year||item.period} text={item.text||item.title||item.award} />)}
            </ul>
            <SectionHead>Books</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {books.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : books.map((item,i) => <TimelineItem key={i} year={item.year||item.period} text={item.text||item.role||item.title} />)}
            </ul>
            <SectionHead>Refereed Conferences</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {talks.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : talks.map((item,i) => <TimelineItem key={i} year={item.year||item.period} text={item.text||item.title} />)}
            </ul>
          </>
        )}

        {/* ── Research ── */}
        {active === "Research" && (
          <>
            <PageTitle>Research</PageTitle>
            <SectionHead>Research Interests</SectionHead>
            <p style={{lineHeight:1.9,color:"#374151",fontSize:15,marginBottom:24,marginTop:8}}>My work lies at the intersection of probability theory, network science, and machine learning — building rigorous analytical and data-driven models for real-world systems at scale.</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {["Computer Networks","Communication Networks","Queueing Theory","Stochastic Systems","Performance Modeling","Network Economics","Distributed Optimization","Recommendation Systems","Resource Allocation","Learning Systems","Data-Driven Optimization","Large-Scale Systems"].map(tag => (
                <span key={tag} style={{padding:"6px 12px",borderRadius:7,fontSize:13,background:C.pale,color:C.forest,border:`1px solid ${C.border}`}}>{tag}</span>
              ))}
            </div>
            <SectionHead>Current Focus Areas</SectionHead>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
              {[{title:"Stochastic Models",desc:"Rigorous probabilistic models for large-scale network systems and queues."},{title:"Resource Allocation",desc:"Optimal and near-optimal policies for resource distribution in dynamic environments."},{title:"Recommendation Systems",desc:"Theory and algorithms for personalized recommendations at scale."},{title:"Data-Driven Optimization",desc:"Combining statistical learning with classical optimization in networked settings."}].map(({title,desc}) => (
                <div key={title} style={{background:C.white,border:`1px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:10,padding:"16px 18px"}}>
                  <div style={{fontWeight:"bold",color:C.forest,fontSize:15,marginBottom:8}}>{title}</div>
                  <div style={{color:"#4b5563",fontSize:13.5,lineHeight:1.75}}>{desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Professional Activities ── */}
        {active === "Professional Activities" && (
          <>
            <PageTitle>Professional Activities</PageTitle>
            {profActs.length===0
              ? <p style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</p>
              : (() => {
                  const knownCategories = ["Organiser","Editorial","Board Membership","Conference Leadership","Refereeing - IEEE Journals","Refereeing - ACM Journals","Refereeing - CS and Mathematics","Refereeing - Operations Research","Refereeing - Other Journals","Refereeing - IEEE Conferences","Refereeing - ACM Conferences","Refereeing - Other Conferences","Refereeing","TPC Member","IEEE Membership","Conference Participation"];
                  const parsed = profActs.map(item => {
                    const cols = Object.values(item);
                    const colA=(cols[0]||"").trim(), colB=(cols[1]||"").trim(), colC=(cols[2]||"").trim();
                    let category="Other", activity=colA;
                    for (const cat of knownCategories) {
                      if (colA.startsWith(cat)) { category=cat.startsWith("Refereeing -")?"Refereeing":cat; activity=colA.slice(cat.length).trim(); break; }
                    }
                    return { category, activity:[activity,colB,colC].filter(Boolean).join(", ") };
                  });
                  const groups=[], seen={};
                  parsed.forEach(({category,activity}) => {
                    if (!seen[category]) { seen[category]=true; groups.push({category,items:[]}); }
                    groups.find(g=>g.category===category).items.push(activity);
                  });
                  return groups.map(({category,items}) => (
                    <div key={category}>
                      <SectionHead>{category}</SectionHead>
                      <ul style={{listStyle:"none",padding:0}}>
                        {items.map((activity,i) => (
                          <li key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.pale}`,lineHeight:1.75}}>
                            <span style={{color:C.teal,fontSize:16,lineHeight:1.6,flexShrink:0}}>•</span>
                            <span style={{color:"#374151",fontSize:14}}>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()
            }
          </>
        )}

        {/* ── Awards ── */}
        {active === "Awards & Distinctions" && (
          <>
            <PageTitle>Awards & Distinctions</PageTitle>
            <ColRow>
              <CH w={90}>Year</CH>
              <CH>Award</CH>
            </ColRow>
            <ul style={{listStyle:"none",padding:0}}>
              {awards.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : awards.map((item,i) => <TimelineItem key={i} year={item.Year} text={item.Award} />)}
            </ul>
          </>
        )}

        {/* ── Students ── */}
        {active === "Students" && (
          <>
            <PageTitle>Students</PageTitle>
            <SectionHead>PhD Supervisions: Completed</SectionHead>
            {isMobile ? (
              <ul style={{listStyle:"none",padding:0}}>
                {phd.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : phd.map((item,i) => (
                  <li key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.pale}`}}>
                    <div style={{color:C.teal,fontWeight:"bold",fontSize:12,fontFamily:"'Courier New', monospace",marginBottom:2}}>{item.Year}</div>
                    <div style={{color:C.forest,fontSize:14,fontWeight:"bold",marginBottom:2}}>{item.Student}</div>
                    <div style={{color:"#374151",fontSize:13,lineHeight:1.6}}>{item["Thesis Title"]}{item.Institution ? ", "+item.Institution : ""}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ColRow>
                  <CH w={60}>Year</CH>
                  <CH w={180}>Student</CH>
                  <CH>Thesis</CH>
                </ColRow>
                <ul style={{listStyle:"none",padding:0}}>
                  {phd.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : phd.map((item,i) => (
                    <DataRow key={i}>
                      <DC w={60} color={C.teal} mono>{item.Year}</DC>
                      <DC w={180} color={C.forest}>{item.Student}</DC>
                      <DC>{item["Thesis Title"]}{item.Institution ? ", "+item.Institution : ""}</DC>
                    </DataRow>
                  ))}
                </ul>
              </>
            )}

            <SectionHead>Graduate Thesis Supervisions</SectionHead>
            {isMobile ? (
              <ul style={{listStyle:"none",padding:0}}>
                {grad.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : grad.map((item,i) => (
                  <li key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.pale}`}}>
                    <div style={{color:C.teal,fontWeight:"bold",fontSize:12,fontFamily:"'Courier New', monospace",marginBottom:2}}>{item.Year} {item.Type ? `· ${item.Type}` : ""}</div>
                    <div style={{color:C.forest,fontSize:14,fontWeight:"bold",marginBottom:2}}>{item.Student}</div>
                    <div style={{color:"#374151",fontSize:13,lineHeight:1.6}}>{item["Thesis Title"]}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                <ColRow>
                  <CH w={60}>Year</CH>
                  <CH w={200}>Student</CH>
                  <CH w={150}>Type</CH>
                  <CH>Thesis</CH>
                </ColRow>
                <ul style={{listStyle:"none",padding:0}}>
                  {grad.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : grad.map((item,i) => (
                    <DataRow key={i}>
                      <DC w={60} color={C.teal} mono>{item.Year}</DC>
                      <DC w={200} color={C.forest}>{item.Student}</DC>
                      <DC w={150} color={C.muted} size={13}>{item.Type}</DC>
                      <DC>{item["Thesis Title"]}</DC>
                    </DataRow>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {/* ── Funded Projects ── */}
        {active === "Funded Projects" && (
          <>
            <PageTitle>Funded Projects</PageTitle>
            {[{title:"Research & Development Projects", data:funded}, {title:"Technology Deployment Projects", data:fundedTech}].map(({title,data}) => (
              <div key={title}>
                <SectionHead>{title}</SectionHead>
                {isMobile ? (
                  <ul style={{listStyle:"none",padding:0}}>
                    {data.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : data.map((item,i) => (
                      <li key={i} style={{padding:"12px 0",borderBottom:`1px solid ${C.pale}`}}>
                        <div style={{color:C.teal,fontWeight:"bold",fontSize:12,fontFamily:"'Courier New', monospace",marginBottom:2}}>{item.Role}{item.Period && item.Period !== "–" ? ` · ${item.Period}` : ""}</div>
                        <div style={{color:"#374151",fontSize:14,lineHeight:1.6,marginBottom:2}}>{item.Project}</div>
                        {item.Funder && <div style={{color:C.muted,fontSize:13}}>{item.Funder}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    <ColRow>
                      <CH w={170}>Role</CH>
                      <CH w={80}>Period</CH>
                      <CH w={undefined}>Project</CH>
                      <CH w={220}>Funder</CH>
                    </ColRow>
                    <ul style={{listStyle:"none",padding:0}}>
                      {data.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : data.map((item,i) => (
                        <DataRow key={i}>
                          <DC w={170} color={C.teal} mono size={12}>{item.Role}</DC>
                          <DC w={80} color={C.muted} size={13}>{item.Period}</DC>
                          <span style={{flex:1,color:"#374151",fontSize:14,lineHeight:1.75,minWidth:0}}>{item.Project}</span>
                          <span style={{width:220,flexShrink:0,color:C.muted,fontSize:13,lineHeight:1.75}}>{item.Funder}</span>
                        </DataRow>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── Inventions & Software ── */}
        {active === "Inventions & Software" && (
          <>
            <PageTitle>Inventions & Software</PageTitle>
            <SectionHead>Inventions</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {inventions.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : inventions.map((item,i) => (
                <li key={i} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.pale}`,lineHeight:1.75}}>
                  <span style={{color:C.teal,fontSize:16,lineHeight:1.6,flexShrink:0}}>•</span>
                  <div>
                    <span style={{color:C.forest,fontSize:14,fontWeight:"bold"}}>{item.Authors} </span>
                    <span style={{color:C.slate,fontSize:14}}>{item.Title}</span>
                    {item.Details && <div style={{color:C.muted,fontSize:13,marginTop:3}}>{item.Details}</div>}
                  </div>
                </li>
              ))}
            </ul>
            <SectionHead>Software Developed</SectionHead>
            <ul style={{listStyle:"none",padding:0}}>
              {software.length===0 ? <li style={{color:C.muted,fontSize:13,padding:"16px 0"}}>Loading...</li> : software.map((item,i) => (
                <li key={i} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.pale}`,lineHeight:1.75}}>
                  <span style={{color:C.teal,fontSize:16,lineHeight:1.6,flexShrink:0}}>•</span>
                  <div>
                    <span style={{color:C.forest,fontSize:14,fontWeight:"bold"}}>{item.Name}</span>
                    {item.Description && <div style={{color:"#374151",fontSize:14,marginTop:3}}>{item.Description}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

      </div>

      <div style={{background:C.white,borderTop:`1px solid ${C.border}`,padding:"20px 16px",textAlign:"center",fontSize:11,color:C.muted,fontFamily:"'Courier New', monospace",letterSpacing:"0.06em"}}>
        {"© D. MANJUNATH · IIT BOMBAY · DEPARTMENT OF ELECTRICAL ENGINEERING"}
      </div>

    </div>
  );
}