"use client";
import { useState, useEffect } from "react";

// ── Responsive hook ────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ── Inject global responsive CSS ───────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; overflow-x: hidden; }
      .resp-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
      .resp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .resp-grid-5 { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; }
      .table-wrap  { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .resp-page   { padding: 24px 28px; }
      .resp-bar    { padding: 16px 28px; }
      .resp-profile-grid { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }
      @media (max-width: 767px) {
        .resp-grid-4  { grid-template-columns: 1fr 1fr !important; }
        .resp-grid-5  { grid-template-columns: 1fr 1fr !important; }
        .resp-grid-2  { grid-template-columns: 1fr !important; }
        .resp-page    { padding: 16px 14px !important; }
        .resp-bar     { padding: 14px 16px !important; }
        .resp-profile-grid { grid-template-columns: 1fr !important; }
        .hide-mobile  { display: none !important; }
        .modal-inner  { width: 95vw !important; margin: 0 10px; }
      }
      input, select, textarea { box-sizing: border-box; }
    `}</style>
  );
}

const BRAND    = process.env.NEXT_PUBLIC_BRAND_COLOR    || "#6C63FF";
const ACCENT   = process.env.NEXT_PUBLIC_ACCENT_COLOR   || "#FF7A59";
const BG       = process.env.NEXT_PUBLIC_BG_COLOR       || "#F6F7FB";
const SIDEBAR  = process.env.NEXT_PUBLIC_SIDEBAR_COLOR  || "#FFFFFF";
const CARD     = process.env.NEXT_PUBLIC_CARD_COLOR     || "#FFFFFF";
const INPUT    = process.env.NEXT_PUBLIC_INPUT_COLOR    || "#F1F3FA";
const BORDER   = process.env.NEXT_PUBLIC_BORDER_COLOR   || "#E6E8F2";
const TEXT     = process.env.NEXT_PUBLIC_TEXT_COLOR     || "#1E1F3A";
const MUTED    = process.env.NEXT_PUBLIC_TEXT_MUTED     || "#7C82A0";
const FONT     = process.env.NEXT_PUBLIC_FONT           || "system-ui,-apple-system,sans-serif";
const RADIUS   = process.env.NEXT_PUBLIC_BORDER_RADIUS  || "14px";
const COMPANY  = process.env.NEXT_PUBLIC_COMPANY_NAME   || "UrBench";
const TAGLINE  = process.env.NEXT_PUBLIC_COMPANY_TAGLINE|| "Building Trust, Exceeding Expectations";

const G1 = `linear-gradient(135deg,#6C63FF,#8F88FF,#FF7A59)`;
const GLASS        = `rgba(10,12,30,0.65)`;
const GLASS_BORDER = `rgba(255,255,255,0.07)`;
const GLASS_BLUR   = "blur(20px)";

const SUBMISSION_STATUSES = [
  { value: "pending_review",      label: "Pending Review" },
  { value: "approved_internally", label: "Approved Internally" },
  { value: "rejected_internally", label: "Rejected Internally" },
  { value: "submitted_to_vendor", label: "Submitted to Prime Vendor" },
  { value: "submitted_to_client", label: "Submitted to End Client" },
  { value: "rejected_by_client",  label: "Rejected by Client" },
  { value: "placed",              label: "Placed 🎉" },
  { value: "withdrawn",           label: "Withdrawn" },
];

const ROLES = [
  { value: "RECRUITER",          label: "Recruiter" },
  { value: "RECRUITING_MANAGER", label: "Recruiting Manager" },
  { value: "SALES",              label: "Sales" },
  { value: "SALES_MANAGER",      label: "Sales Manager" },
  { value: "ADMIN",              label: "Admin" },
];

async function api(path: string, method = "GET", body?: any, token?: string) {
  const h: any = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const opts: any = { method, headers: h };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(path, opts);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || e.error || `Error ${r.status}`); }
  return r.json();
}

const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const isToday = (d: string) => { if (!d) return false; const t = new Date(d), n = new Date(); return t.getDate()===n.getDate()&&t.getMonth()===n.getMonth()&&t.getFullYear()===n.getFullYear(); };
const startOfWeek = () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d; };
const startOfMonth = () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; };

const bc = (s: string) => {
  if (!s) return "#5A6080";
  const l = s.toLowerCase();
  if (["active","open","placed","completed","approved"].some(x=>l.includes(x))) return "#10B981";
  if (["pending","submitted","interview","review","vendor","client"].some(x=>l.includes(x))) return "#F59E0B";
  if (["rejected","closed","cancel","withdrawn"].some(x=>l.includes(x))) return "#EF4444";
  return BRAND;
};

