import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Btn from "../components/ui/Btn";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";

export default function ForgotPasswordPage({ onRequest = forgotPassword, signInPath = "/" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault(); if (loading) return;
    setLoading(true); setError(null);
    try { const result = await onRequest(email.trim()); if (result.success) setSent(true); else setError(result.message || "Could not request a reset link. Try again."); }
    catch { setError("Could not request a reset link. Try again."); }
    finally { setLoading(false); }
  }
  return <AuthLayout title={sent ? "Check your inbox." : "Let’s get you back in."} subtitle={sent ? "If this email is registered, a reset link will arrive shortly." : "Enter the email you use for HireSignal. We’ll send instructions to reset your password."}>
    <Alert message={error} />
    {sent ? <div className="context-note" role="status">Check your spam folder too. Open the link in the email to choose a new password.</div> : <form onSubmit={submit} aria-busy={loading}><FormField label="Email address"><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></FormField><Btn fullWidth type="submit" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Btn></form>}
    <button className="text-link mt-6" onClick={() => navigate(signInPath)}>← Back to sign in</button>
  </AuthLayout>;
}
