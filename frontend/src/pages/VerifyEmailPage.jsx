import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail, resendVerification } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Btn from "../components/ui/Btn";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";

export default function VerifyEmailPage({ onVerify = verifyEmail, onResend = resendVerification, signInPath = "/" }) {
  const [params] = useSearchParams(); const token = params.get("token"); const navigate = useNavigate();
  const [loading, setLoading] = useState(Boolean(token));
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    let active = true;
    setVerified(false); setError(null); setLoading(Boolean(token));
    if (!token) return;
    (async () => { try { const result = await onVerify(token); if (active) { setVerified(Boolean(result.success)); if (!result.success) setError(result.message || "This verification link could not be used. Request another below."); } } catch { if (active) setError("Could not verify your email. Please try again."); } finally { if (active) setLoading(false); } })();
    return () => { active = false; };
  }, [token, onVerify]);
  async function resend(event) {
    event.preventDefault(); if (sending) return; setSending(true); setError(null); setMessage(null);
    try { const result = await onResend(email.trim()); if (result.success) setMessage("If this email is registered and unverified, a new link will arrive shortly."); else setError(result.message || "Could not send a new link. Try again."); }
    catch { setError("Could not send a new link. Try again."); }
    finally { setSending(false); }
  }
  return <AuthLayout title={verified ? "Your email is verified." : "Verify your email."} subtitle={verified ? "Your account is ready. Sign in to continue." : "Confirm your email address to finish setting up your account."}>
    {loading ? <p className="context-note" role="status">Checking your verification link…</p> : verified ? <Btn fullWidth onClick={() => navigate(signInPath)}>Continue to sign in</Btn> : <><Alert message={error} /><Alert message={message} variant="success" />{!token && <p className="context-note mb-5">Open the verification link in your email, or request a new one below.</p>}<form onSubmit={resend}><FormField label="Email address"><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></FormField><Btn fullWidth type="submit" disabled={sending}>{sending ? "Sending…" : "Send a new verification link"}</Btn></form></>}
    {!verified && <button className="text-link mt-6" onClick={() => navigate(signInPath)}>← Back to sign in</button>}
  </AuthLayout>;
}
