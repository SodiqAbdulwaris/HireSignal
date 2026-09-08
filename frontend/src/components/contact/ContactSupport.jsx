import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { sendContactFeedback } from "../../lib/api";
import Alert from "../ui/Alert";
import Btn from "../ui/Btn";
import FormField from "../ui/FormField";
import Spinner from "../ui/Spinner";

export function SupportForm({ user, onSend }) {
  const [form, setForm] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  async function submitFeedback(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await onSend(form);
    setLoading(false);

    if (result.success) {
      setSuccess("Thanks. Your message has been sent.");
      setForm((current) => ({ ...current, subject: "", message: "" }));
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="work-form-layout">
      <section className="work-form-panel">
        <div className="page-eyebrow">Support</div><h2 className="work-form-title">Tell us what happened.</h2>
        <p className="mb-6 text-[13px] text-muted-foreground">
          Send feedback, report an issue, or ask for help with HireSignal.
        </p>
        <Alert message={error} variant="error" />
        <Alert message={success} variant="success" />
        <form onSubmit={submitFeedback}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name">
              <input value={form.name} onChange={update("name")} required />
            </FormField>
            <FormField label="Email">
              <input type="email" value={form.email} onChange={update("email")} required />
            </FormField>
          </div>
          <FormField label="Subject">
            <input placeholder="What should we know?" value={form.subject} onChange={update("subject")} />
          </FormField>
          <FormField label="Message">
            <textarea
              rows={6}
              placeholder="Share the details..."
              value={form.message}
              onChange={update("message")}
              required
              className="resize-y"
            />
          </FormField>
          <Btn variant="primary" type="submit" disabled={loading} className="mt-1.5">
            {loading ? <Spinner size={16} /> : "Send message"}
          </Btn>
        </form>
      </section>
      <aside className="work-form-guide"><h2>A useful starting point</h2><dl><dt>Describe the issue</dt><dd>Include the page you were using, what you expected, and what happened instead.</dd><dt>Resume details look wrong?</dt><dd>Review the extracted profile against your original file. Mention which information is missing.</dd><dt>Account and appearance</dt><dd>Use the theme control to change appearance. The Account menu contains sign-out and account deletion.</dd></dl>{user && <div className="context-note"><strong className="block text-foreground">Signed in as</strong><span className="block break-words">{user.fullName}</span><span className="block break-words">{user.email}</span></div>}</aside>
    </div>
  );
}

export default function ContactSupport() { const { user } = useOutletContext(); return <SupportForm user={user} onSend={sendContactFeedback} />; }
