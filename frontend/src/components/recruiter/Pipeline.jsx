import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getJob, getJobApplications, advanceApplicationStage, bulkAdvanceApplicationStage } from "../../lib/api";
import { APPLICATION_STAGES, applicationStage } from "../../lib/applicationStages";
import { fmtDate } from "../../lib/utils";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";
import Nav from "../layout/Nav";

const nameOf = application => application.candidateProfile?.fullName || "Candidate";
export function PipelineContent({ applications, onAdvance, onBulkAdvance }) {
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [target, setTarget] = useState("reviewed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const visible = applications.filter(application => filter === "all" || application.status === filter);
  async function update(operation, copy) {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try { const result = await operation(); if (result.success) { setMessage(copy); setSelected(new Set()); } else setError(result.message || "Could not update the stage."); }
    catch { setError("Could not update the stage. Try again."); }
    finally { setBusy(false); }
  }
  function toggle(id) { setSelected(previous => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
  function stageControl(application) {
    return <label className="stage-control">Stage<select disabled={busy} value={application.status} aria-label={`Stage for ${nameOf(application)}`} onChange={event => { const status = event.target.value; update(() => onAdvance(application._id, status), `${nameOf(application)} moved to ${applicationStage(status).label.toLowerCase()}.`); }}>{APPLICATION_STAGES.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label>;
  }
  function candidate(application) {
    const profile = application.candidateProfile;
    return <div className="pipeline-person"><h3>{nameOf(application)}</h3><p>{profile?.yearsExperience != null ? `${profile.yearsExperience} years experience` : "Experience not provided"}</p><p className="pipeline-skills">{profile?.skills?.slice(0, 4).join(" · ") || "No profile skills available"}{profile?.skills?.length > 4 && ` · +${profile.skills.length - 4} more`}</p><span>Applied {fmtDate(application.appliedAt)}</span></div>;
  }
  return <section aria-label="Applicant pipeline">
    <Alert message={error} /><Alert message={message} variant="success" />
    <div className="section-toolbar"><div className="summary-line mb-0"><span><strong>{applications.length}</strong> applications</span><span><strong>{applications.filter(a => a.status === "pending").length}</strong> awaiting review</span></div><div className="view-switch" aria-label="Pipeline view"><button aria-pressed={view === "list"} onClick={() => setView("list")}>List</button><button aria-pressed={view === "board"} onClick={() => { setView("board"); setSelected(new Set()); }}>Board</button></div></div>
    <div className="stage-filters" aria-label="Filter by stage"><button aria-pressed={filter === "all"} disabled={busy} onClick={() => { setFilter("all"); setSelected(new Set()); }}>All <span>{applications.length}</span></button>{APPLICATION_STAGES.map(stage => <button key={stage.key} aria-pressed={filter === stage.key} disabled={busy} onClick={() => { setFilter(stage.key); setSelected(new Set()); }}>{stage.label}<span>{applications.filter(a => a.status === stage.key).length}</span></button>)}</div>
    {!applications.length ? <div className="empty-panel"><h2>Ready for your first applicant.</h2><p>Applications will appear here when candidates apply for this role.</p></div> : view === "list" ? <>
      <div className="pipeline-bulk"><label><input type="checkbox" disabled={busy || !visible.length} checked={visible.length > 0 && visible.every(a => selected.has(a._id))} onChange={event => setSelected(event.target.checked ? new Set(visible.map(a => a._id)) : new Set())} /> Select visible applicants</label>{selected.size > 0 && <div className="flex flex-wrap items-center gap-3"><span className="text-sm">{selected.size} selected</span><select aria-label="Stage for selected applicants" disabled={busy} value={target} onChange={event => setTarget(event.target.value)}>{APPLICATION_STAGES.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select><Btn disabled={busy} onClick={() => update(() => onBulkAdvance([...selected], target), `${selected.size} applications updated.`)}>{busy ? "Updating…" : "Move selected"}</Btn></div>}</div>
      <div className="record-list">{visible.map(application => <article className="pipeline-record" key={application._id}><input type="checkbox" aria-label={`Select ${nameOf(application)}`} disabled={busy} checked={selected.has(application._id)} onChange={() => toggle(application._id)} />{candidate(application)}{stageControl(application)}</article>)}{!visible.length && <p className="p-6 text-sm text-muted-foreground">No applicants in this stage.</p>}</div>
    </> : <div className="pipeline-board">{APPLICATION_STAGES.filter(stage => filter === "all" || filter === stage.key).map(stage => <section className="pipeline-column" key={stage.key}><div className="section-heading"><h2>{stage.label}</h2><span>{applications.filter(a => a.status === stage.key).length}</span></div>{applications.filter(a => a.status === stage.key).map(application => <article className="pipeline-card" key={application._id}>{candidate(application)}{stageControl(application)}</article>)}{!applications.some(a => a.status === stage.key) && <p className="record-meta">No applicants in this stage.</p>}</section>)}</div>}
  </section>;
}
export default function Pipeline({ onContactClick }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [jobResult, result] = await Promise.all([getJob(jobId, token), getJobApplications(jobId, token)]);
      if (jobResult.success) setJob(jobResult.data);
      if (result.success) setApplications(result.data);
      if (!result.success || !jobResult.success) setError(result.message && !result.success ? result.message : jobResult.message || "Could not load the pipeline.");
    } catch { setError("Could not load the pipeline. Try again."); }
    finally { setLoading(false); }
  }, [jobId, token]);
  useEffect(() => { load(); }, [load]);
  async function advance(id, status) {
    const result = await advanceApplicationStage(jobId, id, status, token);
    if (result.success) setApplications(previous => previous.map(application => application._id === id ? { ...application, status } : application));
    return result;
  }
  async function bulkAdvance(ids, status) {
    const result = await bulkAdvanceApplicationStage(jobId, ids, status, token);
    if (result.success) setApplications(previous => previous.map(application => ids.includes(application._id) ? { ...application, status } : application));
    return result;
  }
  return <><Nav onContactClick={onContactClick} /><main id="main-content" tabIndex={-1} className="app-main"><button className="text-link mb-6" onClick={() => navigate("/recruiter/jobs")}>← Back to roles</button><div className="section-heading mb-7"><div><div className="page-eyebrow">Applicant pipeline</div><h1 className="mt-2 text-3xl font-semibold tracking-tight">{job?.title || "Your applicants"}</h1><p className="mt-3 text-sm text-muted-foreground">See who is waiting, review their experience, and keep each application up to date.</p></div></div>{loading ? <p role="status" className="context-note">Loading applications…</p> : error ? <><Alert message={error} /><Btn variant="secondary" onClick={load}>Try again</Btn></> : <PipelineContent applications={applications} onAdvance={advance} onBulkAdvance={bulkAdvance} />}</main></>;
}
