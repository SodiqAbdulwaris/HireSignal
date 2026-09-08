export default function AuthLayout({ title, subtitle, children, audience = "candidate" }) {
  const hiring = audience === "recruiter";
  const steps = hiring
    ? [["Define what the role needs", "Set out the experience and skills that matter."], ["Review people with context", "See how each profile relates to your requirements."], ["Keep your hiring organized", "Manage your roles, shortlists and applicants."]]
    : [["Find the right starting point", "See requirements before you apply."], ["Bring your experience into focus", "Build your profile from your resume."], ["Know where you stand", "Keep your applications in one place."]];
  return (
    <div className="auth-shell">
      <header className="auth-nav"><span className="brand-mark" aria-hidden="true" /><span className="auth-brand">HireSignal</span></header>
      <main className="auth-columns">
        <aside className="auth-story" aria-label="About HireSignal">
          <div className="page-eyebrow">{hiring ? "Make room for good people" : "Make your next move"}</div>
          <h2>Good work starts with a clear view.</h2>
          <p>{hiring ? "Understand the experience behind each application. Give your next hiring decision the context it needs." : "Understand the role. Show what you bring. Keep track of what happens next."}</p>
          <div className="auth-steps">{steps.map(([heading, copy], index) => <div className="auth-step" key={heading}><span>0{index + 1}</span><div><h3>{heading}</h3><p>{copy}</p></div></div>)}</div>
        </aside>
        <section className="auth-form"><div className="page-eyebrow">Your next chapter</div><h1>{title}</h1>{subtitle && <p className="auth-intro">{subtitle}</p>}{children}</section>
      </main>
    </div>
  );
}
