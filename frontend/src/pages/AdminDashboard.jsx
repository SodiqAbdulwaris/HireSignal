import { useState, useEffect, useCallback } from "react";
import { fmtDate } from "../lib/utils";
import {
  getAdminUsers,
  deactivateAdminUser,
  getAdminJobs,
  getAdminStats,
  getAdminSettings,
  updateAdminSettings,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import Btn from "../components/ui/Btn";
import Badge from "../components/ui/Badge";
import Alert from "../components/ui/Alert";
import SkeletonBlock from "../components/ui/SkeletonBlock";

const TD = "whitespace-nowrap border-b border-border px-3 py-2.5 text-[13px]";

export function StatsGrid({ stats }) {
  const cards = [
    { label: "Candidates", value: stats.totalCandidates },
    { label: "Recruiters", value: stats.totalRecruiters },
    { label: "Jobs (open)", value: `${stats.totalJobs} (${stats.openJobs})` },
    { label: "Jobs matched", value: stats.jobsMatched },
    { label: "Applications", value: stats.totalApplications },
    { label: "Match results", value: stats.totalMatches },
  ];
  return (
    <div className="admin-metrics">
      {cards.map((c) => (
        <div key={c.label} className="admin-metric">
          <div className="mb-1 text-xs text-muted-foreground">{c.label}</div>
          <div className="text-[22px] font-bold text-foreground">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (cursor = null) => {
    setLoading(!cursor);
    const r = await getAdminUsers(token, cursor);
    if (r.success) {
      setUsers((prev) => (cursor ? [...prev, ...r.data.items] : r.data.items));
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    } else setError(r.message);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (user) => {
    setError(null);
    const r = await deactivateAdminUser(user._id, !user.isDeleted, token);
    if (r.success) setUsers((prev) => prev.map((u) => (u._id === user._id ? r.data : u)));
    else setError(r.message);
  };

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <Alert message={error} variant="error" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse admin-table">
          <thead>
            <tr>
              {["Name", "Email", "Role", "Status", "Joined", ""].map((h) => (
                <th key={h} className={`${TD} text-left font-medium text-muted-foreground`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!users.length && <tr><td colSpan={6} className="p-6 text-sm text-muted-foreground">No accounts to display.</td></tr>}
            {users.map((u) => (
              <tr key={u._id}>
                <td className={TD}>{u.fullName}</td>
                <td className={TD}>{u.email}</td>
                <td className={TD}><Badge variant={u.role === "admin" ? "blue" : u.role === "recruiter" ? "teal" : "gray"}>{u.role}</Badge></td>
                <td className={TD}>{u.isDeleted ? <Badge variant="red">Deactivated</Badge> : <Badge variant="green">Active</Badge>}</td>
                <td className={TD}>{fmtDate(u.createdAt)}</td>
                <td className={TD}>
                  {u.role !== "admin" && (
                    <Btn variant={u.isDeleted ? "secondary" : "danger"} size="sm" onClick={() => toggle(u)}>
                      {u.isDeleted ? "Reactivate" : "Deactivate"}
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="mt-4 text-center">
          <Btn variant="secondary" size="sm" onClick={() => load(nextCursor)}>Load more</Btn>
        </div>
      )}
    </div>
  );
}

function JobsTab({ token }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (cursor = null) => {
    setLoading(!cursor);
    const r = await getAdminJobs(token, cursor);
    if (r.success) {
      setJobs((prev) => (cursor ? [...prev, ...r.data.items] : r.data.items));
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <SkeletonBlock height={200} />;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Title", "Recruiter", "Status", "Last matched", "Posted"].map((h) => (
                <th key={h} className={`${TD} text-left font-medium text-muted-foreground`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!jobs.length && <tr><td colSpan={5} className="p-6 text-sm text-muted-foreground">No roles to display.</td></tr>}
            {jobs.map((j) => (
              <tr key={j._id}>
                <td className={TD}>{j.title}</td>
                <td className={TD}>{j.createdBy?.fullName || "—"}</td>
                <td className={TD}>{j.isOpen ? <Badge variant="green">Open</Badge> : <Badge variant="gray">Closed</Badge>}</td>
                <td className={TD}>{j.lastMatchedAt ? fmtDate(j.lastMatchedAt) : "Never run"}</td>
                <td className={TD}>{fmtDate(j.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="mt-4 text-center">
          <Btn variant="secondary" size="sm" onClick={() => load(nextCursor)}>Load more</Btn>
        </div>
      )}
    </div>
  );
}

const WEIGHT_FIELDS = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "semantic", label: "Resume relevance" },
  { key: "education", label: "Education" },
];

function SettingsTab({ token }) {
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await getAdminSettings(token);
      if (r.success) setWeights(r.data.defaultWeights);
      else setError(r.message);
      setLoading(false);
    })();
  }, [token]);

  const sum = weights ? WEIGHT_FIELDS.reduce((acc, f) => acc + Number(weights[f.key] || 0), 0) : 0;
  const sumOk = Math.abs(sum - 1) < 0.001;

  const save = async () => {
    setSaving(true); setError(null); setSuccess(null);
    const r = await updateAdminSettings(weights, token);
    setSaving(false);
    if (r.success) setSuccess("Platform matching defaults updated.");
    else setError(r.message);
  };

  if (loading) return <SkeletonBlock height={200} />;
  if (!weights) return <Alert message={error || "Matching settings are unavailable."} />;

  return (
    <div className="max-w-[600px] rounded-lg border border-border bg-card p-6">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Platform matching defaults</div>
      <p className="mb-4 text-xs text-muted-foreground">
        Applies to roles using standard matching. Set each area’s share of the score; the total must be 100%. Role-specific settings take precedence.
      </p>
      <Alert message={error} variant="error" />
      <Alert message={success} variant="success" />
      {WEIGHT_FIELDS.map((f) => (
        <div key={f.key} className="mb-3">
          <label htmlFor={`default-${f.key}`} className="mb-1 block text-sm text-muted-foreground">{f.label} (%)</label>
          <input
            id={`default-${f.key}`} type="number" step="1" min="0" max="100"
            value={Number((weights[f.key] * 100).toFixed(2))}
            onChange={(e) => setWeights((w) => ({ ...w, [f.key]: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) / 100 }))}
          />
        </div>
      ))}
      <div className={`mb-4 text-xs ${sumOk ? "text-muted-foreground" : "text-red-500"}`}>
        Total: {(sum * 100).toFixed(0)}% {!sumOk && "— adjust the shares to reach 100%"}
      </div>
      <Btn variant="primary" onClick={save} disabled={saving || !sumOk}>
        {saving ? "Saving…" : "Save defaults"}
      </Btn>
    </div>
  );
}

export default function AdminDashboard({ onContactClick }) {
  const { token } = useAuth();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await getAdminStats(token);
      if (r.success) setStats(r.data);
    })();
  }, [token]);

  const tabDefs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "jobs", label: "Jobs" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <div id="main-content" role="main" tabIndex={-1} className="app-main">
        <PageHeader title="Platform overview" subtitle="Manage accounts, monitor roles, and maintain matching settings." />
        <div className="overflow-x-auto">
          <Tabs tabs={tabDefs} active={tab} onChange={setTab} />
        </div>
        {tab === "overview" && (stats ? <StatsGrid stats={stats} /> : <SkeletonBlock height={100} />)}
        {tab === "users" && <UsersTab token={token} />}
        {tab === "jobs" && <JobsTab token={token} />}
        {tab === "settings" && <SettingsTab token={token} />}
      </div>
    </div>
  );
}
