import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authLogin, authRegister, resendVerification } from "../lib/api";
import AuthLayout from "../components/layout/AuthLayout";
import Alert from "../components/ui/Alert";
import FormField from "../components/ui/FormField";
import Btn from "../components/ui/Btn";
import Spinner from "../components/ui/Spinner";
import Tabs from "../components/ui/Tabs";

export function AuthForm({ login, onLogin = authLogin, onRegister = authRegister, onResend = resendVerification, onForgotPassword }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "candidate" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(null);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified. You can now log in.");
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate]);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function switchTab(key) {
    setTab(key);
    setError(null);
    setSuccessMsg(null);
    setShowResend(false);
    setResendSuccess(null);
  }

  async function handleLogin() {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true); setError(null); setShowResend(false); setResendSuccess(null);
    const r = await onLogin({ email: form.email, password: form.password });
    setLoading(false);
    if (r.success) {
      login(r.data.token, r.data.user);
    } else {
      setError(r.message);
      if (r.data?.needsVerification) {
        setShowResend(true);
      }
    }
  }

  async function handleRegister() {
    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true); setError(null); setSuccessMsg(null);
    const r = await onRegister({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role
    });
    setLoading(false);
    if (r.success) {
      if (r.data?.needsVerification) {
        setTab("login");
        setSuccessMsg(r.message);
        setShowResend(true);
      } else {
        login(r.data.token, r.data.user);
      }
    } else {
      setError(r.message);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true); setError(null); setResendSuccess(null);
    const r = await onResend(form.email);
    setResendLoading(false);
    if (r.success) {
      setResendSuccess("Verification email resent. Please check your inbox.");
      setShowResend(false);
    } else {
      setError(r.message || "Failed to resend verification email.");
    }
  }


  return (
    <AuthLayout
      title={tab === "login" ? "Welcome back." : "Create your account"}
      subtitle={tab === "login" ? "Sign in to pick up where you left off." : form.role === "candidate" ? "Find opportunities and follow your applications." : "Post roles and review candidates with context."}
      audience={form.role}
    >
      <Tabs tabs={[{ key: "login", label: "Sign in" }, { key: "register", label: "Create account" }]} active={tab} onChange={(key) => { switchTab(key); setShowPassword(false); }} />
      <Alert message={error} variant="error" />
      <Alert message={successMsg} variant="success" />
      <Alert message={resendSuccess} variant="success" />
      <form onSubmit={(event) => { event.preventDefault(); if (!loading) { if (tab === "login") handleLogin(); else handleRegister(); } }} aria-busy={loading}>
        {tab === "register" && <>
          <div className="intent-options" role="group" aria-label="I want to">
            <button type="button" aria-pressed={form.role === "candidate"} onClick={() => setForm(f => ({ ...f, role: "candidate" }))}>Find a job<small>For job seekers</small></button>
            <button type="button" aria-pressed={form.role === "recruiter"} onClick={() => setForm(f => ({ ...f, role: "recruiter" }))}>Hire people<small>For hiring teams</small></button>
          </div>
          <FormField label="Full name"><input autoComplete="name" placeholder="Your full name" value={form.fullName} onChange={update("fullName")} required /></FormField>
        </>}
        <FormField label="Email"><input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update("email")} required /></FormField>
        <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium">Password{tab === "register" && <span className="ml-2 text-xs font-normal text-muted-foreground">At least 8 characters</span>}</label>
        <div className="password-field"><input id="auth-password" autoComplete={tab === "login" ? "current-password" : "new-password"} type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={update("password")} minLength={tab === "register" ? 8 : undefined} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div>
        {tab === "login" && <div className="mb-5 text-right"><button type="button" onClick={() => onForgotPassword ? onForgotPassword() : navigate("/forgot-password")} className="min-h-11 text-sm text-primary hover:underline">Forgot password?</button></div>}
        <Btn type="submit" fullWidth disabled={loading}>{loading ? <><Spinner size={16} /> {tab === "login" ? "Signing in…" : "Creating account…"}</> : tab === "login" ? "Sign in" : "Create account"}</Btn>
      </form>
      {showResend && <button type="button" onClick={handleResendVerification} disabled={resendLoading} className="mt-4 min-h-11 text-sm text-primary underline">{resendLoading ? "Resending..." : "Resend verification email"}</button>}
    </AuthLayout>
  );
}

export default function AuthPage() { const { login } = useAuth(); return <AuthForm login={login} />; }
