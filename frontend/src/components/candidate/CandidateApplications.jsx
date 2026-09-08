import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { fmtDate } from "../../lib/utils";
import { APPLICATION_STAGES, applicationStage } from "../../lib/applicationStages";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";

export default function CandidateApplications() {
  const { applications, handleCancelApplication: onCancel } = useOutletContext();
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  async function cancel(application) {
    if (!onCancel || cancellingId) return;
    setCancellingId(application._id); setError(null); setMessage(null);
    try {
      const result = await onCancel(application.job?._id || application.job);
      if (result.success) { setConfirmId(null); setMessage("Application withdrawn."); }
      else setError(result.message || "Could not withdraw the application. Try again.");
    } catch { setError("Could not withdraw the application. Try again."); }
    finally { setCancellingId(null); }
  }
  const visible = applications.filter(item => filter === "all" || item.status === filter);
  return <section aria-label="Your applications">
    <Alert message={error} /><Alert message={message} variant="success" />
    {!applications.length ? <div className="empty-panel"><div className="page-eyebrow">A place for your progress</div><h2>No applications yet.</h2><p>When you apply for a role, its status will appear here. Start by exploring the requirements of open roles.</p><Link className="text-link" to="/jobs">Find your first opportunity →</Link></div> : <>
      <div className="section-toolbar"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{applications.length}</strong> applications in one place</p><label className="filter-label">Show status<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All applications</option>{APPLICATION_STAGES.map(stage => <option value={stage.key} key={stage.key}>{stage.label}</option>)}</select></label></div>
      <div className="record-list">{visible.map(application => {
        const stage = applicationStage(application.status);
        return <article className="application-record" key={application._id}>
          <div><span className="record-status">{stage.label}</span><h2>{application.job?.title || "Role no longer available"}</h2><p className="record-meta">Applied {fmtDate(application.appliedAt)}</p></div>
          <div><p className="status-explanation">{stage.description}</p><p className="record-meta">{application.status === "rejected" ? "You can continue exploring other opportunities." : "Check here for updates. No additional step is shown for this application."}</p></div>
          <div className="record-options"><details><summary>Manage application</summary><div className="mt-3"><Btn variant="secondary" disabled={Boolean(cancellingId)} onClick={() => setConfirmId(application._id)}>Withdraw application</Btn></div></details></div>
          {confirmId === application._id && <div className="inline-confirm" role="group" aria-label={`Withdraw ${application.job?.title || "application"}`}><p>Withdraw your application for <strong>{application.job?.title || "this role"}</strong>?</p><div className="flex flex-wrap gap-2"><Btn variant="secondary" disabled={Boolean(cancellingId)} onClick={() => setConfirmId(null)}>Keep application</Btn><Btn variant="danger" disabled={Boolean(cancellingId)} onClick={() => cancel(application)}>{cancellingId === application._id ? "Withdrawing…" : "Confirm withdrawal"}</Btn></div></div>}
        </article>;
      })}{!visible.length && <div className="p-6 text-sm text-muted-foreground">No applications have this status.</div>}</div>
    </>}
  </section>;
}
