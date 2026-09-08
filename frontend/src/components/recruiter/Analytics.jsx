import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getRecruiterAnalytics } from "../../lib/api";
import { APPLICATION_STAGES } from "../../lib/applicationStages";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";

function Distribution({ rows }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return <div>{rows.map(row => <div className="distribution-row" key={row.label}><div><span>{row.label}</span><strong>{row.count}</strong></div><div className="distribution-track" aria-hidden="true"><div style={{ width: `${total ? row.count / total * 100 : 0}%` }} /></div></div>)}</div>;
}
export function AnalyticsSummary({ data }) {
  const scores = data.scoreDistribution || [];
  const matchedCount = scores.reduce((sum, bucket) => sum + bucket.count, 0);
  return <section aria-label="Hiring activity">
    <div className="metric-strip"><div><span>Total roles</span><strong>{data.totalJobs}</strong><p>All roles you have posted</p></div><div><span>Open roles</span><strong>{data.openJobs}</strong><p>Currently accepting applications</p></div><div><span>Applications</span><strong>{data.totalApplications}</strong><p>Across your roles</p></div></div>
    <div className="analytics-grid"><section className="analysis-panel"><div className="page-eyebrow">Current positions</div><h2>Applications by stage</h2><p>Where applications stand now. These are current counts, not conversion rates.</p><Distribution rows={APPLICATION_STAGES.map(stage => ({ label: stage.label, count: data.funnel?.[stage.key] || 0 }))} />{!data.totalApplications && <p>No applications yet. Counts will appear as candidates apply.</p>}</section><section className="analysis-panel"><div className="page-eyebrow">Matching results</div><h2>How scores are distributed</h2><p>{matchedCount} scored results. Scores describe alignment with role requirements, not hiring outcomes.</p><Distribution rows={scores} />{!matchedCount && <p>No scored results yet. Run matching for a role to populate this view.</p>}</section></div>
  </section>;
}
export default function Analytics() {
  const { token } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const result = await getRecruiterAnalytics(token); if (result.success) setData(result.data); else setError(result.message || "Could not load analytics."); }
    catch { setError("Could not load analytics. Try again."); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { load(); }, [load]);
  if (loading) return <p className="context-note" role="status">Loading hiring activity…</p>;
  if (error) return <><Alert message={error} /><Btn variant="secondary" onClick={load}>Try again</Btn></>;
  return data ? <AnalyticsSummary data={data} /> : null;
}
