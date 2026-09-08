import { useState } from "react";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import Btn from "../ui/Btn";
import Alert from "../ui/Alert";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { deleteMyAccount } from "../../lib/api";

function DeleteAccountDialog({ onClose }) {
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    const r = await deleteMyAccount(token);
    if (r.success) {
      await logout();
    } else {
      setLoading(false);
      setError(r.message || "Could not delete your account. Please try again.");
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={420}>
      <h3 className="mb-3 text-xl font-bold text-foreground">Delete your account?</h3>
      <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
        This deactivates your account immediately and signs you out everywhere. This can't be undone from the app —
        contact support if you need it reversed.
      </p>
      <Alert message={error} variant="error" />
      <div className="flex gap-2.5">
        <Btn variant="secondary" fullWidth onClick={onClose} disabled={loading}>Cancel</Btn>
        <Btn variant="danger" fullWidth onClick={handleDelete} disabled={loading}>
          {loading ? <Spinner size={16} /> : "Delete account"}
        </Btn>
      </div>
    </Modal>
  );
}

export default function Nav({ onContactClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDelete, setShowDelete] = useState(false);
  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const roleLabel = isAdmin ? "Admin" : isRecruiter ? "Recruiter" : "Candidate";

  return (
    <nav
      className="sticky top-0 z-[200] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3 backdrop-blur-md sm:px-8 sm:py-3.5"
      style={{ background: "color-mix(in srgb, var(--background) 90%, transparent)" }}
    >
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="flex items-center gap-2.5">
        <span className="brand-mark" aria-hidden="true" />
        <span className="text-xl font-bold tracking-tight text-foreground">HireSignal</span>
        {user && (
          <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
            {roleLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Btn
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="px-2"
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Btn>
        <Btn id="nav-contact-btn" variant="ghost" size="sm" onClick={onContactClick} className="hidden sm:inline-flex">
          Contact Us
        </Btn>

        {user && (
          <>
            <details className="account-menu"><summary>Account</summary><div><div className="page-eyebrow mb-3">Your account</div><p className="break-words text-sm font-medium">{user.fullName}</p><p className="mb-4 break-words text-xs text-muted-foreground">{user.email}</p><p className="mb-4 text-xs text-muted-foreground">{roleLabel} workspace</p><div className="flex flex-col gap-2"><Btn variant="secondary" size="sm" onClick={logout}>Sign out</Btn><Btn variant="ghost" size="sm" onClick={() => setShowDelete(true)}>Delete account</Btn></div></div></details>
          </>
        )}
      </div>

      {showDelete && <DeleteAccountDialog onClose={() => setShowDelete(false)} />}
    </nav>
  );
}
