import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { createJob } from "../../lib/api";
import Alert from "../ui/Alert";
import FormField from "../ui/FormField";
import Btn from "../ui/Btn";
import Spinner from "../ui/Spinner";

const MATCHING_OPTIONS = [
  { key: "default", label: "Use the usual balance" },
  { key: "skills", label: "Having the right skills" },
  { key: "experience", label: "Having more work experience" },
];
export function matchingWeights(mode) {
  if (mode === "skills") return { skills: .6, experience: .15, semantic: .2, education: .05 };
  if (mode === "experience") return { skills: .25, experience: .5, semantic: .2, education: .05 };
  return undefined;
}

export function JobForm({ onCreate, onPosted = () => {} }) {
  const [form, setForm] = useState({
    title: "", description: "", requiredSkills: "", preferredSkills: "",
    requiredEducationLevel: "any", requiredExperienceYears: "",
  });
  const [matching, setMatching] = useState("default");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const weights = matchingWeights(matching);

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) { setError("Title and description are required."); return; }
    setLoading(true); setError(null); setSuccess(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      preferredSkills: form.preferredSkills.split(",").map((s) => s.trim()).filter(Boolean),
      requiredEducationLevel: form.requiredEducationLevel,
      requiredExperienceYears: parseInt(form.requiredExperienceYears || "0"),
      ...(weights && { weights }),
    };
    const r = await onCreate(payload);
    setLoading(false);
    if (r.success) {
      setSuccess("Role posted.");
      setForm({ title: "", description: "", requiredSkills: "", preferredSkills: "", requiredEducationLevel: "any", requiredExperienceYears: "" });
      setMatching("default");
      onPosted();
    } else {
      setError(r.message);
    }
  }

  return (
    <div className="work-form-layout">
      <section className="work-form-panel">
        <div className="page-eyebrow">The opportunity</div><h2 className="work-form-title">Give candidates a clear picture.</h2><p className="work-form-copy">Describe the work first, then separate essential requirements from useful extras.</p>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <form onSubmit={event => { event.preventDefault(); if (!loading) handleSubmit(); }}>
          <FormField label="Job title *">
            <input placeholder="e.g. Customer Service Assistant" value={form.title} onChange={update("title")} required />
          </FormField>
          <FormField label="Description *">
            <textarea rows={7} placeholder="Describe the role, responsibilities, team, and expectations..." value={form.description} onChange={update("description")} required className="resize-y" />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Minimum education">
              <select value={form.requiredEducationLevel} onChange={update("requiredEducationLevel")}>
                <option value="any">Any</option>
                <option value="olevel">O-Level / High School</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </FormField>
            <FormField label="Years of experience">
              <input type="number" min="0" placeholder="0" value={form.requiredExperienceYears} onChange={update("requiredExperienceYears")} />
            </FormField>
          </div>
          <FormField label="Required skills" hint="separate each skill with a comma">
            <input placeholder="Customer service, organisation, written communication" value={form.requiredSkills} onChange={update("requiredSkills")} />
          </FormField>
          <FormField label="Preferred skills" hint="comma separated">
            <input placeholder="Excel, a second language" value={form.preferredSkills} onChange={update("preferredSkills")} />
          </FormField>

          <div className="matching-simple">
            <label htmlFor="matching-focus">What matters most for this role? <span>Optional</span></label>
            <select id="matching-focus" value={matching} onChange={event => setMatching(event.target.value)} aria-describedby="matching-help">{MATCHING_OPTIONS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select>
            <p id="matching-help">Not sure? Leave it as it is. This helps order your candidate matches; you still decide who to hire.</p>
          </div>

          <Btn variant="primary" type="submit" disabled={loading} className="mt-1.5">
            {loading ? <Spinner size={16} /> : "Publish role"}
          </Btn>
        </form>
      </section>
      <aside className="work-form-guide"><h2>Before you publish</h2><dl><dt>Make the work concrete</dt><dd>Explain the responsibilities and what a typical week involves.</dd><dt>Help people decide</dt><dd>Include company, location, work arrangement and pay information in the description when available.</dd><dt>Keep requirements intentional</dt><dd>Use required skills for essentials. Put skills someone can learn on the job under preferred skills.</dd></dl><div className="context-note">Publishing makes this role available for candidates to apply.</div></aside>
    </div>
  );
}

export default function PostJobView() { const { token, onPosted } = useOutletContext(); return <JobForm onCreate={payload => createJob(payload, token)} onPosted={onPosted} />; }
