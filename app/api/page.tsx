export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "40px", background: "#0a0a0a", color: "#00ff88", minHeight: "100vh" }}>
      <h1>⚡ UrBench ATS API</h1>
      <p>Backend is running successfully.</p>
      <br />
      <h3>Available Endpoints:</h3>
      <ul>
        <li>POST /api/auth/login</li>
        <li>GET/POST /api/candidates</li>
        <li>GET/POST /api/jobs</li>
        <li>GET/POST /api/clients</li>
        <li>GET/POST /api/submissions</li>
        <li>GET/POST /api/placements</li>
        <li>POST /api/ai/parse-resume</li>
        <li>POST /api/ai/parse-jd</li>
        <li>POST /api/ai/match</li>
        <li>GET /api/analytics/recruiter</li>
      </ul>
      <br />
      <p style={{ color: "#888" }}>UrBench LLC — Internal Use Only</p>
    </main>
  );
}