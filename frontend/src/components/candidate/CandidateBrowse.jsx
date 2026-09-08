import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { applyToJob } from "../../lib/api";
import { fmtDate } from "../../lib/utils";
import { educationLabel, experienceLabel } from "../../lib/jobLabels";
import ApplyModal from "./ApplyModal";
import Btn from "../ui/Btn";

export default function CandidateBrowse() {
  const { jobs, applications, profile, token, loadAll: onApplied, hasMore, loadingJobs: loadingMore, loadJobsData, nextCursor } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [applying, setApplying] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const panel = useRef(null);
  const lastRow = useRef(null);
  const appliedIds = new Set((applications || []).map(a => a.job?._id || a.job));
  const visibleJobs = jobs.filter(job => `${job.title} ${(job.requiredSkills || []).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const selected = jobs.find(job => job._id === params.get("job")) || visibleJobs[0];
  const showingDetail = Boolean(params.get("job"));
  useEffect(() => {
    if (showingDetail) panel.current?.focus({ preventScroll: true });
  }, [params.get("job")]);
  function selectJob(job, event) {
    lastRow.current = event.currentTarget;
    setParams(previous => { const next = new URLSearchParams(previous); next.set("job", job._id); return next; });
  }
  function closeDetail() {
    setParams(previous => { const next = new URLSearchParams(previous); next.delete("job"); return next; });
    requestAnimationFrame(() => lastRow.current?.focus({ preventScroll: true }));
  }
  async function confirmApply() {
    if (loading || !applying) return;
    setLoading(true); setError(null);
    const result = await applyToJob(applying._id, token);
    setLoading(false);
    if (result.success) { setApplying(null); onApplied(); }
    else setError(result.message);
  }
  return (
    <section aria-label="Job discovery">
      <div className="mb-6 max-w-xl">
        <label htmlFor="job-search" className="mb-2 block text-sm font-medium">Search {hasMore ? "loaded roles" : "roles"}</label>
        <input id="job-search" type="search" placeholder="Role title or required skill" value={query} onChange={event => setQuery(event.target.value)} />
        {hasMore && <p className="mt-2 text-xs text-muted-foreground">Search covers {jobs.length} loaded roles. Load more below to include more results.</p>}
      </div>
      {!jobs.length ? <div className="context-note">No open roles right now. You can update your resume while you wait for new opportunities.</div> : (
        <div className={`browse-layout ${showingDetail ? "show-detail" : ""}`}>
          <div className="browse-list" aria-label="Open roles">
            {!visibleJobs.length && <p className="p-6 text-sm text-muted-foreground">No loaded roles match your search. Try another title or skill.</p>}
            {visibleJobs.map(job => <button key={job._id} type="button" className="decision-row" aria-pressed={selected?._id === job._id} onClick={event => selectJob(job, event)}>
              <div className="flex items-start justify-between gap-3"><h3>{job.title}</h3><span className="shrink-0 text-xs text-muted-foreground">{appliedIds.has(job._id) ? "Applied" : "Open"}</span></div>
              <div className="decision-meta">{experienceLabel(job.requiredExperienceYears)} · {educationLabel(job.requiredEducationLevel)}</div>
              <div className="decision-skills">{job.requiredSkills?.length ? job.requiredSkills.slice(0, 4).join(" · ") : "No required skills specified"}{job.requiredSkills?.length > 4 && ` · +${job.requiredSkills.length - 4} more`}</div>
              <div className="mt-4 flex justify-between gap-2 text-xs text-muted-foreground"><span>Posted {fmtDate(job.createdAt)}</span><span>View role →</span></div>
            </button>)}
          </div>
          <article ref={panel} tabIndex={-1} className="detail-panel" aria-label="Role details">
            <button className="detail-back" type="button" onClick={closeDetail}>← Back to roles</button>
            {selected ? <>
              <div className="page-eyebrow">Role overview</div><h2>{selected.title}</h2>
              <dl className="detail-facts"><div><dt>Experience</dt><dd>{experienceLabel(selected.requiredExperienceYears)}</dd></div><div><dt>Education</dt><dd>{educationLabel(selected.requiredEducationLevel)}</dd></div><div><dt>Posted</dt><dd>{fmtDate(selected.createdAt)}</dd></div><div><dt>Application</dt><dd>{appliedIds.has(selected._id) ? "Already applied" : "Accepting applications"}</dd></div></dl>
              <section className="detail-section"><h3>What you’ll need</h3><p>{selected.requiredSkills?.join(" · ") || "No required skills specified."}</p>{selected.preferredSkills?.length > 0 && <><h3 className="mt-5">Nice to have</h3><p>{selected.preferredSkills.join(" · ")}</p></>}</section>
              <section className="detail-section"><h3>About the work</h3><p className="whitespace-pre-wrap text-muted-foreground">{selected.description || "No description provided."}</p></section>
              {!profile && !appliedIds.has(selected._id) ? <div className="context-note">Add your resume before applying so the recruiter can review your experience.<Link className="mt-2 block font-medium text-primary underline" to="/resume">Add your resume →</Link></div> : appliedIds.has(selected._id) ? <p className="context-note">You’ve applied to this role. <Link to="/applications" className="text-primary underline">View your applications</Link></p> : <Btn fullWidth onClick={() => { setApplying(selected); setError(null); }}>Review application →</Btn>}
            </> : <p className="text-muted-foreground">Select a role to see the requirements.</p>}
          </article>
        </div>
      )}
      {hasMore && <div className="mt-7"><Btn variant="secondary" onClick={() => loadJobsData(nextCursor)} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more roles"}</Btn></div>}
      {applying && <ApplyModal job={applying} onConfirm={confirmApply} onClose={() => { if (!loading) setApplying(null); }} loading={loading} error={error} />}
    </section>
  );
}
