import { useOutletContext, useNavigate } from "react-router-dom";
import { educationLabel, experienceLabel } from "../../lib/jobLabels";
import Btn from "../ui/Btn";

export default function RecruiterJobs() {
  const { jobs, onViewMatch, onPost, onToggleJobStatus, hasMore, loadingMore, onLoadMore } = useOutletContext();
  const navigate = useNavigate();
  const openCount = jobs.filter(job => job.isOpen).length;
  return <section aria-label="Your roles">
    <div className="summary-line"><span><strong>{jobs.length}</strong>{hasMore ? "roles loaded" : "roles"}</span><span><strong>{openCount}</strong>{hasMore ? "open in this list" : "open"}</span><span><strong>{jobs.length - openCount}</strong>{hasMore ? "closed in this list" : "closed"}</span></div>
    {!jobs.length ? <div className="context-note"><h3 className="mb-2 font-semibold text-foreground">Your next hire starts with a role.</h3><p className="mb-5">Describe the work and the requirements so candidates can decide whether to apply.</p><Btn onClick={onPost}>Post your first job</Btn></div> : <div className="role-list">{jobs.map(job => <article key={job._id} className="role-item"><div><div className="flex items-start gap-4"><h3 className="text-lg font-semibold">{job.title}</h3><span className="mt-1 text-xs text-muted-foreground">{job.isOpen ? "Open" : "Closed"}</span></div><p className="decision-meta">{experienceLabel(job.requiredExperienceYears)} · {educationLabel(job.requiredEducationLevel)}</p><p className="decision-skills">{job.requiredSkills?.slice(0, 4).join(" · ") || "No required skills specified"}{job.requiredSkills?.length > 4 && ` · +${job.requiredSkills.length - 4} more`}</p></div><div className="role-actions"><Btn onClick={() => onViewMatch(job, false)}>Review candidates</Btn><Btn variant="secondary" onClick={() => navigate(`/recruiter/jobs/${job._id}/pipeline`)}>Pipeline</Btn><details><summary className="min-h-11 py-3 text-sm text-muted-foreground">Manage role</summary><div className="mt-2 flex flex-wrap gap-2"><Btn variant="secondary" onClick={() => onViewMatch(job, true)}>Run matching</Btn><Btn variant="secondary" onClick={() => onToggleJobStatus?.(job._id, job.isOpen)}>{job.isOpen ? "Close Role" : "Reopen Role"}</Btn></div></details></div></article>)}</div>}
    {hasMore && <div className="mt-7"><Btn variant="secondary" onClick={onLoadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more roles"}</Btn></div>}
  </section>;
}
