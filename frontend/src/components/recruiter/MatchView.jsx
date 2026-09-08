import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, BarChartIcon } from "@radix-ui/react-icons";
import { useAuth } from "../../context/AuthContext";
import { downloadMatchResultsCsv, getMatchResults, getJob, triggerMatch, toggleShortlist } from "../../lib/api";
import Alert from "../ui/Alert";
import Spinner from "../ui/Spinner";
import Btn from "../ui/Btn";
import Badge from "../ui/Badge";
import SkeletonBlock from "../ui/SkeletonBlock";
import MatchResultCard from "./MatchResultCard";
import Nav from "../layout/Nav";

export default function MatchView({ onContactClick }) {
  const { jobId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savingId, setSavingId] = useState(null);
  const panel = useRef(null);
  const lastRow = useRef(null);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const autoRun = state?.autoRun ?? false;

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastMatchedAt, setLastMatchedAt] = useState(null);

  // Load the job record first so we can display the title
  useEffect(() => {
    async function fetchJob() {
      setJobLoading(true);
      const r = await getJob(jobId, token);
      if (r.success) setJob(r.data);
      setJobLoading(false);
    }
    fetchJob();
  }, [jobId, token]);

  const loadMatches = useCallback(async (cursor = null) => {
    if (cursor) setLoadingMore(true);
    else setFetching(true);
    setError(null);
    const r = await getMatchResults(jobId, token, cursor);
    if (r.success) {
      setResults(prev => cursor ? [...prev, ...r.data.items] : r.data.items);
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
      setLastMatchedAt(r.data.lastMatchedAt);
    } else {
      setError(r.message);
    }
    setLoadingMore(false);
    setFetching(false);
  }, [jobId, token]);

  useEffect(() => {
    async function loadAndRun() {
      await loadMatches();
      if (autoRun) {
        setLoading(true); setError(null);
        const matchRes = await triggerMatch(jobId, token);
        setLoading(false);
        if (matchRes.success) await loadMatches();
        else setError(matchRes.message);
      }
    }
    loadAndRun();
  }, [jobId, token, autoRun]);

  const runMatch = async () => {
    setLoading(true); setError(null);
    const r = await triggerMatch(jobId, token);
    setLoading(false);
    if (r.success) await loadMatches();
    else setError(r.message);
  };

  const exportCsv = async () => {
    setExporting(true); setError(null);
    const result = await downloadMatchResultsCsv(jobId, token);
    setExporting(false);
    if (!result.success) { setError(result.message); return; }
    const url = URL.createObjectURL(result.data.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.data.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleToggleShortlist = async (matchId, currentlyShortlisted) => {
    if (savingId) return;
    setSavingId(matchId);
    const nextVal = !currentlyShortlisted;
    setError(null);
    const r = await toggleShortlist(jobId, matchId, nextVal, token);
    setSavingId(null);
    if (r.success) setResults(prev => prev.map(m => m._id === matchId ? { ...m, shortlisted: nextVal } : m));
    else setError(r.message);
  };

  const selectedMatch = results.find(match => match._id === searchParams.get("candidate")) || results[0];
  useEffect(() => { if (searchParams.get("candidate")) panel.current?.focus({ preventScroll: true }); }, [searchParams.get("candidate")]);
  const title = jobLoading ? "Loading…" : (job?.title ?? "Job");

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div id="main-content" role="main" tabIndex={-1} className="app-main">
        <div className="fade-up mb-6 flex flex-wrap items-center gap-4">
          <Btn variant="secondary" size="sm" onClick={() => navigate("/recruiter/jobs")}><ArrowLeftIcon /> Back</Btn>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
            <div className="text-xs text-muted-foreground">Review candidates with context</div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {results.length > 0 && <Badge variant="blue">{results.length} candidates{hasMore ? " loaded" : ""}</Badge>}
            {results.length > 0 && (
              <Btn variant="secondary" size="sm" onClick={exportCsv} disabled={exporting}>
                {exporting ? <Spinner size={14} /> : "Export CSV"}
              </Btn>
            )}
            <Btn variant="primary" size="sm" onClick={runMatch} disabled={loading}>
              {loading ? <><Spinner size={14} />Running…</> : <>Run matching</>}
            </Btn>
          </div>
        </div>
        <p className="context-note mb-6">Compare the requirements with each profile. Matching supports your review; it does not make a hiring decision.</p>
        <Alert message={error} variant="error" />
        {fetching ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-[14px] border border-border bg-card p-6">
                <SkeletonBlock height={16} width="40%" />
                <div className="mt-3"><SkeletonBlock height={5} /></div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BarChartIcon width={40} height={40} className="mx-auto mb-4 opacity-30" />
            <p className="mb-5">
              {lastMatchedAt
                ? "AI matching ran, but no candidates matched — check that anyone has applied to this job yet."
                : "No match results yet. Run AI matching to rank candidates."}
            </p>
            <Btn variant="primary" onClick={runMatch} disabled={loading}>
              {loading ? <><Spinner size={16} />Matching…</> : <>Run matching</>}
            </Btn>
          </div>
        ) : (
          <div className={`review-layout ${searchParams.get("candidate") ? "show-detail" : ""}`}>
            <div className="review-list" aria-label="Candidates">
              {results.map((match, index) => { const candidate = match.candidate || {}; return <button type="button" key={match._id || index} className="decision-row" aria-pressed={selectedMatch === match} onClick={event => { lastRow.current = event.currentTarget; setSearchParams(previous => { const next = new URLSearchParams(previous); next.set("candidate", match._id); return next; }); }}>
                <div className="flex items-start justify-between gap-3"><h3>{candidate.fullName || "Candidate"}</h3><span className="shrink-0 text-xs text-muted-foreground">{match.shortlisted ? "Shortlisted" : "Not shortlisted"}</span></div>
                <p className="decision-meta">{candidate.yearsExperience != null ? candidate.yearsExperience + " years experience" : "Experience not provided"}</p>
                <p className="decision-skills">{match.matchedSkills?.length ? match.matchedSkills.slice(0, 4).join(" · ") : "No matched skills listed"}</p>
                <span className="mt-4 block text-xs text-muted-foreground">View match evidence →</span>
              </button>; })}
            </div>
            <article ref={panel} tabIndex={-1} className="detail-panel" aria-label="Candidate details"><button type="button" className="detail-back" onClick={() => { setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete("candidate"); return next; }); requestAnimationFrame(() => lastRow.current?.focus({ preventScroll: true })); }}>← Back to candidates</button>{selectedMatch && <MatchResultCard key={selectedMatch._id} match={selectedMatch} onToggleShortlist={handleToggleShortlist} pending={savingId === selectedMatch._id} />}</article>
          </div>
        )}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Btn variant="secondary" onClick={() => loadMatches(nextCursor)} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load More Candidates"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
