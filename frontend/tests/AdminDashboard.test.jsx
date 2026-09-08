import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ThemeProvider } from "../src/context/ThemeContext";

vi.mock("../src/context/AuthContext", () => ({
  useAuth: () => ({ token: "fake-token", user: { fullName: "Admin User", email: "admin@example.com", role: "admin" }, logout: vi.fn() }),
}));

const mockGetAdminStats = vi.fn();
const mockGetAdminUsers = vi.fn();
const mockDeactivateAdminUser = vi.fn();

vi.mock("../src/lib/api", () => ({
  getAdminUsers: (...args) => mockGetAdminUsers(...args),
  deactivateAdminUser: (...args) => mockDeactivateAdminUser(...args),
  getAdminJobs: vi.fn(),
  getAdminStats: (...args) => mockGetAdminStats(...args),
  getAdminSettings: vi.fn(),
  updateAdminSettings: vi.fn(),
}));

import AdminDashboard from "../src/pages/AdminDashboard";

function renderDashboard() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockGetAdminStats.mockReset();
  mockGetAdminUsers.mockReset();
  mockDeactivateAdminUser.mockReset();
  // AdminDashboard fetches stats on mount regardless of which tab is
  // active — give every test a safe default so it doesn't have to care.
  mockGetAdminStats.mockResolvedValue({ success: true, data: { totalCandidates: 0, totalRecruiters: 0, totalJobs: 0, openJobs: 0, jobsMatched: 0, totalApplications: 0, totalMatches: 0 } });
});

describe("AdminDashboard (Phase 5)", () => {
  it("renders real platform stats on the Overview tab", async () => {
    mockGetAdminStats.mockResolvedValue({
      success: true,
      data: { totalCandidates: 4, totalRecruiters: 2, totalJobs: 5, openJobs: 3, jobsMatched: 2, totalApplications: 6, totalMatches: 10 },
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText("4")).toBeInTheDocument()); // candidates
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1); // recruiters and/or jobsMatched
    expect(screen.getByText("6")).toBeInTheDocument(); // applications
    expect(screen.getByText("10")).toBeInTheDocument(); // match results
  });
});

describe("AdminDashboard — Users tab deactivate/reactivate toggle", () => {
  const baseUser = { _id: "u1", fullName: "Sam Recruiter", email: "sam@example.com", role: "recruiter", isDeleted: false, createdAt: "2026-01-01" };

  it("deactivates an active user and swaps the badge + button label", async () => {
    mockGetAdminUsers.mockResolvedValue({ success: true, data: { items: [baseUser], nextCursor: null, hasMore: false } });
    mockDeactivateAdminUser.mockResolvedValue({ success: true, data: { ...baseUser, isDeleted: true } });

    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    expect(mockDeactivateAdminUser).toHaveBeenCalledWith("u1", true, "fake-token");
    await waitFor(() => expect(screen.getByText("Deactivated")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Reactivate" })).toBeInTheDocument();
  });

  it("reactivates a deactivated user", async () => {
    const deactivated = { ...baseUser, isDeleted: true };
    mockGetAdminUsers.mockResolvedValue({ success: true, data: { items: [deactivated], nextCursor: null, hasMore: false } });
    mockDeactivateAdminUser.mockResolvedValue({ success: true, data: { ...baseUser, isDeleted: false } });

    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => expect(screen.getByText("Deactivated")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Reactivate" }));

    expect(mockDeactivateAdminUser).toHaveBeenCalledWith("u1", false, "fake-token");
    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
  });

  it("shows an error and leaves the badge unchanged when the toggle fails", async () => {
    mockGetAdminUsers.mockResolvedValue({ success: true, data: { items: [baseUser], nextCursor: null, hasMore: false } });
    mockDeactivateAdminUser.mockResolvedValue({ success: false, message: "Could not update this user." });

    renderDashboard();
    fireEvent.click(screen.getByRole("button", { name: "Users" }));

    await waitFor(() => expect(screen.getByText("Active")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(screen.getByText("Could not update this user.")).toBeInTheDocument());
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
