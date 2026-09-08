const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

let authToken = null;
let tokenUpdater = null;
let logoutCallback = null;

export const setAuthTokenTracker = (token, updateFn, logoutFn) => {
  authToken = token;
  tokenUpdater = updateFn;
  logoutCallback = logoutFn;
};

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return { success: false, status: res.status, message: `Invalid JSON response from server (Status ${res.status})` };
    }
  } else {
    try {
      const text = await res.text();
      return { success: false, status: res.status, message: text || `Server error (Status ${res.status})` };
    } catch {
      return { success: false, status: res.status, message: `Server error (Status ${res.status})` };
    }
  }
}

export async function apiCall(method, path, body = null, token = null, isForm = false) {
  let currentToken = token || authToken;
  const headers = {};

  if (currentToken) {
    headers.Authorization = `Bearer ${currentToken}`;
  }

  if (!isForm && body) {
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  };

  try {
    const res = await fetch(API_BASE + path, fetchOptions);

    if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
      const retryWithToken = (newToken) => {
        if (!newToken) {
          return { success: false, status: 401, message: "Session expired. Please log in again." };
        }
        const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        return fetch(API_BASE + path, { ...fetchOptions, headers: retryHeaders })
          .then(parseResponse)
          .catch(() => ({ success: false, message: "Retry connection failed" }));
      };

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(API_BASE + "/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          const refreshData = await parseResponse(refreshRes);

          if (refreshRes.ok && refreshData.success) {
            const newAccessToken = refreshData.data.token;
            if (tokenUpdater) {
              tokenUpdater(newAccessToken);
            }
            authToken = newAccessToken;
            isRefreshing = false;
            // Wake up every OTHER request that queued behind this refresh —
            // the triggering request (this one) retries directly below,
            // since it never subscribed to itself in the first place.
            onRefreshed(newAccessToken);
            return await retryWithToken(newAccessToken);
          } else {
            isRefreshing = false;
            if (logoutCallback) {
              logoutCallback();
            }
            // Wake up every request that queued behind this refresh — otherwise
            // their promises never resolve and the UI hangs on a spinner forever.
            onRefreshed(null);
            return { success: false, status: 401, message: "Session expired. Please log in again." };
          }
        } catch (refreshErr) {
          isRefreshing = false;
          if (logoutCallback) {
            logoutCallback();
          }
          onRefreshed(null);
          return { success: false, status: 401, message: "Network error during token refresh." };
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => resolve(retryWithToken(newToken)));
      });
    }

    return await parseResponse(res);
  } catch (err) {
    return { success: false, message: "Network error — failed to connect to server." };
  }
}

export const authRegister = (body) => apiCall("POST", "/auth/register", body);
export const authLogin = (body) => apiCall("POST", "/auth/login", body);
export const getMe = (token) => apiCall("GET", "/auth/me", null, token);
export const deleteMyAccount = (token) => apiCall("DELETE", "/auth/me", null, token);
export const silentRefresh = () => apiCall("POST", "/auth/refresh");
export const getJobs = (token, cursor = null, limit = 20) =>
  apiCall("GET", `/jobs?limit=${limit}` + (cursor ? `&cursor=${cursor}` : ""), null, token);
export const applyToJob = (jobId, token) => apiCall("POST", `/jobs/${jobId}/apply`, null, token);
export const cancelApplication = (jobId, token) => apiCall("DELETE", `/jobs/${jobId}/apply`, null, token);
export const getMyApplications = (token) => apiCall("GET", "/jobs/my-applications", null, token);
export const getCandidateProfile = (token) => apiCall("GET", "/candidates/me", null, token);
export const acceptParsedName = (token) => apiCall("POST", "/candidates/me/accept-parsed-name", null, token);
export const uploadResume = (formData, token) => apiCall("POST", "/resumes", formData, token, true);
export const getMyResumes = (token) => apiCall("GET", "/resumes/mine", null, token);
export const setDefaultResume = (resumeId, token) => apiCall("PATCH", `/resumes/${resumeId}/default`, null, token);
export const deleteResume = (resumeId, token) => apiCall("DELETE", `/resumes/${resumeId}`, null, token);
export const createJob = (body, token) => apiCall("POST", "/jobs", body, token);
export const triggerMatch = (jobId, token) => apiCall("POST", `/jobs/${jobId}/match`, null, token);
export const getMatchResults = (jobId, token, cursor = null, limit = 20) =>
  apiCall("GET", `/jobs/${jobId}/matches?limit=${limit}` + (cursor ? `&cursor=${cursor}` : ""), null, token);
export const getResume = (resumeId, token) => apiCall("GET", `/resumes/${resumeId}`, null, token);
export const getJob = (jobId, token) => apiCall("GET", `/jobs/${jobId}`, null, token);
export const sendContactFeedback = (body) => apiCall("POST", "/contact", body);
export const toggleShortlist = (jobId, matchId, shortlisted, token) =>
  apiCall("PATCH", `/jobs/${jobId}/matches/${matchId}`, { shortlisted }, token);
export const closeJob = (jobId, isOpen, token) =>
  apiCall("PATCH", `/jobs/${jobId}`, { isOpen }, token);

export const getJobApplications = (jobId, token) => apiCall("GET", `/jobs/${jobId}/applications`, null, token);
export const advanceApplicationStage = (jobId, applicationId, status, token) =>
  apiCall("PATCH", `/jobs/${jobId}/applications/${applicationId}/stage`, { status }, token);
export const bulkAdvanceApplicationStage = (jobId, applicationIds, status, token) =>
  apiCall("PATCH", `/jobs/${jobId}/applications/bulk-stage`, { applicationIds, status }, token);
export const getRecruiterAnalytics = (token) => apiCall("GET", "/jobs/analytics", null, token);

export const getAdminUsers = (token, cursor = null) =>
  apiCall("GET", `/admin/users` + (cursor ? `?cursor=${cursor}` : ""), null, token);
export const deactivateAdminUser = (userId, isDeleted, token) =>
  apiCall("PATCH", `/admin/users/${userId}/deactivate`, { isDeleted }, token);
export const getAdminJobs = (token, cursor = null) =>
  apiCall("GET", `/admin/jobs` + (cursor ? `?cursor=${cursor}` : ""), null, token);
export const getAdminStats = (token) => apiCall("GET", "/admin/stats", null, token);
export const getAdminSettings = (token) => apiCall("GET", "/admin/settings", null, token);
export const updateAdminSettings = (defaultWeights, token) =>
  apiCall("PATCH", "/admin/settings", { defaultWeights }, token);

export const verifyEmail = (token) => apiCall("GET", `/auth/verify-email?token=${token}`);
export const resendVerification = (email) => apiCall("POST", "/auth/resend-verification", { email });
export const forgotPassword = (email) => apiCall("POST", "/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) => apiCall("POST", "/auth/reset-password", { token, newPassword });

export async function downloadMatchResultsCsv(jobId, token) {
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/matches/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, message: text || "CSV export failed" };
    }

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    return {
      success: true,
      data: {
        blob,
        filename: match?.[1] || "match-results.csv",
      },
    };
  } catch {
    return { success: false, message: "Network error — is the server running?" };
  }
}
