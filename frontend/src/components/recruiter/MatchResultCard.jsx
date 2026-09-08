import { educationLabel } from "../../lib/jobLabels";
import Btn from "../ui/Btn";

export default function MatchResultCard({ match, onToggleShortlist, pending = false }) {
  const candidate = typeof match.candidate === "object" && match.candidate ? match.candidate : {};
  const breakdown = match.scoreBreakdown || {};
  const score = Number.isFinite(match.totalScore) ? `${Math.round(match.totalScore * 100)}%` : "Unavailable";
  return <div>
    <div className="page-eyebrow">Candidate overview</div>
    <h2>{candidate.fullName || "Candidate"}</h2>
    <p className="text-muted-foreground">{candidate.yearsExperience != null ? `${candidate.yearsExperience} years experience` : "Experience not provided"} · {educationLabel(candidate.educationLevel)}</p>
    <dl className="detail-facts"><div><dt>Required skills found</dt><dd>{match.matchedSkills?.join(", ") || "None listed"}</dd></div><div><dt>Not found in profile</dt><dd>{match.missingSkills?.join(", ") || "None listed"}</dd></div></dl>
    <section className="detail-section"><h3>What supports this match</h3>
      {match.supportingReasons?.length > 0 && <ul className="mb-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{match.supportingReasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul>}
      {match.explanation && <p className="text-muted-foreground">{match.explanation}</p>}
      {!match.explanation && !match.supportingReasons?.length && <p className="text-muted-foreground">No explanation is available for this result.</p>}
      <p className="mt-4 text-muted-foreground">Extracted information may be incomplete. A skill not found in the profile does not mean the candidate lacks it.</p>
    </section>
    {match.concerns?.length > 0 && <section className="detail-section"><h3>Worth reviewing further</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">{match.concerns.map((concern, index) => <li key={index}>{concern}</li>)}</ul>
    </section>}
    <details className="detail-section"><summary className="min-h-11 py-2 text-sm font-medium text-primary">View score breakdown · {score}</summary><dl className="detail-facts">{Object.entries(breakdown).map(([key, value]) => <div key={key}><dt className="capitalize">{key === "semantic" ? "Resume relevance" : key}</dt><dd>{Number.isFinite(value) ? `${Math.round(value * 100)}%` : "Unavailable"}</dd></div>)}</dl><p className="text-muted-foreground">Scores describe alignment with this role’s requirements. Use them alongside your review of the candidate’s experience.</p></details>
    <section className="detail-section"><h3>Profile and contact</h3><p>{candidate.skills?.join(" · ") || "No profile skills provided."}</p><div className="mt-3 flex flex-col gap-2 text-sm">{candidate.email && <a className="text-primary underline" href={`mailto:${candidate.email}`}>{candidate.email}</a>}{candidate.phone && <a className="text-primary underline" href={`tel:${candidate.phone}`}>{candidate.phone}</a>}{!candidate.email && !candidate.phone && <span className="text-muted-foreground">Contact details are not available.</span>}</div></section>
    <Btn fullWidth variant={match.shortlisted ? "secondary" : "primary"} disabled={pending} onClick={() => onToggleShortlist?.(match._id, Boolean(match.shortlisted))}>{pending ? "Saving…" : match.shortlisted ? "Remove from shortlist" : "Add to shortlist"}</Btn>
    <p className="mt-3 text-muted-foreground" role="status">{match.shortlisted ? "This candidate is on your shortlist." : "Not shortlisted."}</p>
  </div>;
}
