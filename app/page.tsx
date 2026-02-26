"use client";
import { useState, useEffect } from "react";

const BRAND = process.env.NEXT_PUBLIC_BRAND_COLOR || "#00D4FF";
const ACCENT = process.env.NEXT_PUBLIC_ACCENT_COLOR || "#D000FF";

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
  inp: { width: "100%", padding: "9px 12px", background: "#08090F", border: "1px solid #1A1B2E", borderRadius: 8, color: "#E8ECF4", fontSize: 13, outline: "none", fontFamily: "inherit" } as React.CSSProperties,
  th: { padding: "10px 18px", textAlign: "left" as const, fontSize: 10, fontWeight: 600, color: "#3A3D55", textTransform: "uppercase" as const, letterSpacing: "0.8px", borderBottom: "1px solid #1A1B2E", background: "#08090F" },
  td: { padding: "12px 18px", fontSize: 13, borderBottom: "1px solid #1A1B2E", color: "#8B90B0" },
  tdn: { padding: "12px 18px", fontSize: 13, borderBottom: "1px solid #1A1B2E", color: "#E8ECF4", fontWeight: 500 },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  card: { background: "#0C0D16", border: "1px solid #1A1B2E", borderRadius: 12, overflow: "hidden" as const },
  page: { padding: "24px 28px" },
  bar: { padding: "18px 28px", borderBottom: "1px solid #1A1B2E", background: "#0A0B12", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
};

function Badge({ children, status }: { children: string; status?: string }) {
  const c = bc(status || children);
  return <span style={{ display: "inline-flex", padding: "2px 9px", borderRadius: 14, fontSize: 11, fontWeight: 600, background: c + "15", color: c }}>{children}</span>;
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ ...S.card, padding: 18, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, opacity: 0.4 }} />
      <div style={{ fontSize: 12, color: "#6B7094", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.8px", color }}>{value}</div>
    </div>
  );
}

