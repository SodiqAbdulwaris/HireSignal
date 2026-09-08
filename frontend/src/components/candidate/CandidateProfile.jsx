import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { educationLabel } from "../../lib/jobLabels";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";

function years(entry) {
  if (!entry.startYear && !entry.endYear) return "Dates not provided";
  return `${entry.startYear || "Start year not provided"} — ${entry.endYear || "End year not provided"}`;
}
export default function CandidateProfile() {
  const { profile, handleAcceptParsedName: onAcceptParsedName } = useOutletContext();
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  if (!profile) return <div className="empty-panel"><div className="page-eyebrow">Tell your story</div><h2>Your experience belongs here.</h2><p>Upload a resume to create your profile, then review the extracted information before applying.</p><Link className="text-link" to="/resume">Add your resume →</Link></div>;
  const name = profile.fullName || "Name not provided";
  const differentName = profile.parsedFullName && profile.parsedFullName.trim().toLowerCase() !== name.trim().toLowerCase();
  async function acceptName() {
    if (!onAcceptParsedName || accepting) return;
    setAccepting(true); setMessage(null); setError(null);
    try {
      const result = await onAcceptParsedName();
      if (result.success) setMessage("Account name updated from your resume.");
      else setError(result.message || "Could not update your name.");
    } catch { setError("Could not update your name. Try again."); }
    finally { setAccepting(false); }
  }
  return <div className="profile-layout">
    <aside className="profile-summary"><div className="page-eyebrow">Your profile</div><h2>{name}</h2><dl className="profile-contact"><div><dt>Email</dt><dd>{profile.email || "Not provided"}</dd></div><div><dt>Phone</dt><dd>{profile.phone || "Not provided"}</dd></div><div><dt>Location</dt><dd>{profile.location || "Not provided"}</dd></div></dl><dl className="detail-facts"><div><dt>Experience</dt><dd>{profile.yearsExperience == null ? "Not provided" : `${profile.yearsExperience} years`}</dd></div><div><dt>Education</dt><dd>{educationLabel(profile.educationLevel)}</dd></div></dl><div className="context-note">Built from your resume. Check that the details reflect your experience.<Link className="text-link mt-3 block" to="/resume">Manage resumes →</Link></div></aside>
    <div className="profile-body"><Alert message={error} /><Alert message={message} variant="success" />
      {differentName && <div className="inline-confirm mb-6"><div><h3>A different name was found</h3><p>Your resume says <strong>{profile.parsedFullName}</strong>. You can use this as your account name.</p></div><Btn variant="secondary" disabled={accepting} onClick={acceptName}>{accepting ? "Updating…" : "Accept resume name"}</Btn></div>}
      <section className="profile-section"><div className="section-heading"><h2>Skills</h2><span>{profile.skills?.length || 0} listed</span></div>{profile.skills?.length ? <ul className="skill-list">{profile.skills.map(skill => <li key={skill}>{skill}</li>)}</ul> : <p>No skills were extracted from your resume.</p>}</section>
      <section className="profile-section"><h2>Experience</h2>{profile.experience?.length ? profile.experience.map((entry, index) => <article className="timeline-entry" key={index}><div><h3>{entry.role || "Role not provided"}</h3><p>{entry.company || "Company not provided"}</p></div><span>{years(entry)}</span></article>) : <p>No work experience was extracted. Projects and education can also help describe what you bring.</p>}</section>
      <section className="profile-section"><h2>Education</h2>{profile.education?.length ? profile.education.map((entry, index) => <article className="timeline-entry" key={index}><div><h3>{entry.degree || "Qualification not provided"}</h3><p>{entry.institution || "Institution not provided"}</p></div><span>{years(entry)}</span></article>) : <p>No education details were extracted.</p>}</section>
      <section className="profile-section"><h2>Projects</h2>{profile.projects?.length ? profile.projects.map((project, index) => <article className="timeline-entry" key={index}><div><h3>{project.name || "Untitled project"}</h3><p>{project.technologies?.join(" · ") || "No technologies listed"}</p></div></article>) : <p>No projects were extracted from your resume.</p>}</section>
      {profile.certifications?.length > 0 && <section className="profile-section"><h2>Certifications</h2><ul className="space-y-3 text-sm">{profile.certifications.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
    </div>
  </div>;
}
