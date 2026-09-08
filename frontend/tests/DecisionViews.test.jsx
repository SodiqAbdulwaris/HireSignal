import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CandidateBrowse from "../src/components/candidate/CandidateBrowse";
import MatchResultCard from "../src/components/recruiter/MatchResultCard";
const { applyToJob } = vi.hoisted(() => ({ applyToJob: vi.fn() }));
vi.mock("../src/lib/api", () => ({ applyToJob }));
const jobs = [
  { _id: "job-a", title: "Frontend developer", description: "Build accessible interfaces.", requiredSkills: ["React"], requiredExperienceYears: 1, requiredEducationLevel: "bachelor" },
  { _id: "job-b", title: "Graduate engineer", description: "Learn with the team.", requiredSkills: ["SQL"], requiredExperienceYears: 0, requiredEducationLevel: "any" },
];
function renderBrowse(overrides = {}) {
  const context = { jobs, applications: [], profile: {}, token: "test-token", loadAll: vi.fn(), loadJobsData: vi.fn(), hasMore: true, nextCursor: "next", ...overrides };
  render(<MemoryRouter><Routes><Route element={<Outlet context={context} />}><Route path="/" element={<CandidateBrowse />} /><Route path="/resume" element={<h1>Add a resume</h1>} /></Route></Routes></MemoryRouter>);
  return context;
}
beforeEach(() => applyToJob.mockReset());
describe("Decision-focused job browsing", () => {
  it("searches loaded roles, preserves pagination, and opens the selected role", () => {
    const context = renderBrowse();
    expect(screen.getByText(/Search covers 2 loaded roles/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search loaded roles"), { target: { value: "SQL" } });
    const row = screen.getByRole("button", { name: /Graduate engineer/ });
    expect(screen.queryByRole("button", { name: /Frontend developer/ })).not.toBeInTheDocument();
    fireEvent.click(row);
    expect(screen.getByRole("heading", { level: 2, name: "Graduate engineer" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more roles" }));
    expect(context.loadJobsData).toHaveBeenCalledWith("next");
    fireEvent.click(screen.getByRole("button", { name: /Back to roles/ }));
    expect(document.querySelector(".browse-layout")).not.toHaveClass("show-detail");
  });
  it("routes candidates without profiles to resume upload instead of submitting", () => {
    renderBrowse({ profile: null });
    expect(screen.queryByRole("button", { name: /Review application/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: /Add your resume/ }));
    expect(screen.getByRole("heading", { name: "Add a resume" })).toBeInTheDocument();
    expect(applyToJob).not.toHaveBeenCalled();
  });
  it("submits only after confirmation and refreshes applications on success", async () => {
    applyToJob.mockResolvedValue({ success: true });
    const context = renderBrowse();
    fireEvent.click(screen.getByRole("button", { name: /Review application/ }));
    expect(applyToJob).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(context.loadAll).toHaveBeenCalledOnce());
    expect(applyToJob).toHaveBeenCalledWith("job-a", "test-token");
  });
});
it("shows evidence before score detail and preserves the shortlist action", () => {
  const onToggle = vi.fn();
  render(<MatchResultCard match={{ _id: "m1", candidate: { fullName: "Test Candidate", yearsExperience: 2 }, totalScore: .86, matchedSkills: ["React"], missingSkills: ["SQL"], explanation: "Profile includes React experience.", scoreBreakdown: { skills: .8 }, shortlisted: false }} onToggleShortlist={onToggle} />);
  expect(screen.getByText("Profile includes React experience.")).toBeVisible();
  expect(screen.getByText("SQL")).toBeVisible();
  expect(screen.getByText(/View score breakdown/).closest("details")).not.toHaveAttribute("open");
  fireEvent.click(screen.getByRole("button", { name: "Add to shortlist" }));
  expect(onToggle).toHaveBeenCalledWith("m1", false);
});