function Modal({ title, onClose, children, onSave, saving }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#0C0D16", border: "1px solid #1A1B2E", borderRadius: 14, width: 480, maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1A1B2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#6B7094", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {onSave && (
          <div style={{ padding: "14px 20px", borderTop: "1px solid #1A1B2E", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #1A1B2E", borderRadius: 8, color: "#6B7094", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={onSave} disabled={saving} style={{ ...S.btn, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return <div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#6B7094", marginBottom: 5 }}>{label}</label>{children}</div>;
}

function SimpleBar({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, padding: "10px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#6B7094" }}>${(d[valueKey] / 1000).toFixed(0)}k</div>
          <div style={{ width: "100%", maxWidth: 40, height: `${(d[valueKey] / max) * 120}px`, background: `linear-gradient(180deg,${BRAND},${ACCENT})`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
          <div style={{ fontSize: 10, color: "#3A3D55" }}>{d[labelKey]}</div>
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060609" }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 6 }}>
            <span style={{ color: "#fff" }}>Ur</span>
            <span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bench</span>
          </div>
          <div style={{ height: 3, width: 80, background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, borderRadius: 2, margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, color: "#6B7094", fontStyle: "italic" }}>Building Trust, Exceeding Expectations</div>
        </div>
        <div style={{ background: "#0C0D16", border: "1px solid #1A1B2E", borderRadius: 16, padding: "36px 32px" }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Welcome back</div>
          <div style={{ color: "#6B7094", fontSize: 13, marginBottom: 28 }}>Sign in to your ATS dashboard</div>
          <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.inp} /></Field>
          <Field label="Password"><input type="password" value={pw} onChange={e => setPw(e.target.value)} style={S.inp} /></Field>
          {error && <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 14, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>{error}</div>}
          <button type="button" onClick={submit} disabled={loading} style={{ ...S.btn, width: "100%", justifyContent: "center", padding: "12px", fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#2E3148" }}>Developed by <span style={{ color: "#4A4D68" }}>UrBench LLC</span> — SAP Staffing Solutions</div>
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

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh", color: "#3A3D55" }}>Loading...</div>;

  return (
    <div>
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700 }}>Dashboard</div></div>
      <div style={S.page}>
        <div style={{ background: `linear-gradient(135deg,rgba(0,212,255,0.06),rgba(208,0,255,0.04))`, border: "1px solid #1A1B2E", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Welcome to <span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>UrBench ATS</span></div>
          <div style={{ fontSize: 13, color: "#6B7094" }}>Your SAP staffing pipeline at a glance</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
          <Stat label="Candidates" value={d.c.length} color={BRAND} />
          <Stat label="Open Jobs" value={d.j.length} color="#10B981" />
          <Stat label="Clients" value={d.cl.length} color={ACCENT} />
          <Stat label="Submissions" value={d.s.length} color="#F59E0B" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={S.card}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1A1B2E", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Recent Candidates</span>
              <button type="button" onClick={() => goTo("candidates")} style={{ fontSize: 12, color: BRAND, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {d.c.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#3A3D55", fontSize: 13 }}>No candidates yet</div>}
            {d.c.slice(0, 5).map((x: any, i: number) => (
              <div key={i} style={{ padding: "11px 18px", borderBottom: "1px solid #1A1B2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{x.firstName || x.name || "—"} {x.lastName || ""}</div><div style={{ fontSize: 11, color: "#3A3D55" }}>{x.email || "—"}</div></div>
                <Badge status={x.status}>{x.status || "Active"}</Badge>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1A1B2E", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Open Jobs</span>
              <button type="button" onClick={() => goTo("jobs")} style={{ fontSize: 12, color: BRAND, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
            </div>
            {d.j.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#3A3D55", fontSize: 13 }}>No jobs yet</div>}
            {d.j.slice(0, 5).map((x: any, i: number) => (
              <div key={i} style={{ padding: "11px 18px", borderBottom: "1px solid #1A1B2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>{x.title || "—"}</div><div style={{ fontSize: 11, color: "#3A3D55" }}>{x.client?.name || x.location || "—"}</div></div>
                <Badge status={x.status}>{x.status || "Open"}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DataPage({ title, token, notify, endpoint, columns, nameField, addTitle, addFields }: any) {
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
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        {addFields && <button type="button" onClick={() => setModal(true)} style={S.btn}>+ {addTitle}</button>}
      </div>
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #1A1B2E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>All {title} ({list.length})</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ ...S.inp, width: 220 }} />
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: "#3A3D55" }}>Loading...</div> :
            filtered.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "#3A3D55" }}>No {title.toLowerCase()} found</div> :
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
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700 }}>Analytics</div></div>
      <div style={S.page}>
        {loading ? <div style={{ padding: 60, textAlign: "center", color: "#3A3D55" }}>Loading...</div> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
            <Stat label="Total Placements" value={rec?.totalPlacements || rec?.placements || 0} color="#10B981" />
            <Stat label="Active Submissions" value={rec?.activeSubmissions || rec?.submissions || 0} color={BRAND} />
            <Stat label="Fill Rate" value={`${rec?.fillRate || rec?.fill_rate || 0}%`} color={ACCENT} />
            <Stat label="Revenue" value={`$${Math.floor((rec?.revenue || rec?.totalRevenue || 0) / 1000)}k`} color="#F59E0B" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Revenue Forecast</div>
              <SimpleBar data={cd} labelKey="month" valueKey="revenue" />
            </div>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recruiter Metrics</div>
              {[{ l: "Avg Time to Fill", v: `${rec?.avgTimeToFill || 14} days`, c: BRAND }, { l: "Sub → Interview", v: `${rec?.subToInterview || 45}%`, c: "#7B2FFF" }, { l: "Interview → Offer", v: `${rec?.interviewToOffer || 62}%`, c: ACCENT }, { l: "Offer Acceptance", v: `${rec?.offerAcceptance || 88}%`, c: "#10B981" }].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#08090F", borderRadius: 8, border: "1px solid #1A1B2E", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: m.c }} /><span style={{ fontSize: 13, color: "#6B7094" }}>{m.l}</span></div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{m.v}</span>
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
      <div style={S.bar}><div style={{ fontSize: 18, fontWeight: 700 }}>AI Tools</div></div>
      <div style={S.page}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[{ id: "resume", l: "Parse Resume" }, { id: "jd", l: "Parse JD" }, { id: "match", l: "AI Match" }].map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setRes(null); setTxt(""); }}
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", border: tab === t.id ? "none" : "1px solid #1A1B2E", background: tab === t.id ? `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})` : "#0C0D16", color: tab === t.id ? "#fff" : "#6B7094" }}>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ ...S.card, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
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
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Results</div>
            {!res ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#2E3148" }}>
                🤖<br />Run an analysis to see results
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
                {res?.data && Object.entries(res.data).map(([key, value]: any) => (
                  <div key={key} style={{ background: "#08090F", border: "1px solid #1A1B2E", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#3A3D55", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div style={{ fontSize: 13, color: "#E8ECF4" }}>
                      {Array.isArray(value) ? (
                        value.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                            {value.map((v: string, i: number) => (
                              <span key={i} style={{ background: "#1A1B2E", padding: "2px 8px", borderRadius: 10, fontSize: 11 }}>{v}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#3A3D55" }}>None</span>
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#060609", color: "#E8ECF4", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ width: 230, background: "#0A0B12", borderRight: "1px solid #1A1B2E", display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1A1B2E" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(90deg,${BRAND},${ACCENT})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", fontFamily: "monospace" }}>Ur</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}><span style={{ color: "#fff" }}>Ur</span><span style={{ background: `linear-gradient(90deg,${BRAND},#7B2FFF,${ACCENT})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Bench</span></div>
              <div style={{ fontSize: 9, fontWeight: 600, color: BRAND, background: "rgba(0,212,255,0.1)", padding: "1px 7px", borderRadius: 10, display: "inline-block", letterSpacing: "0.8px", textTransform: "uppercase", marginTop: 2 }}>ATS Platform</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {navItems.map(n => (
            <button key={n.id} type="button" onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: page === n.id ? BRAND : "#6B7094", fontSize: 13, fontWeight: page === n.id ? 500 : 400, cursor: "pointer", border: "none", background: page === n.id ? "rgba(0,212,255,0.08)" : "transparent", width: "100%", textAlign: "left", fontFamily: "inherit" }}>{n.label}</button>
          ))}
        </div>
        <div style={{ padding: "12px 10px", borderTop: "1px solid #1A1B2E" }}>
          <button type="button" onClick={() => setToken("")} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, color: "#6B7094", fontSize: 13, cursor: "pointer", border: "none", background: "transparent", width: "100%", textAlign: "left", fontFamily: "inherit" }}>↩ Sign Out</button>
          <div style={{ padding: "8px 10px 4px", fontSize: 10, color: "#2E3148" }}>Developed by UrBench LLC</div>
        </div>
      </div>

      <div style={{ marginLeft: 230, flex: 1, minHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard token={token} goTo={setPage} notify={notify} />}
        {page === "candidates" && <DataPage title="Candidates" token={token} notify={notify} endpoint="/api/candidates" addTitle="Candidate"
          columns={[{ key: "name", label: "Name", isName: true, render: (x: any) => `${x.firstName || x.name || "—"} ${x.lastName || ""}` }, { key: "email", label: "Email" }, { key: "title", label: "Title / Skills", render: (x: any) => x.title || x.skills || "—" }, { key: "status", label: "Status", render: (x: any) => <Badge status={x.status}>{x.status || "Active"}</Badge> }, { key: "createdAt", label: "Added", render: (x: any) => fmt(x.createdAt) }]}
          addFields={[{ key: "firstName", label: "First Name" }, { key: "lastName", label: "Last Name" }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" }, { key: "title", label: "Title", placeholder: "e.g. SAP FICO Consultant" }, { key: "skills", label: "Skills", placeholder: "e.g. SAP S/4HANA, FICO" }]} />}
        {page === "jobs" && <DataPage title="Jobs" token={token} notify={notify} endpoint="/api/jobs" addTitle="Job"
          columns={[{ key: "title", label: "Title", isName: true }, { key: "client", label: "Client", render: (x: any) => x.client?.name || x.clientName || "—" }, { key: "location", label: "Location" }, { key: "type", label: "Type", render: (x: any) => <Badge>{x.type || "Contract"}</Badge> }, { key: "billRate", label: "Bill Rate", render: (x: any) => x.billRate ? `$${x.billRate}/hr` : "—" }, { key: "status", label: "Status", render: (x: any) => <Badge status={x.status}>{x.status || "Open"}</Badge> }]}
          addFields={[{ key: "title", label: "Job Title", placeholder: "e.g. SAP S/4HANA Consultant" }, { key: "description", label: "Description", type: "textarea" }, { key: "location", label: "Location", placeholder: "e.g. Dallas, TX (Remote)" }, { key: "billRate", label: "Bill Rate ($/hr)", type: "number" }, { key: "payRate", label: "Pay Rate ($/hr)", type: "number" }, { key: "type", label: "Type", type: "select", options: [{ value: "CONTRACT", label: "Contract" }, { value: "FULL_TIME", label: "Full Time" }, { value: "CONTRACT_TO_HIRE", label: "Contract to Hire" }] }]} />}
        {page === "clients" && <DataPage title="Clients" token={token} notify={notify} endpoint="/api/clients" addTitle="Client"
          columns={[{ key: "name", label: "Company", isName: true }, { key: "industry", label: "Industry" }, { key: "contactName", label: "Contact" }, { key: "contactEmail", label: "Email" }, { key: "createdAt", label: "Added", render: (x: any) => fmt(x.createdAt) }]}
          addFields={[{ key: "name", label: "Company Name" }, { key: "industry", label: "Industry", placeholder: "e.g. Manufacturing, Finance" }, { key: "contactName", label: "Contact Name" }, { key: "contactEmail", label: "Contact Email", type: "email" }]} />}
        {page === "submissions" && <DataPage title="Submissions" token={token} notify={notify} endpoint="/api/submissions" addTitle=""
          columns={[{ key: "candidate", label: "Candidate", isName: true, render: (x: any) => `${x.candidate?.firstName || x.candidateName || "—"} ${x.candidate?.lastName || ""}` }, { key: "job", label: "Job", render: (x: any) => x.job?.title || x.jobTitle || "—" }, { key: "status", label: "Status", render: (x: any) => <Badge status={x.status}>{x.status || "Submitted"}</Badge> }, { key: "createdAt", label: "Submitted", render: (x: any) => fmt(x.createdAt || x.submittedAt) }, { key: "billRate", label: "Bill Rate", render: (x: any) => x.billRate ? `$${x.billRate}/hr` : "—" }]}
          addFields={null} />}
        {page === "analytics" && <Analytics token={token} />}
        {page === "ai" && <AITools token={token} notify={notify} />}
        {page === "users" && <DataPage title="Users" token={token} notify={notify} endpoint="/api/users" addTitle="User"
          columns={[
            { key: "name", label: "Name", isName: true },
            { key: "email", label: "Email" },
            { key: "role", label: "Role", render: (x: any) => <Badge>{x.role}</Badge> },
            { key: "isActive", label: "Status", render: (x: any) => <Badge status={x.isActive ? "active" : "rejected"}>{x.isActive ? "Active" : "Inactive"}</Badge> },
            { key: "createdAt", label: "Added", render: (x: any) => fmt(x.createdAt) },
          ]}
          addFields={[
            { key: "name", label: "Full Name" },
            { key: "email", label: "Email", type: "email" },
            { key: "password", label: "Password", placeholder: "Min 8 characters" },
            { key: "role", label: "Role", type: "select", options: [
              { value: "RECRUITER", label: "Recruiter" },
              { value: "SALES", label: "Sales" },
              { value: "ADMIN", label: "Admin" },
            ]},
          ]}
        />}
      </div>

      {toast.show && <div style={{ position: "fixed", bottom: 20, right: 20, background: "#0F1018", border: "1px solid #1A1B2E", borderRadius: 10, padding: "12px 18px", fontSize: 13, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320, borderLeft: toast.type === "success" ? "3px solid #10B981" : toast.type === "error" ? "3px solid #EF4444" : `3px solid ${BRAND}` }}>{toast.msg}</div>}
    </div>
  );
}