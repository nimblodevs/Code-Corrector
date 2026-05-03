import { LAB_CATEGORIES, RAD_CATEGORIES, DRUG_ITEMS, searchRegistry, FLOW_STEPS, TRIAGE_LEVELS } from "../data/referenceData";
import { STATUS_META, NAV, emojiOf, calcAge, avatarHue, fmtN, pad, genNo } from "../lib/utils";

const C = { // colors
  navy:"#071828", navyM:"#0d2744", navyL:"#0f3460",
  cyan:"#00bcd4", cyanL:"#e0f7fa",
  slate:"#64748b", slateL:"#94a3b8", slateXL:"#e2e8f0",
  bg:"#f1f5f9",
};

// ============================================================================
// CatalogueSearch - reusable item-search widget used at EVERY service point.
//
// Props:
//   cats        [string]   - category filter e.g. ["lab"] or ["pharmacy"]
//   selected    [id]       - currently selected item ids (for tick display)
//   onAdd       (item)=>   - called when user picks an item
//   onRemove    (id)=>     - called when user removes an item (optional)
//   placeholder string     - input hint
//   multi       bool       - allow multiple selections (default true)
//   showPrice   bool       - show price column (default true)
//   compact     bool       - smaller card layout
//   label       string     - section heading
//   accentColor string
// ============================================================================
function CatalogueSearch({
  cats = null,
  selected = [],
  onAdd,
  onRemove,
  placeholder = "Search items...",
  multi = true,
  showPrice = true,
  compact = false,
  label = null,
  accentColor = "#0e7490",
}) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [limit,    setLimit]    = useState(12);
  const [focused,  setFocused]  = useState(false);
  const timerRef = useRef(null);

  // Debounced search - runs synchronously in this single-file setup
  const runSearch = (q) => {
    const r = searchRegistry(q, { cats, limit: 40 });
    setResults(r);
    setLimit(12);
  };

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    runSearch(q);
  };

  // Show default results when focused with empty query
  const handleFocus = () => {
    setFocused(true);
    if (!query) runSearch("");
  };

  const pick = (item) => {
    if (!multi && selected.length >= 1 && !selected.includes(item.id)) return;
    onAdd(item);
    if (!multi) { setQuery(""); setResults([]); setFocused(false); }
  };

  const visible = results.slice(0, limit);
  const hasMore = results.length > limit;

  const catColor = (cat) =>
    cat==="lab"?"#0e7490":cat==="radiology"?"#7c3aed":cat==="pharmacy"?"#059669":
    cat==="procedure"?"#d97706":cat==="consultation"?"#1d4ed8":
    cat==="accommodation"?"#0369a1":cat==="nursing"?"#be185d":"#475569";

  const catBg = (cat) =>
    cat==="lab"?"#cffafe":cat==="radiology"?"#ede9fe":cat==="pharmacy"?"#d1fae5":
    cat==="procedure"?"#fef3c7":cat==="consultation"?"#dbeafe":
    cat==="accommodation"?"#e0f2fe":cat==="nursing"?"#fce7f3":"#f1f5f9";

  return (
    <div style={{ marginBottom: compact ? 8 : 14 }}>
      {label && (
        <div style={{ fontSize:11,fontWeight:700,color:accentColor,textTransform:"uppercase",letterSpacing:.9,fontFamily:"monospace",marginBottom:6 }}>
          {label}
        </div>
      )}

      {/* Search input */}
      <div style={{ position:"relative", marginBottom: focused && visible.length ? 6 : 0 }}>
        <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:15,color:"#94a3b8",pointerEvents:"none",userSelect:"none" }}>
          🔍
        </span>
        <input
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          placeholder={placeholder}
          style={{ width:"100%",boxSizing:"border-box",padding:"10px 36px",border:"1.5px solid #e2e8f0",borderRadius:9,fontFamily:"inherit",fontSize:13,outline:"none",background:"#f8fafc",transition:"border-color .15s",borderColor: focused ? accentColor : "#e2e8f0" }}
        />
        {query && (
          <button onClick={()=>{ setQuery(""); setResults([]); }}
            style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8",padding:"0 4px",lineHeight:1 }}>
            x
          </button>
        )}
      </div>

      {/* Results dropdown / inline list */}
      {focused && visible.length > 0 && (
        <div style={{ background:"#fff",borderRadius:10,border:"1.5px solid #e2e8f0",boxShadow:"0 6px 24px rgba(0,0,0,.10)",overflow:"hidden",maxHeight:320,overflowY:"auto" }}>
          {visible.map(item => {
            const isSelected = selected.includes(item.id);
            return (
              <div key={item.id}
                onMouseDown={() => pick(item)}
                style={{ display:"flex",alignItems:"center",gap:10,padding: compact ? "8px 12px" : "10px 14px",cursor: isSelected && multi ? "default" : "pointer",
                  background: isSelected ? "#f0fdf4" : "#fff",
                  borderBottom:"1px solid #f1f5f9",transition:"background .1s" }}
                onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#f8fafc"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=isSelected?"#f0fdf4":"#fff"; }}>
                {/* Status indicator */}
                <div style={{ width:20,height:20,borderRadius:5,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                  background: isSelected ? "#059669" : "#f1f5f9",
                  border: isSelected ? "none" : "1.5px solid #e2e8f0" }}>
                  {isSelected && <span style={{ color:"#fff",fontSize:11,fontWeight:900 }}>v</span>}
                </div>
                {/* Item info */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize: compact ? 12 : 13, fontWeight:600, color:"#0b1929",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {item.name}
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:2 }}>
                    <span style={{ background:catBg(item.cat),color:catColor(item.cat),
                      borderRadius:4,padding:"1px 6px",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:.6 }}>
                      {item.subcat||item.cat}
                    </span>
                    {item.unit && <span style={{ fontSize:10,color:"#94a3b8" }}>{item.unit}</span>}
                  </div>
                </div>
                {/* Price */}
                {showPrice && (
                  <div style={{ fontSize: compact ? 11 : 12, fontWeight:700, color: isSelected ? "#059669" : catColor(item.cat),
                    fontFamily:"monospace",flexShrink:0 }}>
                    {item.price > 0 ? `KES ${item.price.toLocaleString()}` : "POA"}
                  </div>
                )}
                {/* Remove button if selected */}
                {isSelected && onRemove && (
                  <button onMouseDown={e=>{ e.stopPropagation(); onRemove(item.id); }}
                    style={{ background:"#fef2f2",border:"none",borderRadius:5,width:22,height:22,cursor:"pointer",color:"#dc2626",fontSize:13,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    x
                  </button>
                )}
              </div>
            );
          })}
          {hasMore && (
            <div onMouseDown={()=>setLimit(l=>l+12)}
              style={{ padding:"10px 14px",textAlign:"center",fontSize:12,color:accentColor,fontWeight:700,cursor:"pointer",background:"#f8fafc" }}>
              Show more results ({results.length - limit} more)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color, bg, dot, sm }) {
  return (
    <span style={{ background:bg, color, borderRadius:20,
      padding:sm?"2px 10px":"4px 13px",
      fontSize:sm?11:12, fontWeight:700,
      display:"inline-flex", alignItems:"center", gap:5, whiteSpace:"nowrap" }}>
      {dot && <span style={{ width:6,height:6,borderRadius:"50%",background:dot,flexShrink:0 }}/>}
      {label}
    </span>
  );
}

function Sec({ children, accent="#475569" }) {
  return (
    <div style={{ fontSize:11,fontWeight:700,color:accent,letterSpacing:1.3,
      textTransform:"uppercase",fontFamily:"monospace",marginBottom:12,
      paddingBottom:6,borderBottom:`2px solid ${accent}22` }}>{children}</div>
  );
}

const baseInput = { width:"100%",padding:"9px 11px",borderRadius:8,fontSize:13,
  fontFamily:"inherit",outline:"none",boxSizing:"border-box",color:"#1e293b",background:"#fff" };
const IS  = (err) => ({ ...baseInput, border:`1.5px solid ${err?"#fca5a5":"#e2e8f0"}` });
const SS  = { ...baseInput, border:"1.5px solid #e2e8f0" };
const TA  = (err, rows=3) => ({ ...IS(err), resize:"vertical", minHeight:rows*28 });

function FL({ label, ch, span }) {
  return (
    <div style={{ gridColumn:span===2?"1/-1":"auto" }}>
      <label style={{ display:"block",fontSize:11,fontWeight:700,color:C.slate,
        marginBottom:5,letterSpacing:.8,textTransform:"uppercase" }}>{label}</label>
      {ch}
    </div>
  );
}

function Card({ children, mb=16, p="20px 22px" }) {
  return <div style={{ background:"#fff",borderRadius:14,padding:p,
    boxShadow:"0 2px 12px rgba(0,0,0,.07)",marginBottom:mb }}>{children}</div>;
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return <div style={{ background:"#fef2f2",color:"#dc2626",borderRadius:9,
    padding:"10px 16px",marginBottom:14,fontSize:13,border:"1px solid #fecaca" }}>{msg}</div>;
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return <div style={{ background:"#f0fdf4",color:"#15803d",borderRadius:9,
    padding:"10px 16px",marginBottom:14,fontSize:13,border:"1px solid #bbf7d0",
    display:"flex",alignItems:"center",gap:8,fontWeight:600 }}>[OK] {msg}</div>;
}

// --- Flow Progress Bar ---------------------------------------------------------
function FlowBar({ status }) {
  const idx = FLOW_STEPS.findIndex(s=>s.key===status);
  return (
    <div style={{ background:"#fff",borderRadius:12,padding:"14px 20px",marginBottom:16,
      boxShadow:"0 1px 8px rgba(0,0,0,.06)" }}>
      <div style={{ display:"flex",alignItems:"center" }}>
        {FLOW_STEPS.map((s,i) => {
          const done = i < idx, curr = i === idx;
          return (
            <div key={s.key} style={{ display:"flex",alignItems:"center",flex:i<FLOW_STEPS.length-1?1:"auto" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5,flexShrink:0 }}>
                <div style={{ width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:done?13:curr?16:14,fontWeight:800,transition:"all .2s",
                  background:done?"#0b1929":curr?C.cyan:"#f1f5f9",
                  color:done||curr?"#fff":C.slateL,
                  boxShadow:curr?"0 0 0 4px rgba(0,188,212,.2)":"none" }}>
                  {done ? "v" : emojiOf(s.icon)}
                </div>
                <span style={{ fontSize:9,fontWeight:curr?800:400,letterSpacing:.5,whiteSpace:"nowrap",
                  color:curr?"#0b1929":done?"#475569":C.slateL }}>{s.label}</span>
              </div>
              {i < FLOW_STEPS.length-1 &&
                <div style={{ flex:1,height:2.5,borderRadius:2,margin:"0 6px",marginBottom:16,
                  background:done?"#0b1929":"#e2e8f0",transition:"background .3s" }}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Sidebar ------------------------------------------------------------------
function Sidebar({ page, setPage, patients }) {
  const badgeCounts = {
    queue:    patients.filter(p=>p.status==="Queued").length,
    triage:   patients.filter(p=>p.status==="Queued").length,
    register: patients.filter(p=>p.status==="Triaged").length,
    billing:  patients.filter(p=>p.status==="Registered").length,
    doctor:   patients.filter(p=>p.status==="Billed"||p.status==="With Doctor").length,
    lab:      patients.filter(p=>p.status==="Lab Pending").length,
    pharmacy: patients.filter(p=>p.clerking?.orders?.rx?.drugs?.length>0 && !p.clerking?.dispensed).length,
    ward:     patients.filter(p=>p.admitted || p.status==="Pending Admission").length,
    finance:  (() => { try { const d=JSON.parse(localStorage.getItem("medicore_debtors_registry")||"[]"); return d.filter(x=>x.status==="suspended").length; } catch { return 0; } })(),
  };

  // Group NAV into sections for clean rendering
  const clinicalItems  = NAV.filter(n=>!["finance","schemes","inventory","procurement","catalogue","forecast","transfers","expiry"].includes(n.key));
  const financeItems   = NAV.filter(n=>["finance","schemes"].includes(n.key));
  const operationsItems= NAV.filter(n=>["inventory","procurement","catalogue","forecast","transfers","expiry"].includes(n.key));

  const NavItem = ({ n, i }) => {
    const active = page === n.key;
    const cnt    = badgeCounts[n.badge] || 0;
    return (
      <button onClick={()=>setPage(n.key)}
        style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,
          border:"none",cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"left",
          background:active?"rgba(0,188,212,.18)":"transparent",
          color:active?"#00e5ff":"rgba(255,255,255,.6)",
          borderLeft:active?"3px solid #00bcd4":"3px solid transparent",
          transition:"all .15s", marginBottom:1 }}
        onMouseEnter={e=>{ if(!active){e.currentTarget.style.background="rgba(255,255,255,.06)";e.currentTarget.style.color="rgba(255,255,255,.85)";} }}
        onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,.6)";} }}>
        <span style={{ fontSize:15,width:20,flexShrink:0,textAlign:"center" }}>{emojiOf(n.emoji)}</span>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:12,fontWeight:active?700:500,lineHeight:1.2 }}>{n.label}</div>
          <div style={{ fontSize:9,color:"rgba(255,255,255,.28)",marginTop:1,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.desc}</div>
        </div>
        {cnt>0 &&
          <span style={{ background:active?C.cyan:"rgba(255,255,255,.15)",color:"#fff",
            borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:700,flexShrink:0 }}>{cnt}</span>}
      </button>
    );
  };

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize:8,color:"rgba(255,255,255,.22)",letterSpacing:2.5,textTransform:"uppercase",
      fontFamily:"monospace",padding:"6px 10px 4px",marginTop:4 }}>{children}</div>
  );

  return (
    <div style={{ width:220,flexShrink:0,
      background:`linear-gradient(180deg,${C.navy} 0%,${C.navyM} 60%,#0a1f38 100%)`,
      display:"flex",flexDirection:"column",boxShadow:"4px 0 28px rgba(0,0,0,.45)",
      position:"sticky",top:0,height:"100vh",overflow:"hidden" }}>

      {/* Logo */}
      <div style={{ padding:"16px 16px 13px",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#00bcd4,#0097a7)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
            boxShadow:"0 4px 14px rgba(0,188,212,.4)" }}>🏥</div>
          <div>
            <div style={{ color:"#fff",fontWeight:800,fontSize:15,letterSpacing:.3 }}>MediCore</div>
            <div style={{ color:"rgba(255,255,255,.3)",fontSize:8,letterSpacing:2.5,textTransform:"uppercase",fontFamily:"monospace" }}>HMS · v3.0</div>
          </div>
        </div>
      </div>

      {/* Scrollable nav — all sections */}
      <nav style={{ flex:1,overflowY:"auto",overflowX:"hidden",padding:"6px 8px 8px",
        scrollbarWidth:"thin",scrollbarColor:"rgba(255,255,255,.12) transparent" }}>
        <style>{`
          .medicore-nav::-webkit-scrollbar{width:4px}
          .medicore-nav::-webkit-scrollbar-track{background:transparent}
          .medicore-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}
        `}</style>

        <SectionLabel>Modules</SectionLabel>
        {clinicalItems.map((n,i)=><NavItem key={n.key} n={n} i={i} />)}

        <div style={{ height:1,background:"rgba(255,255,255,.08)",margin:"8px 6px 4px",borderRadius:1 }} />
        <SectionLabel>Finance</SectionLabel>
        {financeItems.map((n,i)=><NavItem key={n.key} n={n} i={i} />)}

        <div style={{ height:1,background:"rgba(255,255,255,.08)",margin:"8px 6px 4px",borderRadius:1 }} />
        <SectionLabel>Operations</SectionLabel>
        {operationsItems.map((n,i)=><NavItem key={n.key} n={n} i={i} />)}
      </nav>

      {/* Footer */}
      <div style={{ padding:"10px 14px 14px",borderTop:"1px solid rgba(255,255,255,.07)",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:9 }}>
          <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#00bcd4,#0097a7)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0 }}>🩺</div>
          <div style={{ minWidth:0 }}>
            <div style={{ color:"rgba(255,255,255,.85)",fontSize:11,fontWeight:600 }}>Admin User</div>
            <div style={{ color:"rgba(255,255,255,.28)",fontSize:9,fontFamily:"monospace" }}>{new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- Top Bar ------------------------------------------------------------------
function TopBar({ title, subtitle, action }) {
  return (
    <div style={{ background:"#fff",borderBottom:"1.5px solid #e2e8f0",padding:"13px 26px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
      position:"sticky",top:0,zIndex:10,boxShadow:"0 1px 0 #e2e8f0" }}>
      <div>
        <div style={{ fontSize:18,fontWeight:800,color:"#0b1929",letterSpacing:.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize:11,color:C.slateL,fontFamily:"monospace",marginTop:1 }}>{subtitle}</div>}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>{action}</div>
    </div>
  );
}

// --- Layout -------------------------------------------------------------------
function Layout({ page, setPage, patients, children, overlay }) {
  return (
    <div style={{ display:"flex",minHeight:"100vh",fontFamily:"'Palatino Linotype',Palatino,serif" }}>
      <Sidebar page={page} setPage={setPage} patients={patients} />
      <div style={{ flex:1,display:"flex",flexDirection:"column",background:C.bg,minWidth:0,overflow:"auto" }}>
        {children}
      </div>
      {overlay}
    </div>
  );
}

// --- Patient Banner -----------------------------------------------------------
function PatientBanner({ p }) {
  if (!p) return null;
  const sm = STATUS_META[p.status] || STATUS_META.Queued;
  const hue = avatarHue(p.id);
  return (
    <div style={{ background:"#fff",borderRadius:12,padding:"14px 18px",marginBottom:14,
      boxShadow:"0 1px 8px rgba(0,0,0,.06)",display:"flex",justifyContent:"space-between",
      alignItems:"center",flexWrap:"wrap",gap:12 }}>
      <div style={{ display:"flex",alignItems:"center",gap:13 }}>
        <div style={{ width:44,height:44,borderRadius:"50%",flexShrink:0,
          background:`hsl(${hue},50%,82%)`,color:`hsl(${hue},40%,28%)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800 }}>
          {(p.firstName||"?")[0]}{(p.lastName||"?")[0]}
        </div>
        <div>
          <div style={{ fontWeight:800,color:"#0b1929",fontSize:15 }}>
            {p.firstName||"-"} {p.middleName||""} {p.lastName||"-"}
          </div>
          <div style={{ fontSize:11,color:C.slateL,fontFamily:"monospace" }}>
            {p.id||"Unregistered"} . {p.mrn||"-"} . {p.queueNo}
          </div>
        </div>
      </div>
      <div style={{ display:"flex",gap:16,alignItems:"center",flexWrap:"wrap" }}>
        {p.dateOfBirth && <div><div style={{ fontSize:9,color:C.slateL,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1 }}>Age</div><div style={{ fontSize:13,fontWeight:700 }}>{calcAge(p.dateOfBirth)} yrs</div></div>}
        {p.gender && <div><div style={{ fontSize:9,color:C.slateL,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1 }}>Sex</div><div style={{ fontSize:13,fontWeight:700 }}>{p.gender}</div></div>}
        {p.bloodGroup && <div><div style={{ fontSize:9,color:C.slateL,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1 }}>Blood</div><div style={{ fontSize:13,fontWeight:700 }}>{p.bloodGroup}</div></div>}
        {p.category && <div><div style={{ fontSize:9,color:C.slateL,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1 }}>Category</div><div style={{ fontSize:13,fontWeight:700 }}>{p.category}</div></div>}
        {(() => {
          const w = parseFloat(p.triage?.weight); const h = parseFloat(p.triage?.height);
          const bmi = (w && h) ? (w/((h/100)**2)).toFixed(1) : null;
          if (!bmi) return null;
          const bmiLabel = bmi>=40?"Morbidly Obese":bmi>=35?"Obese II":bmi>=30?"Obese":bmi>=25?"Overweight":bmi>=18.5?"Normal":bmi>=16?"Underweight":"Sev. Underweight";
          const bmiColor = bmi>=30?"#dc2626":bmi>=25?"#b45309":bmi<16?"#dc2626":bmi<18.5?"#b45309":"#059669";
          const bmiBg   = bmi>=30?"#fee2e2":bmi>=25?"#fef3c7":bmi<16?"#fee2e2":bmi<18.5?"#fef3c7":"#dcfce7";
          return (
            <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:8,background:bmiBg,border:`1.5px solid ${bmiColor}44` }}>
              <div>
                <div style={{ fontSize:8,color:bmiColor,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:.8,fontWeight:700 }}>BMI</div>
                <div style={{ fontSize:16,fontWeight:900,color:bmiColor,lineHeight:1 }}>{bmi}</div>
              </div>
              <div style={{ fontSize:10,fontWeight:700,color:bmiColor }}>{bmiLabel}</div>
            </div>
          );
        })()}
        <Badge label={p.status} color={sm.color} bg={sm.bg} dot={sm.dot} sm />
      </div>
    </div>
  );
}

// --- Billing / Reference Number Strip -----------------------------------------
// Shows all reference numbers for a patient in a consistent coloured strip.
// Pass the patient object; only numbers that exist are rendered.
function RefNumStrip({ p }) {
  if (!p) return null;
  const nums = [
    p.billing?.invoiceNo   && { label:"Invoice",      val:p.billing.invoiceNo,   bg:"#eff6ff", border:"#bfdbfe", col:"#1d4ed8",
                                  badge: p.billing.paid
                                    ? { txt:"PAID",   bg:"#dcfce7", col:"#15803d" }
                                    : { txt:"UNPAID", bg:"#fef3c7", col:"#b45309" } },
    p.billing?.receiptNo   && { label:"Receipt",      val:p.billing.receiptNo,   bg:"#f0fdf4", border:"#bbf7d0", col:"#15803d" },
    p.clerking?.consNo     && { label:"Consultation", val:p.clerking.consNo,     bg:"#f5f3ff", border:"#ddd6fe", col:"#7c3aed" },
    p.clerking?.labNo      && { label:"Lab Report",   val:p.clerking.labNo,      bg:"#f0fdfa", border:"#99f6e4", col:"#0f766e" },
    p.clerking?.rxNo       && { label:"Rx Dispensed", val:p.clerking.rxNo,       bg:"#f0fdf4", border:"#86efac", col:"#15803d",
                                  badge: { txt:"DISPENSED", bg:"#dcfce7", col:"#166534" } },
    p.billing?.billedBy    && { label:"Billed By",    val:p.billing.billedBy,    bg:"#f8fafc", border:"#e2e8f0", col:"#475569",
                                  sub: p.billing.billedAt ? new Date(p.billing.billedAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : null },
  ].filter(Boolean);

  if (!nums.length) return null;

  return (
    <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:14 }}>
      {nums.map(n=>(
        <div key={n.label} style={{ background:n.bg,border:`1px solid ${n.border}`,borderRadius:8,
          padding:"5px 12px",display:"flex",alignItems:"center",gap:7 }}>
          <div>
            <div style={{ fontSize:8,fontFamily:"monospace",color:n.col,textTransform:"uppercase",
              letterSpacing:1.2,opacity:.75,marginBottom:1 }}>{n.label}</div>
            <div style={{ fontSize:13,fontWeight:800,color:n.col,fontFamily:"monospace",lineHeight:1 }}>{n.val}</div>
            {n.sub && <div style={{ fontSize:9,color:n.col,opacity:.6,fontFamily:"monospace",marginTop:1 }}>{n.sub}</div>}
          </div>
          {n.badge && (
            <span style={{ background:n.badge.bg,color:n.badge.col,borderRadius:4,
              padding:"1px 6px",fontSize:9,fontWeight:800,letterSpacing:.5,flexShrink:0 }}>
              {n.badge.txt}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Empty select state --------------------------------------------------------
function EmptyState({ icon, msg, btn, onBtn }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14,marginTop:64 }}>
      <div style={{ fontSize:56,lineHeight:1 }}>{icon}</div>
      <div style={{ fontSize:15,color:C.slate,fontWeight:600,textAlign:"center",maxWidth:360 }}>{msg}</div>
      {onBtn && <button onClick={onBtn} style={{ padding:"10px 22px",border:"none",borderRadius:9,background:"#0b1929",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit" }}>{btn}</button>}
    </div>
  );
}


export { C, baseInput, IS, SS, TA };
export { CatalogueSearch };
export { Badge, Sec, FL, Card, ErrBox, SuccessBox, FlowBar };
export { Sidebar, TopBar, Layout };
export { PatientBanner, RefNumStrip, EmptyState };
