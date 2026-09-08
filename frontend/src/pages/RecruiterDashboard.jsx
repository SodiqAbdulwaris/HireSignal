import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getJobs, closeJob } from "../lib/api";
import Nav from "../components/layout/Nav";
import PageHeader from "../components/layout/PageHeader";
import Tabs from "../components/ui/Tabs";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import Alert from "../components/ui/Alert";

export default function RecruiterDashboard({ onContactClick }) {
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Determine active tab from URL path
  let activeTab = "jobs";
  if (location.pathname === "/recruiter/post") activeTab = "post";
  else if (location.pathname === "/recruiter/analytics") activeTab = "analytics";
  else if (location.pathname === "/recruiter/contact") activeTab = "contact";

  const handleTabChange = (key) => {
    navigate(`/recruiter/${key}`);
  };

  const loadJobs = useCallback(async (cursor = null) => {
    if (cursor) setLoadingMore(true);
    else setLoadingData(true);
    setLoadError(null);
    const r = await getJobs(token, cursor);
    if (r.success) {
      setJobs(prev => cursor ? [...prev, ...r.data.items] : r.data.items);
      setNextCursor(r.data.nextCursor);
      setHasMore(r.data.hasMore);
    } else {
      setLoadError(r.message || "Could not load roles. Please try again.");
    }
    setLoadingMore(false);
    setLoadingData(false);
  }, [token]);

  const handleToggleJobStatus = async (jobId, isOpen) => {
    const nextVal = !isOpen;
    const r = await closeJob(jobId, nextVal, token);
    if (r.success) {
      loadJobs();
    }
  };

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleViewMatch = (job, autoRun) => {
    navigate(`/recruiter/jobs/${job._id}/matches`, { state: { autoRun } });
  };

  const handleJobPosted = () => {
    loadJobs();
    navigate("/recruiter/jobs");
  };

  const tabDefs = [
    { key: "jobs", label: "Roles" },
    { key: "post", label: "Post a role" },
    { key: "analytics", label: "Analytics" },
    { key: "contact", label: "Help" },
  ];

  return (
    <div>
      <Nav onContactClick={onContactClick} />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <PageHeader title={{ jobs: "Make room for good people.", post: "Define your next role", analytics: "Your hiring activity", contact: "How can we help?" }[activeTab]} subtitle={{ jobs: "Manage open roles and review applicants with context.", post: "Help candidates understand the work and what you need.", analytics: "Understand your roles and applicant pipeline.", contact: "Get support with your account or hiring workflow." }[activeTab]} />
        <div className="overflow-x-auto">
          <Tabs tabs={tabDefs} active={activeTab} onChange={handleTabChange} />
        </div>
        {loadError && <div><Alert message={loadError} /><button type="button" className="mb-5 min-h-11 text-sm text-primary underline" onClick={() => loadJobs()}>Try loading roles again</button></div>}
        {loadingData ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-6">
                <SkeletonBlock height={18} width="60%" />
                <SkeletonBlock height={12} />
                <SkeletonBlock height={12} width="80%" />
              </div>
            ))}
          </div>
        ) : (
          <Outlet
            context={{
              jobs,
              onViewMatch: handleViewMatch,
              onPost: () => navigate("/recruiter/post"),
              onPosted: handleJobPosted,
              onToggleJobStatus: handleToggleJobStatus,
              hasMore,
              loadingMore,
              onLoadMore: () => loadJobs(nextCursor),
              token,
              loadJobs,
              user,
            }}
          />
        )}
      </main>
    </div>
  );
}