// ── Shared Styles ──────────────────────────────────────────────────────────
const S = {
  inp: { width:"100%", padding:"10px 14px", background:`rgba(7,9,26,0.85)`, border:`1px solid ${GLASS_BORDER}`, borderRadius:10, color:TEXT, fontSize:13, outline:"none", fontFamily:FONT, backdropFilter:"blur(8px)", transition:"border-color 0.2s,box-shadow 0.2s" } as React.CSSProperties,
  th: { padding:"11px 16px", textAlign:"left" as const, fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase" as const, letterSpacing:"0.9px", borderBottom:`1px solid ${GLASS_BORDER}`, background:`rgba(6,7,20,0.7)`, backdropFilter:"blur(10px)" },
  td: { padding:"13px 16px", fontSize:13, borderBottom:`1px solid rgba(255,255,255,0.035)`, color:MUTED },
  tdn: { padding:"13px 16px", fontSize:13, borderBottom:`1px solid rgba(255,255,255,0.035)`, color:TEXT, fontWeight:500 },
  btn: { display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", background:G1, border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", boxShadow:`0 4px 20px rgba(0,212,255,0.25)`, transition:"opacity 0.2s,transform 0.15s" } as React.CSSProperties,
  card: { background:GLASS, backdropFilter:GLASS_BLUR, border:`1px solid ${GLASS_BORDER}`, borderRadius:RADIUS, overflow:"hidden" as const, boxShadow:"0 8px 32px rgba(0,0,0,0.45)" },
  page: { padding:"24px 28px" } as React.CSSProperties,
  bar: { borderBottom:`1px solid ${GLASS_BORDER}`, background:`rgba(6,7,26,0.85)`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", justifyContent:"space-between" } as React.CSSProperties,
};

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ children, status }: { children: string; status?: string }) {
  const c = bc(status || children);
  const label = SUBMISSION_STATUSES.find(s => s.value === children)?.label || children;
  return <span style={{ display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:c+"18", color:c, border:`1px solid ${c}30` }}>{label}</span>;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function Stat({ label, value, color, sub }: { label:string; value:string|number; color:string; sub?:string }) {
  return (
    <div style={{ ...S.card, padding:20, position:"relative", background:`linear-gradient(135deg,rgba(10,12,30,0.85),rgba(8,10,24,0.9))` }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:G1, opacity:0.5, borderRadius:`${RADIUS} ${RADIUS} 0 0` }} />
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:color, opacity:0.07, filter:"blur(25px)" }} />
      <div style={{ fontSize:11, color:MUTED, marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.7px" }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px", color }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:MUTED, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, onSave, saving }: any) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, backdropFilter:"blur(6px)", padding:"10px" }}>
      <div className="modal-inner" style={{ background:"rgba(10,12,30,0.97)", backdropFilter:"blur(30px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:18, width:500, maxWidth:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:`0 24px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(0,212,255,0.06)` }}>
        <div style={{ padding:"18px 22px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,212,255,0.02)" }}>
          <div style={{ fontSize:15, fontWeight:700, color:TEXT }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:MUTED, cursor:"pointer", fontSize:14, width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>✕</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
        {onSave && (
          <div style={{ padding:"14px 22px", borderTop:`1px solid ${GLASS_BORDER}`, display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px", background:"rgba(255,255,255,0.05)", border:`1px solid ${GLASS_BORDER}`, borderRadius:10, color:MUTED, fontSize:13, cursor:"pointer", fontFamily:FONT }}>Cancel</button>
            <button type="button" onClick={onSave} disabled={saving} style={{ ...S.btn, opacity:saving?0.6:1 }}>{saving?"Saving...":"Save"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div style={{ marginBottom:16 }}><label style={{ display:"block", fontSize:12, fontWeight:600, color:MUTED, marginBottom:6, letterSpacing:"0.4px" }}>{label}</label>{children}</div>;
}

// ── Live Clock ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const timeStr = time.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  const dateStr = time.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
  return (
    <div style={{ textAlign:"right" }}>
      <div style={{ fontSize:18, fontWeight:700, color:TEXT, fontVariantNumeric:"tabular-nums", letterSpacing:"0.5px" }}>{timeStr}</div>
      <div style={{ fontSize:11, color:MUTED }}>{dateStr}</div>
    </div>
  );
}

// ── Notification Bell ──────────────────────────────────────────────────────
function NotificationBell({ token, notify }: any) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  function load() { api("/api/notifications","GET",null,token).then(d=>{setNotifs(d.data||[]);setUnread(d.unreadCount||0);}).catch(()=>{}); }
  useEffect(() => { load(); const t = setInterval(load,30000); return ()=>clearInterval(t); }, [token]);

  function markAllRead() { api("/api/notifications","POST",null,token).then(()=>{setUnread(0);setNotifs(n=>n.map(x=>({...x,isRead:true})));}).catch(()=>{}); }

  return (
    <div style={{ position:"relative" }}>
      <button type="button" onClick={() => { setOpen(!open); if(!open) load(); }}
        style={{ position:"relative", background:"rgba(255,255,255,0.05)", border:`1px solid ${GLASS_BORDER}`, borderRadius:10, padding:"7px 11px", cursor:"pointer", color:TEXT, fontSize:15, backdropFilter:"blur(8px)", transition:"background 0.2s" }}>
        🔔
        {unread>0 && <span style={{ position:"absolute", top:-5, right:-5, background:"#EF4444", color:"#fff", fontSize:9, fontWeight:800, borderRadius:"50%", width:17, height:17, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${BG}` }}>{unread>9?"9+":unread}</span>}
      </button>
      {open && (
        <div style={{ position:"absolute", top:44, right:0, width:340, background:"rgba(10,12,30,0.97)", backdropFilter:"blur(30px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:14, boxShadow:"0 16px 50px rgba(0,0,0,0.6)", zIndex:200 }}>
          <div style={{ padding:"12px 16px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, fontWeight:700, color:TEXT }}>Notifications {unread>0&&<span style={{ color:BRAND }}>({unread})</span>}</span>
            {unread>0 && <button type="button" onClick={markAllRead} style={{ fontSize:11, color:BRAND, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight:360, overflowY:"auto" }}>
            {notifs.length===0 ? <div style={{ padding:24, textAlign:"center", color:MUTED, fontSize:13 }}>No notifications</div> :
              notifs.map((n:any,i:number)=>(
                <div key={i} style={{ padding:"12px 16px", borderBottom:`1px solid rgba(255,255,255,0.04)`, background:n.isRead?"transparent":"rgba(0,212,255,0.03)" }}>
                  <div style={{ fontSize:12, fontWeight:600, color:n.isRead?MUTED:TEXT, marginBottom:3 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:MUTED }}>{n.message}</div>
                  <div style={{ fontSize:10, color:MUTED, marginTop:4 }}>{fmt(n.createdAt)}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Simple Bar Chart ───────────────────────────────────────────────────────
function SimpleBar({ data, labelKey, valueKey }: { data:any[]; labelKey:string; valueKey:string }) {
  const max = Math.max(...data.map(d=>d[valueKey]||0),1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:140, padding:"10px 0" }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
          <div style={{ fontSize:10, color:MUTED }}>${(d[valueKey]/1000).toFixed(0)}k</div>
          <div style={{ width:"100%", maxWidth:36, height:`${(d[valueKey]/max)*110}px`, background:G1, borderRadius:"4px 4px 0 0", minHeight:4, boxShadow:`0 0 12px rgba(0,212,255,0.3)` }} />
          <div style={{ fontSize:10, color:MUTED }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin:(t:string)=>void }) {
  const [email,setEmail] = useState("");
  const [pw,setPw] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  function submit() {
    if(loading) return;
    setLoading(true); setError("");
    api("/api/auth/login","POST",{email,password:pw})
      .then(d=>onLogin(d.accessToken||d.token))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:BG, fontFamily:FONT, position:"relative", overflow:"hidden" }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", top:"15%", left:"20%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,rgba(0,212,255,0.12),transparent 70%)`, filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"15%", right:"20%", width:350, height:350, borderRadius:"50%", background:`radial-gradient(circle,rgba(180,79,255,0.12),transparent 70%)`, filter:"blur(40px)", pointerEvents:"none" }} />

      <div style={{ width:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ marginBottom:12 }}>
  <img 
    src="/PNG.jpeg"
    alt="Company Logo"
    style={{ 
      height: 70,
      objectFit: "contain",
      display: "block",
      margin: "0 auto"
    }} 
  />
</div>
          <div style={{ height:3, width:60, background:G1, borderRadius:2, margin:"0 auto 10px", boxShadow:"0 0 12px rgba(0,212,255,0.5)" }} />
          <div style={{ fontSize:13, color:MUTED, fontStyle:"italic" }}>{TAGLINE}</div>
        </div>

        <div style={{ background:"rgba(10,12,30,0.8)", backdropFilter:"blur(30px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:20, padding:"38px 34px", boxShadow:`0 24px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(0,212,255,0.06)` }}>
          <div style={{ fontSize:22, fontWeight:800, marginBottom:4, color:TEXT }}>Welcome back</div>
          <div style={{ color:MUTED, fontSize:13, marginBottom:28 }}>Sign in to your ATS dashboard</div>
          <Field label="Email Address">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={S.inp} placeholder="you@company.com" />
          </Field>
          <Field label="Password">
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={S.inp} placeholder="••••••••" />
          </Field>
          {error && <div style={{ color:"#EF4444", fontSize:12, marginBottom:14, padding:"10px 14px", background:"rgba(239,68,68,0.08)", borderRadius:10, border:"1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          <button type="button" onClick={submit} disabled={loading}
            style={{ ...S.btn, width:"100%", justifyContent:"center", padding:"13px", fontSize:14, opacity:loading?0.7:1 }}>
            {loading?"Signing in...":"Sign In →"}
          </button>
        </div>
        <div style={{ textAlign:"center", marginTop:20, fontSize:11, color:MUTED }}>
          Developed with ❤️ in India by <span style={{ color:BRAND, fontWeight:600 }}>Owais</span>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ token, goTo, notify, userName, userRole }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/api/candidates","GET",null,token).catch(()=>({data:[]})),
      api("/api/jobs","GET",null,token).catch(()=>({data:[]})),
      api("/api/clients","GET",null,token).catch(()=>({data:[]})),
      api("/api/submissions","GET",null,token).catch(()=>({data:[]})),
    ]).then(r=>setData({ c:r[0]?.data||[], j:r[1]?.data||[], cl:r[2]?.data||[], s:r[3]?.data||[] }))
      .catch(e=>notify(e.message,"error")).finally(()=>setLoading(false));
  },[token]);

  if(loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh", color:MUTED, fontSize:14 }}>Loading...</div>;

  const now = new Date();
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const subs = data.s;

  // Role-based submission stats
  const isRecruiter = ["RECRUITER","RECRUITING_MANAGER"].includes(userRole);
  const isSales = ["SALES","SALES_MANAGER"].includes(userRole);

  const subsToday   = subs.filter((s:any) => isToday(s.createdAt)).length;
  const subsWeek    = subs.filter((s:any) => new Date(s.createdAt) >= weekStart).length;
  const subsMonth   = subs.filter((s:any) => new Date(s.createdAt) >= monthStart).length;
  const placed      = subs.filter((s:any) => s.status === "placed").length;
  const interviewsToday = subs.filter((s:any) => isToday(s.interviewDate) || s.candidate?.status === "interviewing" && isToday(s.updatedAt)).length;
  const hotJobs     = data.j.filter((j:any) => j.isHot);
  const pendingReview = subs.filter((s:any) => s.status === "pending_review");

  const subLabel = isRecruiter ? "My Submissions" : isSales ? "Received Submissions" : "Total Submissions";

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Dashboard</div>
        <LiveClock />
      </div>
      <div className="resp-page" style={S.page}>
        {/* Welcome + Profile Card */}
        <div className="resp-profile-grid" style={{ marginBottom:24 }}>
          <div style={{ background:`linear-gradient(135deg,rgba(0,212,255,0.07),rgba(180,79,255,0.04))`, backdropFilter:"blur(20px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:16, padding:"22px 26px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-30, right:-30, width:150, height:150, borderRadius:"50%", background:`radial-gradient(circle,rgba(0,212,255,0.15),transparent 70%)`, pointerEvents:"none" }} />
            <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:4 }}>
              Good {now.getHours()<12?"Morning":now.getHours()<17?"Afternoon":"Evening"}, <span style={{ background:G1, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{userName?.split(" ")[0] || "there"}</span> 👋
            </div>
            <div style={{ fontSize:13, color:MUTED }}>{COMPANY} ATS · Your staffing pipeline at a glance</div>
          </div>
          <div style={{ background:"rgba(10,12,30,0.8)", backdropFilter:"blur(20px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:16, padding:"16px 22px", minWidth:180 }}>
            <div style={{ fontSize:13, fontWeight:700, color:TEXT, marginBottom:4 }}>{userName || "User"}</div>
            <div style={{ display:"inline-flex", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${BRAND}18`, color:BRAND, border:`1px solid ${BRAND}30` }}>
              {ROLES.find(r=>r.value===userRole)?.label || userRole}
            </div>
            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:5 }}>
              {[
                { l:"Today", v:subsToday },
                { l:"This Week", v:subsWeek },
                { l:"This Month", v:subsMonth },
              ].map((x,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:11, color:MUTED }}>{subLabel} · {x.l}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:TEXT }}>{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="resp-grid-5" style={{ marginBottom:24 }}>
          <Stat label="Candidates"       value={data.c.length} color={BRAND} />
          <Stat label="Open Jobs"        value={data.j.length} color="#10B981" />
          <Stat label="Clients"          value={data.cl.length} color={ACCENT} />
          <Stat label="Placed 🎉"        value={placed}        color="#10B981" sub="All time" />
          <Stat label="Interviews Today" value={interviewsToday} color="#F59E0B" sub="Scheduled" />
        </div>

        {/* Alerts row */}
        {(hotJobs.length>0 || pendingReview.length>0) && (
          <div className="resp-grid-2" style={{ marginBottom:24 }}>
            {hotJobs.length>0 && (
              <div style={{ ...S.card, padding:16, border:`1px solid rgba(245,158,11,0.2)`, background:"rgba(245,158,11,0.04)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#F59E0B", marginBottom:10 }}>🔥 Hot Jobs ({hotJobs.length})</div>
                {hotJobs.slice(0,3).map((j:any,i:number)=>(
                  <div key={i} style={{ fontSize:12, color:TEXT, padding:"7px 0", borderBottom:`1px solid rgba(255,255,255,0.04)`, display:"flex", justifyContent:"space-between" }}>
                    <span>{j.title}</span><span style={{ color:MUTED }}>{j.client?.name}</span>
                  </div>
                ))}
              </div>
            )}
            {pendingReview.length>0 && (
              <div style={{ ...S.card, padding:16, border:`1px solid rgba(0,212,255,0.15)`, background:"rgba(0,212,255,0.03)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:BRAND, marginBottom:10 }}>⏳ Pending Review ({pendingReview.length})</div>
                {pendingReview.slice(0,3).map((s:any,i:number)=>(
                  <div key={i} style={{ fontSize:12, color:TEXT, padding:"7px 0", borderBottom:`1px solid rgba(255,255,255,0.04)`, display:"flex", justifyContent:"space-between" }}>
                    <span>{s.candidate?.name}</span><span style={{ color:MUTED }}>{s.job?.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recent tables */}
        <div className="resp-grid-2">
          <div style={S.card}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>Recent Candidates</span>
              <button type="button" onClick={()=>goTo("candidates")} style={{ fontSize:12, color:BRAND, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>View all →</button>
            </div>
            {data.c.length===0 ? <div style={{ padding:24, textAlign:"center", color:MUTED, fontSize:13 }}>No candidates yet</div> :
              data.c.slice(0,5).map((x:any,i:number)=>(
                <div key={i} style={{ padding:"11px 18px", borderBottom:`1px solid rgba(255,255,255,0.04)`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:TEXT }}>{x.name||"—"}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{x.candidateId||""}{x.email?` · ${x.email}`:""}</div>
                  </div>
                  <Badge status={x.status}>{x.status||"sourcing"}</Badge>
                </div>
              ))}
          </div>
          <div style={S.card}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>Open Jobs</span>
              <button type="button" onClick={()=>goTo("jobs")} style={{ fontSize:12, color:BRAND, background:"none", border:"none", cursor:"pointer", fontFamily:FONT }}>View all →</button>
            </div>
            {data.j.length===0 ? <div style={{ padding:24, textAlign:"center", color:MUTED, fontSize:13 }}>No jobs yet</div> :
              data.j.slice(0,5).map((x:any,i:number)=>(
                <div key={i} style={{ padding:"11px 18px", borderBottom:`1px solid rgba(255,255,255,0.04)`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, color:TEXT }}>{x.isHot?"🔥 ":""}{x.title||"—"}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{x.jobId||""}{x.client?.name?` · ${x.client.name}`:""}</div>
                  </div>
                  <Badge status={x.status}>{x.status||"Open"}</Badge>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Page (Clients) ────────────────────────────────────────────────────
function DataPage({ title, token, notify, endpoint, columns, addTitle, addFields }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  function load() { setLoading(true); api(endpoint,"GET",null,token).then(d=>setList(d.data||[])).catch(e=>notify(e.message,"error")).finally(()=>setLoading(false)); }
  useEffect(()=>{ load(); },[token]);

  const filtered = list.filter(x=>!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    setSaving(true);
    api(endpoint,"POST",form,token).then(()=>{ notify(`${addTitle} added!`,"success"); setModal(false); setForm({}); load(); }).catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>{title}</div>
        {addFields && <button type="button" onClick={()=>setModal(true)} style={S.btn}>+ {addTitle}</button>}
      </div>
      <div className="resp-page" style={S.page}>
        <div style={S.card}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>All {title} ({list.length})</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width:220 }} />
          </div>
          {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>Loading...</div> :
            filtered.length===0 ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>No {title.toLowerCase()} found</div> :
            <div className="table-wrap"><table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{columns.map((c:any)=><th key={c.key} style={S.th}>{c.label}</th>)}</tr></thead>
              <tbody>{filtered.map((x:any,i:number)=>(
                <tr key={i} style={{ transition:"background 0.15s" }} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  {columns.map((c:any)=><td key={c.key} style={c.isName?S.tdn:S.td}>{c.render?c.render(x):x[c.key]||"—"}</td>)}
                </tr>
              ))}</tbody>
            </table></div>}
        </div>
      </div>
      {modal && addFields && (
        <Modal title={`Add ${addTitle}`} onClose={()=>setModal(false)} onSave={save} saving={saving}>
          {addFields.map((f:any)=>(
            <Field key={f.key} label={f.label}>
              {f.type==="textarea" ? <textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }} value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} /> :
               f.type==="select" ? <select style={S.inp} value={form[f.key]||f.options[0].value} onChange={e=>setForm({...form,[f.key]:e.target.value})}>{f.options.map((o:any)=><option key={o.value} value={o.value}>{o.label}</option>)}</select> :
               <input style={S.inp} type={f.type||"text"} value={form[f.key]||""} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder||""} />}
            </Field>
          ))}
        </Modal>
      )}
    </div>
  );
}

// ── Analytics ──────────────────────────────────────────────────────────────
function Analytics({ token }: any) {
  const [rec, setRec] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.all([
      api("/api/analytics/recruiter","GET",null,token).catch(()=>null),
      api("/api/analytics/revenue-forecast","GET",null,token).catch(()=>null),
    ]).then(r=>{ setRec(r[0]); setFc(r[1]); }).finally(()=>setLoading(false));
  },[token]);

  const cd = fc?.months||[{month:"Mar",revenue:12000},{month:"Apr",revenue:18000},{month:"May",revenue:24000},{month:"Jun",revenue:30000}];

  return (
    <div>
      <div className="resp-bar" style={S.bar}><div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Analytics</div></div>
      <div className="resp-page" style={S.page}>
        {loading ? <div style={{ padding:60, textAlign:"center", color:MUTED }}>Loading...</div> : <>
          <div className="resp-grid-4" style={{ marginBottom:24 }}>
            <Stat label="Total Placements" value={rec?.totalPlacements||0} color="#10B981" />
            <Stat label="Active Submissions" value={rec?.activeSubmissions||0} color={BRAND} />
            <Stat label="Fill Rate" value={`${rec?.fillRate||0}%`} color={ACCENT} />
            <Stat label="Revenue" value={`$${Math.floor((rec?.revenue||0)/1000)}k`} color="#F59E0B" />
          </div>
          <div className="resp-grid-2">
            <div style={{ ...S.card, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:TEXT }}>Revenue Forecast</div>
              <SimpleBar data={cd} labelKey="month" valueKey="revenue" />
            </div>
            <div style={{ ...S.card, padding:20 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:16, color:TEXT }}>Recruiter Metrics</div>
              {[{l:"Avg Time to Fill",v:`${rec?.avgTimeToFill||14} days`,c:BRAND},{l:"Sub → Interview",v:`${rec?.subToInterview||45}%`,c:"#7B2FFF"},{l:"Interview → Offer",v:`${rec?.interviewToOffer||62}%`,c:ACCENT},{l:"Offer Acceptance",v:`${rec?.offerAcceptance||88}%`,c:"#10B981"}].map((m,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:`1px solid ${GLASS_BORDER}`, marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:2, background:m.c, boxShadow:`0 0 8px ${m.c}` }} /><span style={{ fontSize:13, color:MUTED }}>{m.l}</span></div>
                  <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

// ── AI Tools ───────────────────────────────────────────────────────────────
function AITools({ token, notify }: any) {
  const [tab, setTab] = useState("resume");
  const [txt, setTxt] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState("");
  const [jid, setJid] = useState("");
  const [file, setFile] = useState<File|null>(null);
  const [inputMode, setInputMode] = useState<"text"|"file">("text");

  async function run() {
    setLoading(true); setRes(null);
    try {
      const ep = tab==="resume"?"/api/ai/parse-resume":tab==="jd"?"/api/ai/parse-jd":"/api/ai/match";
      if(tab==="match") {
        const d = await api(ep,"POST",{candidateId:cid,jobId:jid},token);
        setRes(d); notify("AI analysis complete!","success"); return;
      }
      let content = txt;
      if(inputMode==="file"&&file) {
        if(file.name.endsWith(".pdf")) {
          const base64 = await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve((r.result as string).split(",")[1]); r.onerror=reject; r.readAsDataURL(file); });
          const d = await api(ep,"POST",{base64Pdf:base64,fileName:file.name},token);
          setRes(d); notify("AI analysis complete!","success"); return;
        } else {
          content = await new Promise<string>((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result as string); r.onerror=reject; r.readAsText(file); });
        }
      }
      if(!content.trim()) { notify("Please paste text or upload a file","error"); return; }
      const d = await api(ep,"POST",{text:content,resumeText:content,description:content},token);
      setRes(d); notify("AI analysis complete!","success");
    } catch(e:any) { notify(e.message,"error"); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="resp-bar" style={S.bar}><div style={{ fontSize:18, fontWeight:700, color:TEXT }}>AI Tools</div></div>
      <div className="resp-page" style={S.page}>
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {[{id:"resume",l:"Parse Resume"},{id:"jd",l:"Parse JD"},{id:"match",l:"AI Match"}].map(t=>(
            <button key={t.id} type="button" onClick={()=>{ setTab(t.id); setRes(null); setTxt(""); setFile(null); }}
              style={{ padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:tab===t.id?700:400, cursor:"pointer", border:tab===t.id?"none":`1px solid ${GLASS_BORDER}`, background:tab===t.id?G1:"rgba(255,255,255,0.04)", color:tab===t.id?"#fff":MUTED, boxShadow:tab===t.id?"0 4px 16px rgba(0,212,255,0.2)":"none", fontFamily:FONT }}>{t.l}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ ...S.card, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:TEXT }}>{tab==="resume"?"Resume Input":tab==="jd"?"Job Description Input":"Match Candidate to Job"}</div>
            {tab==="match" ? (
              <>
                <Field label="Candidate ID (CAN-0001 or internal ID)"><input style={S.inp} value={cid} onChange={e=>setCid(e.target.value)} placeholder="e.g. CAN-0001" /></Field>
                <Field label="Job ID (JOB-0001 or internal ID)"><input style={S.inp} value={jid} onChange={e=>setJid(e.target.value)} placeholder="e.g. JOB-0001" /></Field>
                <div style={{ fontSize:11, color:MUTED, padding:"8px 12px", background:"rgba(0,212,255,0.05)", borderRadius:8, border:`1px solid rgba(0,212,255,0.1)` }}>💡 Use the readable ID (CAN-0001) from the Candidates or Jobs page</div>
              </>
            ) : (
              <>
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {[{id:"text",l:"✏️ Paste Text"},{id:"file",l:"📎 Upload File"}].map(m=>(
                    <button key={m.id} type="button" onClick={()=>setInputMode(m.id as any)}
                      style={{ padding:"6px 14px", borderRadius:8, fontSize:12, cursor:"pointer", border:`1px solid ${GLASS_BORDER}`, background:inputMode===m.id?BRAND:"transparent", color:inputMode===m.id?"#fff":MUTED, fontFamily:FONT }}>{m.l}</button>
                  ))}
                </div>
                {inputMode==="text" ? <textarea value={txt} onChange={e=>setTxt(e.target.value)} placeholder="Paste resume or JD text here..." style={{ ...S.inp, minHeight:200, resize:"vertical" }} /> : (
                  <div style={{ border:`2px dashed rgba(255,255,255,0.08)`, borderRadius:12, padding:28, textAlign:"center", background:"rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize:36, marginBottom:10 }}>📄</div>
                    <div style={{ fontSize:13, color:MUTED, marginBottom:14 }}>Upload PDF or Word document</div>
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={e=>setFile(e.target.files?.[0]||null)} style={{ display:"none" }} id="fileInput" />
                    <label htmlFor="fileInput" style={{ ...S.btn, cursor:"pointer" }}>Choose File</label>
                    {file && <div style={{ marginTop:12, fontSize:12, color:BRAND, fontWeight:600 }}>✅ {file.name}</div>}
                  </div>
                )}
              </>
            )}
            <button type="button" onClick={run} disabled={loading} style={{ ...S.btn, marginTop:14, opacity:loading?0.6:1 }}>{loading?"Analyzing...":"⚡ Run AI Analysis"}</button>
          </div>
          <div style={{ ...S.card, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:14, color:TEXT }}>Results</div>
            {!res ? <div style={{ textAlign:"center", padding:"60px 20px", color:MUTED }}>🤖<br /><span style={{ fontSize:13 }}>Run an analysis to see results</span></div> : (
              <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:400, overflowY:"auto" }}>
                {res?.data&&Object.entries(res.data).map(([key,value]:any)=>(
                  <div key={key} style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${GLASS_BORDER}`, borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:MUTED, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:5 }}>{key.replace(/([A-Z])/g," $1").trim()}</div>
                    <div style={{ fontSize:13, color:TEXT }}>
                      {Array.isArray(value) ? (value.length>0 ? <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>{value.map((v:string,i:number)=><span key={i} style={{ background:GLASS_BORDER, padding:"2px 8px", borderRadius:10, fontSize:11 }}>{v}</span>)}</div> : <span style={{ color:MUTED }}>None</span>) :
                       typeof value==="number" ? <span style={{ color:BRAND, fontWeight:700, fontSize:20 }}>{value}</span> : String(value)||"—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Candidates Page ────────────────────────────────────────────────────────
function CandidatesPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [editId, setEditId] = useState<string|null>(null);

  function load() { setLoading(true); api("/api/candidates","GET",null,token).then(d=>setList(d.data||[])).catch(e=>notify(e.message,"error")).finally(()=>setLoading(false)); }
  useEffect(()=>{ load(); },[token]);

  const filtered = list.filter(x=>!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    if(!form.name) { notify("Name is required","error"); return; }
    setSaving(true);
    api(editId?`/api/candidates/${editId}`:"/api/candidates", editId?"PATCH":"POST", form, token)
      .then(()=>{ notify(editId?"Candidate updated!":"Candidate added!","success"); setModal(false); setForm({}); setEditId(null); load(); })
      .catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  function del(id:string,name:string) {
    if(!confirm(`Delete ${name}?`)) return;
    api(`/api/candidates/${id}`,"DELETE",null,token).then(()=>{ notify(`${name} deleted`,"success"); load(); }).catch(e=>notify(e.message,"error"));
  }

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Candidates</div>
        <button type="button" onClick={()=>{ setForm({}); setEditId(null); setModal(true); }} style={S.btn}>+ Add Candidate</button>
      </div>
      <div className="resp-page" style={S.page}>
        <div style={S.card}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>All Candidates ({list.length})</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width:220 }} />
          </div>
          {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>Loading...</div> :
           filtered.length===0 ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>No candidates found</div> : (
            <div className="table-wrap"><table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={S.th}>CAN ID</th><th style={S.th}>Name</th><th style={S.th}>Email</th>
                <th style={S.th}>Location</th><th style={S.th}>Visa</th><th style={S.th}>Rate</th>
                <th style={S.th}>Status</th><th style={S.th}>Actions</th>
              </tr></thead>
              <tbody>{filtered.map((x:any,i:number)=>(
                <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} style={{ transition:"background 0.15s" }}>
                  <td style={S.td}>
                    <span onClick={()=>{ navigator.clipboard.writeText(x.id); notify("ID copied!","success"); }}
                      style={{ fontFamily:"monospace", fontSize:11, background:"rgba(0,212,255,0.08)", padding:"3px 8px", borderRadius:6, color:BRAND, cursor:"pointer", border:`1px solid rgba(0,212,255,0.2)`, whiteSpace:"nowrap" }}>
                      {x.candidateId||x.id?.slice(0,8)}
                    </span>
                  </td>
                  <td style={S.tdn}>{x.name}</td>
                  <td style={S.td}>{x.email||"—"}</td>
                  <td style={S.td}>{x.location||"—"}</td>
                  <td style={S.td}>{x.visaStatus||"—"}</td>
                  <td style={S.td}>{x.rateExpectation||"—"}</td>
                  <td style={S.td}><Badge status={x.status}>{x.status||"sourcing"}</Badge></td>
                  <td style={S.td}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button type="button" onClick={()=>{ setForm({name:x.name,email:x.email||"",phone:x.phone||"",location:x.location||"",visaStatus:x.visaStatus||"",rateExpectation:x.rateExpectation||"",availability:x.availability||"",employmentType:x.employmentType||"CONTRACT",status:x.status||"sourcing"}); setEditId(x.id); setModal(true); }}
                        style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:`1px solid ${GLASS_BORDER}`, background:"rgba(0,212,255,0.08)", color:BRAND, cursor:"pointer", fontFamily:FONT }}>✏️ Edit</button>
                      <button type="button" onClick={()=>del(x.id,x.name)}
                        style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.06)", color:"#EF4444", cursor:"pointer", fontFamily:FONT }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {modal && (
        <Modal title={editId?"Edit Candidate":"Add Candidate"} onClose={()=>{ setModal(false); setForm({}); setEditId(null); }} onSave={save} saving={saving}>
          <Field label="Full Name *"><input style={S.inp} value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. John Smith" /></Field>
          <Field label="Email"><input style={S.inp} type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} /></Field>
          <Field label="Phone"><input style={S.inp} value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} /></Field>
          <Field label="Location"><input style={S.inp} value={form.location||""} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Dallas, TX" /></Field>
          <Field label="Visa Status"><input style={S.inp} value={form.visaStatus||""} onChange={e=>setForm({...form,visaStatus:e.target.value})} placeholder="e.g. H1B, GC, USC" /></Field>
          <Field label="Rate Expectation"><input style={S.inp} value={form.rateExpectation||""} onChange={e=>setForm({...form,rateExpectation:e.target.value})} placeholder="e.g. $85/hr" /></Field>
          <Field label="Availability"><input style={S.inp} value={form.availability||""} onChange={e=>setForm({...form,availability:e.target.value})} placeholder="e.g. Immediate" /></Field>
          <Field label="Employment Type">
            <select style={S.inp} value={form.employmentType||"CONTRACT"} onChange={e=>setForm({...form,employmentType:e.target.value})}>
              <option value="CONTRACT">Contract</option><option value="FULL_TIME">Full Time</option><option value="CONTRACT_TO_HIRE">Contract to Hire</option>
            </select>
          </Field>
          <Field label="Status">
            <select style={S.inp} value={form.status||"sourcing"} onChange={e=>setForm({...form,status:e.target.value})}>
              <option value="sourcing">Sourcing</option><option value="screening">Screening</option><option value="submitted">Submitted</option>
              <option value="interviewing">Interviewing</option><option value="offered">Offered</option><option value="placed">Placed</option><option value="rejected">Rejected</option>
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ── Jobs Page ──────────────────────────────────────────────────────────────
function JobsPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ type:"Contract" });
  const [editId, setEditId] = useState<string|null>(null);

  function load() {
    setLoading(true);
    Promise.all([api("/api/jobs","GET",null,token),api("/api/clients","GET",null,token)])
      .then(([j,c])=>{ setList(j.data||[]); setClients(c.data||[]); }).catch(e=>notify(e.message,"error")).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[token]);
  const filtered = list.filter(x=>!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    if(!form.clientId) { notify("Please select a client","error"); return; }
    if(!form.title) { notify("Job title is required","error"); return; }
    setSaving(true);
    const body = { clientId:form.clientId,title:form.title,description:form.description||"",location:form.location||"",type:form.type||"Contract",rate:form.rate||"",rateNumeric:form.rateNumeric?Number(form.rateNumeric):undefined,currency:form.currency||"USD",paymentType:form.paymentType||"Hourly",remote:form.remote||"",duration:form.duration||"",isHot:form.isHot||false };
    api(editId?`/api/jobs/${editId}`:"/api/jobs",editId?"PATCH":"POST",body,token)
      .then(()=>{ notify(editId?"Job updated!":"Job added!","success"); setModal(false); setForm({type:"Contract"}); setEditId(null); load(); })
      .catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Jobs</div>
        <button type="button" onClick={()=>{ setForm({type:"Contract"}); setEditId(null); setModal(true); }} style={S.btn}>+ Add Job</button>
      </div>
      <div className="resp-page" style={S.page}>
        <div style={S.card}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>All Jobs ({list.length})</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width:220 }} />
          </div>
          {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>Loading...</div> :
           filtered.length===0 ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>No jobs found</div> : (
            <div className="table-wrap"><table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={S.th}>JOB ID</th><th style={S.th}>Title</th><th style={S.th}>Client</th>
                <th style={S.th}>Location</th><th style={S.th}>Type</th><th style={S.th}>Rate</th>
                <th style={S.th}>Status</th><th style={S.th}>Actions</th>
              </tr></thead>
              <tbody>{filtered.map((x:any,i:number)=>(
                <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} style={{ transition:"background 0.15s" }}>
                  <td style={S.td}>
                    <span onClick={()=>{ navigator.clipboard.writeText(x.id); notify("ID copied!","success"); }}
                      style={{ fontFamily:"monospace", fontSize:11, background:"rgba(0,212,255,0.08)", padding:"3px 8px", borderRadius:6, color:BRAND, cursor:"pointer", border:`1px solid rgba(0,212,255,0.2)` }}>
                      {x.jobId||x.id?.slice(0,8)}
                    </span>
                  </td>
                  <td style={S.tdn}>{x.isHot?"🔥 ":""}{x.title}</td>
                  <td style={S.td}>{x.client?.name||"—"}</td>
                  <td style={S.td}>{x.location||"—"}</td>
                  <td style={S.td}><Badge>{x.type||"Contract"}</Badge></td>
                  <td style={S.td}>{x.rateNumeric?`${x.currency||"USD"} ${x.rateNumeric}/${x.paymentType||"hr"}`:x.rate||"—"}</td>
                  <td style={S.td}><Badge status={x.status}>{x.status||"Open"}</Badge></td>
                  <td style={S.td}>
                    <button type="button" onClick={()=>{ setForm({clientId:x.client?.id||x.clientId,title:x.title,description:x.description||"",location:x.location||"",type:x.type||"Contract",rateNumeric:x.rateNumeric||"",currency:x.currency||"USD",paymentType:x.paymentType||"Hourly",duration:x.duration||"",remote:x.remote||"",isHot:x.isHot||false}); setEditId(x.id); setModal(true); }}
                      style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:`1px solid ${GLASS_BORDER}`, background:"rgba(0,212,255,0.08)", color:BRAND, cursor:"pointer", fontFamily:FONT }}>✏️ Edit</button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {modal && (
        <Modal title={editId?"Edit Job":"Add New Job"} onClose={()=>{ setModal(false); setEditId(null); setForm({type:"Contract"}); }} onSave={save} saving={saving}>
          <Field label="Client *">
            <select style={S.inp} value={form.clientId||""} onChange={e=>setForm({...form,clientId:e.target.value})}>
              <option value="">— Select Client —</option>
              {clients.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Job Title *"><input style={S.inp} value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. SAP FICO Consultant" /></Field>
          <Field label="Description"><textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} /></Field>
          <Field label="Location"><input style={S.inp} value={form.location||""} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Dallas, TX" /></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Type">
              <select style={S.inp} value={form.type||"Contract"} onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="Contract">Contract</option><option value="Permanent">Permanent</option><option value="ContractToHire">Contract to Hire</option>
              </select>
            </Field>
            <Field label="Duration"><input style={S.inp} value={form.duration||""} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="e.g. 6 months" /></Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
            <Field label="Rate"><input style={S.inp} type="number" value={form.rateNumeric||""} onChange={e=>setForm({...form,rateNumeric:e.target.value})} placeholder="85" /></Field>
            <Field label="Currency">
              <select style={S.inp} value={form.currency||"USD"} onChange={e=>setForm({...form,currency:e.target.value})}>
                <option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="INR">INR</option><option value="CAD">CAD</option><option value="AUD">AUD</option>
              </select>
            </Field>
            <Field label="Payment">
              <select style={S.inp} value={form.paymentType||"Hourly"} onChange={e=>setForm({...form,paymentType:e.target.value})}>
                <option value="Hourly">Hourly</option><option value="Daily">Daily</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <Field label="Remote">
            <select style={S.inp} value={form.remote||""} onChange={e=>setForm({...form,remote:e.target.value})}>
              <option value="">— Select —</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="Onsite">Onsite</option>
            </select>
          </Field>
          <Field label="🔥 Hot Job">
            <select style={S.inp} value={form.isHot?"true":"false"} onChange={e=>setForm({...form,isHot:e.target.value==="true"})}>
              <option value="false">No</option><option value="true">Yes — Flag as Hot Job</option>
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ── Submissions Page ───────────────────────────────────────────────────────
function SubmissionsPage({ token, notify, userRole }: any) {
  const [list, setList] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<any>({});
  const [statusForm, setStatusForm] = useState<any>({});

  const canChangeStatus = ["ADMIN","RECRUITING_MANAGER","SALES_MANAGER","SALES"].includes(userRole);
  const canApprove = ["ADMIN","RECRUITING_MANAGER"].includes(userRole);
  const canSubmitToClient = ["ADMIN","SALES_MANAGER","SALES"].includes(userRole);

  function load() {
    setLoading(true);
    Promise.all([api("/api/submissions","GET",null,token),api("/api/candidates","GET",null,token),api("/api/jobs","GET",null,token)])
      .then(([s,c,j])=>{ setList(s.data||[]); setCandidates(c.data||[]); setJobs(j.data||[]); })
      .catch(e=>notify(e.message,"error")).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[token]);

  const filtered = list.filter(x=>!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    if(!form.candidateId) { notify("Please select a candidate","error"); return; }
    if(!form.jobId) { notify("Please select a job","error"); return; }
    setSaving(true);
    api("/api/submissions","POST",{candidateId:form.candidateId,jobId:form.jobId,notes:form.notes,interviewDate:form.interviewDate},token)
      .then(()=>{ notify("Submission added! Pending manager review.","success"); setModal(false); setForm({}); load(); })
      .catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  function updateStatus() {
    if(!statusForm.status) { notify("Please select a status","error"); return; }
    setSaving(true);
    api(`/api/submissions/${statusModal.id}`,"PATCH",statusForm,token)
      .then(()=>{ notify("Status updated!","success"); setStatusModal(null); setStatusForm({}); load(); })
      .catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  const availableStatuses = SUBMISSION_STATUSES.filter(s=>{
    if(userRole==="ADMIN") return true;
    if(userRole==="RECRUITING_MANAGER") return ["pending_review","approved_internally","rejected_internally"].includes(s.value);
    if(["SALES","SALES_MANAGER"].includes(userRole)) return ["submitted_to_vendor","submitted_to_client","rejected_by_client","placed","withdrawn"].includes(s.value);
    return false;
  });

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Submissions</div>
        <button type="button" onClick={()=>setModal(true)} style={S.btn}>+ Add Submission</button>
      </div>
      <div className="resp-page" style={S.page}>
        <div style={S.card}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>All Submissions ({list.length})</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width:220 }} />
          </div>
          {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>Loading...</div> :
           filtered.length===0 ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>No submissions yet</div> : (
            <div className="table-wrap"><table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={S.th}>SUB ID</th><th style={S.th}>Candidate</th><th style={S.th}>Job</th>
                <th style={S.th}>Client</th><th style={S.th}>Status</th><th style={S.th}>Interview</th>
                <th style={S.th}>Submitted</th>{canChangeStatus&&<th style={S.th}>Actions</th>}
              </tr></thead>
              <tbody>{filtered.map((x:any,i:number)=>(
                <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} style={{ transition:"background 0.15s" }}>
                  <td style={S.td}><span style={{ fontFamily:"monospace", fontSize:11, background:"rgba(0,212,255,0.08)", padding:"3px 8px", borderRadius:6, color:BRAND, border:`1px solid rgba(0,212,255,0.2)` }}>{x.submissionId||x.id?.slice(0,8)}</span></td>
                  <td style={S.tdn}>{x.candidate?.name||"—"}</td>
                  <td style={S.td}>{x.job?.title||"—"}</td>
                  <td style={S.td}>{x.job?.client?.name||"—"}</td>
                  <td style={S.td}><Badge status={x.status}>{x.status||"pending_review"}</Badge></td>
                  <td style={S.td}>{x.interviewDate ? <span style={{ color:isToday(x.interviewDate)?"#F59E0B":MUTED }}>{isToday(x.interviewDate)?"📅 Today":fmt(x.interviewDate)}</span> : "—"}</td>
                  <td style={S.td}>{fmt(x.submissionDate||x.createdAt)}</td>
                  {canChangeStatus&&<td style={S.td}><button type="button" onClick={()=>{ setStatusModal(x); setStatusForm({status:x.status,internalNotes:x.internalNotes||""}); }} style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:`1px solid ${GLASS_BORDER}`, background:"rgba(0,212,255,0.08)", color:BRAND, cursor:"pointer", fontFamily:FONT }}>✏️ Update</button></td>}
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>

      {modal && (
        <Modal title="Add Submission" onClose={()=>setModal(false)} onSave={save} saving={saving}>
          <div style={{ fontSize:12, color:MUTED, marginBottom:16, padding:"10px 14px", background:"rgba(0,212,255,0.05)", borderRadius:10, border:`1px solid rgba(0,212,255,0.12)` }}>
            ℹ️ Submission will be sent for manager review automatically.
          </div>
          <Field label="Candidate *">
            <select style={S.inp} value={form.candidateId||""} onChange={e=>setForm({...form,candidateId:e.target.value})}>
              <option value="">— Select Candidate —</option>
              {candidates.map((c:any)=><option key={c.id} value={c.id}>{c.name}{c.candidateId?` (${c.candidateId})`:""}</option>)}
            </select>
          </Field>
          <Field label="Job *">
            <select style={S.inp} value={form.jobId||""} onChange={e=>setForm({...form,jobId:e.target.value})}>
              <option value="">— Select Job —</option>
              {jobs.map((j:any)=><option key={j.id} value={j.id}>{j.title}{j.jobId?` (${j.jobId})`:""} — {j.client?.name||"No client"}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea style={{ ...S.inp, minHeight:80, resize:"vertical" }} value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any notes..." /></Field>
          <Field label="Interview Date"><input style={S.inp} type="date" value={form.interviewDate||""} onChange={e=>setForm({...form,interviewDate:e.target.value})} /></Field>
        </Modal>
      )}

      {statusModal && (
        <Modal title={`Update — ${statusModal.candidate?.name}`} onClose={()=>{ setStatusModal(null); setStatusForm({}); }} onSave={updateStatus} saving={saving}>
          <div style={{ fontSize:12, color:MUTED, marginBottom:16 }}>Current: <Badge status={statusModal.status}>{statusModal.status}</Badge></div>
          <Field label="New Status">
            <select style={S.inp} value={statusForm.status||""} onChange={e=>setStatusForm({...statusForm,status:e.target.value})}>
              <option value="">— Select Status —</option>
              {availableStatuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          {canApprove&&<Field label="Internal Notes"><textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }} value={statusForm.internalNotes||""} onChange={e=>setStatusForm({...statusForm,internalNotes:e.target.value})} placeholder="Internal notes..." /></Field>}
          {canSubmitToClient&&<Field label="Client Feedback"><textarea style={{ ...S.inp, minHeight:60, resize:"vertical" }} value={statusForm.clientFeedback||""} onChange={e=>setStatusForm({...statusForm,clientFeedback:e.target.value})} placeholder="Client feedback..." /></Field>}
          <Field label="Interview Date"><input style={S.inp} type="date" value={statusForm.interviewDate||""} onChange={e=>setStatusForm({...statusForm,interviewDate:e.target.value})} /></Field>
        </Modal>
      )}
    </div>
  );
}

// ── Users Page ─────────────────────────────────────────────────────────────
function UsersPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [resetModal, setResetModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState<any>({});

  function load() { setLoading(true); api("/api/users","GET",null,token).then(d=>setList(d.data||[])).catch(e=>notify(e.message,"error")).finally(()=>setLoading(false)); }
  useEffect(()=>{ load(); },[token]);

  const filtered = list.filter(x=>!search||JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function addUser() {
    setSaving(true);
    api("/api/users","POST",form,token).then(()=>{ notify("User added!","success"); setAddModal(false); setForm({}); load(); }).catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  function deleteUser(id:string,name:string) {
    if(!confirm(`Deactivate ${name}?`)) return;
    api(`/api/users/${id}`,"DELETE",null,token).then(()=>{ notify(`${name} deactivated`,"success"); load(); }).catch(e=>notify(e.message,"error"));
  }

  function resetPassword() {
    if(!newPw||newPw.length<8) { notify("Min 8 characters","error"); return; }
    setSaving(true);
    api(`/api/users/${resetModal.id}`,"PATCH",{password:newPw},token).then(()=>{ notify(`Password reset for ${resetModal.name}`,"success"); setResetModal(null); setNewPw(""); }).catch(e=>notify(e.message,"error")).finally(()=>setSaving(false));
  }

  return (
    <div>
      <div className="resp-bar" style={S.bar}>
        <div style={{ fontSize:18, fontWeight:700, color:TEXT }}>Manage Users</div>
        <button type="button" onClick={()=>setAddModal(true)} style={S.btn}>+ Add User</button>
      </div>
      <div className="resp-page" style={S.page}>
        <div style={S.card}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${GLASS_BORDER}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:700, color:TEXT }}>All Users ({list.length})</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width:220 }} />
          </div>
          {loading ? <div style={{ padding:40, textAlign:"center", color:MUTED }}>Loading...</div> : (
            <div className="table-wrap"><table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Role</th><th style={S.th}>Status</th><th style={S.th}>Added</th><th style={S.th}>Actions</th></tr></thead>
              <tbody>{filtered.map((x:any,i:number)=>(
                <tr key={i} onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.02)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")} style={{ transition:"background 0.15s" }}>
                  <td style={S.tdn}>{x.name}</td>
                  <td style={S.td}>{x.email}</td>
                  <td style={S.td}><Badge>{ROLES.find(r=>r.value===x.role)?.label||x.role}</Badge></td>
                  <td style={S.td}><Badge status={x.isActive?"active":"rejected"}>{x.isActive?"Active":"Inactive"}</Badge></td>
                  <td style={S.td}>{fmt(x.createdAt)}</td>
                  <td style={S.td}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button type="button" onClick={()=>{ setResetModal(x); setNewPw(""); }} style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:`1px solid ${GLASS_BORDER}`, background:"rgba(0,212,255,0.08)", color:BRAND, cursor:"pointer", fontFamily:FONT }}>🔑 Reset PW</button>
                      {x.isActive&&<button type="button" onClick={()=>deleteUser(x.id,x.name)} style={{ padding:"4px 10px", fontSize:11, borderRadius:6, border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.06)", color:"#EF4444", cursor:"pointer", fontFamily:FONT }}>🗑 Deactivate</button>}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>
      {addModal && (
        <Modal title="Add New User" onClose={()=>setAddModal(false)} onSave={addUser} saving={saving}>
          <Field label="Full Name"><input style={S.inp} value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. John Smith" /></Field>
          <Field label="Email"><input style={S.inp} type="email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="john@company.com" /></Field>
          <Field label="Password"><input style={S.inp} type="password" value={form.password||""} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 8 characters" /></Field>
          <Field label="Role">
            <select style={S.inp} value={form.role||"RECRUITER"} onChange={e=>setForm({...form,role:e.target.value})}>
              {ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
        </Modal>
      )}
      {resetModal && (
        <Modal title={`Reset Password — ${resetModal.name}`} onClose={()=>setResetModal(null)} onSave={resetPassword} saving={saving}>
          <div style={{ fontSize:13, color:MUTED, marginBottom:16 }}>New password for <strong style={{ color:TEXT }}>{resetModal.name}</strong></div>
          <Field label="New Password"><input style={S.inp} type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 8 characters" /></Field>
        </Modal>
      )}
    </div>
  );
}

// ── Root Page ──────────────────────────────────────────────────────────────
export default function Page() {
  const [token, setToken] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState({ msg:"", type:"info", show:false });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  function notify(msg:string, type="info") {
    setToast({ msg, type, show:true });
    setTimeout(()=>setToast(t=>({...t,show:false})),3500);
  }

  function handleLogin(t:string) {
    setToken(t);
    try { const p = JSON.parse(atob(t.split(".")[1])); setUserRole(p.role||""); setUserName(p.name||p.email||""); } catch {}
    notify("Logged in successfully!","success");
  }

  function goToPage(id:string) {
    setPage(id);
    if(isMobile) setSidebarOpen(false);
  }

  if(!token) return <><GlobalStyles /><LoginPage onLogin={handleLogin} /></>;

  const allNavItems = [
    { id:"dashboard",   label:"📊 Dashboard",      roles:["ADMIN","RECRUITER","RECRUITING_MANAGER","SALES","SALES_MANAGER"] },
    { id:"candidates",  label:"👥 Candidates",      roles:["ADMIN","RECRUITER","RECRUITING_MANAGER"] },
    { id:"jobs",        label:"💼 Jobs",            roles:["ADMIN","RECRUITER","RECRUITING_MANAGER","SALES","SALES_MANAGER"] },
    { id:"clients",     label:"🏢 Clients",         roles:["ADMIN","SALES","SALES_MANAGER"] },
    { id:"submissions", label:"📨 Submissions",     roles:["ADMIN","RECRUITER","RECRUITING_MANAGER","SALES","SALES_MANAGER"] },
    { id:"analytics",   label:"📈 Analytics",       roles:["ADMIN","RECRUITING_MANAGER","SALES_MANAGER"] },
    { id:"ai",          label:"🤖 AI Tools",        roles:["ADMIN","RECRUITER","RECRUITING_MANAGER"] },
    { id:"users",       label:"👤 Manage Users",    roles:["ADMIN"] },
  ];
  const navItems = allNavItems.filter(n=>n.roles.includes(userRole));

  return (
    <>
    <GlobalStyles />
    <div style={{ display:"flex", minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT }}>
      <div style={{ position:"fixed", top:"10%", left:"15%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,rgba(0,212,255,0.06),transparent 70%)`, filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"10%", right:"10%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,rgba(180,79,255,0.07),transparent 70%)`, filter:"blur(60px)", pointerEvents:"none", zIndex:0 }} />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:49, backdropFilter:"blur(2px)" }} />
      )}

      {/* Sidebar */}
      <div style={{ width:230, background:`rgba(6,7,26,0.97)`, backdropFilter:"blur(20px)", borderRight:`1px solid ${GLASS_BORDER}`, display:"flex", flexDirection:"column", flexShrink:0, position:"fixed", top:0, left:0, bottom:0, zIndex:50, overflowY:"auto", transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)", transform:isMobile&&!sidebarOpen?"translateX(-100%)":"translateX(0)" }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:`1px solid ${GLASS_BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img 
  src="/PNG.png"
  alt="Company Logo"
  style={{ 
    width: 45,
    height: 45,
    objectFit: "contain",
    borderRadius: 8
  }} 
/>
            <div>
              <div style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px" }}>
                <span style={{ color:TEXT }}>{COMPANY.slice(0,2)}</span>
                <span style={{ background:G1, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{COMPANY.slice(2)}</span>
              </div>
              <div style={{ fontSize:9, fontWeight:700, color:BRAND, background:"rgba(0,212,255,0.1)", padding:"1px 7px", borderRadius:10, display:"inline-block", letterSpacing:"1px", textTransform:"uppercase", marginTop:2 }}>ATS Platform</div>
            </div>
          </div>
        </div>
        <div style={{ flex:1, padding:"16px 10px", display:"flex", flexDirection:"column", gap:2 }}>
          {navItems.map(n=>{ const active=page===n.id; return (
            <button key={n.id} type="button" onClick={()=>goToPage(n.id)} style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 12px", borderRadius:10, color:active?BRAND:MUTED, fontSize:13, fontWeight:active?600:400, cursor:"pointer", border:"none", background:active?"rgba(0,212,255,0.1)":"transparent", width:"100%", textAlign:"left", fontFamily:FONT, transition:"all 0.15s", boxShadow:active?`inset 0 0 0 1px rgba(0,212,255,0.15)`:"none" }}>{n.label}</button>
          );})}
        </div>
        <div style={{ padding:"12px 10px", borderTop:`1px solid ${GLASS_BORDER}` }}>
          <button type="button" onClick={()=>{ setToken(""); setUserRole(""); setUserName(""); }} style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 12px", borderRadius:10, color:MUTED, fontSize:13, cursor:"pointer", border:"none", background:"transparent", width:"100%", textAlign:"left", fontFamily:FONT }}>↩ Sign Out</button>
          <div style={{ padding:"6px 12px 2px", fontSize:10, color:MUTED, lineHeight:1.6 }}>Developed with ❤️ in India<br />by <span style={{ color:BRAND, fontWeight:600 }}>Owais</span></div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft:isMobile?0:230, flex:1, minHeight:"100vh", position:"relative", zIndex:1, maxWidth:isMobile?"100%":"calc(100% - 230px)" }}>
        {/* Top bar */}
        <div style={{ position:"sticky", top:0, zIndex:40, background:"rgba(6,7,26,0.92)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${GLASS_BORDER}`, padding:isMobile?"10px 14px":"10px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {isMobile && <button type="button" onClick={()=>setSidebarOpen(!sidebarOpen)} style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${GLASS_BORDER}`, borderRadius:8, padding:"7px 11px", cursor:"pointer", color:TEXT, fontSize:18, lineHeight:1, fontFamily:FONT }}>☰</button>}
            {isMobile && <span style={{ fontSize:15, fontWeight:800, background:G1, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{COMPANY}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {userRole && !isMobile && <span style={{ fontSize:11, color:MUTED, background:"rgba(255,255,255,0.04)", padding:"4px 12px", borderRadius:20, border:`1px solid ${GLASS_BORDER}` }}>{ROLES.find(r=>r.value===userRole)?.label||userRole}</span>}
            <NotificationBell token={token} notify={notify} />
          </div>
        </div>

        {page==="dashboard"   && <Dashboard token={token} goTo={goToPage} notify={notify} userName={userName} userRole={userRole} />}
        {page==="candidates"  && <CandidatesPage token={token} notify={notify} />}
        {page==="jobs"        && <JobsPage token={token} notify={notify} />}
        {page==="clients"     && <DataPage title="Clients" token={token} notify={notify} endpoint="/api/clients" addTitle="Client"
          columns={[
            { key:"clientId", label:"CLT ID", render:(x:any)=><span style={{ fontFamily:"monospace", fontSize:11, background:"rgba(0,212,255,0.08)", padding:"3px 8px", borderRadius:6, color:BRAND, border:`1px solid rgba(0,212,255,0.2)` }}>{x.clientId||"—"}</span> },
            { key:"name", label:"Company", isName:true },
            { key:"industry", label:"Industry" },
            { key:"contactName", label:"Contact" },
            { key:"contactEmail", label:"Email" },
            { key:"createdAt", label:"Added", render:(x:any)=>fmt(x.createdAt) },
          ]}
          addFields={[
            { key:"name", label:"Company Name" },
            { key:"industry", label:"Industry", placeholder:"e.g. Manufacturing, Finance" },
            { key:"contactName", label:"Contact Name" },
            { key:"contactEmail", label:"Contact Email", type:"email" },
            { key:"website", label:"Website", placeholder:"https://..." },
          ]} />}
        {page==="submissions" && <SubmissionsPage token={token} notify={notify} userRole={userRole} />}
        {page==="analytics"   && <Analytics token={token} />}
        {page==="ai"          && <AITools token={token} notify={notify} />}
        {page==="users"       && <UsersPage token={token} notify={notify} />}
      </div>

      {toast.show && (
        <div style={{ position:"fixed", bottom:20, right:isMobile?12:24, left:isMobile?12:"auto", background:"rgba(10,12,30,0.97)", backdropFilter:"blur(20px)", border:`1px solid ${GLASS_BORDER}`, borderRadius:12, padding:"13px 18px", fontSize:13, zIndex:999, boxShadow:"0 12px 40px rgba(0,0,0,0.6)", borderLeft:`3px solid ${toast.type==="success"?"#10B981":toast.type==="error"?"#EF4444":BRAND}`, color:TEXT, display:"flex", alignItems:"center", gap:10 }}>
          <span>{toast.type==="success"?"✅":toast.type==="error"?"❌":"ℹ️"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
    </>
  );
}