import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Btn from "../components/ui/Btn";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";

export default function ResetPasswordPage({ onReset = resetPassword, signInPath = "/" }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault(); if (loading || !token) return;
    if (password !== confirmation) { setError("The passwords don’t match. Please check both fields."); return; }
    if (password.length < 8) { setError("Use at least 8 characters."); return; }
    setLoading(true); setError(null);
    try { const result = await onReset(token, password); if (result.success) setSuccess(true); else setError(result.message || "Could not reset your password. Try requesting a new link."); }
    catch { setError("Could not reset your password. Try again."); }
    finally { setLoading(false); }
  }
  return <AuthLayout title={success ? "Your password is updated." : "Choose a new password."} subtitle={success ? "You can now sign in with your new password." : "Use at least 8 characters and a password you don’t use elsewhere."}>
    <Alert message={error} />
    {!token ? <div className="context-note">This reset link is incomplete. Request a new link to continue.<button className="text-link mt-3" onClick={() => navigate("/forgot-password")}>Request a new reset link →</button></div> : success ? <Btn fullWidth onClick={() => navigate(signInPath)}>Continue to sign in</Btn> : <form onSubmit={submit} aria-busy={loading}>
      <FormField label="New password"><input type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></FormField>
      <FormField label="Confirm new password"><input type={visible ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></FormField>
      <button className="text-link mb-4" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Hide passwords" : "Show passwords"}</button><Btn fullWidth type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</Btn>
    </form>}
    {!success && <button className="text-link mt-6" onClick={() => navigate(signInPath)}>← Back to sign in</button>}
  </AuthLayout>;
}
