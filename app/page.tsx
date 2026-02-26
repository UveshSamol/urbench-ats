"use client";
import { useState, useEffect } from "react";

const BRAND       = process.env.NEXT_PUBLIC_BRAND_COLOR      || "#00D4FF";
const ACCENT      = process.env.NEXT_PUBLIC_ACCENT_COLOR     || "#D000FF";
const BG          = process.env.NEXT_PUBLIC_BG_COLOR         || "#060609";
const SIDEBAR     = process.env.NEXT_PUBLIC_SIDEBAR_COLOR    || "#0A0B12";
const CARD        = process.env.NEXT_PUBLIC_CARD_COLOR       || "#0C0D16";
const INPUT       = process.env.NEXT_PUBLIC_INPUT_COLOR      || "#08090F";
const BORDER      = process.env.NEXT_PUBLIC_BORDER_COLOR     || "#1A1B2E";
const TEXT        = process.env.NEXT_PUBLIC_TEXT_COLOR       || "#E8ECF4";
const MUTED       = process.env.NEXT_PUBLIC_TEXT_MUTED       || "#6B7094";
const FONT        = process.env.NEXT_PUBLIC_FONT             || "system-ui,sans-serif";
const RADIUS      = process.env.NEXT_PUBLIC_BORDER_RADIUS    || "12px";
const HEADER_BG   = process.env.NEXT_PUBLIC_HEADER_BG        || "#0A0B12";
const NAV_ACTIVE  = process.env.NEXT_PUBLIC_NAV_ACTIVE_BG    || "rgba(0,212,255,0.08)";
const COMPANY     = process.env.NEXT_PUBLIC_COMPANY_NAME     || "UrBench";
const TAGLINE     = process.env.NEXT_PUBLIC_COMPANY_TAGLINE  || "Building Trust, Exceeding Expectations";

async function api(path: string, method = "GET", body?: any, token?: string) {
  const h: any = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const opts: any = { method, headers: h };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(path, opts);
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || e.error || `Error ${r.status}`);
  }
  return r.json();
}

const fmt = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const bc = (s: string) => {
  if (!s) return "#7B8BA8";
  const l = s.toLowerCase();
  if (["active","open","placed","completed"].some(x => l.includes(x))) return "#10B981";
  if (["pending","submitted","interview","review"].some(x => l.includes(x))) return "#F59E0B";
  if (["rejected","closed","cancel"].some(x => l.includes(x))) return "#EF4444";
  return BRAND;
};

const S = {
  inp: { width: "100%", padding: "9px 12px", background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, outline: "none", fontFamily: FONT } as React.CSSProperties,
  th: { padding: "10px 18px", textAlign: "left" as const, fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase" as const, letterSpacing: "0.8px", borderBottom: `1px solid ${BORDER}`, background: INPUT },
  td: { padding: "12px 18px", fontSize: 13, borderBottom: `1px solid ${BORDER}`, color: MUTED },
  tdn: { padding: "12px 18px", fontSize: 13, borderBottom: `1px solid ${BORDER}`, color: TEXT, fontWeight: 500 },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: RADIUS, overflow: "hidden" as const },
  page: { padding: "24px 28px" },
  bar: { padding: "18px 28px", borderBottom: `1px solid ${BORDER}`, background: HEADER_BG, display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
};

function Badge({ children, status }: { children: string; status?: string }) {
  const c = bc(status || children);
  return <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 14, fontSize: 11, fontWeight: 600, background: c + "15", color: c }}>{children}</span>;
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ ...S.card, padding: 18, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, opacity: 0.4 }} />
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.8px", color }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children, onSave, saving }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {onSave && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, color: MUTED, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={onSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 12, fontWeight: 500, color: MUTED, marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SimpleBar({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, padding: "10px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 11, color: MUTED }}>${(d[valueKey] / 1000).toFixed(0)}k</div>
          <div style={{ width: "100%", maxWidth: 40, height: `${(d[valueKey] / max) * 120}px`, background: `linear-gradient(180deg,${BRAND},${ACCENT})`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
          <div style={{ fontSize: 10, color: MUTED }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: (t: string) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function submit() {
    if (loading) return;
    setLoading(true); setError("");
    api("/api/auth/login", "POST", { email, password: pw })
      .then(d => onLogin(d.accessToken || d.token))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG, fontFamily: FONT }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>
            <span style={{ color: TEXT }}>{COMPANY.slice(0, 2)}</span>
            <span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{COMPANY.slice(2)}</span>
          </div>
          <div style={{ height: 3, width: 80, background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, borderRadius: 2, margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>{TAGLINE}</div>
        </div>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "36px 32px" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: TEXT }}>Welcome back</div>
          <div style={{ color: MUTED, fontSize: 13, marginBottom: 28 }}>Sign in to your ATS dashboard</div>
          <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} /></Field>
          <Field label="Password"><input type="password" value={pw} onChange={e => setPw(e.target.value)} style={S.inp} /></Field>
          {error && <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 14, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{error}</div>}
          <button type="button" onClick={submit} disabled={loading} style={{ ...S.btn, width: "100%", justifyContent: "center", padding: "12px", fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: MUTED }}>Developed by <span style={{ color: MUTED }}>{COMPANY} LLC</span> — SAP Staffing Solutions</div>
      </div>
    </div>
  );
}

function Dashboard({ token, goTo, notify }: any) {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/api/candidates", "GET", null, token).catch(() => []),
      api("/api/jobs", "GET", null, token).catch(() => []),
      api("/api/clients", "GET", null, token).catch(() => []),
      api("/api/submissions", "GET", null, token).catch(() => []),
    ]).then(r => {
      setD({
        c: r[0]?.data || r[0]?.candidates || (Array.isArray(r[0]) ? r[0] : []),
        j: r[1]?.data || r[1]?.jobs || (Array.isArray(r[1]) ? r[1] : []),
        cl: r[2]?.data || r[2]?.clients || (Array.isArray(r[2]) ? r[2] : []),
        s: r[3]?.data || r[3]?.submissions || (Array.isArray(r[3]) ? r[3] : []),
      });
    }).catch(e => notify(e.message, "error")).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", color: MUTED }}>Loading...</div>;

  return (
    <div>
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Dashboard</div></div>
      <div style={S.page}>
        <div style={{ background: `linear-gradient(135deg,rgba(0,212,255,0.06),rgba(208,0,255,0.04))`, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: TEXT }}>Welcome to <span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>{COMPANY} ATS</span></div>
          <div style={{ fontSize: 13, color: MUTED }}>Your SAP staffing pipeline at a glance</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <Stat label="Candidates" value={d.c.length} color={BRAND} />
          <Stat label="Open Jobs" value={d.j.length} color="#10B981" />
          <Stat label="Clients" value={d.cl.length} color={ACCENT} />
          <Stat label="Submissions" value={d.s.length} color="#F59E0B" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={S.card}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Recent Candidates</span>
              <button type="button" onClick={() => goTo("candidates")} style={{ fontSize: 12, color: BRAND, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {d.c.length === 0 && <div style={{ padding: 24, textAlign: "center", color: MUTED, fontSize: 13 }}>No candidates yet</div>}
            {d.c.slice(0, 5).map((x: any, i: number) => (
              <div key={i} style={{ padding: "11px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{x.firstName || x.name || "—"} {x.lastName || ""}</div><div style={{ fontSize: 11, color: MUTED }}>{x.email || "—"}</div></div>
                <Badge status={x.status}>{x.status || "Active"}</Badge>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Open Jobs</span>
              <button type="button" onClick={() => goTo("jobs")} style={{ fontSize: 12, color: BRAND, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {d.j.length === 0 && <div style={{ padding: 24, textAlign: "center", color: MUTED, fontSize: 13 }}>No jobs yet</div>}
            {d.j.slice(0, 5).map((x: any, i: number) => (
              <div key={i} style={{ padding: "11px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 13, fontWeight: 500, color: TEXT }}>{x.title || "—"}</div><div style={{ fontSize: 11, color: MUTED }}>{x.client?.name || x.location || "—"}</div></div>
                <Badge status={x.status}>{x.status || "Open"}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPage({ title, token, notify, endpoint, columns, addTitle, addFields }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  function load() {
    setLoading(true);
    api(endpoint, "GET", null, token).then(d => setList(d.data || d[Object.keys(d).find((k: string) => Array.isArray(d[k])) || ""] || (Array.isArray(d) ? d : []))).catch(e => notify(e.message, "error")).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [token]);

  const filtered = list.filter(x => {
    if (!search) return true;
    return JSON.stringify(x).toLowerCase().includes(search.toLowerCase());
  });

  function save() {
    setSaving(true);
    const body = { ...form };
    if (body.billRate) body.billRate = Number(body.billRate) || 0;
    if (body.payRate) body.payRate = Number(body.payRate) || 0;
    api(endpoint, "POST", body, token)
      .then(() => { notify(`${addTitle} added!`, "success"); setModal(false); setForm({}); load(); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <div style={S.bar}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>{title}</div>
        {addFields && <button type="button" onClick={() => setModal(true)} style={S.btn}>+ {addTitle}</button>}
      </div>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>All {title} ({list.length})</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width: 220 }} />
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Loading...</div> :
            filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No {title.toLowerCase()} found</div> :
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{columns.map((c: any) => <th key={c.key} style={S.th}>{c.label}</th>)}</tr></thead>
                <tbody>{filtered.map((x: any, i: number) => (
                  <tr key={i}>{columns.map((c: any) => (
                    <td key={c.key} style={c.isName ? S.tdn : S.td}>
                      {c.render ? c.render(x) : (c.path ? c.path.split(".").reduce((o: any, k: string) => o?.[k], x) || "—" : x[c.key] || "—")}
                    </td>
                  ))}</tr>
                ))}</tbody>
              </table>}
        </div>
      </div>
      {modal && addFields && (
        <Modal title={`Add ${addTitle}`} onClose={() => setModal(false)} onSave={save} saving={saving}>
          {addFields.map((f: any) => (
            <Field key={f.key} label={f.label}>
              {f.type === "textarea" ?
                <textarea style={{ ...S.inp, minHeight: 80, resize: "vertical" }} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} /> :
                f.type === "select" ?
                  <select style={S.inp} value={form[f.key] || f.options[0].value} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                    {f.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select> :
                  <input style={S.inp} type={f.type || "text"} value={form[f.key] || ""} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder || ""} />
              }
            </Field>
          ))}
        </Modal>
      )}
    </div>
  );
}

function Analytics({ token }: any) {
  const [rec, setRec] = useState<any>(null);
  const [fc, setFc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/api/analytics/recruiter", "GET", null, token).catch(() => null),
      api("/api/analytics/revenue-forecast", "GET", null, token).catch(() => null),
    ]).then(r => { setRec(r[0]); setFc(r[1]); }).finally(() => setLoading(false));
  }, [token]);

  const cd = fc?.months || fc?.forecast || [{ month: "Mar", revenue: 12000 }, { month: "Apr", revenue: 18000 }, { month: "May", revenue: 24000 }, { month: "Jun", revenue: 30000 }];

  return (
    <div>
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Analytics</div></div>
      <div style={S.page}>
        {loading ? <div style={{ padding: 60, textAlign: "center", color: MUTED }}>Loading...</div> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            <Stat label="Total Placements" value={rec?.totalPlacements || rec?.placements || 0} color="#10B981" />
            <Stat label="Active Submissions" value={rec?.activeSubmissions || rec?.submissions || 0} color={BRAND} />
            <Stat label="Fill Rate" value={`${rec?.fillRate || rec?.fill_rate || 0}%`} color={ACCENT} />
            <Stat label="Revenue" value={`$${Math.floor((rec?.revenue || rec?.totalRevenue || 0) / 1000)}k`} color="#F59E0B" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: TEXT }}>Revenue Forecast</div>
              <SimpleBar data={cd} labelKey="month" valueKey="revenue" />
            </div>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: TEXT }}>Recruiter Metrics</div>
              {[{ l: "Avg Time to Fill", v: `${rec?.avgTimeToFill || 14} days`, c: BRAND }, { l: "Sub → Interview", v: `${rec?.subToInterview || 45}%`, c: "#7B2FFF" }, { l: "Interview → Offer", v: `${rec?.interviewToOffer || 62}%`, c: ACCENT }, { l: "Offer Acceptance", v: `${rec?.offerAcceptance || 88}%`, c: "#10B981" }].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: INPUT, borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: m.c }} /><span style={{ fontSize: 13, color: MUTED }}>{m.l}</span></div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{m.v}</span>
                </div>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

function AITools({ token, notify }: any) {
  const [tab, setTab] = useState("resume");
  const [txt, setTxt] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cid, setCid] = useState("");
  const [jid, setJid] = useState("");

  function run() {
    setLoading(true);
    setRes(null);
    const ep = tab === "resume" ? "/api/ai/parse-resume" : tab === "jd" ? "/api/ai/parse-jd" : "/api/ai/match";
    const bd = tab === "match" ? { candidateId: cid, jobId: jid } : { text: txt, resumeText: txt, description: txt };
    api(ep, "POST", bd, token)
      .then(d => { setRes(d); notify("AI analysis complete!", "success"); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>AI Tools</div></div>
      <div style={S.page}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[{ id: "resume", l: "Parse Resume" }, { id: "jd", l: "Parse JD" }, { id: "match", l: "AI Match" }].map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setRes(null); setTxt(""); }}
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", border: tab === t.id ? "none" : `1px solid ${BORDER}`, background: tab === t.id ? `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})` : CARD, color: tab === t.id ? "#fff" : MUTED }}>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ ...S.card, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: TEXT }}>
              {tab === "resume" ? "Paste Resume" : tab === "jd" ? "Paste Job Description" : "Match Candidate to Job"}
            </div>
            {tab === "match" ? (
              <>
                <Field label="Candidate ID"><input style={S.inp} value={cid} onChange={e => setCid(e.target.value)} placeholder="Enter candidate ID" /></Field>
                <Field label="Job ID"><input style={S.inp} value={jid} onChange={e => setJid(e.target.value)} placeholder="Enter job ID" /></Field>
              </>
            ) : (
              <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="Paste content here..." style={{ ...S.inp, minHeight: 200, resize: "vertical" }} />
            )}
            <button type="button" onClick={run} disabled={loading} style={{ ...S.btn, marginTop: 12, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Analyzing..." : "⚡ Run AI Analysis"}
            </button>
          </div>
          <div style={{ ...S.card, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: TEXT }}>Results</div>
            {!res ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
                🤖<br />Run an analysis to see results
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
                {res?.data && Object.entries(res.data).map(([key, value]: any) => (
                  <div key={key} style={{ background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div style={{ fontSize: 13, color: TEXT }}>
                      {Array.isArray(value) ? (
                        value.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                            {value.map((v: string, i: number) => (
                              <span key={i} style={{ background: BORDER, padding: "2px 8px", borderRadius: 10, fontSize: 11, color: TEXT }}>{v}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: MUTED }}>None</span>
                        )
                      ) : typeof value === "number" ? (
                        <span style={{ color: BRAND, fontWeight: 600, fontSize: 18 }}>{value}</span>
                      ) : (
                        String(value) || "—"
                      )}
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
function JobsPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ type: "Contract" });

  function load() {
    setLoading(true);
    Promise.all([
      api("/api/jobs", "GET", null, token),
      api("/api/clients", "GET", null, token),
    ]).then(([j, c]) => {
      setList(j.data || []);
      setClients(c.data || []);
    }).catch(e => notify(e.message, "error")).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [token]);

  const filtered = list.filter(x => !search || JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    if (!form.clientId) { notify("Please select a client", "error"); return; }
    if (!form.title) { notify("Job title is required", "error"); return; }
    setSaving(true);
    const body = {
      clientId: form.clientId,
      title: form.title,
      description: form.description || "",
      location: form.location || "",
      type: form.type || "Contract",
      rate: form.rate || "",
      rateNumeric: form.rateNumeric ? Number(form.rateNumeric) : undefined,
      currency: form.currency || "USD",
      paymentType: form.paymentType || "Hourly",
      remote: form.remote || "",
      duration: form.duration || "",
    };
    api("/api/jobs", "POST", body, token)
      .then(() => { notify("Job added!", "success"); setModal(false); setForm({ type: "Contract" }); load(); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <div style={S.bar}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Jobs</div>
        <button type="button" onClick={() => setModal(true)} style={S.btn}>+ Add Job</button>
      </div>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>All Jobs ({list.length})</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width: 220 }} />
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Loading...</div> :
            filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No jobs found</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Title</th>
                    <th style={S.th}>Client</th>
                    <th style={S.th}>Location</th>
                    <th style={S.th}>Type</th>
                    <th style={S.th}>Rate</th>
                    <th style={S.th}>Currency</th>
                    <th style={S.th}>Payment</th>
                    <th style={S.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x: any, i: number) => (
                    <tr key={i}>
                      <td style={S.tdn}>{x.title}</td>
                      <td style={S.td}>{x.client?.name || "—"}</td>
                      <td style={S.td}>{x.location || "—"}</td>
                      <td style={S.td}><Badge>{x.type || "Contract"}</Badge></td>
                      <td style={S.td}>{x.rate || (x.rateNumeric ? `${x.rateNumeric}` : "—")}</td>
                      <td style={S.td}>{x.currency || "USD"}</td>
                      <td style={S.td}>{x.paymentType || "Hourly"}</td>
                      <td style={S.td}><Badge status={x.status}>{x.status || "Open"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {modal && (
        <Modal title="Add New Job" onClose={() => setModal(false)} onSave={save} saving={saving}>
          <Field label="Client *">
            <select style={S.inp} value={form.clientId || ""} onChange={e => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— Select Client —</option>
              {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Job Title *">
            <input style={S.inp} value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. SAP FICO Consultant" />
          </Field>
          <Field label="Description">
            <textarea style={{ ...S.inp, minHeight: 80, resize: "vertical" }} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Location">
            <input style={S.inp} value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Dallas, TX (Remote)" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Type">
              <select style={S.inp} value={form.type || "Contract"} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="Contract">Contract</option>
                <option value="Permanent">Permanent</option>
                <option value="ContractToHire">Contract to Hire</option>
              </select>
            </Field>
            <Field label="Duration">
              <input style={S.inp} value={form.duration || ""} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 6 months" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Rate">
              <input style={S.inp} type="number" value={form.rateNumeric || ""} onChange={e => setForm({ ...form, rateNumeric: e.target.value })} placeholder="85" />
            </Field>
            <Field label="Currency">
              <select style={S.inp} value={form.currency || "USD"} onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </Field>
            <Field label="Payment Type">
              <select style={S.inp} value={form.paymentType || "Hourly"} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </Field>
          </div>
          <Field label="Remote">
            <select style={S.inp} value={form.remote || ""} onChange={e => setForm({ ...form, remote: e.target.value })}>
              <option value="">— Select —</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}
function SubmissionsPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<any>({});

  function load() {
    setLoading(true);
    Promise.all([
      api("/api/submissions", "GET", null, token),
      api("/api/candidates", "GET", null, token),
      api("/api/jobs", "GET", null, token),
    ]).then(([s, c, j]) => {
      setList(s.data || []);
      setCandidates(c.data || []);
      setJobs(j.data || []);
    }).catch(e => notify(e.message, "error")).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [token]);

  const filtered = list.filter(x => !search || JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function save() {
    if (!form.candidateId) { notify("Please select a candidate", "error"); return; }
    if (!form.jobId) { notify("Please select a job", "error"); return; }
    setSaving(true);
    api("/api/submissions", "POST", form, token)
      .then(() => { notify("Submission added!", "success"); setModal(false); setForm({}); load(); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <div style={S.bar}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Submissions</div>
        <button type="button" onClick={() => setModal(true)} style={S.btn}>+ Add Submission</button>
      </div>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>All Submissions ({list.length})</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width: 220 }} />
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Loading...</div> :
            filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>No submissions yet</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Candidate</th>
                    <th style={S.th}>Job</th>
                    <th style={S.th}>Client</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Submitted</th>
                    <th style={S.th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x: any, i: number) => (
                    <tr key={i}>
                      <td style={S.tdn}>{x.candidate?.name || "—"}</td>
                      <td style={S.td}>{x.job?.title || "—"}</td>
                      <td style={S.td}>{x.job?.client?.name || "—"}</td>
                      <td style={S.td}><Badge status={x.status}>{x.status || "Submitted"}</Badge></td>
                      <td style={S.td}>{fmt(x.submissionDate || x.createdAt)}</td>
                      <td style={S.td}>{x.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {modal && (
        <Modal title="Add Submission" onClose={() => setModal(false)} onSave={save} saving={saving}>
          <Field label="Candidate *">
            <select style={S.inp} value={form.candidateId || ""} onChange={e => setForm({ ...form, candidateId: e.target.value })}>
              <option value="">— Select Candidate —</option>
              {candidates.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Job *">
            <select style={S.inp} value={form.jobId || ""} onChange={e => setForm({ ...form, jobId: e.target.value })}>
              <option value="">— Select Job —</option>
              {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title} — {j.client?.name || "No client"}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea style={{ ...S.inp, minHeight: 80, resize: "vertical" }} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this submission..." />
          </Field>
          <Field label="Interview Date">
            <input style={S.inp} type="date" value={form.interviewDate || ""} onChange={e => setForm({ ...form, interviewDate: e.target.value })} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
function UsersPage({ token, notify }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [resetModal, setResetModal] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [form, setForm] = useState<any>({});

  function load() {
    setLoading(true);
    api("/api/users", "GET", null, token)
      .then(d => setList(d.data || []))
      .catch(e => notify(e.message, "error"))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [token]);

  const filtered = list.filter(x => !search || JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));

  function addUser() {
    setSaving(true);
    api("/api/users", "POST", form, token)
      .then(() => { notify("User added!", "success"); setAddModal(false); setForm({}); load(); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setSaving(false));
  }

  function deleteUser(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? Their data will be kept.`)) return;
    api(`/api/users/${id}`, "DELETE", null, token)
      .then(() => { notify(`${name} deactivated`, "success"); load(); })
      .catch(e => notify(e.message, "error"));
  }

  function resetPassword() {
    if (!newPw || newPw.length < 8) { notify("Password must be at least 8 characters", "error"); return; }
    setSaving(true);
    api(`/api/users/${resetModal.id}`, "PATCH", { password: newPw }, token)
      .then(() => { notify(`Password reset for ${resetModal.name}`, "success"); setResetModal(null); setNewPw(""); })
      .catch(e => notify(e.message, "error"))
      .finally(() => setSaving(false));
  }

  return (
    <div>
      <div style={S.bar}>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Manage Users</div>
        <button type="button" onClick={() => setAddModal(true)} style={S.btn}>+ Add User</button>
      </div>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>All Users ({list.length})</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width: 220 }} />
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Loading...</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Added</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x: any, i: number) => (
                  <tr key={i}>
                    <td style={S.tdn}>{x.name}</td>
                    <td style={S.td}>{x.email}</td>
                    <td style={S.td}><Badge>{x.role}</Badge></td>
                    <td style={S.td}><Badge status={x.isActive ? "active" : "rejected"}>{x.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td style={S.td}>{fmt(x.createdAt)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button type="button" onClick={() => { setResetModal(x); setNewPw(""); }}
                          style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: BRAND, cursor: "pointer", fontFamily: FONT }}>
                          🔑 Reset PW
                        </button>
                        {x.isActive && (
                          <button type="button" onClick={() => deleteUser(x.id, x.name)}
                            style={{ padding: "4px 10px", fontSize: 11, borderRadius: 6, border: "1px solid #EF444430", background: "transparent", color: "#EF4444", cursor: "pointer", fontFamily: FONT }}>
                            🗑 Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {addModal && (
        <Modal title="Add New User" onClose={() => setAddModal(false)} onSave={addUser} saving={saving}>
          <Field label="Full Name"><input style={S.inp} value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Smith" /></Field>
          <Field label="Email"><input style={S.inp} type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@urbench.com" /></Field>
          <Field label="Password"><input style={S.inp} value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></Field>
          <Field label="Role">
            <select style={S.inp} value={form.role || "RECRUITER"} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="RECRUITER">Recruiter</option>
              <option value="SALES">Sales</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
        </Modal>
      )}

      {resetModal && (
        <Modal title={`Reset Password — ${resetModal.name}`} onClose={() => setResetModal(null)} onSave={resetPassword} saving={saving}>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Enter a new password for <strong style={{ color: TEXT }}>{resetModal.name}</strong> ({resetModal.email})</div>
          <Field label="New Password">
            <input style={S.inp} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
          </Field>
        </Modal>
      )}
    </div>
  );
}
export default function Page() {
  const [token, setToken] = useState("");
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState({ msg: "", type: "info", show: false });

  function notify(msg: string, type = "info") {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  if (!token) return <LoginPage onLogin={t => { setToken(t); notify("Logged in!", "success"); }} />;

  const navItems = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "candidates", label: "👥 Candidates" },
    { id: "jobs", label: "💼 Jobs" },
    { id: "clients", label: "🏢 Clients" },
    { id: "submissions", label: "📨 Submissions" },
    { id: "analytics", label: "📈 Analytics" },
    { id: "ai", label: "🤖 AI Tools" },
    { id: "users", label: "👤 Manage Users" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BG, color: TEXT, fontFamily: FONT }}>
      <div style={{ width: 230, background: SIDEBAR, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: "auto" }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(90deg,${BRAND},${ACCENT})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", fontFamily: "monospace" }}>{COMPANY.slice(0,2)}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>
                <span style={{ color: TEXT }}>{COMPANY.slice(0,2)}</span>
                <span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{COMPANY.slice(2)}</span>
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, color: BRAND, background: "rgba(0,212,255,0.1)", padding: "1px 7px", borderRadius: 10, display: "inline-block", letterSpacing: "0.8px", textTransform: "uppercase", marginTop: 2 }}>ATS Platform</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
          {navItems.map(n => (
            <button key={n.id} type="button" onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: page === n.id ? BRAND : MUTED, fontSize: 13, fontWeight: page === n.id ? 500 : 400, cursor: "pointer", border: "none", background: page === n.id ? NAV_ACTIVE : "transparent", width: "100%", textAlign: "left", fontFamily: FONT }}>{n.label}</button>
          ))}
        </div>
        <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
          <button type="button" onClick={() => setToken("")} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: MUTED, fontSize: 13, cursor: "pointer", border: "none", background: "transparent", width: "100%", textAlign: "left", fontFamily: FONT }}>↩ Sign Out</button>
          <div style={{ padding: "8px 10px 4px", fontSize: 10, color: MUTED }}>Developed by {COMPANY} LLC</div>
        </div>
      </div>

      <div style={{ marginLeft: 230, flex: 1, minHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard token={token} goTo={setPage} notify={notify} />}
        {page === "candidates" && <DataPage title="Candidates" token={token} notify={notify} endpoint="/api/candidates" addTitle="Candidate"
          columns={[{ key: "name", label: "Name", isName: true, render: (x: any) => x.name || "—" }, { key: "email", label: "Email" }, { key: "title", label: "Title / Skills", render: (x: any) => x.title || x.skills || "—" }, { key: "status", label: "Status", render: (x: any) => <Badge status={x.status}>{x.status || "Active"}</Badge> }, { key: "createdAt", label: "Added", render: (x: any) => fmt(x.createdAt) }]}
          addFields={[
  { key: "name", label: "Full Name", placeholder: "e.g. John Smith" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "location", label: "Location", placeholder: "e.g. Dallas, TX" },
  { key: "visaStatus", label: "Visa Status", placeholder: "e.g. H1B, GC, USC" },
  { key: "rateExpectation", label: "Rate Expectation", placeholder: "e.g. $85/hr" },
  { key: "availability", label: "Availability", placeholder: "e.g. Immediate, 2 weeks" },
  { key: "employmentType", label: "Employment Type", type: "select", options: [
    { value: "CONTRACT", label: "Contract" },
    { value: "FULL_TIME", label: "Full Time" },
    { value: "CONTRACT_TO_HIRE", label: "Contract to Hire" },
  ]},
]} />}
        {page === "jobs" && <JobsPage token={token} notify={notify} />}
        {page === "clients" && <DataPage title="Clients" token={token} notify={notify} endpoint="/api/clients" addTitle="Client"
          columns={[{ key: "name", label: "Company", isName: true }, { key: "industry", label: "Industry" }, { key: "contactName", label: "Contact" }, { key: "contactEmail", label: "Email" }, { key: "createdAt", label: "Added", render: (x: any) => fmt(x.createdAt) }]}
          addFields={[{ key: "name", label: "Company Name" }, { key: "industry", label: "Industry", placeholder: "e.g. Manufacturing, Finance" }, { key: "contactName", label: "Contact Name" }, { key: "contactEmail", label: "Contact Email", type: "email" }]} />}
        {page === "submissions" && <SubmissionsPage token={token} notify={notify} />}
        {page === "analytics" && <Analytics token={token} />}
        {page === "ai" && <AITools token={token} notify={notify} />}
        {page === "users" && <UsersPage token={token} notify={notify} />}
      </div>

      {toast.show && <div style={{ position: "fixed", bottom: 20, right: 20, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 18px", fontSize: 13, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320, borderLeft: toast.type === "success" ? "3px solid #10B981" : toast.type === "error" ? "3px solid #EF4444" : `3px solid ${BRAND}`, color: TEXT }}>{toast.msg}</div>}
    </div>
  );
}